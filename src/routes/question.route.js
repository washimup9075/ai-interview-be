import express from "express"
import {getQuestionById,getQuestionsByInterview,submitAnswer,executeCode,submitCodingAnswer} from "../controller/question.controller.js"
import authMiddleware from "../middleware/auth.middleware.js";
 
const router=express.Router();

// Important: specific routes before wildcard /:id
router.get("/interview/:interviewId", authMiddleware, getQuestionsByInterview);
router.post("/coding/execute", authMiddleware, executeCode);
router.post("/:id/coding-submit", authMiddleware, submitCodingAnswer);
router.get('/:id', authMiddleware, getQuestionById);
router.post('/:id/submit', authMiddleware, submitAnswer);

export default router;