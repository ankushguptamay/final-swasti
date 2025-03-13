import joi from "joi";

const validateYTClassTimes = (data) => {
  const schema = joi.object().keys({
    modeOfClass: joi.string().valid("online").required(),
    yogaCategory: joi.array().min(1).items(joi.string().required()).required(),
    yTRule: joi.array().min(1).items(joi.string().required()).optional(),
    yTRequirement: joi.array().min(1).items(joi.string().required()).optional(),
    description: joi.string().optional(),
    time: joi.string().length(5).required(),
    timeDurationInMin: joi.number().required(),
    className: joi.string().required(),
    yogaTutorPackage: joi.string().required(),
    classType: joi.string().valid("individual", "group").required(),
    publishedDate: joi
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
    yTRule: joi.array().min(1).items(joi.string().required()).optional(),
    yTRequirement: joi.array().min(1).items(joi.string().required()).optional(),
    yogaCategory: joi.array().min(1).items(joi.string().required()).required(),
    description: joi.string().optional(),
    yogaTutorPackage: joi.string().required(),
    className: joi.string().required(),
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
