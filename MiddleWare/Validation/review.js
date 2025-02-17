import joi from "joi";

const validateInstructorReview = (data) => {
  const schema = joi.object().keys({
    rating: joi.number().greater(0).less(6).required(),
    message: joi.string().optional(),
    instructor: joi.string().required(),
  });
  return schema.validate(data);
};

const validateDeleteMyReply = (data) => {
  const schema = joi.object().keys({
    reviewId: joi.string().required(),
    replyId: joi.string().required(),
  });
  return schema.validate(data);
};

const validateReplyOnMyReviews = (data) => {
  const schema = joi.object().keys({
    reviewId: joi.string().required(),
    reply: joi.string().required(),
  });
  return schema.validate(data);
};

export {
  validateInstructorReview,
  validateDeleteMyReply,
  validateReplyOnMyReviews,
};
