import dotenv from "dotenv";
dotenv.config();

import { capitalizeFirstLetter } from "../../Helper/formatChange.js";
import { deleteSingleFile } from "../../Helper/fs.helper.js";
import { generateFixedLengthRandomNumber } from "../../Helper/generateOTP.js";
import {
  createUserAccessToken,
  createUserRefreshToken,
} from "../../Helper/jwtToken.js";
import {
  failureResponse,
  successResponse,
} from "../../MiddleWare/responseMiddleware.js";
import {
  validateUserRegistration,
  validateUserMobileLogin,
  validateVerifyMobileOTP,
  validateRolePage,
  validateUpdateInstructor,
  validateProfileVisible,
  validateAadharVerification,
} from "../../MiddleWare/Validation/userProfile.js";
import { OTP } from "../../Model/User/otpModel.js";
import { UserChakras } from "../../Model/User/Profile/chakrasModel.js";
import { InstructorUpdateHistory } from "../../Model/User/Profile/instructorUpdateHistoryModel.js";
import { User } from "../../Model/User/Profile/userModel.js";
import { uploadFileToBunny } from "../../Util/bunny.js";
import { sendOTPToNumber } from "../../Util/sendOTP.js";
import axios from "axios";
const {
  OTP_DIGITS_LENGTH,
  OTP_VALIDITY_IN_MILLISECONDS,
  TEST_NUMBER_1,
  TEST_NUMBER_2,
  TEST_NUMBER_3,
  SHOW_BUNNY_FILE_HOSTNAME,
  SPRINT_AADHAR_JWT_TOKEN,
  SPRINT_AADHAR_AUTHORISED_KEY,
  SPRINT_AADHAR_PARTNER_ID,
} = process.env;
import fs from "fs";
import jwt from "jsonwebtoken";
const bunnyFolderName = "inst-doc";

// Helper
const chakraName = [
  "Root",
  "Sacral",
  "Solar Plexus",
  "Heart",
  "Throat",
  "Third Eye",
  "Crown",
];

async function compareArrays(a, b) {
  return (
    a.length === b.length && a.every((element, index) => element === b[index])
  );
}

function getRandomIntInclusive(max, exclude) {
  let num = getRandomInt(max);
  while (num === exclude) {
    num = getRandomInt(max);
  }
  return num;
}

function getRandomInt(max) {
  return Math.floor(Math.random() * max) + 1;
}

function transformUserDetails(user) {
  const data = {
    _id: user._id,
    name: user.name,
    email: user.email,
    mobileNumber: user.mobileNumber,
    role: user.role,
    profilePic: user.profilePic ? user.profilePic.url || null : null,
    userCode: user.userCode,
  };
  if (user.role.toLowerCase() === "instructor") {
    data.language = user.language || [];
    data.dateOfBirth = user.dateOfBirth || null;
    data.experience_year = user.experience_year || null;
    data.bio = user.bio || null;
    data.aadharDetails = user.aadharDetails || null;
    data.isAadharVerified = user.isAadharVerified;
    data.isProfileVisible = user.isProfileVisible;
    data.averageRating = user.averageRating;
    // Calculate Profile
    let profileComplete = 0;
    if (data.name) profileComplete += 7;
    if (data.profilePic) profileComplete += 2;
    if (data.language.length > 0) profileComplete += 2;
    if (data.bio) profileComplete += 2;
    if (data.experience_year) profileComplete += 2;
    if (data.dateOfBirth) profileComplete += 2;
    if (data.email && data.phoneNumber) profileComplete += 13;
    data.profileComplete = profileComplete;
  }
  return data;
}

async function generateUserCode(preFix) {
  const today = new Date();
  today.setMinutes(today.getMinutes() + 330);
  const day = today.toISOString().slice(8, 10);
  const year = today.toISOString().slice(2, 4);
  const month = today.toISOString().slice(5, 7);
  let userCode,
    lastDigits,
    startWith = `${preFix}${day}${month}${year}`;
  const query = new RegExp("^" + startWith);
  const isUserCode = await User.findOne({ userCode: query }).sort({
    createdAt: -1,
  });
  if (!isUserCode) {
    lastDigits = 1;
  } else {
    lastDigits = parseInt(isUserCode.userCode.substring(9)) + 1;
  }
  userCode = `${startWith}${lastDigits}`;
  while (await User.findOne({ userCode })) {
    userCode = `${startWith}${lastDigits++}`;
  }
  return userCode;
}

