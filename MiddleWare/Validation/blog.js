import joi from "joi";

const blogValidation = (data) => {
  const schema = joi.object().keys({
    subCategory: joi.array().optional(),
    category: joi.array().optional(),
    tag: joi.array().optional(),
    title: joi.string().min(3).required(),
    content: joi.string().required(),
    excerpt: joi.string().optional(),
    readTime: joi.string().required(),
    publishDate: joi.string().required(),
    status: joi.string().valid("Draft", "Published").required(),
    description: joi.string().min(20).optional(),
  });
  return schema.validate(data);
};

const deleteAdditionalPicValidation = (data) => {
  const schema = joi.object().keys({
    additionalPicId: joi.string().required(),
  });
  return schema.validate(data);
};

const publishBlogValidation = (data) => {
  const schema = joi.object().keys({
    status: joi.string().valid("Draft", "Published", "Unpublish").required(),
  });
  return schema.validate(data);
};

export { publishBlogValidation, deleteAdditionalPicValidation, blogValidation };
