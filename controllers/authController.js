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

        // Validate required fields
        if (!name || !email || !password || !role) {
            return res.status(400).json({ 
                error: "Missing required fields. Please provide name, email, password, and role." 
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ 
                error: "Invalid email format." 
            });
        }

        // Validate role
        if (role !== "student" && role !== "instructor") {
            return res.status(400).json({ 
                error: "Invalid role. Role must be 'student' or 'instructor'." 
            });
        }

        // Use UTC as default if timeZone is not provided
        const finalTimeZone = timeZone || "UTC";

        const result = await signupService(name, email, password, role, finalTimeZone);
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
        console.log("error in signup:", err.message);
        console.log("Full error:", err);
        
        // Provide user-friendly error messages
        let errorMessage = err.message || "Signup failed. Please try again.";
        
        // Map common database errors to user-friendly messages
        if (errorMessage.includes("Email already exists") || errorMessage.includes("already registered")) {
            errorMessage = "This email is already registered. Please use a different email or try logging in.";
        } else if (errorMessage.includes("Database connection") || errorMessage.includes("connection failed") || errorMessage.includes("ECONNREFUSED")) {
            errorMessage = "Cannot connect to database. Please ensure PostgreSQL is running and check your database configuration.";
        } else if (errorMessage.includes("Table not found") || errorMessage.includes("does not exist")) {
            errorMessage = "Database tables not found. Please run the SQL script: database_learnsync.sql";
        } else if (errorMessage.includes("authentication failed") || errorMessage.includes("28P01")) {
            errorMessage = "Database authentication failed. Please check your PostgreSQL password in the .env file.";
        } else if (errorMessage.includes("Database not found") || errorMessage.includes("3D000")) {
            errorMessage = "Database 'learnsync_database' not found. Please create it first.";
        }
        
        return res.status(400).json({ error: errorMessage });
    }
}
export async function logout(req, res){
  try { 
    // Clear the token cookie
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // only send over HTTPS in prod
      sameSite: "strict"
    });

    res.json({ success: true, message: "Logged out successfully" });
  } catch (err) {
    console.error("Logout error:", err);
    res.status(500).json({ success: false, error: "Failed to log out" });
  }
}