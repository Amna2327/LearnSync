// routes/studentRoute.js
import express from "express";
import { getStudentDetailsForDashboard, saveStudentProfile } from "../controllers/studentController.js";
import { verifyToken } from "../middlewares/jwtMiddleware.js";

const router = express.Router();

router.get("/details", verifyToken, getStudentDetailsForDashboard);
router.post("/profile", verifyToken, saveStudentProfile);

export default router;
