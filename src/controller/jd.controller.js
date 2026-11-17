import { analyzeJDWithAI } from "../utils/ai.js";

export const analyzeJobDescription = async (req, res) => {
  try {
    const { jobDescriptionText, resumeText } = req.body;

    if (!jobDescriptionText || jobDescriptionText.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Job description text is required.",
      });
    }

    const analysis = await analyzeJDWithAI(jobDescriptionText, resumeText || "");

    return res.status(200).json({
      success: true,
      message: "Job description analyzed successfully",
      analysis,
    });
  } catch (error) {
    console.error("Error in analyzeJobDescription controller:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to analyze Job Description: " + error.message,
    });
  }
};
