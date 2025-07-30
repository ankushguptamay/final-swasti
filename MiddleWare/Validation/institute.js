import joi from "joi";

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

const validateYogaCourse = (data) => {
  const schema = joi.object().keys({
    name: joi
      .string()
      .valid("Yoga Volunteer Course", "Obesity Management")
      .required(),
    description: joi.string().optional(),
    assigned_to: joi.string().optional(),
    startDate: joi.string().required(),
    amount: joi.number().required(),
  });
  return schema.validate(data);
};

const validateReAssignYogaCourse = (data) => {
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
    date: joi.string().required(), // UTC/GMT
  });
  return schema.validate(data);
};

export {
  validateInstituteRegistration,
  validateInstituteLogin,
  validateInstituteInstructorRegistration,
  validateYogaCourse,
  validateReAssignYogaCourse,
  validateYogaCourseLesson,
};
