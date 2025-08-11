import dotenv from "dotenv";
dotenv.config();

import { capitalizeFirstLetter } from "../../Helper/formatChange.js";
import {
  createUserAccessToken,
  createUserRefreshToken,
} from "../../Helper/jwtToken.js";
import {
  failureResponse,
  successResponse,
} from "../../MiddleWare/responseMiddleware.js";
import {
  validateInstituteLogin,
  validateInstituteInstructorRegistration,
  validateInstituteLoginOTP,
} from "../../MiddleWare/Validation/institute.js";
import jwt from "jsonwebtoken";
import { InstituteInstructor } from "../../Model/Institute/instituteInstructorModel.js";
import { User } from "../../Model/User/Profile/userModel.js";
import { InstituteOTP } from "../../Model/Institute/instituteOtpModel.js";
import { generateFixedLengthRandomNumber } from "../../Helper/generateOTP.js";
import { sendOTPToNumber } from "../../Util/sendOTP.js";

const instructorDetails = async (req, res) => {
  try {
    const instructor = await InstituteInstructor.findById(
      req.institute_instructor._id
    )
      .select("_id name email mobileNumber slug")
      .lean();
    // Send final success response
    return successResponse(res, 200, "Successfully!", instructor);
  } catch (err) {
    console.log(err.message);
    failureResponse(res);
  }
};

const registerIInstructorByAdmin = async (req, res) => {
  try {
    // Body Validation
    const { error } = validateInstituteInstructorRegistration(req.body);
    if (error) return failureResponse(res, 400, error.details[0].message, null);
    // Find Institute
    const { email, mobileNumber, institute } = req.body;
    const name = capitalizeFirstLetter(
      req.body.name.replace(/\s+/g, " ").trim()
    );
    const instituteInstructor = await InstituteInstructor.findOne({
      email: email,
    }).lean();
    if (instituteInstructor) {
      return failureResponse(res, 400, "Instructor already present!", null);
    }
    // If this register in user
    let instructor = undefined;
    const user = await User.findOne({ $or: [{ email }, { mobileNumber }] })
      .select("name")
      .lean();
    if (user) {
      instructor = user._id;
    }
    // Save details
    await InstituteInstructor.create({
      email,
      mobileNumber,
      name,
      approvalByAdmin: "accepted",
      institute,
      instructor,
    });
    // Send final success response
    return successResponse(res, 201, "Instructor created!");
  } catch (err) {
    console.log(err.message);
    failureResponse(res);
  }
};

const loginByMobile = async (req, res) => {
  try {
    // Body Validation
    const { error } = validateInstituteLogin(req.body);
    if (error) return failureResponse(res, 400, error.details[0].message, null);
    const { mobileNumber } = req.body;
    // Find Institute
    const instructor = await InstituteInstructor.findOne({ mobileNumber })
      .select("-createdAt -isDelete -deleted_at -refreshToken")
      .lean();
    if (!instructor) {
      return failureResponse(res, 400, "Invalid Mobile Number!", null);
    }
    // Valid time
    const oneHourAgo = new Date(new Date().getTime() - 30 * 60 * 1000);
    const otpCount = await InstituteOTP.countDocuments({
      receiverId: instructor._id,
      createdAt: { $gte: oneHourAgo },
    });
    if (otpCount > 2) {
      return failureResponse(
        res,
        400,
        "Too many attempt. Please try to login after 30 minute."
      );
    }
    // Generate OTP for Email
    const otp = await generateFixedLengthRandomNumber(
      process.env.OTP_DIGITS_LENGTH
    );
    // Sending OTP to mobile number
    await sendOTPToNumber(mobileNumber, otp);
    //  Store OTP
    await InstituteOTP.create({
      validTill:
        new Date().getTime() +
        parseInt(process.env.OTP_VALIDITY_IN_MILLISECONDS),
      otp: otp,
      receiverId: instructor._id,
    });
    // Send final success response
    return successResponse(
      res,
      201,
      `OTP send to mobile number successfully! Valid for ${
        process.env.OTP_VALIDITY_IN_MILLISECONDS / (60 * 1000)
      } minutes!`,
      { mobileNumber }
    );
  } catch (err) {
    failureResponse(res);
  }
};

