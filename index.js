import dotenv from "dotenv";
dotenv.config();

import express from "express";
import path from "path";
import { fileURLToPath } from "url";

import authRoutes from "./routes/authRoute.js";
import { verifyToken } from "./middlewares/jwtMiddleware.js";
import { getUserInfoFromId, getStudentDetails } from "./databases/userDatabase.js";
import adminRoutes from "./routes/adminRoute.js";//for admins
import instructorRoutes from "./routes/instructorRoute.js";//for instructors
import studentRoutes from "./routes/studentRoute.js";
import sessionRoutes from "./routes/sessionRoute.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// static
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "public")));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// routes

app.use("/auth", authRoutes);
app.use("/admin", adminRoutes);//for admins
app.use("/instructor", instructorRoutes);//instructors
app.use("/student", studentRoutes);
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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


