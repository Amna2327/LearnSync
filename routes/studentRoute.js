// routes/studentRoute.js
import express from "express";
import { getStudentDetailsForDashboard, saveStudentProfile, getStudentSessionsForDashboard } from "../controllers/studentController.js";
import { filterInstructors} from "../controllers/instructorController.js";
import { verifyToken } from "../middlewares/jwtMiddleware.js";
import { payForSession } from "../controllers/studentController.js";

const router = express.Router();

router.post('/filter_instructor', verifyToken, filterInstructors);
router.get("/details", verifyToken, getStudentDetailsForDashboard);
router.post("/profile", verifyToken, saveStudentProfile);
router.get("/all_sessions", verifyToken, getStudentSessionsForDashboard);
router.post("/pay_session", verifyToken, payForSession);
export default router;