// Main Controller
const register = async (req, res) => {
  try {
    // Body Validation
    const { error } = validateUserRegistration(req.body);
    if (error) {
      return failureResponse(res, 400, error.details[0].message, null);
    }
    const { email, mobileNumber, referralCode } = req.body;
    // Capital First Letter
    const name = capitalizeFirstLetter(req.body.name);
    // Is user already present
    const isUser = await User.findOne({ $or: [{ email }, { mobileNumber }] });
    if (isUser) {
      return failureResponse(
        res,
        400,
        "These credentials are already present!"
      );
    }
    // Create in database
    const chakraBreakNumber = getRandomInt(7) + 1;
    const user = await User.create({
      name,
      email,
      mobileNumber,
      chakraBreakNumber,
      referralCode,
    });
    // Generate OTP for Email
    const otp = generateFixedLengthRandomNumber(OTP_DIGITS_LENGTH);
    // Sending OTP to mobile number
    await sendOTPToNumber(mobileNumber, otp);
    // Store OTP
    await OTP.create({
      validTill: new Date().getTime() + parseInt(OTP_VALIDITY_IN_MILLISECONDS),
      otp: otp,
      receiverId: user._id,
    });
    // Send final success response
    return successResponse(
      res,
      201,
      `OTP send successfully! Valid for ${
        OTP_VALIDITY_IN_MILLISECONDS / (60 * 1000)
      } minutes!`,
      { mobileNumber }
    );
  } catch (err) {
    failureResponse(res, 500, err.message, null);
  }
};

const loginByMobile = async (req, res) => {
  try {
    // Body Validation
    const { error } = validateUserMobileLogin(req.body);
    if (error) {
      return failureResponse(res, 400, error.details[0].message, null);
    }
    const { mobileNumber, referralCode } = req.body;
    // Find User in collection
    const data = { mobileNumber };
    if (referralCode) {
      data.referralCode = referralCode;
    }
    const isUser = await User.findOne({ mobileNumber });
    if (!isUser) {
      return failureResponse(res, 401, "NOTPRESENT", data);
    }

    // Testing
    if (
      mobileNumber === TEST_NUMBER_1 || // Ankush
      mobileNumber === TEST_NUMBER_2 || // Amit
      mobileNumber === TEST_NUMBER_3 // Laxmi
    ) {
      return successResponse(
        res,
        201,
        `OTP send successfully! Valid for ${
          OTP_VALIDITY_IN_MILLISECONDS / (60 * 1000)
        } minutes!`,
        { mobileNumber }
      );
    }

    // Generate OTP for Email
    const otp = generateFixedLengthRandomNumber(OTP_DIGITS_LENGTH);
    // Sending OTP to mobile number
    await sendOTPToNumber(mobileNumber, otp);
    //  Store OTP
    await OTP.create({
      validTill: new Date().getTime() + parseInt(OTP_VALIDITY_IN_MILLISECONDS),
      otp: otp,
      receiverId: isUser._id,
    });
    console.log(otp);
    // Send final success response
    return successResponse(
      res,
      201,
      `OTP send successfully! Valid for ${
        OTP_VALIDITY_IN_MILLISECONDS / (60 * 1000)
      } minutes!`,
      { mobileNumber }
    );
  } catch (err) {
    failureResponse(res, 500, err.message, null);
  }
};

