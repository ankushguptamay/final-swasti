import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import {
  capitalizeFirstLetter,
  compareArrays,
} from "../../../Helper/formatChange.js";
import {
  compressImageFile,
  deleteSingleFile,
} from "../../../Helper/fileHelper.js";
import { generateFixedLengthRandomNumber } from "../../../Helper/generateOTP.js";
import {
  createUserAccessToken,
  createUserRefreshToken,
} from "../../../Helper/jwtToken.js";
import {
  failureResponse,
  successResponse,
} from "../../../MiddleWare/responseMiddleware.js";
import {
  validateUserRegistration,
  validateUserMobileLogin,
  validateVerifyMobileOTP,
  validateRolePage,
  validateUpdateInstructor,
  validateProfileVisible,
  validateAadharVerification,
  validateUpdateLearner,
  validateVerifyEmailOTP,
  validateUserEmailLogin,
} from "../../../MiddleWare/Validation/userProfile.js";
import { OTP } from "../../../Model/User/otpModel.js";
import { UserChakras } from "../../../Model/User/Profile/chakrasModel.js";
import { InstructorUpdateHistory } from "../../../Model/User/Profile/instructorUpdateHistoryModel.js";
import { User } from "../../../Model/User/Profile/userModel.js";
import { deleteFileToBunny, uploadFileToBunny } from "../../../Util/bunny.js";
import { sendOTPToNumber } from "../../../Util/sendOTP.js";
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
import { Wallet } from "../../../Model/User/Profile/walletModel.js";
import { YogaTutorClass } from "../../../Model/User/Services/YogaTutorClass/yogaTutorClassModel.js";
import {
  convertGivenTimeZoneToUTC,
  getDatesDay,
} from "../../../Util/timeZone.js";
import { Specialization } from "../../../Model/Master/specializationModel.js";
import { UserNotification } from "../../../Model/User/notificationModel.js";
import {
  finaliseEmailCredential,
  sendOTPToEmail,
} from "../../../Util/sendEmail.js";
import { OTPEMAIL } from "../../../Config/emailFormate.js";
const bunnyFolderName = process.env.INSTRUCTOR_PROFILE_FOLDER || "inst-doc";

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
    gender: user.gender || null,
    profilePic: user.profilePic ? user.profilePic.url || null : null,
    userCode: user.userCode,
    dateOfBirth: user.dateOfBirth || null,
  };
  let profileComplete = 60; // Name, email, mobileNumber
  if (data.profilePic) profileComplete += 20;
  if (data.gender) profileComplete += 20;
  if (user.role.toLowerCase() === "instructor") {
    data.language = user.language || [];
    data.specialization = user.specialization
      ? user.specialization.map(({ specialization }) => specialization)
      : [];
    data.experience_year = user.experience_year || null;
    data.bio = user.bio || null;
    data.isAadharVerified = user.isAadharVerified;
    data.isProfileVisible = user.isProfileVisible;
    data.averageRating = user.averageRating;
    // Calculate Profile
    profileComplete = 15; // Name, email, mobileNumber
    if (data.profilePic) profileComplete += 3;
    if (data.language.length > 0) profileComplete += 3;
    if (data.bio) profileComplete += 3;
    if (data.experience_year) profileComplete += 3;
    if (data.gender) profileComplete += 3;
    if (data.isAadharVerified) profileComplete += 20;
    if (
      user.bankDetail &&
      Array.isArray(user.bankDetail) &&
      user.bankDetail.length > 0
    )
      profileComplete += 15;
    if (
      user.education &&
      Array.isArray(user.education) &&
      user.education.length > 0
    )
      profileComplete += 15;
    if (
      user.certificate &&
      Array.isArray(user.certificate) &&
      user.certificate.length > 0
    )
      profileComplete += 20;
  }
  data.profileComplete = profileComplete;
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

