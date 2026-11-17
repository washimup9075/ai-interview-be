import express from "express"
import authMiddleware from "../middleware/auth.middleware.js";
import { createInterview,getInterviews,getInterviewById,deleteInterview} from "../controller/interview.controller.js";


const router=express.Router();

router.post("/create",authMiddleware,createInterview);
router.get("/all",authMiddleware,getInterviews);
router.get("/:id",authMiddleware,getInterviewById);
router.delete("/:id",authMiddleware,deleteInterview)

export default router;