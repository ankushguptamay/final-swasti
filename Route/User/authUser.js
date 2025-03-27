import express from "express";
const router = express.Router();

import {
  register,
  loginByMobile,
  verifyMobileOTP,
  refreshAccessToken,
  logout,
  rolePage,
} from "../../Controller/User/UserProfile/user.controller.js";

import publicRoute from "./publicRoute.js";

// Middle
import { verifyUserJWT } from "../../MiddleWare/verifyJWTToken.js";

router.post("/register", register);
router.post("/loginByMobile", loginByMobile);
router.post("/verifyMobileOTP", verifyMobileOTP);
router.post("/refresh", refreshAccessToken);

router.put("/logout", verifyUserJWT, logout);
router.put("/rolePage", verifyUserJWT, rolePage);

// PubLic Routes
router.use("/pub", publicRoute);

export default router;
