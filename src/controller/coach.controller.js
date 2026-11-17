import interviewModel from "../models/interview.model.js";
import questionModel from "../models/question.model.js";
import { generateCareerCoachAnalysis, careerCoachChat } from "../utils/ai.js";

export const getCareerCoachDashboard = async (req, res) => {
  try {
    const userInterviews = await interviewModel
      .find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate("questions");

    if (!userInterviews || userInterviews.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          readinessScore: 50,
          skillBreakdown: {
            technical: 50,
            communication: 50,
            problemSolving: 50,
            behavioral: 50,
            systemDesign: 50
          },
          weaknesses: ["No completed interviews yet"],
          strengths: ["Ready to start practice"],
          coachInsight: "Welcome to PrepPilot! Complete your first mock interview to get custom AI coaching and skill readiness insights.",
          practicePlan: [
            { day: 1, topic: "First Mock Interview", description: "Complete a 3-question baseline mock interview", questionCount: 3 },
            { day: 2, topic: "Resume Practice", description: "Upload your resume and test domain questions", questionCount: 3 },
            { day: 3, topic: "System Design", description: "Practice foundational architecture questions", questionCount: 3 },
            { day: 4, topic: "Behavioral Prep", description: "Practice leadership & STAR framework answers", questionCount: 3 },
            { day: 5, topic: "Coding Challenge", description: "Solve an algorithmic challenge", questionCount: 2 },
            { day: 6, topic: "Review & Refine", description: "Review AI feedback on past answers", questionCount: 3 },
            { day: 7, topic: "Full Simulation", description: "Complete a full 5-question mock session", questionCount: 5 }
          ]
        }
      });
    }

    const coachData = await generateCareerCoachAnalysis(userInterviews);

    return res.status(200).json({
      success: true,
      data: coachData,
    });
  } catch (error) {
    console.error("Error in getCareerCoachDashboard controller:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate Career Coach dashboard: " + error.message,
    });
  }
};

export const chatWithCareerCoach = async (req, res) => {
  try {
    const { userMessage, chatHistory = [] } = req.body;
    if (!userMessage || userMessage.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "User message is required.",
      });
    }

    const userInterviews = await interviewModel
      .find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("questions");

    const reply = await careerCoachChat(userInterviews, userMessage, chatHistory);

    return res.status(200).json({
      success: true,
      reply,
    });
  } catch (error) {
    console.error("Error in chatWithCareerCoach controller:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to process chat message: " + error.message,
    });
  }
};
