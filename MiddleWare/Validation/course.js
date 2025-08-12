import joi from "joi";
import { YOGACOURSE } from "../../Config/class.const.js";

const validateCourseCoupon = (data) => {
  const schema = joi.object().keys({
    courseName: joi.string().required(),
    couponName: joi.string().required(),
    // courseAmount: joi.number().required(),
  });
  return schema.validate(data);
};

const courseOrderValidation = (data) => {
  const schema = joi.object().keys({
    couponName: joi.string().optional(),
    amount: joi.number().required(),
    batchId: joi.string().required(),
    currency: joi.string().required(),
  });
  return schema.validate(data);
};

const verifyCoursePaymentByRazorpayValidation = (data) => {
  const schema = joi.object().keys({
    razorpay_payment_id: joi.string().required(),
    razorpay_order_id: joi.string().required(),
    razorpay_signature: joi.string().required(),
  });
  return schema.validate(data);
};

const courseOrderForNewUserValidation = (data) => {
  const schema = joi.object().keys({
    courseName: joi
      .string()
      .valid(...YOGACOURSE)
      .required(),
    couponName: joi.string().optional(),
    amount: joi.number().required(),
    startDate: joi.string().required(),
    currency: joi.string().required(),
    name: joi.string().min(3).max(30).required(),
    email: joi.string().email().required().label("Email"),
    mobileNumber: joi
      .string()
      .length(10)
      .pattern(/^[0-9]+$/)
      .required(),
    referralCode: joi.string().optional(),
    term_condition_accepted: joi.boolean().required(),
  });
  return schema.validate(data);
};

export {
  validateCourseCoupon,
  courseOrderValidation,
  verifyCoursePaymentByRazorpayValidation,
  courseOrderForNewUserValidation,
};
