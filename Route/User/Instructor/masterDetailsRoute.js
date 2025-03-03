import express from "express";
const router = express.Router();

import {
  getSpecialization,
  specializationDetails,
} from "../../../Controller/Master/specialization.controller.js";

import {
  getYogaCategory,
  yogaCategoryDetails,
} from "../../../Controller/Master/yogaCategory.controller.js";

// specialization
router.get("/specialization", getSpecialization);
router.get("/specialization/:id", specializationDetails);

// yoga category
router.get("/y-c", getYogaCategory);
router.get("/y-c/:id", yogaCategoryDetails);

export default router;
