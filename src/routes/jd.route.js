import express from "express";
import { analyzeJobDescription } from "../controller/jd.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/analyze", authMiddleware, analyzeJobDescription);

export default router;
