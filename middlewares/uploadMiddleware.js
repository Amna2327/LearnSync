import multer from "multer";
import path from "path";
import fs from "fs";
// For local storage (you can swap with cloud storage later)
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Dynamically detect project root
        const rootDir = path.resolve(process.cwd());

        // uploads folder path in root
        const uploadPath = path.join(rootDir, "uploads");

        // Create folder if it doesn't exist
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }

        cb(null, uploadPath);
    },

    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + "-" + file.originalname);
    }
});

export const upload = multer({ storage });
