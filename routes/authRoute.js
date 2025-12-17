import express from "express";
import { login, signup, logout} from "../controllers/authController.js";

const router = express.Router();

//login
router.post("/login", login);
//signup
router.post("/signup", signup);
// Logout route
router.post("/logout", logout);

export default router;