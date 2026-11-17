import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    interview: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Interview",
        default: null,
    },
    // Razorpay fields
    razorpayOrderId: {
        type: String,
        required: true,
        unique: true,
    },
    razorpayPaymentId: {
        type: String,
        default: null,
    },
    razorpaySignature: {
        type: String,
        default: null,
    },
    // Order details
    amount: {
        type: Number,
        required: true,   // in paise (1 INR = 100 paise)
    },
    currency: {
        type: String,
        default: "INR",
    },
    plan: {
        type: String,
        enum: ["basic", "standard", "premium"],
        default: "standard",
    },
    planLabel: {
        type: String,
        default: "Standard Interview",
    },
    status: {
        type: String,
        enum: ["created", "paid", "failed", "cancelled", "refunded"],
        default: "created",
    },
    // Interview config captured at order time (so we can create interview after payment)
    interviewConfig: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
    },
    notes: {
        type: String,
        default: "",
    },
}, { timestamps: true });

const paymentModel = mongoose.model("Payment", paymentSchema);
export default paymentModel;
