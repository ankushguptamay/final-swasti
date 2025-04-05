import express from "express";
const router = express.Router();

import { createPayment } from "../../../Controller/User/Service/serviceOrder.controller.js";

router.post("/createPayment", createPayment);

export default router;
