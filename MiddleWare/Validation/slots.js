import joi from "joi";

const times = joi.object({
  yogaCategory: joi.array().min(1).items(joi.string().required()).required(),
  description: joi.string().optional(),
  time: joi.string().length(5).required(),
  timeDurationInMin: joi.number().required(),
  className: joi.string().required(),
  packageId: joi.string().required(),
  publishedDate: joi
    .string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .required(),
});

const validateYTClassTimes = (data) => {
  const schema = joi.object().keys({
    modeOfClass: joi
      .string()
      .valid("online", "offline-learners-place", "offline-tutors-place")
      .required(),
    classType: joi.string().valid("individual", "group").required(),
    times: joi.array().items(times).min(1).required(),
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
    yogaCategory: joi.array().min(1).items(joi.string().required()).required(),
    description: joi.string().optional(),
    packageId: joi.string().required(),
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
