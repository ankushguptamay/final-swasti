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
import { response } from "express";

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
      }).lean();
      console.log(order);
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
      return successResponse(res, 201, { redirectUrl: COURSE_THANK_YOU_URL });
    } else {
      return failureResponse(res, 400, "Payment failed. Please try again.");
    }
  } catch (err) {
    console.log(err.message);
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
    console.log(err.message);
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
      }).lean();
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
              phonepeDetails: {
                transactionId: response.paymentDetails[0].transactionId,
                orderId: response.orderId,
                response: response.paymentDetails[0],
              },
              verify: true,
            },
          }
        );
      }
      return res.redirect(COURSE_THANK_YOU_URL);
      return successResponse(res, 201, { redirectUrl: COURSE_THANK_YOU_URL });
    } else {
      // Update Purchase
      await CoursePayment.updateOne(
        { _id: order._id },
        { $set: { status: "failed" } }
      );
      return res.redirect(COURSE_FAIL_YOU_URL);
      return failureResponse(res, 400, "Payment failed. Please try again.");
    }
  } catch (err) {
    console.log(err.message);
    return failureResponse(res);
  }
};

export {
  applyCourseCoupon,
  createCourseOrderByRazorpay,
  verifyCoursePaymentByRazorpay,
  createCourseOrderByPhonepe,
  verifyCoursePaymentByPhonepe,
};
