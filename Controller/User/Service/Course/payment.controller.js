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
} from "../../../../MiddleWare/Validation/course.js";
import { CoursePayment } from "../../../../Model/User/Services/Course/coursePaymentModel.js";
import { generateReceiptNumber } from "../../../../Helper/generateOTP.js";

const { RAZORPAY_KEY_ID, RAZORPAY_SECRET_ID } = process.env;
const razorpayInstance = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_SECRET_ID,
});
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

const createCourseOrder = async (req, res) => {
  try {
    // Validate body
    const { error } = courseOrderValidation(req.body);
    if (error) return failureResponse(res, 400, error.details[0].message, null);
    const { courseName, currency, startDate, couponName, amount } = req.body;
    const userId = req.user._id;
    const receipt = await generateReceiptNumber("ytc");
    // initiate payment
    razorpayInstance.orders.create(
      { amount, currency, receipt },
      (err, order) => {
        if (!err) {
          CoursePayment.create({
            learner: userId,
            couponName,
            courseName,
            startDate: new Date(startDate),
            amount,
            razorpayOrderId: order.id,
            receipt,
          })
            .then(() => {
              return successResponse(
                res,
                201,
                `Order craeted successfully!`,
                order
              );
            })
            .catch((err) => {
              // console.log(err.message);
              return failureResponse(res);
            });
        } else {
          console.log("Here1")
          console.log(err);
          return failureResponse(res);
        }
      }
    );
  } catch (err) {
    console.log("Here2")
    console.log(err);
    return failureResponse(res);
  }
};

const verifyCoursePayment = async (req, res) => {
  try {
    const orderId = req.body.orderId;
    const paymentId = req.body.paymentId;
    const razorpay_signature = req.body.razorpay_signature;
    // Creating hmac object
    let hmac = crypto.createHmac("sha256", RAZORPAY_SECRET_ID);
    // Passing the data to be hashed
    hmac.update(orderId + "|" + paymentId);
    // Creating the hmac in the required format
    const generated_signature = hmac.digest("hex");

    if (razorpay_signature === generated_signature) {
      const order = await CoursePayment.findOne({
        razorpayOrderId: orderId,
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
              razorpayPaymentId: paymentId,
              verify: true,
            },
          }
        );
      }
      return successResponse(res, 201, "Payment successful.");
    } else {
      return failureResponse(res, 400, "Payment failed. Please try again.");
    }
  } catch (err) {
    return failureResponse(res);
  }
};

export { applyCourseCoupon, createCourseOrder, verifyCoursePayment };
