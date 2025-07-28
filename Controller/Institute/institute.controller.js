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

const SALT = 10;
import bcrypt from "bcryptjs";
import { Institute } from "../../Model/Institute/instituteModel.js";
import {
  validateInstituteLogin,
  validateInstituteRegistration,
} from "../../MiddleWare/Validation/institute.js";
import jwt from "jsonwebtoken";

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

const registerByAdmin = async (req, res) => {
  try {
    // Body Validation
    const { error } = validateInstituteRegistration(req.body);
    if (error) return failureResponse(res, 400, error.details[0].message, null);
    // Find Institute
    const { email, mobileNumber, password } = req.body;
    const name = capitalizeFirstLetter(
      req.body.name.replace(/\s+/g, " ").trim()
    );
    const isInstittute = await Institute.findOne({ email: email });
    if (isInstittute) {
      return failureResponse(res, 400, "Institute already present!", null);
    }
    // Hash password
    const salt = await bcrypt.genSalt(SALT);
    const hashedPassword = await bcrypt.hash(password, salt);
    // Save details
    await Institute.create({
      email,
      mobileNumber,
      name,
      password: hashedPassword,
      approvalByAdmin: "accepted",
    });
    // Send final success response
    return successResponse(res, 201, "Institute created!");
  } catch (err) {
    failureResponse(res);
  }
};

const login = async (req, res) => {
  try {
    // Body Validation
    const { error } = validateInstituteLogin(req.body);
    if (error) return failureResponse(res, 400, error.details[0].message, null);
    const { email, password } = req.body;
    // Find Institute
    const isInstittute = await Institute.findOne({ email })
      .select("+password -createdAt -isDelete -deleted_at -refreshToken")
      .lean();
    if (!isInstittute) {
      return failureResponse(res, 400, "Invalid email or password!", null);
    }
    // Validate password
    const validPassword = await bcrypt.compare(password, isInstittute.password);
    if (!validPassword) {
      return failureResponse(res, 400, "Invalid email or password!", null);
    }
    // Create token
    const accessToken = createUserAccessToken({ _id: isInstittute._id, email });
    const refreshToken = createUserRefreshToken({
      _id: isInstittute._id,
      email,
    });
    // Added refresh token in database
    await Institute.updateOne(
      { _id: isInstittute._id },
      { $set: { refreshToken } }
    );
    delete isInstittute.password;
    // Send final success response
    return successResponse(res, 201, `Welcome Back, ${isInstittute.name}.`, {
      institute: isInstittute,
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
    console.log(err.message)
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
  registerByAdmin,
  login,
  logout,
  refreshAccessToken,
  instituteDetailsForAdmin,
  getInstitute,
};
