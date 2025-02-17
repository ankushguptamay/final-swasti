import express from "express";
const router = express.Router();

import {
  addCerificate,
  certificateById,
  certificates,
  deleteCertificate,
} from "../../../Controller/User/UserProfile/certificate.controller.js";

// Middleware
import { uploadImage } from "../../../MiddleWare/uploadFile.js";

router.post("/", uploadImage.single("image"), addCerificate);
router.get("/", certificates);
router.get("/:id", certificateById);
router.delete("/:id", deleteCertificate);

export default router;
