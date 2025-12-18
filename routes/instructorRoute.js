import express from "express";
import { verifyToken } from "../middlewares/jwtMiddleware.js";
import { upload } from "../middlewares/uploadMiddleware.js";
import { uploadInstructorFiles, getInstructorSessionsForDashboard, handleSessionRequest } from "../controllers/instructorController.js";

const router = express.Router();

// Upload instructor files
router.post(
    '/upload-profile',
    verifyToken,
    upload.fields([
        { name: 'certifications', maxCount: 10 },
        { name: 'demo_material', maxCount: 10 }
    ]),
    uploadInstructorFiles
);

 
// get instructors filtered by subject tags and/or time_zone
router.get("/all_sessions", verifyToken, getInstructorSessionsForDashboard);
router.post("/session_action", verifyToken, handleSessionRequest);

export default router;
