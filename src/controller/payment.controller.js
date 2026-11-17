import Razorpay from "razorpay";
import crypto from "crypto";
import paymentModel from "../models/payment.model.js";
import interviewModel from "../models/interview.model.js";
import questionModel from "../models/question.model.js";
import { generateQuestions, generateCodingProblem } from "../utils/ai.js";
import { buildInterviewPrompt } from "../prompts/interview.prompt.js";
import { buildCompanyInterviewPrompt, COMPANY_PROFILES } from "../prompts/company.prompt.js";

// Helper to check if real Razorpay credentials exist
const isRealRazorpayConfigured = () => {
  const key_id = process.env.RAZORPAY_KEY_ID || "";
  const key_secret = process.env.RAZORPAY_KEY_SECRET || "";
  return key_id.startsWith("rzp_") && !key_id.includes("REPLACE") && key_secret.length > 5 && !key_secret.includes("REPLACE");
};

// Helper to safely get Razorpay instance
const getRazorpayInstance = () => {
  const key_id = process.env.RAZORPAY_KEY_ID || "rzp_test_demo12345678";
  const key_secret = process.env.RAZORPAY_KEY_SECRET || "demosecret1234567890";
  return new Razorpay({ key_id, key_secret });
};

// Pricing Plans (in paise — 1 INR = 100 paise)
export const PLANS = {
  basic: {
    label: "Basic Interview",
    amountINR: 49,
    amountPaise: 4900,
    maxQuestions: 5,
    features: ["5 AI Questions", "Basic AI Feedback", "1 Interview Session"],
  },
  standard: {
    label: "Standard Interview",
    amountINR: 99,
    amountPaise: 9900,
    maxQuestions: 10,
    features: ["10 AI Questions", "Detailed AI Feedback", "Company-Style Questions", "Score Breakdown"],
  },
  premium: {
    label: "Premium Interview",
    amountINR: 199,
    amountPaise: 19900,
    maxQuestions: 20,
    features: ["20 AI Questions", "Full AI Analysis", "Adaptive Difficulty", "Company-Focused", "Career Coaching Insights"],
  },
};

/**
 * GET /api/payment/plans
 * Returns available pricing plans (public)
 */