const verifyMobileOTP = async (req, res) => {
  try {
    // Validate body
    const { error } = validateVerifyMobileOTP(req.body);
    if (error) {
      return failureResponse(res, 400, error.details[0].message, null);
    }
    const { mobileNumber, otp } = req.body;
    // Is Email Otp exist
    const isOtp = await OTP.findOne({ otp });
    if (!isOtp) {
      return failureResponse(res, 401, `Invalid OTP!`, null);
    }
    // Checking is user present or not
    const user = await User.findOne(
      { $and: [{ mobileNumber }, { _id: isOtp.receiverId }] },
      "_id name email mobileNumber role lastLogin isEmailVerified isMobileNumberVerified referralCode"
    );
    if (!user) {
      return failureResponse(res, 401, `Invalid OTP!`, null);
    }
    // Testing Credentials
    if (
      mobileNumber === TEST_NUMBER_1 ||
      mobileNumber === TEST_NUMBER_3 ||
      mobileNumber === TEST_NUMBER_2
    ) {
      // Do Nothing
    } else {
      // is email otp expired?
      const isOtpExpired = new Date().getTime() > parseInt(isOtp.validTill);
      await OTP.deleteMany({ receiverId: isOtp.receiverId });
      if (isOtpExpired) {
        return failureResponse(res, 403, `OTP expired!`, null);
      }
    }
    const updateData = { lastLogin: new Date() };
    const historyData = { instructor: user._id, lastLogin: user.lastLogin };
    // Chakra
    if (!user.isEmailVerified && !user.isMobileNumberVerified) {
      updateData.isMobileNumberVerified = true;
      historyData.isMobileNumberVerified = user.isMobileNumberVerified;
      if (user.referralCode) {
        const referrer = await User.findOne(
          { userCode: user.referralCode },
          "_id chakraBreakNumber"
        );
        if (referrer) {
          const chakraBreakNumber = parseInt(referrer.chakraBreakNumber);
          const totalChakraQuantity = await UserChakras.countDocuments({
            referrer: referrer._id,
            isRedeemed: false,
          });
          let specialNum;
          if (totalChakraQuantity <= 20) {
            specialNum = getRandomIntInclusive(7, chakraBreakNumber);
          } else {
            specialNum = getRandomInt(7);
          }
          // Add chakra to refferer
          await UserChakras.create({
            chakraName: chakraName[specialNum - 1],
            chakraNumber: specialNum,
            joiner: user._id,
            referrer: referrer._id,
          });
        }
      }
    }
    // Generate token
    const data = { _id: user._id };
    if (user.role) data.role = user.role;
    const refreshToken = createUserRefreshToken(data);
    const accessToken = createUserAccessToken(data);
    // Update user
    await InstructorUpdateHistory.create(historyData);
    updateData.refreshToken = refreshToken;
    await user.updateOne(updateData);
    // Final Response
    return successResponse(res, 201, `Welcome, ${user.name}`, {
      accessToken,
      refreshToken,
      user,
    });
  } catch (err) {
    failureResponse(res, 500, err.message, null);
  }
};

const myDetails = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select(
      "_id name email mobileNumber role profilePic language dateOfBirth experience_year bio userCode aadharDetails isAadharVerified isProfileVisible averageRating"
    );
    if (!user) {
      return failureResponse(res, 401, "User is not present!");
    }
    // TransForm data
    const data = transformUserDetails(user._doc);
    // Send final success response
    return successResponse(res, 200, "Fetched successfully!", data);
  } catch (err) {
    failureResponse(res, 500, err.message, null);
  }
};

const rolePage = async (req, res) => {
  try {
    // Body Validation
    const { error } = validateRolePage(req.body);
    if (error) {
      return failureResponse(res, 400, error.details[0].message, null);
    }
    const { role } = req.body;
    // Define code prefix and message
    let codePreFix, message;
    if (role.toLowerCase() === "instructor") {
      message = "instructor";
      codePreFix = "SWI";
    } else if (role.toLowerCase() === "learner") {
      message = "user";
      codePreFix = "SWL";
    } else {
      return failureResponse(res, 403, "This role is not supported!");
    }
    // generate User code
    const userCode = await generateUserCode(codePreFix);
    // Update user
    await User.findOneAndUpdate({ _id: req.user._id }, { role, userCode });
    // Final response
    return successResponse(
      res,
      201,
      `You are successfully register as ${message}!`,
      { ...req.user._doc, role }
    );
  } catch (err) {
    failureResponse(res, 500, err.message, null);
  }
};

