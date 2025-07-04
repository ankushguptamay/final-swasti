import dotenv from "dotenv";
dotenv.config();

import joi from "joi";

const validateUserRegistration = (data) => {
  const schema = joi.object().keys({
    name: joi.string().min(3).max(30).required(),
    email: joi.string().email().required().label("Email"),
    mobileNumber: joi
      .string()
      .length(10)
      .pattern(/^[0-9]+$/)
      .required(),
    referralCode: joi.string().optional(),
    term_condition_accepted: joi.boolean().required(),
    // registerBy: joi.string().valid("email", "mobile").required(),
  });
  return schema.validate(data);
};

const validateUserMobileLogin = (data) => {
  const schema = joi.object().keys({
    mobileNumber: joi
      .string()
      .length(10)
      .pattern(/^[0-9]+$/)
      .required(),
    referralCode: joi.string().optional(),
    term_condition_accepted: joi.boolean().required(),
  });
  return schema.validate(data);
};

const validateVerifyMobileOTP = (data) => {
  const schema = joi.object().keys({
    mobileNumber: joi
      .string()
      .length(10)
      .pattern(/^[0-9]+$/)
      .required(),
    otp: joi
      .string()
      .length(parseInt(process.env.OTP_DIGITS_LENGTH))
      .required(),
  });
  return schema.validate(data);
};

const validateRolePage = (data) => {
  const schema = joi.object().keys({
    role: joi.string().valid("instructor", "learner").required(),
  });
  return schema.validate(data);
};

const validateUpdateInstructor = (data) => {
  const schema = joi.object().keys({
    name: joi.string().min(3).max(30).required(),
    bio: joi.string().min(20).max(1000).required(),
    experience_year: joi.number().required(),
    specialization: joi.array().min(1).required(),
    language: joi.array().min(1).required(),
    dateOfBirth: joi.string().optional(),
    gender: joi.string().valid("male", "female", "other").required(),
  });
  return schema.validate(data);
};

const validateProfileVisible = (data) => {
  const schema = joi.object().keys({
    isProfileVisible: joi.boolean().required(),
  });
  return schema.validate(data);
};

const validateAadharVerification = (data) => {
  const schema = joi.object().keys({
    client_id: joi.string().required(),
    aadharOTP: joi.string().length(6).required(),
  });
  return schema.validate(data);
};

const validateBankDetails = (data) => {
  const schema = joi.object().keys({
    IFSCCode: joi.string().required(),
    accountNumber: joi.string().required(),
    bankName: joi.string().required(),
    branch: joi.string().required(),
  });
  return schema.validate(data);
};

const validateCerificate = (data) => {
  const schema = joi.object().keys({ name: joi.string().required() });
  return schema.validate(data);
};

const validateEducation = (data) => {
  const schema = joi.object().keys({
    qualificationName: joi.string().required(),
    university_institute: joi.string().required(),
    yearOfCompletion: joi.string().required(),
  });
  return schema.validate(data);
};

const validateUpdateLearner = (data) => {
  const schema = joi.object().keys({
    name: joi.string().min(3).max(30).required(),
    dateOfBirth: joi.string().optional(),
    gender: joi.string().valid("male", "female", "other").optional(),
  });
  return schema.validate(data);
};

const validateSubscribedUser = (data) => {
  const schema = joi.object().keys({
    name: joi.string().min(3).max(30).optional(),
    email: joi.string().email().required().label("Email"),
  });
  return schema.validate(data);
};

const validateVerifyEmailOTP = (data) => {
  const schema = joi.object().keys({
    email: joi.string().email().required().label("Email"),
    otp: joi
      .string()
      .length(parseInt(process.env.OTP_DIGITS_LENGTH))
      .required(),
  });
  return schema.validate(data);
};

const validateUserEmailLogin = (data) => {
  const schema = joi.object().keys({
    email: joi.string().email().required().label("Email"),
    referralCode: joi.string().optional(),
    term_condition_accepted: joi.boolean().required(),
  });
  return schema.validate(data);
};

export {
  validateUserRegistration,
  validateUserMobileLogin,
  validateVerifyMobileOTP,
  validateRolePage,
  validateUpdateInstructor,
  validateProfileVisible,
  validateAadharVerification,
  validateBankDetails,
  validateCerificate,
  validateEducation,
  validateUpdateLearner,
  validateSubscribedUser,
  validateVerifyEmailOTP,
  validateUserEmailLogin,
};
