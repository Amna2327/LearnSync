import express from "express";
import { getStudents, getStudentsWithDepartment } from "../controllers/studentController.js";

const router = express.Router();

router.get("/", getStudents);
router.get("/with-department", getStudentsWithDepartment);

export default router;