import express from "express";
import { verifyToken } from "../middlewares/jwtMiddleware.js";
import { upload } from "../middlewares/uploadMiddleware.js";
import { uploadInstructorFiles } from "../controllers/instructorController.js";

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

export default router;
