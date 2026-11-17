import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import {
  getPlans,
  createOrder,
  verifyPayment,
  cancelPayment,
  getPaymentHistory,
} from "../controller/payment.controller.js";

const router = express.Router();

router.get("/plans", getPlans);                         // public — pricing plans
router.post("/create-order", authMiddleware, createOrder);
router.post("/verify", authMiddleware, verifyPayment);
router.post("/cancel", authMiddleware, cancelPayment);
router.get("/history", authMiddleware, getPaymentHistory);

export default router;