async function bindByPackageType(data) {
  const grouped = [];

  for (const { packageType, ...rest } of data) {
    // Find or create group
    let group = grouped.find(
      (g) => g.packageType.toLowerCase() === packageType.toLowerCase()
    );
    if (!group) {
      group = { packageType, yogaClasses: [] };
      grouped.push(group);
    }
    // Convert class start time to UTC
    const classStartTimeInUTC = await convertGivenTimeZoneToUTC(
      `${rest.startDate.toISOString().split("T")[0]}T${rest.time}:00.000`,
      rest.instructorTimeZone
    );
    // Convert each class date
    const datesOfClasses = await Promise.all(
      rest.datesOfClasses.map(async (classe) => {
        const day = await getDatesDay(classe.startDateTimeUTC);
        return { ...classe, day };
      })
    );
    // Add processed class to group
    group.yogaClasses.push({
      ...rest,
      classStartTimeInUTC,
      datesOfClasses,
    });
  }

  return grouped;
}
// Main Controller
const register = async (req, res) => {
  try {
    // Body Validation
    const { error } = validateUserRegistration(req.body);
    if (error) {
      return failureResponse(res, 400, error.details[0].message, null);
    }
    const {
      email,
      mobileNumber,
      registerBy,
      referralCode,
      term_condition_accepted,
    } = req.body;
    if (!term_condition_accepted)
      return failureResponse(
        res,
        401,
        "Please accept term and condition.",
        null
      );
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
    // User Time Zone
    const timezone = req.headers["time-zone"] || req.headers["x-timezone"];
    // Create in database
    const chakraBreakNumber = getRandomInt(7);
    const user = await User.create({
      userTimeZone: timezone,
      name,
      email,
      mobileNumber,
      chakraBreakNumber,
      referralCode,
      term_condition_accepted,
    });
    // Generate OTP for Email
    const otp = await generateFixedLengthRandomNumber(OTP_DIGITS_LENGTH);
    let data = { mobileNumber },
      msg = "OTP send to mobile number successfully";
    if (registerBy === "email") {
      data = { email };
      msg = "OTP send to email successfully";
      // Sending OTP to mobile number
      const emailCredential = await finaliseEmailCredential();
      if (emailCredential) {
        const options = {
          subject: "Email Verification",
          brevoEmail: emailCredential.email,
          brevoKey: emailCredential.EMAIL_API_KEY,
          headers: { "OTP for email verification": "123A" },
          htmlContent: await OTPEMAIL({
            otp: String(otp),
            name: name,
            time: OTP_VALIDITY_IN_MILLISECONDS / (60 * 1000),
            senderMail: emailCredential.email,
          }),
          userEmail: email,
          userName: name,
        };
        await sendOTPToEmail(options);
      }
    } else {
      // Sending OTP to mobile number
      await sendOTPToNumber(mobileNumber, otp);
    }
    // Store OTP
    await OTP.create({
      validTill: new Date().getTime() + parseInt(OTP_VALIDITY_IN_MILLISECONDS),
      otp: otp,
      receiverId: user._id,
    });
    // Create Wallet
    await Wallet.create({ userId: user._id });
    // Send Notification
    await UserNotification.create({
      recipient: user._id,
      type: "welcome",
      redirectTo: "profile",
      title: "Welcome to Swasti Bharat!",
      message: `Hello ${name}, Your account has been created successfully.`,
      createdAt: new Date(new Date().getTime() + 1 * 60 * 1000),
    });
    // Send final success response
    return successResponse(
      res,
      201,
      `${msg}! Valid for ${
        OTP_VALIDITY_IN_MILLISECONDS / (60 * 1000)
      } minutes!`,
      data
    );
  } catch (err) {
    console.log(err.message);
    failureResponse(res);
  }
};

