import {
  validateAdminLogin,
  validateAdminRegistration,
} from "../../MiddleWare/Validation/admin.js";

import { capitalizeFirstLetter } from "../../Helper/formatChange.js";
import { createAdminAccessToken } from "../../Helper/jwtToken.js";
import {
  failureResponse,
  successResponse,
} from "../../MiddleWare/responseMiddleware.js";
import { Admin } from "../../Model/Admin/adminModel.js";
const SALT = 10;
import bcrypt from "bcryptjs";

const getAdmin = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin._id).select(
      "_id name email mobileNumber"
    );
    // Send final success response
    return successResponse(res, 200, "Admin fetched successfully!", { admin });
  } catch (err) {
    failureResponse(res);
  }
};

const register = async (req, res) => {
  try {
    // Body Validation
    const { error } = validateAdminRegistration(req.body);
    if (error) return failureResponse(res, 400, error.details[0].message, null);
    // Find Admin
    const { email, mobileNumber, password } = req.body;
    const name = capitalizeFirstLetter(
      req.body.name.replace(/\s+/g, " ").trim()
    );
    const isAdmin = await Admin.findOne({ email: email });
    if (isAdmin) {
      return failureResponse(res, 400, "Admin already present!", null);
    }
    // Hash password
    const salt = await bcrypt.genSalt(SALT);
    const hashedPassword = await bcrypt.hash(password, salt);
    // Save details
    const admin = await Admin.create({
      email,
      mobileNumber,
      name,
      password: hashedPassword,
    });
    // Create access token
    const accessToken = createAdminAccessToken({ _id: admin._id, email });
    // Send final success response
    return successResponse(res, 201, "Admin created!", { admin, accessToken });
  } catch (err) {
    failureResponse(res);
  }
};

const login = async (req, res) => {
  try {
    // Body Validation
    const { error } = validateAdminLogin(req.body);
    if (error) return failureResponse(res, 400, error.details[0].message, null);
    const { email, password } = req.body;
    // Find Admin
    const isAdmin = await Admin.findOne({ email }).select("+password");
    if (!isAdmin) {
      return failureResponse(res, 400, "Invalid email or password!", null);
    }
    // Validate password
    const validPassword = await bcrypt.compare(password, isAdmin.password);
    if (!validPassword) {
      return failureResponse(res, 400, "Invalid email or password!", null);
    }
    // Create token
    const accessToken = createAdminAccessToken({ _id: isAdmin._id, email });
    // Send final success response
    return successResponse(res, 201, `Welcome Back, ${isAdmin.name}`, {
      isAdmin,
      accessToken,
    });
  } catch (err) {
    failureResponse(res);
  }
};

export { getAdmin, register, login };
