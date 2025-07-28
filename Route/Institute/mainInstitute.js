import express from "express";
const router = express.Router();

// Middleware
import { verifyInstituteJWT } from "../../MiddleWare/verifyJWTToken.js";
import {
  instituteDetails,
  login,
  logout,
  refreshAccessToken,
} from "../../Controller/Institute/institute.controller.js";

// Auth
router.post("/login", login);
router.post("/refresh", refreshAccessToken);

// Authantication
router.use(verifyInstituteJWT);

router.get("/", instituteDetails);
router.put("/logout", logout);

// router.use("/mas", master);

export default router;
