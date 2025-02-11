import multer from "multer";
import path from "path";
import fs from "fs";

const uploadDir = path.resolve("tmp/my-uploads"); // Cross-platform path

// Ensure the directory exists
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = path.join(process.cwd(), "tmp", "my-uploads");
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, `avatar-${Date.now()}-${Math.random().toString(36).substr(2, 9)}${path.extname(file.originalname)}`);
    }
});

export const upload = multer({ storage });