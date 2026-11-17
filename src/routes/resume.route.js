import express from "express";
import multer from "multer";
import { parseResume } from "../controller/resume.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

router.post("/parse", authMiddleware, upload.single("resume"), parseResume);

export default router;