const loginByMobile = async (req, res) => {
  try {
    // Body Validation
    const { error } = validateUserMobileLogin(req.body);
    if (error) {
      return failureResponse(res, 400, error.details[0].message, null);
    }
    const { mobileNumber, referralCode, term_condition_accepted } = req.body;
    if (!term_condition_accepted)
      return failureResponse(
        res,
        401,
        "Please accept term and condition.",
        null
      );
    // Find User in collection
    const data = { mobileNumber };
    if (referralCode) {
      data.referralCode = referralCode;
    }
    const isUser = await User.findOne({ mobileNumber });
    if (!isUser) {
      return failureResponse(res, 401, "NOTPRESENT", data);
    }
    isUser.term_condition_accepted = term_condition_accepted;
    await isUser.save();
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
    const otp = await generateFixedLengthRandomNumber(OTP_DIGITS_LENGTH);
    // console.log(otp);
    // Sending OTP to mobile number
    await sendOTPToNumber(mobileNumber, otp);
    //  Store OTP
    await OTP.create({
      validTill: new Date().getTime() + parseInt(OTP_VALIDITY_IN_MILLISECONDS),
      otp: otp,
      receiverId: isUser._id,
    });
    // Send final success response
    return successResponse(
      res,
      201,
      `OTP send to mobile number successfully! Valid for ${
        OTP_VALIDITY_IN_MILLISECONDS / (60 * 1000)
      } minutes!`,
      { mobileNumber }
    );
  } catch (err) {
    failureResponse(res);
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
      return failureResponse(res, 401, `Invalid OTP. Try again`, null);
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
    user.lastLogin = new Date();
    const historyData = { instructor: user._id, lastLogin: user.lastLogin };
    if (!user.isMobileNumberVerified) {
      user.isMobileNumberVerified = true;
      historyData.isMobileNumberVerified = user.isMobileNumberVerified;
    }
    // Chakra
    if (!user.isEmailVerified && !user.isMobileNumberVerified) {
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
    user.refreshToken = refreshToken;
    await user.save();
    // Send Notification
    if (user.isEmailVerified || user.isMobileNumberVerified) {
      await UserNotification.create({
        recipient: user._id,
        type: "welcome",
        redirectTo: "profile",
        title: "Login from a new device detected!",
        message: `Hello ${user.name}, Welcome back to Swasti Bharat.`,
        createdAt: new Date(new Date().getTime() + 1 * 60 * 1000),
      });
    }
    // Final Response
    return successResponse(res, 201, `Login successful. Welcome back!`, {
      accessToken,
      refreshToken,
      user,
    });
  } catch (err) {
    console.log(err.message);
    failureResponse(res);
  }
};

const myDetails = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select(
        "_id name email mobileNumber role profilePic education certificate bankDetail language dateOfBirth gender experience_year bio userCode isAadharVerified isProfileVisible averageRating"
      )
      .populate("specialization", "specialization");
    if (!user) {
      return failureResponse(res, 401, "User is not present!");
    }
    // TransForm data
    const data = transformUserDetails(user._doc);
    // Send final success response
    return successResponse(res, 200, "Fetched successfully!", data);
  } catch (err) {
    failureResponse(res);
  }
};

const rolePage = async (req, res) => {
  try {
    // Body Validation
    const { error } = validateRolePage(req.body);
    if (error) {
      return failureResponse(res, 400, error.details[0].message, null);
    }
    let { role } = req.body;
    if (!req.user.role) {
      // Define code prefix
      let codePreFix;
      if (role.toLowerCase() === "instructor") {
        codePreFix = "SWI";
      } else if (role.toLowerCase() === "learner") {
        codePreFix = "SWL";
      } else {
        return failureResponse(res, 403, "This role is not supported!");
      }
      // generate User code
      const userCode = await generateUserCode(codePreFix);
      // Update user
      await User.findOneAndUpdate({ _id: req.user._id }, { role, userCode });
    } else {
      role = req.user.role;
    }
    const message =
      role === "instructor"
        ? "Now list your class."
        : "Find your instructor here and book now.";
    const accessToken = createUserAccessToken({ _id: req.user._id, role });
    // Send Notification
    await UserNotification.create({
      recipient: req.user._id,
      type: "welcome",
      redirectTo: "profile",
      title: `You choose ${role}.`,
      message: `Hello ${role}, ${message}`,
      createdAt: new Date(new Date().getTime() + 1 * 60 * 1000),
    });
    // Final response
    return successResponse(
      res,
      201,
      `You have been successfully registered as ${role}.`,
      { ...req.user._doc, role, accessToken }
    );
  } catch (err) {
    console.log(err.message);
    failureResponse(res);
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
    const {
      bio,
      language = [],
      experience_year = 0,
      dateOfBirth,
      gender,
      specialization = [],
    } = req.body;
    const name = capitalizeFirstLetter(req.body.name);
    // Check Which data changed
    const changedData = {};
    const dataHistory = {};
    // Name
    if (name !== instructor.name) {
      changedData.name = name;
      dataHistory.name = instructor.name;
    }
    // Gender
    if (!instructor.isAadharVerified) {
      if (gender && gender !== instructor.gender) {
        changedData.gender = gender.toLowerCase();
        dataHistory.gender = instructor.gender;
      }
    }
    // Experience
    if (parseInt(experience_year) !== parseInt(instructor.experience_year)) {
      changedData.experience_year = experience_year;
      dataHistory.experience_year = instructor.experience_year;
    }
    // Bio
    if (bio && bio !== instructor.bio) {
      changedData.bio = bio;
      dataHistory.bio = instructor.bio;
    }
    // Date Of Birth
    if (!instructor.isAadharVerified) {
      if (
        dateOfBirth &&
        new Date(dateOfBirth).getTime() !==
          new Date(instructor.dateOfBirth || new Date()).getTime()
      ) {
        changedData.dateOfBirth = new Date(dateOfBirth);
        dataHistory.dateOfBirth = instructor.dateOfBirth;
      }
    }
    // Language
    if (language.length > 0) {
      const isLanguageChanged = await compareArrays(
        language,
        instructor.language
      );
      if (!isLanguageChanged) {
        changedData.language = language;
        dataHistory.language = instructor.language;
      }
    }
    // Specialization
    if (specialization.length > 0) {
      const existing = instructor.specialization.map((spe) => spe.toString());
      const newSpecialization = specialization.map((spe) => spe.toString());
      const isSpecializationChanged = await compareArrays(
        newSpecialization.sort(),
        existing.sort()
      );
      if (!isSpecializationChanged) {
        changedData.specialization = specialization;
        dataHistory.specialization = instructor.specialization;
      }
    }

    // store current data in history
    await InstructorUpdateHistory.create({
      ...dataHistory,
      instructor: req.user._id,
    });
    // Update
    await instructor.updateOne(changedData);
    // Send final success response
    return successResponse(res, 201, `Profile updated successfully.`);
  } catch (err) {
    failureResponse(res);
  }
};

