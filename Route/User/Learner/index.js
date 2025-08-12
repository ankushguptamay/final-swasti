import express from "express";
const router = express.Router();

import profile from "./profile.js";
import instructor from "./instructor.js";
import service from "./services.js";

// Middleware
import { verifyUserJWT } from "../../../MiddleWare/verifyJWTToken.js";
import { failureResponse } from "../../../MiddleWare/responseMiddleware.js";
import {
  createCourseOrderByRazorpay,
  createCourseOrderByPhonepe,
} from "../../../Controller/User/Service/Course/payment.controller.js";

// Authantication
router.use(verifyUserJWT);

// Validate instructor role
router.use((req, res, next) => {
  if (!req.user.role || req.user.role.toLowerCase() !== "learner") {
    return failureResponse(res, 401, "Unauthorized", null);
  }
  next();
});

// Course
router.post("/createCourseOrder-ra", createCourseOrderByRazorpay);
// router.post("/createCourseOrder-ph", createCourseOrderByPhonepe);

router.use("/profile", profile);
router.use("/inst", instructor);
router.use("/service", service);

export default router;