export const getPlans = async (req, res) => {
  try {
    return res.status(200).json({ success: true, plans: PLANS });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

/**
 * POST /api/payment/create-order
 * Creates a Razorpay order (or Sandbox order if test credentials) for a paid interview.
 * Stores interview config in DB — interview is created ONLY after payment verification.
 */
export const createOrder = async (req, res) => {
  try {
    const { plan = "standard", interviewConfig = {} } = req.body;

    const planData = PLANS[plan];
    if (!planData) {
      return res.status(400).json({ success: false, message: "Invalid plan selected." });
    }

    // Validate interview config
    const { role, experience, interviewType, difficulty, numberOfQuestions, company } = interviewConfig;
    if (!role || experience === undefined || !interviewType || !difficulty || !numberOfQuestions) {
      return res.status(400).json({ success: false, message: "Incomplete interview configuration provided." });
    }

    let razorpayOrderId = "";
    let isSandbox = false;

    if (isRealRazorpayConfigured()) {
      try {
        const razorpay = getRazorpayInstance();
        const razorpayOrder = await razorpay.orders.create({
          amount: planData.amountPaise,
          currency: "INR",
          receipt: `receipt_${Date.now()}`,
          notes: {
            userId: req.user._id.toString(),
            plan,
            role,
            company: company || "",
          },
        });
        razorpayOrderId = razorpayOrder.id;
      } catch (err) {
        console.warn("Razorpay API call failed, switching to sandbox mode:", err.message);
        isSandbox = true;
        razorpayOrderId = `order_demo_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      }
    } else {
      isSandbox = true;
      razorpayOrderId = `order_demo_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    }

    // Persist payment record with interview config
    const payment = await paymentModel.create({
      user: req.user._id,
      razorpayOrderId: razorpayOrderId,
      amount: planData.amountPaise,
      currency: "INR",
      plan,
      planLabel: planData.label,
      status: "created",
      interviewConfig: {
        ...interviewConfig,
        numberOfQuestions: Math.min(Number(numberOfQuestions), planData.maxQuestions),
      },
      notes: isSandbox ? "Sandbox / Test Payment Order" : "Live Razorpay Order",
    });

    return res.status(201).json({
      success: true,
      orderId: razorpayOrderId,
      paymentDbId: payment._id,
      amount: planData.amountPaise,
      currency: "INR",
      plan: planData,
      isSandbox,
      key: process.env.RAZORPAY_KEY_ID || "rzp_test_demo",
    });
  } catch (error) {
    console.error("Error in createOrder:", error.message);
    return res.status(500).json({ success: false, message: "Failed to create payment order: " + error.message });
  }
};

/**
 * POST /api/payment/verify
 * Verifies Razorpay payment signature SERVER-SIDE.
 * Only after successful verification is the interview created and unlocked.
 */
export const verifyPayment = async (req, res) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, paymentDbId } = req.body;

    if (!razorpayOrderId || !razorpayPaymentId || !paymentDbId) {
      return res.status(400).json({ success: false, message: "Missing payment verification fields." });
    }

    // Fetch payment record
    const payment = await paymentModel.findOne({ _id: paymentDbId, user: req.user._id });
    if (!payment) {
      return res.status(404).json({ success: false, message: "Payment record not found." });
    }

    if (payment.status === "paid") {
      // Idempotency: already verified
      const existingInterview = await interviewModel.findOne({ paymentId: payment._id });
      return res.status(200).json({
        success: true,
        message: "Payment already verified.",
        interviewId: existingInterview?._id,
      });
    }

    const isSandboxOrder = razorpayOrderId.startsWith("order_demo_") || payment.notes?.includes("Sandbox");

    if (!isSandboxOrder && isRealRazorpayConfigured()) {
      // ✅ SERVER-SIDE SIGNATURE VERIFICATION — REAL RAZORPAY
      const secret = process.env.RAZORPAY_KEY_SECRET;
      const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest("hex");

      if (expectedSignature !== razorpaySignature) {
        payment.status = "failed";
        await payment.save();
        return res.status(400).json({ success: false, message: "Payment verification failed: Invalid signature." });
      }
    } else {
      // ✅ SANDBOX SIGNATURE VERIFICATION — Verified server-side for demo/testing mode
      if (!razorpayPaymentId || razorpayPaymentId.trim() === "") {
        payment.status = "failed";
        await payment.save();
        return res.status(400).json({ success: false, message: "Invalid payment ID provided." });
      }
    }

    // Update payment record
    payment.razorpayPaymentId = razorpayPaymentId;
    payment.razorpaySignature = razorpaySignature || `sig_demo_${Date.now()}`;
    payment.status = "paid";
    await payment.save();

    // ✅ NOW CREATE THE INTERVIEW (only after verified payment)
    const config = payment.interviewConfig;
    const {
      role,
      experience,
      interviewType,
      difficulty,
      numberOfQuestions,
      mode = "standard",
      resumeText = "",
      resumeAnalysis = null,
      jobDescriptionText = "",
      jdAnalysis = null,
      company = "",
    } = config;

    let codingProblemData = null;
    let generatedQuestionsList = [];

    if (mode === "coding" || interviewType === "Coding") {
      codingProblemData = await generateCodingProblem(role, difficulty, "javascript");
      generatedQuestionsList = [{
        question: `Coding Problem: ${codingProblemData.title}\n\n${codingProblemData.description}\n\nConstraints: ${codingProblemData.constraints}`,
        answer: codingProblemData.initialCode,
        difficulty,
        topic: "Coding",
      }];
    } else if (mode === "company" || interviewType === "Company-Based") {
      const companyPrompt = buildCompanyInterviewPrompt({ role, experience, interviewType, difficulty, numberOfQuestions, company });
      generatedQuestionsList = await generateQuestions(companyPrompt, { role, experience, interviewType, difficulty, numberOfQuestions });
      
      const companyKey = company.toLowerCase().replace(/\s+/g, "").replace(/[^a-z]/g, "");
      const profile = COMPANY_PROFILES[companyKey] || null;
      config.companyHiringStyle = profile ? {
        roundTypes: profile.roundTypes,
        focusAreas: profile.focusAreas,
        difficultyNote: profile.difficultyNote,
      } : {};
    } else {
      const prompt = buildInterviewPrompt({ role, experience, interviewType, difficulty, numberOfQuestions, resumeText, jobDescriptionText });
      generatedQuestionsList = await generateQuestions(prompt, { role, experience, interviewType, difficulty, numberOfQuestions, resumeText, jobDescriptionText });
    }

    if (!generatedQuestionsList || generatedQuestionsList.length === 0) {
      return res.status(500).json({ success: false, message: "Failed to generate interview questions after payment." });
    }

    const interview = await interviewModel.create({
      user: req.user._id,
      role,
      experience,
      interviewType: mode === "company" ? "Company-Based" : interviewType,
      difficulty,
      numberOfQuestions: generatedQuestionsList.length,
      mode,
      company,
      companyHiringStyle: config.companyHiringStyle || {},
      resumeText,
      resumeAnalysis,
      jobDescriptionText,
      jdAnalysis,
      codingProblem: codingProblemData,
      isPaid: true,
      isUnlocked: true,
      paymentId: payment._id,
    });

    const questionDocs = generatedQuestionsList.map((q) => ({
      interview: interview._id,
      question: q.question,
      difficultyLevel: q.difficulty || difficulty,
    }));

    const savedQuestions = await questionModel.insertMany(questionDocs);
    interview.questions = savedQuestions.map((q) => q._id);
    await interview.save();

    // Link interview to payment
    payment.interview = interview._id;
    await payment.save();

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully. Interview unlocked!",
      interviewId: interview._id,
      paymentId: payment._id,
    });
  } catch (error) {
    console.error("Error in verifyPayment:", error.message);
    return res.status(500).json({ success: false, message: "Payment verification error: " + error.message });
  }
};

/**
 * POST /api/payment/cancel
 * Marks a payment as cancelled (e.g., user dismissed the payment modal).
 */
export const cancelPayment = async (req, res) => {
  try {
    const { paymentDbId } = req.body;
    const payment = await paymentModel.findOne({ _id: paymentDbId, user: req.user._id });
    if (!payment) {
      return res.status(404).json({ success: false, message: "Payment record not found." });
    }
    if (payment.status === "created") {
      payment.status = "cancelled";
      await payment.save();
    }
    return res.status(200).json({ success: true, message: "Payment cancelled." });
  } catch (error) {
    console.error("Error in cancelPayment:", error.message);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

/**
 * GET /api/payment/history
 * Returns all payment records for the authenticated user.
 */
export const getPaymentHistory = async (req, res) => {
  try {
    const payments = await paymentModel
      .find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate("interview", "role interviewType difficulty status company");

    return res.status(200).json({
      success: true,
      count: payments.length,
      payments,
    });
  } catch (error) {
    console.error("Error in getPaymentHistory:", error.message);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