const addUpdateProfilePic = async (req, res) => {
  try {
    // File should be exist
    if (!req.file)
      return failureResponse(res, 400, "Please..upload a profile image!", null);
    // Compress File
    const buffer = fs.readFileSync(req.file.path);
    const compressedImagePath = await compressImageFile(buffer, req.file);
    // Upload file to bunny
    const fileStream = fs.createReadStream(compressedImagePath.imagePath);
    await uploadFileToBunny(
      bunnyFolderName,
      fileStream,
      compressedImagePath.imageName
    );
    // Delete file from server
    deleteSingleFile(compressedImagePath.imagePath);
    const profilePic = {
      fileName: compressedImagePath.imageName,
      url: `${SHOW_BUNNY_FILE_HOSTNAME}/${bunnyFolderName}/${compressedImagePath.imageName}`,
    };
    // Check is profile pic already present
    let message = "Profile pic added successfully!";
    if (req.user?.profilePic?.fileName) {
      message = "Profile pic updated successfully!";
      if (req.user.role.toLowerCase() === "instructor") {
        // Save updates if profile
        await InstructorUpdateHistory.create({
          profilePic: req.user.profilePic,
          instructor: req.user._id,
        });
      } else {
        deleteFileToBunny(bunnyFolderName, req.user.profilePic.fileName);
      }
    }
    // Update
    await User.updateOne({ _id: req.user._id }, { profilePic });
    // Final response
    return successResponse(res, 201, message);
  } catch (err) {
    failureResponse(res);
  }
};

