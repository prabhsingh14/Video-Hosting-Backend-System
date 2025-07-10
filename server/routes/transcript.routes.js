import express from "express";
import { generateTranscript, getTranscript } from "../controllers/transcript.controller.js";
import { auth } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/generate", auth, generateTranscript);
router.get("/:videoId", auth, getTranscript);

export default router;
