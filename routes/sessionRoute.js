// routes/studentRoute.js
import express from "express";
import { saveSession } from "../controllers/sessionController.js";
import { verifyToken } from "../middlewares/jwtMiddleware.js";

const router = express.Router();

router.post("/create", verifyToken, saveSession); //save session in databases

export default router;
