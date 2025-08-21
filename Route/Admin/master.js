import express from "express";
const router = express.Router();

import {
  addSpecialization,
  getSpecialization,
  deleteSpecialization,
  specializationDetails,
  updateSpecialization,
} from "../../Controller/Master/specialization.controller.js";
import {
  addBanner,
  getBanner,
  deleteBanner,
} from "../../Controller/Master/banner.controller.js";
import {
  addYogaCategory,
  getYogaCategory,
  yogaCategoryDetails,
  updateYogaCategoryImage,
  deleteYogaCategory,
  getYogaCategoryWithImage,
  updateYogaCategory,
} from "../../Controller/Master/yogaCategory.controller.js";
import {
  addYTRequirement,
  deleteYTRequirement,
  updateYTRequirement,
  getYTRequirement,
} from "../../Controller/Master/yTRequirement.controller.js";
import {
  addYTRule,
  getYTRule,
  updateYTRule,
  deleteYTRule,
} from "../../Controller/Master/yTRules.controller.js";
import {
  addUpdateYogaCourseDescriptiveVideo,
  createYogaCourse,
  deleteYogaCourseDescriptiveVideo,
  updateYogaCourse,
  updateYogaCourseImage,
  yogaCourse,
  yogaCourseDetails,
  yogaCourseForDropdown,
} from "../../Controller/Master/yogaCourse.controller.js";
import {
  addYogaCourseReviewVideo,
  deleteYCRevieweVideo,
} from "../../Controller/Institute/yCVideoReview.controller.js";

// MiddleWare
import multer from "multer";
const upload = multer();
import { uploadImage } from "../../MiddleWare/uploadFile.js";
import {
  deleteYCReviewByAdmin,
  getYCReviews,
} from "../../Controller/Institute/yCReview.controller.js";

// specialization
router.post("/specialization", addSpecialization);
router.get("/specialization", getSpecialization);
router.get("/specialization/:id", specializationDetails);
router.put("/specialization/:id", updateSpecialization);
router.delete("/specialization/:id", deleteSpecialization);

// yoga category
router.post("/y-c", uploadImage.single("image"), addYogaCategory);
router.get("/y-c", getYogaCategory);
router.get("/y-c/:slug", yogaCategoryDetails);
router.get("/y-c-i", getYogaCategoryWithImage);
router.put("/y-c/:id", uploadImage.single("image"), updateYogaCategoryImage);
router.put("/y-c-i/:id", updateYogaCategory);
router.delete("/y-c/:id", deleteYogaCategory);

// YTRules
router.post("/yTRule", addYTRule);
router.get("/yTRule", getYTRule);
router.put("/yTRule/:id", updateYTRule);
router.delete("/yTRule/:id", deleteYTRule);

// YTRequirement
router.post("/yTRequirement", addYTRequirement);
router.get("/yTRequirement", getYTRequirement);
router.put("/yTRequirement/:id", updateYTRequirement);
router.delete("/yTRequirement/:id", deleteYTRequirement);

// Banner
router.post("/banner", uploadImage.single("bannerImage"), addBanner);
router.get("/banner", getBanner);
router.delete("/banner/:id", deleteBanner);

// Course
router.post("/yogacourse", uploadImage.single("image"), createYogaCourse);
router.put(
  "/yogacoursevideo/:yCId",
  upload.single("video"),
  addUpdateYogaCourseDescriptiveVideo
);
router.put("/yogacourse/:yCId", updateYogaCourse);
router.get("/yogacourse", yogaCourse);
router.get("/yogacourse/:slug", yogaCourseDetails);
router.get("/yc-dropdown", yogaCourseForDropdown);
router.put(
  "/yogacourseimage/:yCId",
  uploadImage.single("image"),
  updateYogaCourseImage
);
router.delete("/yogacoursevideo/:yCId", deleteYogaCourseDescriptiveVideo);
// Yoga course video review
router.post(
  "/yc-videoreview",
  upload.single("video"),
  addYogaCourseReviewVideo
);
router.delete("/yc-videoreview/:reviewId", deleteYCRevieweVideo);
// Yoga course user review
router.get("/yc-userreview/:yCId", getYCReviews);
router.delete("/yc-userreview/:reviewId", deleteYCReviewByAdmin);
export default router;