const verifyMobileOTP = async (req, res) => {
  try {
    // Body Validation
    const { error } = validateInstituteLoginOTP(req.body);
    if (error) return failureResponse(res, 400, error.details[0].message, null);
    const { mobileNumber, otp } = req.body;
    // Is Email Otp exist
    const isOtp = await InstituteOTP.findOne({ otp }).lean();
    if (!isOtp) {
      return failureResponse(res, 401, `Invalid OTP. Try again`, null);
    }
    // Checking is user present or not
    const instructor = await InstituteInstructor.findOne(
      { $and: [{ mobileNumber }, { _id: isOtp.receiverId }] },
      "_id name email mobileNumber"
    ).lean();
    if (!instructor) {
      return failureResponse(res, 401, `Invalid OTP!`, null);
    }
    // is email otp expired?
    const isOtpExpired = new Date().getTime() > parseInt(isOtp.validTill);
    if (isOtpExpired) {
      return failureResponse(res, 403, `OTP expired!`, null);
    }
    await InstituteOTP.deleteMany({ receiverId: isOtp.receiverId });
    // Create token
    const accessToken = createUserAccessToken({ _id: instructor._id });
    const refreshToken = createUserRefreshToken({ _id: instructor._id });
    // Added refresh token in database
    await InstituteInstructor.updateOne(
      { _id: instructor._id },
      { $set: { refreshToken } }
    );
    // Send final success response
    return successResponse(res, 201, `Welcome Back, ${instructor.name}.`, {
      instructor,
      accessToken,
      refreshToken,
    });
  } catch (err) {
    failureResponse(res);
  }
};

const refreshAccessToken = async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken)
    return failureResponse(res, 401, "Refresh token required!", null);
  try {
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_SECRET_REFRESH_KEY_USER
    );
    // Find valid user
    const instructor = await InstituteInstructor.findById(decoded._id).lean();
    if (!instructor || instructor?.refreshToken !== refreshToken) {
      return failureResponse(res, 403, "Unauthorized", null);
    }
    // Generate access token
    const token = createUserAccessToken({
      _id: instructor._id,
      email: instructor.email,
    });
    // Final response
    return successResponse(res, 200, "Successfully", {
      accessToken: token,
      refreshToken,
    });
  } catch (err) {
    console.log(err.message);
    failureResponse(res);
  }
};

const logout = async (req, res) => {
  try {
    await InstituteInstructor.updateOne(
      { _id: req.institute_instructor._id },
      { $set: { refreshToken: null } }
    );
    return successResponse(res, 200, "Loged out successfully");
  } catch (err) {
    console.log(err.message);
    failureResponse(res);
  }
};

const instituteInstructorDetailsForAdmin = async (req, res) => {
  try {
    const instructor = await InstituteInstructor.findById(req.params.id)
      .populate("institute", "name")
      .populate("instructor", "name")
      .lean();
    // Send final success response
    return successResponse(res, 200, "Successfully!", instructor);
  } catch (err) {
    console.log(err.message);
    failureResponse(res);
  }
};

const getInstructor = async (req, res) => {
  try {
    const search = req.query.search?.trim();
    const resultPerPage = req.query.resultPerPage
      ? parseInt(req.query.resultPerPage)
      : 20;
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const skip = (page - 1) * resultPerPage;

    //Search
    const query = {};
    if (search) {
      const withIn = new RegExp(search.toLowerCase(), "i");
      query.name = withIn;
    }
    const [instructor, totalInstructor] = await Promise.all([
      InstituteInstructor.find(query)
        .sort({ name: 1 })
        .skip(skip)
        .limit(resultPerPage)
        .select("_id name slug email mobileNumber createdAt")
        .populate("institute", "name")
        .lean(),
      InstituteInstructor.countDocuments(query),
    ]);

    const totalPages = Math.ceil(totalInstructor / resultPerPage) || 0;
    return successResponse(res, 200, `Successfully!`, {
      data: instructor,
      totalPages,
      currentPage: page,
    });
  } catch (err) {
    console.log(err.message);
    failureResponse(res);
  }
};

export {
  registerIInstructorByAdmin,
  instructorDetails,
  loginByMobile,
  logout,
  refreshAccessToken,
  instituteInstructorDetailsForAdmin,
  getInstructor,
  verifyMobileOTP,
};
