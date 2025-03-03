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
  addYogaCategory,
  getYogaCategory,
  yogaCategoryDetails,
  updateYogaCategory,
  deleteYogaCategory,
} from "../../Controller/Master/yogaCategory.controller.js";

// specialization
router.post("/specialization", addSpecialization);
router.get("/specialization", getSpecialization);
router.get("/specialization/:id", specializationDetails);
router.put("/specialization/:id", updateSpecialization);
router.delete("/specialization/:id", deleteSpecialization);

// yoga category
router.post("/y-c", addYogaCategory);
router.get("/y-c", getYogaCategory);
router.get("/y-c/:id", yogaCategoryDetails);
router.put("/y-c/:id", updateYogaCategory);
router.delete("/y-c/:id", deleteYogaCategory);

export default router;
