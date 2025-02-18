import dotenv from "dotenv";
dotenv.config();

import jwt from "jsonwebtoken";
const {
  JWT_SECRET_KEY_USER,
  JWT_SECRET_REFRESH_KEY_USER,
  JWT_ACCESS_VALIDITY,
  JWT_REFRESH_VALIDITY,
  JWT_SECRET_KEY_ADMIN,
} = process.env;

const createUserAccessToken = (data) => {
  const token = jwt.sign(data, JWT_SECRET_KEY_USER, {
    expiresIn: JWT_ACCESS_VALIDITY,
  });
  return token;
};

const createUserRefreshToken = (data) => {
  const token = jwt.sign(data, JWT_SECRET_REFRESH_KEY_USER, {
    expiresIn: JWT_REFRESH_VALIDITY,
  });
  return token;
};

const createAdminAccessToken = (data) => {
  const token = jwt.sign(data, JWT_SECRET_KEY_ADMIN, {
    expiresIn: JWT_ACCESS_VALIDITY,
  });
  return token;
};

export {
  createUserAccessToken,
  createUserRefreshToken,
  createAdminAccessToken,
};
