import express from "express";
import {
    getPendingInstructors,
    approveInstructor,
    rejectInstructor,
    getInstructorFullDetails
} from "../controllers/adminController.js";

const router = express.Router();

// Get all pending instructors
router.get("/pending-instructors", getPendingInstructors);

// Approve an instructor
router.put("/approve-instructor/:id", approveInstructor);

// Reject an instructor
router.put("/reject-instructor/:id", rejectInstructor);

// Fetch full instructor details (docs, tags, etc.)
router.get("/instructor-details/:id", getInstructorFullDetails);

export default router;

