import joi from "joi";

const validateCourseCoupon = (data) => {
  const schema = joi.object().keys({
    courseName: joi.string().required(),
    couponName: joi.string().required(),
    courseAmount: joi.number().required(),
  });
  return schema.validate(data);
};

const courseOrderValidation = (data) => {
  const schema = joi.object().keys({
    courseName: joi
      .string()
      .valid("Yoga Volunteer Course", "Obesity Management")
      .required(),
    couponName: joi.string().optional(),
    amount: joi.number().required(),
    startDate: joi.string().required(),
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

export {
  validateCourseCoupon,
  courseOrderValidation,
  verifyCoursePaymentByRazorpayValidation,
};
