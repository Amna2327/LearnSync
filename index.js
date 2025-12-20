import dotenv from "dotenv";
dotenv.config();

import express from "express";
import path from "path";
import cookieParser from "cookie-parser";
import { fileURLToPath } from "url";
import { testConnection } from "./db.js";

const app = express();

// Test database connection on startup
testConnection().catch(err => {
    console.error("⚠️  Database connection test failed on startup:", err.message);
    console.log("⚠️  The server will continue, but database operations may fail.");
});

app.use(express.json());
app.use(cookieParser()); 

import authRoutes from "./routes/authRoute.js";
import { verifyToken } from "./middlewares/jwtMiddleware.js";
import { requireRole } from "./middlewares/roleMiddleware.js";

import adminRoutes from "./routes/adminRoute.js";//for admins
import instructorRoutes from "./routes/instructorRoute.js";//for instructors
import studentRoutes from "./routes/studentRoute.js";
import sessionRoutes from "./routes/sessionRoute.js";

import { getUserInfoFromId, getStudentDetails } from "./databases/userDatabase.js";

const PORT = process.env.PORT || 3000;

app.use(express.json());

// static
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "public")));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// routes
app.use("/auth", authRoutes);
app.use("/admin", verifyToken, requireRole("admin"), adminRoutes);//for admins
app.use("/instructor", verifyToken, requireRole("instructor"), instructorRoutes);//instructors
app.use("/student", verifyToken, requireRole("student"), studentRoutes);
app.use("/session", sessionRoutes);
 
// JWT token verified before controller is called.
app.get("/dashboard", verifyToken, async (req, res) => {
  try {
    const user = await getUserInfoFromId(req.user.id); // fetch full info, including status
    if (!user) return res.status(404).json({ error: "User not found" });

    // Base response common to all roles
    const response = {
      message: "Welcome to dashboard",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        time_zone: user.time_zone
      }
    };

    // If student, include profile info
    if (user.role === "student") {
      const studentProfile = await getStudentDetails(user.id); // null if first-time
      response.studentProfile = studentProfile;

      // Optional: include upcoming sessions if you already track them
      //response.user.upcomingSessions = await getStudentSessions(user.id); // implement separately
    }

    // If instructor or admin, you can add extra fields similarly later
    // e.g., pending approvals for admin, instructor sessions for instructor

    res.json(response);
  } catch (err) {
    console.error('Error in /dashboard:', err);
    res.status(500).json({ error: "Failed to fetch user info" });
  }
});


app.get("/", (req, res) => {
  res.send("LearnSync API is running.");
  console.log(`Landing page showing vision and intended use`);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({ 
    error: 'Internal server error. Please try again later.',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🌐 Open http://localhost:${PORT} in your browser`);
});


