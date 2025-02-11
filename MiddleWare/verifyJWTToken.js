import dotenv from "dotenv";
dotenv.config();

import jwt from "jsonwebtoken";
import { User } from "../Model/User/Profile/userModel.js";
import { Admin } from "../Model/Admin/adminModel.js";
const { JWT_SECRET_KEY_USER, JWT_SECRET_KEY_Admin } = process.env;

const verifyUserJWT = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    // console.log('JWT Verif MW');
    if (!authHeader?.startsWith("Bearer ")) return res.sendStatus(401);
    const token = authHeader.split(" ")[1];

    if (!token) return res.sendStatus(401);

    const decode = jwt.verify(token, JWT_SECRET_KEY_USER);

    const user = await User.findOne(
      { _id: decode._id },
      "_id name email mobileNumber role isProfileVisible profilePic refreshToken"
    );
    if (!user || !user._doc.refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized!",
      });
    }
    req.user = user;
    return next();
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

const verifyAdminJWT = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    // console.log('JWT Verif MW');
    if (!authHeader?.startsWith("Bearer ")) return res.sendStatus(401);
    const token = authHeader.split(" ")[1];

    if (!token) return res.sendStatus(401);

    const decode = jwt.verify(token, JWT_SECRET_KEY_Admin);

    const admin = await Admin.findOne(
      { _id: decode._id },
      "_id name email mobileNumber"
    );
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized!",
      });
    }
    req.admin = decode;
    return next();
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

export { verifyAdminJWT, verifyUserJWT };
