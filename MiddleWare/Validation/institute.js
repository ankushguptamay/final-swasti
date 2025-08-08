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
    password: joi
      .string()
      .pattern(
        new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)[a-zA-Z\\d@$!%*?& ]{8,}$")
      )
      .required()
      .min(8)
      .max(20),
  });
  return schema.validate(data);
};

const validateInstituteLogin = (data) => {
  const schema = joi.object().keys({
    email: joi.string().email().required().label("Email"),
    password: joi
      .string()
      .pattern(
        new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)[a-zA-Z\\d@$!%*?& ]{8,}$")
      )
      .required()
      .min(8)
      .max(20),
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
    password: joi
      .string()
      .pattern(
        new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)[a-zA-Z\\d@$!%*?& ]{8,}$")
      )
      .required()
      .min(8)
      .max(20),
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
    video: joi.string().optional(),
    hls_url: joi.string().optional(),
    videoTimeInMinute: joi.string().optional(),
    thumbNailUrl: joi.string().optional(),
    date: joi.string().required(), // UTC/GMT
  });
  return schema.validate(data);
};

const validateYogaCourseLessonUpdation = (data) => {
  const schema = joi.object().keys({
    name: joi.string().required(),
    video: joi.string().optional(),
    hls_url: joi.string().optional(),
    videoTimeInMinute: joi.string().optional(),
    thumbNailUrl: joi.string().optional(),
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
};
