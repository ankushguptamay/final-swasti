import joi from "joi";

const validateYTClassTimes = (data) => {
  const schema = joi.object().keys({
    modeOfClass: joi.string().valid("online").required(),
    yogaCategory: joi.array().min(1).items(joi.string().required()).required(),
    yTRule: joi.array().optional(),
    yTRequirement: joi.array().optional(),
    description: joi.string().optional(),
    time: joi.string().length(5).required(),
    timeDurationInMin: joi.number().required(),
    packageType: joi.string().valid("weekly", "daily", "monthly").required(),
    classType: joi.string().valid("individual", "group").required(),
    numberOfSeats: joi.number().required(),
    numberOfClass: joi.number().required(),
    price: joi.number().required(),
    datesOfClasses: joi
      .array()
      .min(1)
      .items(
        joi
          .string()
          .pattern(/^\d{4}-\d{2}-\d{2}$/)
          .required()
      )
      .required(),
    startDate: joi
      .string()
      .pattern(/^\d{4}-\d{2}-\d{2}$/)
      .required(),
    endDate: joi
      .string()
      .pattern(/^\d{4}-\d{2}-\d{2}$/)
      .required(),
  });
  return schema.validate(data);
};

const validateYTPackage = (data) => {
  const schema = joi.object().keys({
    packageType: joi.string().valid("individual", "group").required(),
    group_price: joi.number().optional(),
    individual_price: joi.number().optional(),
    numberOfDays: joi.number().required(),
    packageName: joi.string().required(),
  });
  return schema.validate(data);
};

const validateUpdateYTClassTimes = (data) => {
  const schema = joi.object().keys({
    yTRule: joi.array().optional(),
    yTRequirement: joi.array().optional(),
    yogaCategory: joi.array().min(1).items(joi.string().required()).required(),
    price: joi.number().required(),
  });
  return schema.validate(data);
};

const validateApprovalClassTimes = (data) => {
  const schema = joi.object().keys({
    approvalByAdmin: joi.string().valid("accepted", "rejected").required(),
  });
  return schema.validate(data);
};

export {
  validateYTClassTimes,
  validateYTPackage,
  validateUpdateYTClassTimes,
  validateApprovalClassTimes,
};
