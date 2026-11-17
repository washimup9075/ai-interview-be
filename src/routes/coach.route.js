import express from "express";
import { getCareerCoachDashboard, chatWithCareerCoach } from "../controller/coach.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/dashboard", authMiddleware, getCareerCoachDashboard);
router.post("/chat", authMiddleware, chatWithCareerCoach);

export default router;
