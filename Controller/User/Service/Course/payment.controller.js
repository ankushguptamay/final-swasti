import dotenv from "dotenv";
dotenv.config();

import Razorpay from "razorpay";
import crypto from "crypto";
import { getOfferedAmount } from "../../../../Helper/coupon.js";
import {
  failureResponse,
  successResponse,
} from "../../../../MiddleWare/responseMiddleware.js";
import {
  courseOrderForNewUserValidation,
  courseOrderValidation,
  validateCourseCoupon,
  verifyCoursePaymentByRazorpayValidation,
} from "../../../../MiddleWare/Validation/course.js";
import { CoursePayment } from "../../../../Model/User/Services/Course/coursePaymentModel.js";
import { generateReceiptNumber } from "../../../../Helper/generateOTP.js";
import {
  createPhonepePayment,
  verifyPhonepePayment,
} from "../../../../Util/phonePe.js";
import { User } from "../../../../Model/User/Profile/userModel.js";
import { Wallet } from "../../../../Model/User/Profile/walletModel.js";
import { capitalizeFirstLetter } from "../../../../Helper/formatChange.js";
import { generateUserCode } from "../../UserProfile/user.controller.js";
import { yvcPaymentSuccessEmail } from "../../../../Config/emailFormate.js";
import { sendEmailViaZeptoZoho } from "../../../../Util/sendEmail.js";

const {
  RAZORPAY_KEY_ID,
  RAZORPAY_SECRET_ID,
  COURSE_THANK_YOU_URL,
  COURSE_FAIL_YOU_URL,
} = process.env;
const razorpayInstance = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_SECRET_ID,
});

function generateAcronym(phrase) {
  return phrase
    .split(" ") // Split into words
    .map((word) => word[0]) // Take first letter of each word
    .join("") // Join them
    .toLowerCase(); // Optional: convert to lowercase
}

const applyCourseCoupon = async (req, res) => {
  try {
    // Validate body
    const { error } = validateCourseCoupon(req.body);
    if (error) return failureResponse(res, 400, error.details[0].message, null);
    const { courseName, couponName, courseAmount } = req.body;

    const offer = await getOfferedAmount(
      courseName.trim().toLowerCase(),
      couponName,
      courseAmount
    );
    return successResponse(res, 201, `Successfully!`, {
      courseAmount,
      savedAmount: offer,
      payableAmount: parseFloat(courseAmount) - parseFloat(offer),
    });
  } catch (err) {
    return failureResponse(res);
  }
};

const createCourseOrderByRazorpay = async (req, res) => {
  try {
    // Validate body
    const { error } = courseOrderValidation(req.body);
    if (error) return failureResponse(res, 400, error.details[0].message, null);
    const { courseName, currency, startDate, couponName, amount } = req.body;
    const userId = req.user._id;
    // Receipt
    const prefix = `${generateAcronym(courseName)}-ra`;
    const receipt = await generateReceiptNumber(prefix);
    // initiate payment
    const order = await razorpayInstance.orders.create({
      amount,
      currency,
      receipt,
    });
    await CoursePayment.create({
      learner: userId,
      couponName,
      courseName,
      startDate: new Date(startDate),
      paymentMethod: "razorpay",
      amount: parseFloat(amount) / 100,
      razorpayDetails: { razorpayOrderId: order.id },
      receipt,
    });
    return successResponse(res, 201, `Order craeted successfully!`, {
      ...order,
      name: req.user.name,
      email: req.user.email,
      mobileNumber: req.user.mobileNumber,
    });
  } catch (err) {
    return failureResponse(res);
  }
};

