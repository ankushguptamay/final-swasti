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

import { Institute } from "../../Model/Institute/instituteModel.js";
import {
  validateInstituteLogin,
  validateInstituteRegistration,
  validateInstituteLoginOTP,
} from "../../MiddleWare/Validation/institute.js";
import jwt from "jsonwebtoken";
import { generateFixedLengthRandomNumber } from "../../Helper/generateOTP.js";
import { sendOTPToNumber } from "../../Util/sendOTP.js";
import { InstituteOTP } from "../../Model/Institute/instituteOtpModel.js";

const instituteDetails = async (req, res) => {
  try {
    const institute = await Institute.findById(req.institute._id)
      .select("_id name email mobileNumber")
      .lean();
    // Send final success response
    return successResponse(res, 200, "Successfully!", institute);
  } catch (err) {
    failureResponse(res);
  }
};

const registerInstituteByAdmin = async (req, res) => {
  try {
    // Body Validation
    const { error } = validateInstituteRegistration(req.body);
    if (error) return failureResponse(res, 400, error.details[0].message, null);
    // Find Institute
    const { email, mobileNumber } = req.body;
    const name = capitalizeFirstLetter(
      req.body.name.replace(/\s+/g, " ").trim()
    );
    const isInstittute = await Institute.findOne({ email: email });
    if (isInstittute) {
      return failureResponse(res, 400, "Institute already present!", null);
    }
    // Save details
    await Institute.create({
      email,
      mobileNumber,
      name,
      approvalByAdmin: "accepted",
    });
    // Send final success response
    return successResponse(res, 201, "Institute created!");
  } catch (err) {
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
    const isInstittute = await Institute.findOne({ mobileNumber })
      .select("-createdAt -isDelete -deleted_at -refreshToken")
      .lean();
    if (!isInstittute) {
      return failureResponse(res, 400, "Invalid Mobile Number!", null);
    }
    // Valid time
    const oneHourAgo = new Date(new Date().getTime() - 30 * 60 * 1000);
    const otpCount = await InstituteOTP.countDocuments({
      receiverId: isInstittute._id,
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
      receiverId: isInstittute._id,
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
    const institute = await Institute.findOne(
      { $and: [{ mobileNumber }, { _id: isOtp.receiverId }] },
      "_id name email mobileNumber"
    ).lean();
    if (!institute) {
      return failureResponse(res, 401, `Invalid OTP!`, null);
    }
    // is email otp expired?
    const isOtpExpired = new Date().getTime() > parseInt(isOtp.validTill);
    if (isOtpExpired) {
      return failureResponse(res, 403, `OTP expired!`, null);
    }
    await InstituteOTP.deleteMany({ receiverId: isOtp.receiverId });
    // Create token
    const accessToken = createUserAccessToken({ _id: institute._id });
    const refreshToken = createUserRefreshToken({ _id: institute._id });
    // Added refresh token in database
    await Institute.updateOne(
      { _id: institute._id },
      { $set: { refreshToken } }
    );
    // Send final success response
    return successResponse(res, 201, `Welcome Back, ${institute.name}.`, {
      institute,
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
    const institute = await Institute.findById(decoded._id).lean();
    if (!institute || institute?.refreshToken !== refreshToken) {
      return failureResponse(res, 403, "Unauthorized", null);
    }
    // Generate access token
    const token = createUserAccessToken({
      _id: institute._id,
      email: institute.email,
    });
    // Final response
    return successResponse(res, 200, "Successfully", {
      accessToken: token,
      refreshToken,
    });
  } catch (err) {
    failureResponse(res);
  }
};

const logout = async (req, res) => {
  try {
    await Institute.updateOne(
      { _id: req.institute._id },
      { $set: { refreshToken: null } }
    );
    return successResponse(res, 200, "Loged out successfully");
  } catch (err) {
    failureResponse(res);
  }
};

const instituteDetailsForAdmin = async (req, res) => {
  try {
    const institute = await Institute.findById(req.params.id).lean();
    // Send final success response
    return successResponse(res, 200, "Successfully!", institute);
  } catch (err) {
    failureResponse(res);
  }
};

const getInstitute = async (req, res) => {
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
    const [institute, totalInstitute] = await Promise.all([
      Institute.find(query)
        .sort({ name: 1 })
        .skip(skip)
        .limit(resultPerPage)
        .select("_id name slug email mobileNumber createdAt")
        .lean(),
      Institute.countDocuments(query),
    ]);

    const totalPages = Math.ceil(totalInstitute / resultPerPage) || 0;
    return successResponse(res, 200, `Successfully!`, {
      data: institute,
      totalPages,
      currentPage: page,
    });
  } catch (err) {
    failureResponse(res);
  }
};

export {
  instituteDetails,
  registerInstituteByAdmin,
  loginByMobile,
  logout,
  refreshAccessToken,
  instituteDetailsForAdmin,
  getInstitute,
  verifyMobileOTP,
};
