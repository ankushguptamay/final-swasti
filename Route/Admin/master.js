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

// MiddleWare
import { uploadImage } from "../../MiddleWare/uploadFile.js";

// specialization
router.post("/specialization", addSpecialization);
router.get("/specialization", getSpecialization);
router.get("/specialization/:id", specializationDetails);
router.put("/specialization/:id", updateSpecialization);
router.delete("/specialization/:id", deleteSpecialization);

// yoga category
router.post("/y-c", uploadImage.single("image"), addYogaCategory);
router.get("/y-c", getYogaCategory);
router.get("/y-c/:id", yogaCategoryDetails);
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

export default router;
