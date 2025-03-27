import joi from "joi";

const validateContactUs = (data) => {
  const schema = joi.object().keys({
    name: joi.string().min(3).max(30).required(),
    email: joi.string().email().optional().label("Email"),
    mobileNumber: joi
      .string()
      .length(10)
      .pattern(/^[0-9]+$/)
      .required(),
    message: joi.string().required().min(20).max(1000),
  });
  return schema.validate(data);
};

export { validateContactUs };
