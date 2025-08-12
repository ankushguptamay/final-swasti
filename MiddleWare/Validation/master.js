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
    tags: joi.array().min(1).items(joi.string().required()).required(),
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
const validateBanner = (data) => {
  const schema = joi.object().keys({
    title: joi.string().required(),
    redirectLink: joi.string().optional(),
  });
  return schema.validate(data);
};

const validateBlogSubCategory = (data) => {
  const schema = joi.object().keys({
    name: joi.string().required(),
    parentCategoryId: joi.string().required(),
    description: joi.string().optional(),
  });
  return schema.validate(data);
};

const validateBlogCategory = (data) => {
  const schema = joi.object().keys({
    name: joi.string().required(),
    description: joi.string().optional(),
  });
  return schema.validate(data);
};

const validateUpdateBlogSubCategory = (data) => {
  const schema = joi.object().keys({
    description: joi.string().required(),
  });
  return schema.validate(data);
};

const validateBlogTag = (data) => {
  const schema = joi.object().keys({
    name: joi.string().required(),
    description: joi.string().optional(),
  });
  return schema.validate(data);
};

const validateYogaCourse = (data) => {
  const schema = joi.object().keys({
    title: joi.string().required(),
    description: joi.string().required(),
    time_hours: joi.number().required(),
    amount: joi.number().required(),
  });
  return schema.validate(data);
};

const validateUpdateYogaCourse = (data) => {
  const schema = joi.object().keys({
    description: joi.string().required(),
    time_hours: joi.number().required(),
  });
  return schema.validate(data);
};

export {
  validateSpecialization,
  validateYogaCategory,
  validateYTRule,
  validateYTRequirement,
  validateBanner,
  validateBlogSubCategory,
  validateBlogCategory,
  validateUpdateBlogSubCategory,
  validateBlogTag,
  validateYogaCourse,
  validateUpdateYogaCourse,
};