const updateInstructor = async (req, res) => {
  try {
    // Validate Body
    const { error } = validateUpdateInstructor(req.body);
    if (error) {
      return failureResponse(res, 400, error.details[0].message, null);
    }
    // Check perticular instructor present in database
    const instructor = await User.findOne({
      $and: [{ _id: req.user._id }, { role: req.user.role.toLowerCase() }],
    });
    if (!instructor) {
      return failureResponse(res, 400, "Instructor is not present!", null);
    }
    const { bio, language, experience_year } = req.body;
    const name = capitalizeFirstLetter(req.body.name);
    // Check Which data changed
    const changedData = {};
    const dataHistory = {};
    if (name !== instructor.name) {
      changedData.name = name;
      dataHistory.name = instructor.name;
    }
    if (parseInt(experience_year) !== parseInt(instructor.experience_year)) {
      changedData.experience_year = experience_year;
      dataHistory.experience_year = instructor.experience_year;
    }
    if (bio !== instructor.bio) {
      changedData.bio = bio;
      dataHistory.bio = instructor.bio;
    }
    const isLanguageChanged = await compareArrays(
      language,
      instructor.language
    );
    if (!isLanguageChanged) {
      changedData.language = language;
      dataHistory.language = instructor.language;
    }
    // store current data in history
    await InstructorUpdateHistory.create({
      ...dataHistory,
      instructor: req.user._id,
    });
    // Update
    await instructor.updateOne(changedData);
    // Send final success response
    return successResponse(res, 201, `Profile updated successfully!`);
  } catch (err) {
    failureResponse(res, 500, err.message, null);
  }
};

const addUpdateProfilePic = async (req, res) => {
  try {
    // File should be exist
    if (!req.file)
      return failureResponse(res, 400, "Please..upload a profile image!", null);
    // Upload file to bunny
    const fileStream = fs.createReadStream(req.file.path);
    await uploadFileToBunny(bunnyFolderName, fileStream, req.file.filename);
    deleteSingleFile(req.file.path);
    const profilePic = {
      fileName: req.file.filename,
      url: `${SHOW_BUNNY_FILE_HOSTNAME}/${bunnyFolderName}/${req.file.filename}`,
    };
    // Check is profile pic already present
    let message = "Profile pic added successfully!";
    if (req.user?.profilePic?.fileName) {
      message = "Profile pic updated successfully!";
      // Save updates if profile
      await InstructorUpdateHistory.create({
        profilePic: req.user.profilePic,
        instructor: req.user._id,
      });
    }
    // Update
    await User.updateOne({ _id: req.user._id }, { profilePic });
    // Final response
    return successResponse(res, 201, message);
  } catch (err) {
    failureResponse(res, 500, err.message, null);
  }
};

const deleteProfilePic = async (req, res) => {
  try {
    if (req.user?.profilePic?.fileName) {
      // Save updates if profile
      await InstructorUpdateHistory.create({
        profilePic: req.user.profilePic,
        instructor: req.user._id,
      });
    }
    // Change
    await User.updateOne({ _id: req.user._id }, { profilePic: null });
    // Final response
    return successResponse(res, 200, "Profile pic deleted successfully!");
  } catch (err) {
    failureResponse(res, 500, err.message, null);
  }
};

const isProfileVisible = async (req, res) => {
  try {
    // Body Validation
    const { error } = validateProfileVisible(req.body);
    if (error) {
      return failureResponse(res, 400, error.details[0].message, null);
    }
    const { isProfileVisible } = req.body;
    const user = await User.findOne({ _id: req.user._id }).select(
      "_id isProfileVisible isAadharVerified education"
    );
    let message = "Your profile is now not live and visible to users.";
    // Check Conditions
    if (isProfileVisible) {
      message = "Your profile is now live and visible to users.";
      // Education
      if (user.education.length < 1) {
        return failureResponse(res, 400, "NOEDUCATION!", null);
      }
      // Aadhar verification
      if (!user.isAadharVerified) {
        return failureResponse(res, 400, "NOAADHARVERIFIED!", null);
      }
    }
    // Storing When user changed their profile visibility
    await InstructorUpdateHistory.create({
      instructor: req.user._id,
      isProfileVisible: user.isProfileVisible,
    });
    // Update user
    await User.findOneAndUpdate({ _id: req.user._id }, { isProfileVisible });
    // Final response
    return successResponse(res, 200, message);
  } catch (err) {
    failureResponse(res, 500, err.message, null);
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
    const user = await User.findById(decoded._id);
    if (!user || user?.refreshToken !== refreshToken) {
      return failureResponse(res, 403, "Unauthorized!", null);
    }
    // Generate access token
    const token = createUserAccessToken({ _id: user._id });
    // Final response
    return successResponse(res, 200, message, {
      accessToken: token,
      refreshToken,
    });
  } catch (err) {
    failureResponse(res, 500, err.message, null);
  }
};

