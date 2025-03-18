import joi from "joi";

const validateSpecialization = (data) => {
  const schema = joi.object().keys({
    specialization: joi.string().required(),
    description: joi.string().optional(),
  });
  return schema.validate(data);
};

const validateYogaCategory = (data) => {
  const schema = joi.object().keys({
    yogaCategory: joi.string().required(),
    description: joi.string().optional(),
  });
  return schema.validate(data);
};
const validateYTRule = (data) => {
  const schema = joi.object().keys({
    rule: joi.string().required(),
  });
  return schema.validate(data);
};

const validateYTRequirement = (data) => {
  const schema = joi.object().keys({
    requirement: joi.string().required(),
  });
  return schema.validate(data);
};

export {
  validateSpecialization,
  validateYogaCategory,
  validateYTRule,
  validateYTRequirement,
};