const verifyCoursePaymentByRazorpay = async (req, res) => {
  try {
    // Validate body
    const { error } = verifyCoursePaymentByRazorpayValidation(req.body);
    if (error) return failureResponse(res, 400, error.details[0].message, null);
    const orderId = req.body.razorpay_order_id;
    const paymentId = req.body.razorpay_payment_id;
    const razorpay_signature = req.body.razorpay_signature;
    // Creating hmac object
    let hmac = crypto.createHmac("sha256", RAZORPAY_SECRET_ID);
    // Passing the data to be hashed
    hmac.update(orderId + "|" + paymentId);
    // Creating the hmac in the required format
    const generated_signature = hmac.digest("hex");

    if (razorpay_signature === generated_signature) {
      const order = await CoursePayment.findOne({
        "razorpayDetails.razorpayOrderId": orderId,
      })
        .populate("learner", "name email")
        .lean();
      if (!order) {
        return failureResponse(res, 400, "Order does not exist!");
      }
      if (!order.verify && order.status === "pending") {
        // Update Purchase
        await CoursePayment.updateOne(
          { _id: order._id },
          {
            $set: {
              status: "completed",
              razorpayDetails: {
                razorpayPaymentId: paymentId,
                razorpayOrderId: orderId,
              },
              verify: true,
            },
          }
        );
      }
      // send Email
      const data = {
        userName: order.learner.name,
        amount: order.amount,
        timeSlote: order.startDate
          ? order.startDate.toString().split(" GMT")[0] + " IST"
          : null,
      };
      let emailHtml;
      if (order.courseName.toLowerCase() == "yoga volunteer course") {
        emailHtml = await yvcPaymentSuccessEmail(data);
      } else {
        emailHtml = null;
      }
      if (emailHtml) {
        const options = {
          senderMail: "office@swastibharat.com",
          senderName: "Swasti Bharat",
          receiver: [
            {
              receiverEmail: order.learner.email,
              receiverName: order.learner.name,
            },
          ],
          subject: "Enrollment Confirmed:",
          htmlbody: emailHtml,
        };
        await sendEmailViaZeptoZoho(options);
      }
      return successResponse(res, 201, { redirectUrl: COURSE_THANK_YOU_URL });
    } else {
      return failureResponse(res, 400, "Payment failed. Please try again.");
    }
  } catch (err) {
    return failureResponse(res);
  }
};

const createCourseOrderByRazorpayAndRegisterUser = async (req, res) => {
  try {
    // Validate body
    const { error } = courseOrderForNewUserValidation(req.body);
    if (error) return failureResponse(res, 400, error.details[0].message, null);

    const {
      courseName,
      currency,
      startDate,
      couponName,
      amount,
      email,
      mobileNumber,
      referralCode,
      term_condition_accepted,
    } = req.body;
    if (!term_condition_accepted)
      return failureResponse(
        res,
        401,
        "Please accept term and condition.",
        null
      );
    // User Registration Process
    // Is user already present
    let user = await User.findOne({ $or: [{ email }, { mobileNumber }] });
    if (user) {
      if (!user.role) {
        await User.updateOne({ _id: user._id }, { $set: { role: "learner" } });
      } else if (user.role === "instructor") {
        return failureResponse(
          res,
          400,
          "You are already register as instructor.",
          null
        );
      }
    } else {
      // Capital First Letter
      const name = capitalizeFirstLetter(req.body.name);
      // User Time Zone
      const timezone = req.headers["time-zone"] || req.headers["x-timezone"];
      // Create in database
      const chakraBreakNumber = Math.floor(Math.random() * 7) + 1;
      // generate User code
      const userCode = await generateUserCode("SWL");
      // Store data
      user = await User.create({
        userTimeZone: timezone,
        name,
        email,
        mobileNumber,
        chakraBreakNumber,
        referralCode,
        userCode,
        role: "learner",
        term_condition_accepted,
      });
      // Create Wallet
      await Wallet.create({ userId: user._id });
    }
    // Receipt
    const prefix = `${generateAcronym(courseName)}-ph`;
    const receipt = await generateReceiptNumber(prefix);
    // initiate payment
    // initiate payment
    const order = await razorpayInstance.orders.create({
      amount,
      currency,
      receipt,
    });
    await CoursePayment.create({
      learner: user._id,
      couponName,
      courseName,
      startDate: new Date(startDate),
      paymentMethod: "razorpay",
      amount: parseFloat(amount) / 100,
      razorpayDetails: { razorpayOrderId: order.id },
      receipt,
    });
    return successResponse(res, 200, "successfully", {
      ...order,
      name: req.body.name,
      email,
      mobileNumber,
    });
  } catch (err) {
    return failureResponse(res);
  }
};

const createCourseOrderByPhonepeAndRegisterUser = async (req, res) => {
  try {
    // Validate body
    const { error } = courseOrderForNewUserValidation(req.body);
    if (error) return failureResponse(res, 400, error.details[0].message, null);
    const {
      courseName,
      currency,
      startDate,
      couponName,
      amount,
      email,
      mobileNumber,
      referralCode,
      term_condition_accepted,
    } = req.body;
    if (!term_condition_accepted)
      return failureResponse(
        res,
        401,
        "Please accept term and condition.",
        null
      );
    // User Registration Process
    // Is user already present
    let user = await User.findOne({ $or: [{ email }, { mobileNumber }] });
    if (user) {
      if (!user.role) {
        await User.updateOne({ _id: user._id }, { $set: { role: "learner" } });
      } else if (user.role === "instructor") {
        return failureResponse(
          res,
          400,
          "You are already register as instructor.",
          null
        );
      }
    } else {
      // Capital First Letter
      const name = capitalizeFirstLetter(req.body.name);
      // User Time Zone
      const timezone = req.headers["time-zone"] || req.headers["x-timezone"];
      // Create in database
      const chakraBreakNumber = Math.floor(Math.random() * 7) + 1;
      // generate User code
      const userCode = await generateUserCode("SWL");
      // Store data
      user = await User.create({
        userTimeZone: timezone,
        name,
        email,
        mobileNumber,
        chakraBreakNumber,
        referralCode,
        userCode,
        role: "learner",
        term_condition_accepted,
      });
      // Create Wallet
      await Wallet.create({ userId: user._id });
    }
    // Receipt
    const prefix = `${generateAcronym(courseName)}-ph`;
    const receipt = await generateReceiptNumber(prefix);
    // initiate payment
    const order = await createPhonepePayment(amount, receipt);
    await CoursePayment.create({
      learner: user._id,
      couponName,
      courseName,
      startDate: new Date(startDate),
      paymentMethod: "phonepe",
      amount: parseFloat(amount) / 100,
      phonepeDetails: { orderId: order.orderId },
      receipt,
    });
    return successResponse(res, 200, { redirectUrl: order.redirectUrl });
  } catch (err) {
    return failureResponse(res);
  }
};