const logout = async (req, res) => {
  try {
    await User.updateOne({ _id: req.user._id }, { refreshToken: null });
    return successResponse(res, 200, "Loged out successfully");
  } catch (err) {
    failureResponse(res, 500, err.message, null);
  }
};

const sendAadharOTP = async (req, res) => {
  try {
    const aadharNumber = req.body.aadharNumber;
    if (!aadharNumber || aadharNumber.length != 12) {
      return failureResponse(res, 400, "Aadhar number is required!", null);
    }

    // Send Aadhar OTP
    const url = "https://api.verifya2z.com/api/v1/verification/aadhaar_sendotp";
    const headers = {
      "Content-Type": "application/json",
      Token: SPRINT_AADHAR_JWT_TOKEN,
      accept: "application/json",
      authorisedkey: SPRINT_AADHAR_AUTHORISED_KEY,
      "User-Agent": SPRINT_AADHAR_PARTNER_ID,
    };
    const data = { id_number: aadharNumber };
    // Store in database
    await User.updateOne(
      { _id: req.user._id },
      { $set: { aadharDetails: { aadharNumber } } }
    );
    const aadhar = await axios.post(url, JSON.stringify(data), { headers });

    if (aadhar.data.status) {
      // Final response
      return successResponse(res, 200, "OTP sent successfully", {
        client_id: aadhar.data.data.client_id,
      });
    } else {
      // Final response
      return failureResponse(res, 400, aadhar.data.message, null);
    }
  } catch (err) {
    failureResponse(res, 500, err.message, null);
  }
};

const verifyAadharOTP = async (req, res) => {
  try {
    // Body Validation
    const { error } = validateAadharVerification(req.body);
    if (error) {
      return failureResponse(res, 400, error.details[0].message, null);
    }
    const { client_id, aadharOTP } = req.body;

    // Verify Aadhar OTP
    const url =
      "https://api.verifya2z.com/api/v1/verification/aadhaar_verifyotp";
    const headers = {
      "Content-Type": "application/json",
      Token: SPRINT_AADHAR_JWT_TOKEN,
      accept: "application/json",
      authorisedkey: SPRINT_AADHAR_AUTHORISED_KEY,
      "User-Agent": SPRINT_AADHAR_PARTNER_ID,
    };
    const refid = generateFixedLengthRandomNumber(6);
    const data = {
      client_id: client_id,
      otp: aadharOTP,
      refid,
    };
    const aadhar = await axios.post(url, JSON.stringify(data), { headers });
    const address = Object.entries(aadhar.data.data.address)
      .reverse()
      .filter(([key, value]) => value) // Keep only entries with non-empty values
      .map(([key, value]) => value)
      .join(", ");
    if (aadhar.data.status) {
      const data = {
        aadharNumber: aadhar.data.data.aadhaar_number,
        full_name: aadhar.data.data.full_name,
        gender: aadhar.data.data.gender,
        dob: aadhar.data.data.dob,
        address,
      };
      // Store in database
      await User.updateOne(
        { _id: req.user._id },
        { $set: { isAadharVerified: true, aadharDetails: data } }
      );
      // Final response
      return successResponse(res, 200, "Aadhar verified successfully", data);
    } else {
      // Final response
      return failureResponse(res, 400, "Not verified", null);
    }
  } catch (err) {
    failureResponse(res, 500, err.message, null);
  }
};

export {
  register,
  loginByMobile,
  verifyMobileOTP,
  myDetails,
  rolePage,
  updateInstructor,
  addUpdateProfilePic,
  deleteProfilePic,
  isProfileVisible,
  refreshAccessToken,
  logout,
  sendAadharOTP,
  verifyAadharOTP,
};