const deleteProfilePic = async (req, res) => {
  try {
    if (req.user?.profilePic?.fileName) {
      if (req.user.role.toLowerCase() === "instructor") {
        // Save updates if profile
        await InstructorUpdateHistory.create({
          profilePic: req.user.profilePic,
          instructor: req.user._id,
        });
      } else {
        deleteFileToBunny(bunnyFolderName, req.user.profilePic.fileName);
      }
    }
    // Change
    await User.updateOne({ _id: req.user._id }, { profilePic: null });
    // Final response
    return successResponse(res, 200, "Profile pic deleted successfully!");
  } catch (err) {
    failureResponse(res);
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
    const user = await User.findById(decoded._id);
    if (
      !user ||
      user?.refreshToken !== refreshToken ||
      !user.term_condition_accepted
    ) {
      return failureResponse(res, 403, "Unauthorized", null);
    }
    // Generate access token
    const token = createUserAccessToken({ _id: user._id });
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
    await User.updateOne({ _id: req.user._id }, { refreshToken: null });
    return successResponse(res, 200, "Loged out successfully");
  } catch (err) {
    failureResponse(res);
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
    failureResponse(res);
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
    const refid = await generateFixedLengthRandomNumber(6);
    const data = {
      client_id: client_id,
      otp: aadharOTP,
      refid,
    };
    const aadhar = await axios.post(url, JSON.stringify(data), { headers });
    let gender = undefined;
    if (aadhar.data.status) {
      const address = Object.entries(aadhar.data.data.address)
        .reverse()
        .filter(([key, value]) => value) // Keep only entries with non-empty values
        .map(([key, value]) => value)
        .join(", ");
      gender =
        aadhar.data.data.gender.toLowerCase() === "m"
          ? "male"
          : aadhar.data.data.gender.toLowerCase() === "f"
          ? "female"
          : "other";
      const aadharDetails = await User.findById(req.user._id).select(
        "aadharDetails"
      );
      const data = {
        aadharNumber: aadharDetails._doc.aadharDetails.aadharNumber,
        name: aadhar.data.data.full_name,
        gender,
        dateOfBirth: aadhar.data.data.dob,
        address,
      };
      // Store in database
      await User.updateOne(
        { _id: req.user._id },
        { $set: { isAadharVerified: true, aadharDetails: data, gender } }
      );
      // Final response
      return successResponse(res, 200, "Aadhar verified successfully", {
        ...data,
        aadharNumber: aadhar.data.data.aadhaar_number,
      });
    } else {
      // Final response
      return failureResponse(res, 400, "Not verified", null);
    }
  } catch (err) {
    failureResponse(res);
  }
};