const createCourseOrderByPhonepe = async (req, res) => {
  try {
    // Validate body
    const { error } = courseOrderValidation(req.body);
    if (error) return failureResponse(res, 400, error.details[0].message, null);
    const { courseName, currency, startDate, couponName, amount } = req.body;
    const userId = req.user._id;
    // Receipt
    const prefix = `${generateAcronym(courseName)}-ph`;
    const receipt = await generateReceiptNumber(prefix);
    // initiate payment
    const order = await createPhonepePayment(amount, receipt);
    await CoursePayment.create({
      learner: userId,
      couponName,
      courseName,
      startDate: new Date(startDate),
      paymentMethod: "phonepe",
      amount: parseFloat(amount) / 100,
      phonepeDetails: { orderId: order.orderId },
      receipt,
    });
    return successResponse(res, 200, { redirectUrl: order.redirectUrl });
  } catch (err) {
    return failureResponse(res);
  }
};

const verifyCoursePaymentByPhonepe = async (req, res) => {
  try {
    const receipt = req.params.receipt;
    // Verify
    const response = await verifyPhonepePayment(receipt);
    if (response.state.toLowerCase() === "completed") {
      const order = await CoursePayment.findOne({
        "phonepeDetails.orderId": response.orderId,
      })
        .populate("learner", "name email")
        .lean();
      if (!order) {
        return failureResponse(res, 400, "Order does not exist!");
      }
      if (!order.verify && order.status === "pending") {
        const paymentDetails = response.paymentDetails[0];
        delete paymentDetails.splitInstruments;
        // Update Purchase
        await CoursePayment.updateOne(
          { _id: order._id },
          {
            $set: {
              status: "completed",
              phonepeDetails: {
                transactionId: response.paymentDetails[0].transactionId,
                orderId: response.orderId,
                response: paymentDetails,
              },
              verify: true,
            },
          }
        );
      }
      // send Email
      const data = {
        userName: order.learner.name,
        amount: order.amount,
        timeSlote: order.startDate,
      };
      let emailHtml;
      if (order.courseName.toLowerCase() == "yoga volunteer course") {
        emailHtml = await yvcPaymentSuccessEmail(data);
      } else {
        emailHtml = null;
      }
      if (emailHtml) {
        const options = {
          senderMail: "office@swastibharat.com",
          senderName: "Swasti Bharat",
          receiver: [
            {
              receiverEmail: order.learner.email,
              receiverName: order.learner.name,
            },
          ],
          subject: "Enrollment Confirmed:",
          htmlbody: emailHtml,
        };
        await sendEmailViaZeptoZoho(options);
      }
      return res.redirect(COURSE_THANK_YOU_URL);
    } else {
      // Update Purchase
      await CoursePayment.updateOne(
        { _id: order._id },
        { $set: { status: "failed" } }
      );
      return res.redirect(COURSE_FAIL_YOU_URL);
    }
  } catch (err) {
    return failureResponse(res);
  }
};

