import { loginService, signupService } from "../services/authService.js";
import dotenv from "dotenv";
dotenv.config();

const COOKIE_MAX_AGE = parseInt(process.env.COOKIE_MAX_AGE) || 24 * 60 * 60 * 1000;
const COOKIE_SECURE = process.env.COOKIE_SECURE === 'true'; // convert string to boolean

export async function login(req, res) {
    try {
        const { email, password } = req.body;

        const result = await loginService(email, password);
        console.log("noice login");

        const { token, message, ...userData } = result; // 🔧 separate token

        // SET HTTP-ONLY COOKIE
        res.cookie("token", token, {
            httpOnly: true,            // JS cannot access HTTP only cookie
            secure: COOKIE_SECURE,             // set true in production (HTTPS)
            sameSite: "lax",           // CSRF protection
            maxAge: COOKIE_MAX_AGE
        });

        // NEVER send token back, protects against xss
        return res.status(200).json({
            message,
            role: userData.role,
            user: userData
        });

    } catch (err) {
        console.log("error in login");
        return res.status(400).json({ error: err.message });
    }
}

export async function signup(req, res) {
    try {
        const { name, email, password, role, timeZone } = req.body;

        const result = await signupService(name, email, password, role, timeZone);
        console.log("noice signup");

        const { token, message, user } = result;

        // AUTO-LOGIN AFTER SIGNUP
        res.cookie("token", token, {
            httpOnly: true,
            secure: COOKIE_SECURE,
            sameSite: "lax",
            maxAge: COOKIE_MAX_AGE
        });

        return res.status(200).json({
            message,
            user
        });

    } catch (err) {
        console.log("error in signup");
        return res.status(400).json({ error: err.message });
    }
}
