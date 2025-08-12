import joi from "joi";
import { YOGACOURSE } from "../../Config/class.const.js";

const validateInstituteRegistration = (data) => {
  const schema = joi.object().keys({
    name: joi.string().min(3).required(),
    email: joi.string().email().required().label("Email"),
    mobileNumber: joi
      .string()
      .length(10)
      .pattern(/^[0-9]+$/)
      .required(),
  });
  return schema.validate(data);
};

const validateInstituteLogin = (data) => {
  const schema = joi.object().keys({
    mobileNumber: joi
      .string()
      .length(10)
      .pattern(/^[0-9]+$/)
      .required(),
  });
  return schema.validate(data);
};
const validateInstituteLoginOTP = (data) => {
  const schema = joi.object().keys({
    mobileNumber: joi
      .string()
      .length(10)
      .pattern(/^[0-9]+$/)
      .required(),
    otp: joi.string().length(6).required(),
  });
  return schema.validate(data);
};

const validateInstituteInstructorRegistration = (data) => {
  const schema = joi.object().keys({
    name: joi.string().min(3).max(30).required(),
    email: joi.string().email().required().label("Email"),
    mobileNumber: joi
      .string()
      .length(10)
      .pattern(/^[0-9]+$/)
      .required(),
    institute: joi.string().required(),
  });
  return schema.validate(data);
};

const validateYCBatch = (data) => {
  const schema = joi.object().keys({
    name: joi
      .string()
      .valid(...YOGACOURSE)
      .required(),
    assigned_to: joi.string().optional(),
    startDate: joi.string().required(),
    amount: joi.number().required(),
  });
  return schema.validate(data);
};

const validateReAssignYCBatch = (data) => {
  const schema = joi.object().keys({
    courseId: joi.string().required(),
    assigned_to: joi.string().required(),
  });
  return schema.validate(data);
};

const validateYogaCourseLesson = (data) => {
  const schema = joi.object().keys({
    name: joi.string().required(),
    yogaCourseId: joi.string().required(),
    videoTimeInMinute: joi.string().optional(),
    video_id: joi.string().optional(),
    date: joi.string().required(), // UTC/GMT
  });
  return schema.validate(data);
};

const validateYogaCourseLessonUpdation = (data) => {
  const schema = joi.object().keys({
    name: joi.string().required(),
    videoTimeInMinute: joi.string().optional(),
    video_id: joi.string().optional(),
    date: joi.string().required(), // UTC/GMT
  });
  return schema.validate(data);
};

const validateYogaCourseVideoReview = (data) => {
  const schema = joi.object().keys({
    name: joi.string().required(),
    masterYogaCourse: joi.string().required(),
  });
  return schema.validate(data);
};

const validateYogaCourseReview = (data) => {
  const schema = joi.object().keys({
    rating: joi.number().greater(0).less(6).required(),
    message: joi.string().optional(),
    masterYC_id: joi.string().required(),
  });
  return schema.validate(data);
};

export {
  validateInstituteRegistration,
  validateInstituteLogin,
  validateInstituteInstructorRegistration,
  validateYCBatch,
  validateReAssignYCBatch,
  validateYogaCourseLesson,
  validateYogaCourseLessonUpdation,
  validateYogaCourseVideoReview,
  validateYogaCourseReview,
  validateInstituteLoginOTP,
};
