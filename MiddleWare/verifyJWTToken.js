import dotenv from "dotenv";
dotenv.config();

import jwt from "jsonwebtoken";
import { User } from "../Model/User/Profile/userModel.js";
import { Admin } from "../Model/Admin/adminModel.js";
import { failureResponse } from "./responseMiddleware.js";
import { Institute } from "../Model/Institute/instituteModel.js";
import { InstituteInstructor } from "../Model/Institute/instituteInstructorModel.js";
const { JWT_SECRET_KEY_USER, JWT_SECRET_KEY_ADMIN } = process.env;

const verifyUserJWT = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (!authHeader?.startsWith("Bearer ")) return res.sendStatus(401);
    const token = authHeader.split(" ")[1];

    if (!token) return res.sendStatus(401);

    const decode = jwt.verify(token, JWT_SECRET_KEY_USER);

    const user = await User.findOne(
      { _id: decode._id },
      "_id name email mobileNumber term_condition_accepted role isProfileVisible profilePic refreshToken userTimeZone"
    );
    if (
      !user ||
      !user._doc.refreshToken ||
      !user._doc.term_condition_accepted
    ) {
      return failureResponse(res, 401, "Unauthorized", null);
    }
    req.user = user;
    return next();
  } catch (err) {
    return failureResponse(res, 500, err.message);
  }
};

const verifyAdminJWT = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (!authHeader?.startsWith("Bearer ")) return res.sendStatus(401);
    const token = authHeader.split(" ")[1];

    if (!token) return res.sendStatus(401);

    const decode = jwt.verify(token, JWT_SECRET_KEY_ADMIN);

    const admin = await Admin.findOne(
      { _id: decode._id },
      "_id name email mobileNumber"
    );
    if (!admin) {
      return failureResponse(res, 401, "Unauthorized", null);
    }
    req.admin = decode;
    return next();
  } catch (err) {
    return failureResponse(res, 500, err.message);
  }
};

const verifyInstituteJWT = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (!authHeader?.startsWith("Bearer ")) return res.sendStatus(401);
    const token = authHeader.split(" ")[1];

    if (!token) return res.sendStatus(401);

    const decode = jwt.verify(token, JWT_SECRET_KEY_USER);

    const institute = await Institute.findOne(
      { _id: decode._id },
      "_id name email mobileNumber refreshToken"
    ).lean();
    if (!institute || !institute.refreshToken) {
      return failureResponse(res, 401, "Unauthorized", null);
    }
    req.institute = institute;
    return next();
  } catch (err) {
    return failureResponse(res, 500, err.message);
  }
};

const verifyInstituteInstructorJWT = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (!authHeader?.startsWith("Bearer ")) return res.sendStatus(401);
    const token = authHeader.split(" ")[1];

    if (!token) return res.sendStatus(401);

    const decode = jwt.verify(token, JWT_SECRET_KEY_USER);

    const institute = await InstituteInstructor.findOne(
      { _id: decode._id },
      "_id name email mobileNumber refreshToken"
    ).lean();
    if (!institute || !institute.refreshToken) {
      return failureResponse(res, 401, "Unauthorized", null);
    }
    req.institute_instructor = institute;
    return next();
  } catch (err) {
    return failureResponse(res, 500, err.message);
  }
};

export {
  verifyAdminJWT,
  verifyUserJWT,
  verifyInstituteJWT,
  verifyInstituteInstructorJWT,
};