const getCoursePayment = async (req, res) => {
  try {
    const { status, exportall, startDate } = req.query;
    const search = req.query.search?.trim();
    const resultPerPage = req.query.resultPerPage
      ? parseInt(req.query.resultPerPage)
      : 20;
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const skip = (page - 1) * resultPerPage;

    // Search and filter
    const query = { amount: { $gt: 5 } };
    if (search) {
      const withIn = new RegExp(search.toLowerCase(), "i");
      query.courseName = withIn;
    }
    if (status) {
      if (status === "pending") {
        const learnersWithCompleted = await CoursePayment.distinct("learner", {
          status: "completed",
          amount: { $gt: 5 },
        });
        query.learner = { $nin: learnersWithCompleted };
      }
      query.status = status;
    }
    if (startDate) {
      query.startDate = new Date(startDate);
    }
    // AggregateQuery
    const aggregateQueryArray = [
      // 🔍 Step 1: Filter as needed
      { $match: { ...query } },
      // Group by learner
      {
        $group: {
          _id: "$learner",
          all: { $push: "$$ROOT" },
          hasCompleted: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
          },
        },
      },
      // Select only completed OR latest pending
      {
        $project: {
          result: {
            $cond: [
              { $gt: ["$hasCompleted", 0] },
              {
                $filter: {
                  input: "$all",
                  as: "item",
                  cond: { $eq: ["$$item.status", "completed"] },
                },
              },
              [
                {
                  $first: {
                    $slice: [
                      {
                        $filter: {
                          input: {
                            $sortArray: {
                              input: "$all",
                              sortBy: { createdAt: -1 },
                            },
                          },
                          as: "item",
                          cond: { $eq: ["$$item.status", "pending"] },
                        },
                      },
                      1,
                    ],
                  },
                },
              ],
            ],
          },
        },
      },
      // Flatten the result array
      { $unwind: "$result" },
      // Select fields
      {
        $project: {
          _id: "$result._id",
          courseName: "$result.courseName",
          couponName: "$result.couponName",
          createdAt: "$result.createdAt",
          paymentMethod: "$result.paymentMethod",
          startDate: "$result.startDate",
          amount: "$result.amount",
          status: "$result.status",
          learner: "$result.learner",
        },
      },
      // Populate learner manually
      {
        $lookup: {
          from: "users", // Replace with your actual learner collection name
          localField: "learner",
          foreignField: "_id",
          as: "learner",
        },
      },
      { $unwind: "$learner" },
      // Optionally project learner fields
      {
        $project: {
          courseName: 1,
          couponName: 1,
          createdAt: 1,
          paymentMethod: 1,
          startDate: 1,
          amount: 1,
          status: 1,
          learner: {
            _id: 1,
            name: "$learner.name",
            email: "$learner.email",
            mobileNumber: "$learner.mobileNumber",
            isMobileNumberVerified: "$learner.isMobileNumberVerified",
            createdAt: "$learner.createdAt",
            lastLogin: "$learner.lastLogin",
          },
        },
      },
      // Pagination
      { $sort: { createdAt: -1 } },
    ];
    if (!exportall || exportall === "false") {
      aggregateQueryArray.push({ $skip: skip });
      aggregateQueryArray.push({ $limit: resultPerPage });
    }
    const [coursePayment, totalCoursePayment] = await Promise.all([
      CoursePayment.aggregate(aggregateQueryArray),
      CoursePayment.aggregate([
        { $match: query },
        {
          $group: {
            _id: "$learner",
            all: { $push: "$$ROOT" },
            hasCompleted: {
              $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
            },
          },
        },
        {
          $project: {
            result: {
              $cond: [
                { $gt: ["$hasCompleted", 0] },
                {
                  $filter: {
                    input: "$all",
                    as: "item",
                    cond: { $eq: ["$$item.status", "completed"] },
                  },
                },
                [
                  {
                    $first: {
                      $slice: [
                        {
                          $filter: {
                            input: {
                              $sortArray: {
                                input: "$all",
                                sortBy: { createdAt: -1 },
                              },
                            },
                            as: "item",
                            cond: { $eq: ["$$item.status", "pending"] },
                          },
                        },
                        1,
                      ],
                    },
                  },
                ],
              ],
            },
          },
        },
        { $unwind: "$result" },
        { $count: "total" },
      ]),
    ]);
    const totalCount = totalCoursePayment[0]?.total || 0;
    const totalPages = Math.ceil(totalCount / resultPerPage) || 0;
    return successResponse(res, 200, `Successfully!`, {
      data: coursePayment,
      totalRow: totalCount,
      totalPages,
      currentPage: page,
    });
  } catch (err) {
    failureResponse(res);
  }
};

const getMyCourses = async (req, res) => {
  try {
    const coursePayment = await CoursePayment.find({
      status: "completed",
      learner: req.user._id,
    })
      .select("_id courseName startDate amount")
      .lean();
    coursePayment.startDateInIST = new Date(
      new Date(coursePayment.startDate).getTime() + 330 * 60 * 1000
    );
    return successResponse(res, 200, `Successfully!`, coursePayment);
  } catch (err) {
    // console.log(err.message);
    failureResponse(res);
  }
};

export {
  applyCourseCoupon,
  createCourseOrderByRazorpay,
  verifyCoursePaymentByRazorpay,
  createCourseOrderByPhonepe,
  verifyCoursePaymentByPhonepe,
  createCourseOrderByPhonepeAndRegisterUser,
  createCourseOrderByRazorpayAndRegisterUser,
  getCoursePayment,
  getMyCourses,
};