const getMyChakra = async (req, res) => {
  try {
    const [chakras, totalUnredemedChakras] = await Promise.all([
      UserChakras.aggregate([
        {
          $match: {
            isRedeemed: false,
            referrer: new mongoose.Types.ObjectId(req.user._id),
          },
        },
        {
          $group: {
            _id: "$chakraNumber",
            chakraName: { $first: "$chakraName" },
            totalChakras: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        {
          $project: {
            chakraNumber: "$_id",
            _id: 0,
            chakraName: 1,
            totalChakras: 1,
          },
        },
      ]),
      UserChakras.countDocuments({
        isRedeemed: false,
        referrer: req.user._id,
      }),
    ]);
    // Count completed set
    const completedSet =
      chakras.length === 7
        ? Math.min(...chakras.map(({ totalChakras }) => totalChakras))
        : 0;
    // Final Response
    return successResponse(res, 200, "Fetched successfully!", {
      totalUnredemedChakras,
      completedSet,
      chakras,
    });
  } catch (err) {
    failureResponse(res);
  }
};

const chakraDetails = async (req, res) => {
  try {
    const chakraNumber = req.params.chakraNumber;
    const chakra = await UserChakras.find({
      chakraNumber: parseInt(chakraNumber),
      isRedeemed: false,
      referrer: req.user._id,
    })
      .populate("joiner", "_id name profilePic")
      .select("chakraName createdAt");
    // Transform data
    const transform = chakra.map(({ chakraName, joiner, createdAt }) => {
      return {
        chakraName,
        createdAt,
        joiner: {
          _id: joiner._id,
          name: joiner.name,
          profilePic: joiner.profilePic ? joiner.profilePic.url || null : null,
        },
      };
    });
    // Final Response
    return successResponse(res, 200, "Fetched successfully!", {
      totalChakra: chakra.length,
      chakraNumber,
      chakra: transform,
    });
  } catch (err) {
    failureResponse(res);
  }
};

const updateLearner = async (req, res) => {
  try {
    // Validate Body
    const { error } = validateUpdateLearner(req.body);
    if (error) {
      return failureResponse(res, 400, error.details[0].message, null);
    }
    const { gender, dateOfBirth } = req.body;
    const name = capitalizeFirstLetter(req.body.name);
    // Check Which data changed
    const changedData = {
      name,
      gender: gender ? gender.toLowerCase() : undefined,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
    };
    // Update
    await User.updateOne({ _id: req.user._id }, { $set: changedData });
    // Send final success response
    return successResponse(res, 201, `Profile updated successfully!`);
  } catch (err) {
    failureResponse(res);
  }
};

const searchInstructor = async (req, res) => {
  try {
    const {
      s, // search
      eLL, // experienceLowerLimit
      eUL, // experienceUpperLimit
      sR = 0, // starRating
      role = "instructor",
      spe,
      gender,
    } = req.query;

    const resultPerPage = req.query.resultPerPage
      ? parseInt(req.query.resultPerPage)
      : 20;
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const skip = (page - 1) * resultPerPage;

    // Data query
    let query = {
      $and: [
        { role },
        { $expr: { $gte: [{ $size: "$education" }, 1] } }, // Atleast one educaion should present
        { "profilePic.url": { $exists: true, $ne: null, $ne: "" } }, // profile pic should be present
      ],
    };
    //Search
    if (s) {
      const containInString = new RegExp(s, "i");
      query.$and.push({ name: containInString });
    }

    // Filter
    if (eLL && eUL) {
      query.$and.push({
        experience_year: { $gte: parseInt(eLL), $lte: parseInt(eUL) },
      });
    }
    // Specialization
    if (Array.isArray(spe) && spe.length > 0) {
      const speci = await Specialization.find({ specialization: spe })
        .select("_id")
        .lean();
      if (speci.length > 0)
        query.$and.push({
          specialization: { $in: speci.map((spe) => spe._id) },
        });
    }
    // Average rating
    if (sR) {
      query.$and.push({ averageRating: { $gte: parseInt(sR) } });
    }
    // Gender
    if (gender) {
      query.$and.push({ gender });
    }
    // Get required data
    const [instructor, totalInstructor] = await Promise.all([
      User.find(query)
        .select("_id name profilePic bio averageRating gender experience_year")
        .sort({ averageRating: -1, name: 1 })
        .skip(skip)
        .limit(resultPerPage)
        .populate("specialization", "specialization")
        .lean(),
      User.countDocuments(query),
    ]);

    // Transform Data
    const transformData = instructor.map((user) => {
      return {
        ...user,
        profilePic: user.profilePic ? user.profilePic.url || null : null,
        specialization:
          user.specialization.length > 0
            ? user.specialization.map((spe) => spe.specialization)
            : [],
      };
    });
    const totalPages = Math.ceil(totalInstructor / resultPerPage) || 0;
    // Send final success response
    return successResponse(res, 200, `Successfully!`, {
      data: transformData,
      totalPages,
      totalResults: totalInstructor,
      currentPage: page,
    });
  } catch (err) {
    failureResponse(res);
  }
};

const instructorDetailsForLearner = async (req, res) => {
  try {
    const instructor = await User.findOne({
      _id: req.params.id,
      $expr: { $gte: [{ $size: "$education" }, 1] },
      "profilePic.url": { $exists: true, $ne: null, $ne: "" },
    })
      .select(
        "_id name role profilePic language dateOfBirth gender experience_year bio isProfileVisible averageRating isAadharVerified"
      )
      .populate("specialization", "specialization")
      .populate("certificate", "name")
      .lean();
    if (!instructor)
      return failureResponse(
        res,
        400,
        "This instructor profile is not available!",
        null
      );
    // Transform Data
    const data = {
      ...instructor,
      profilePic: instructor.profilePic
        ? instructor.profilePic.url || null
        : null,
      specialization:
        instructor.specialization?.length > 0
          ? instructor.specialization.map(
              ({ specialization }) => specialization
            )
          : [],
      certificate:
        instructor.certificate?.length > 0
          ? instructor.certificate.map(({ name }) => name)
          : [],
    };
    // Find other user
    const specialization =
      instructor.specialization?.length > 0
        ? instructor.specialization.map(({ _id }) => _id)
        : [];
    const similarQuery = {
      _id: { $ne: req.params.id },
      $expr: { $gte: [{ $size: "$education" }, 1] },
      "profilePic.url": { $exists: true, $ne: null, $ne: "" },
      $or: [
        { averageRating: { $gte: instructor.averageRating } },
        { experience_year: { $gte: instructor.experience_year } },
        { language: { $in: instructor.language } },
      ],
    };
    if (specialization.length > 0) {
      similarQuery.$or.push({ specialization: { $in: specialization } });
    }
    const [similarProfile, yogaClasses] = await Promise.all([
      User.find(similarQuery)
        .select("_id name profilePic bio averageRating")
        .sort({ averageRating: -1, name: 1 })
        .limit(20)
        .populate("specialization", "specialization")
        .lean(),
      YogaTutorClass.find({
        startDate: {
          $gte: new Date(new Date().toISOString().split("T")[0]),
        },
        instructor: req.params.id,
        isDelete: false,
        approvalByAdmin: "accepted",
      })
        .select(
          "_id modeOfClass classType startDate endDate packageType numberOfClass time price timeDurationInMin totalBookedSeat numberOfSeats isBooked instructorTimeZone"
        )
        .populate("yogaCategory", "-_id yogaCategory description")
        .populate(
          "datesOfClasses",
          "_id date startDateTimeUTC endDateTimeUTC classStatus"
        )
        .lean(),
    ]);
    // Transform Similar profile
    const transformData = similarProfile.map((user) => {
      return {
        ...user,
        profilePic: user.profilePic ? user.profilePic.url || null : null,
        specialization:
          user.specialization.length > 0
            ? user.specialization.map((spe) => spe.specialization)
            : [],
      };
    });
    data.similarProfile = transformData;
    data.yTClassTime = await bindByPackageType(yogaClasses);
    // Send final success response
    return successResponse(res, 200, `Successfully!`, { data });
  } catch (err) {
    failureResponse(res);
  }
};

const register_login_learner = async (req, res) => {
  try {
    // Body Validation
    const { error } = validateUserRegistration(req.body);
    if (error) {
      return failureResponse(res, 400, error.details[0].message, null);
    }
    const { email, mobileNumber, referralCode, term_condition_accepted } =
      req.body;
    if (!term_condition_accepted)
      return failureResponse(
        res,
        401,
        "Please accept term and condition.",
        null
      );
    // Is user already present
    let user = await User.findOne({ $or: [{ email }, { mobileNumber }] });
    if (user) {
      if (!user.role) {
        await User.updateOne({ _id: user._id }, { $set: { role: "learner" } });
      } else if (user.role === "instructor") {
        return failureResponse(
          res,
          400,
          "You are already register as instructor.",
          null
        );
      }
    } else {
      // Capital First Letter
      const name = capitalizeFirstLetter(req.body.name);
      // User Time Zone
      const timezone = req.headers["time-zone"] || req.headers["x-timezone"];
      // Create in database
      const chakraBreakNumber = getRandomInt(7);
      // generate User code
      const userCode = await generateUserCode("SWL");
      // Store data
      user = await User.create({
        userTimeZone: timezone,
        name,
        email,
        mobileNumber,
        chakraBreakNumber,
        referralCode,
        userCode,
        role: "learner",
        term_condition_accepted,
      });
      // Create Wallet
      await Wallet.create({ userId: user._id });
    }
    // Generate OTP for Email
    const otp = await generateFixedLengthRandomNumber(OTP_DIGITS_LENGTH);
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
    failureResponse(res);
  }
};

const instructorForLandingPage = async (req, res) => {
  try {
    // Data query
    let query = {
      $and: [
        { role: "instructor" },
        { $expr: { $gte: [{ $size: "$education" }, 1] } }, // Atleast one educaion should present
        { "profilePic.url": { $exists: true, $ne: null, $ne: "" } }, // profile pic should be present
      ],
    };
    // Get required data
    const instructor = await User.aggregate([
      { $match: query },
      { $sample: { size: 16 } },
      {
        $lookup: {
          from: "specializations",
          localField: "specialization",
          foreignField: "_id",
          as: "specialization",
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          profilePic: 1,
          bio: 1,
          averageRating: 1,
          gender: 1,
          experience_year: 1,
          specialization: {
            $map: {
              input: "$specialization",
              as: "spec",
              in: "$$spec.specialization",
            },
          },
        },
      },
    ]);
    // Transform Data
    const transformData = instructor.map((user) => {
      return {
        ...user,
        profilePic: user.profilePic ? user.profilePic.url || null : null,
        // specialization:
        //   user.specialization.length > 0
        //     ? user.specialization.map((spe) => spe.specialization)
        //     : [],
      };
    });
    // Split in Two
    const sectionA = transformData.slice(0, 8);
    const sectionB = transformData
      .slice(Math.max(0, transformData.length - 8), transformData.length)
      .map(({ bio, ...rest }) => rest);

    // Send final success response
    return successResponse(res, 200, `Successfully!`, { sectionA, sectionB });
  } catch (err) {
    failureResponse(res);
  }
};

const loginByEmail = async (req, res) => {
  try {
    // Body Validation
    const { error } = validateUserEmailLogin(req.body);
    if (error) {
      return failureResponse(res, 400, error.details[0].message, null);
    }
    const { email, referralCode, term_condition_accepted } = req.body;
    if (!term_condition_accepted)
      return failureResponse(
        res,
        401,
        "Please accept term and condition.",
        null
      );
    // Find User in collection
    const data = { email };
    if (referralCode) {
      data.referralCode = referralCode;
    }
    const isUser = await User.findOne({ email });
    if (!isUser) {
      return failureResponse(res, 401, "NOTPRESENT", data);
    }
    isUser.term_condition_accepted = term_condition_accepted;
    await isUser.save();
    // Generate OTP for Email
    const otp = await generateFixedLengthRandomNumber(OTP_DIGITS_LENGTH);
    // Sending OTP to mobile number
    const emailCredential = await finaliseEmailCredential();
    if (emailCredential) {
      const options = {
        subject: "Email Verification",
        brevoEmail: emailCredential.email,
        brevoKey: emailCredential.EMAIL_API_KEY,
        headers: { "OTP for email verification": "123A" },
        htmlContent: await OTPEMAIL({
          otp: String(otp),
          name: isUser.name,
          time: OTP_VALIDITY_IN_MILLISECONDS / (60 * 1000),
          senderMail: emailCredential.email,
        }),
        userEmail: email,
        userName: isUser.name,
      };
      await sendOTPToEmail(options);
    }
    //  Store OTP
    await OTP.create({
      validTill: new Date().getTime() + parseInt(OTP_VALIDITY_IN_MILLISECONDS),
      otp: otp,
      receiverId: isUser._id,
    });
    // Send final success response
    return successResponse(
      res,
      201,
      `OTP send to email successfully! Valid for ${
        OTP_VALIDITY_IN_MILLISECONDS / (60 * 1000)
      } minutes!`,
      { email }
    );
  } catch (err) {
    failureResponse(res);
  }
};

const verifyEmailOTP = async (req, res) => {
  try {
    // Validate body
    const { error } = validateVerifyEmailOTP(req.body);
    if (error) {
      return failureResponse(res, 400, error.details[0].message, null);
    }
    const { email, otp } = req.body;
    // Is Email Otp exist
    const isOtp = await OTP.findOne({ otp });
    if (!isOtp) {
      return failureResponse(res, 401, `Invalid OTP. Try again`, null);
    }
    // Checking is user present or not
    const user = await User.findOne(
      { $and: [{ email }, { _id: isOtp.receiverId }] },
      "_id name email mobileNumber role lastLogin isEmailVerified isMobileNumberVerified referralCode"
    );
    if (!user) {
      return failureResponse(res, 401, `Invalid OTP!`, null);
    }
    // is email otp expired?
    const isOtpExpired = new Date().getTime() > parseInt(isOtp.validTill);
    await OTP.deleteMany({ receiverId: isOtp.receiverId });
    if (isOtpExpired) {
      return failureResponse(res, 403, `OTP expired!`, null);
    }
    user.lastLogin = new Date();
    const historyData = { instructor: user._id, lastLogin: user.lastLogin };
    if (!user.isEmailVerified) {
      user.isEmailVerified = true;
      historyData.isEmailVerified = user.isEmailVerified;
    }
    // Chakra
    if (!user.isEmailVerified && !user.isMobileNumberVerified) {
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
    user.refreshToken = refreshToken;
    await user.save();
    // Send Notification
    if (user.isEmailVerified || user.isMobileNumberVerified) {
      await UserNotification.create({
        recipient: user._id,
        type: "welcome",
        redirectTo: "profile",
        title: "Login from a new device detected!",
        message: `Hello ${user.name}, Welcome back to Swasti Bharat.`,
        createdAt: new Date(new Date().getTime() + 1 * 60 * 1000),
      });
    }
    // Final Response
    return successResponse(res, 201, `Login successful. Welcome back!`, {
      accessToken,
      refreshToken,
      user,
    });
  } catch (err) {
    failureResponse(res);
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
  getMyChakra,
  chakraDetails,
  updateLearner,
  searchInstructor,
  instructorDetailsForLearner,
  register_login_learner,
  instructorForLandingPage,
  loginByEmail,
  verifyEmailOTP,
};
