// routes/studentRoute.js
import express from "express";
import { getStudentDetailsForDashboard, saveStudentProfile, getStudentSessionsForDashboard } from "../controllers/studentController.js";
import { verifyToken } from "../middlewares/jwtMiddleware.js";

const router = express.Router();

router.get("/details", verifyToken, getStudentDetailsForDashboard);
router.post("/profile", verifyToken, saveStudentProfile);
router.get("/all_sessions", verifyToken, getStudentSessionsForDashboard);
export default router;
