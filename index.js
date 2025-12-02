import dotenv from "dotenv";
dotenv.config();

import express from "express";
import path from "path";
import { fileURLToPath } from "url";

import authRoutes from "./routes/authRoute.js";
import { verifyToken } from "./middlewares/jwtMiddleware.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// static
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "public")));

// Auth routes
app.use("/auth", authRoutes);

// JWT token verified before controller is called.
app.get("/dashboard", verifyToken, (req, res) => {
    res.json({
        message: "Welcome to dashboard",
        user: req.user
    });
});

app.get("/", (req, res) => {
  res.send("LearnSync API is running.");
  console.log(`Landing page showing vision and intended use`);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});