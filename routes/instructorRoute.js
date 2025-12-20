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
    (err, req, res, next) => {
        // Handle multer errors
        if (err) {
            console.error("Multer upload error:", err);
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ error: "File too large. Maximum file size is 10MB." });
            }
            if (err.code === 'LIMIT_FILE_COUNT') {
                return res.status(400).json({ error: "Too many files. Maximum 10 files per category." });
            }
            if (err.code === 'LIMIT_UNEXPECTED_FILE') {
                return res.status(400).json({ error: "Unexpected file field." });
            }
            return res.status(400).json({ error: "File upload error: " + err.message });
        }
        next();
    },
    uploadInstructorFiles
);

 
// get instructors filtered by subject tags and/or time_zone
router.get("/all_sessions", verifyToken, getInstructorSessionsForDashboard);
router.post("/session_action", verifyToken, handleSessionRequest);

export default router;
