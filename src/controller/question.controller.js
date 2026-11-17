import questionModel from "../models/question.model.js"
import mongoose from "mongoose";
import { evaluateAnswer, generateAdaptiveFollowUp, evaluateCodeReview } from "../utils/ai.js";
import interviewModel from "../models/interview.model.js";
import { executeJavaScriptSandbox } from "../utils/codeSandbox.js";

export const getQuestionById=async(req,res)=>{
    try {
        const {id}=req.params;

        if(!mongoose.Types.ObjectId.isValid(id)){
            return res.status(400).json({
                success:false,
                message:"Invalid Question Id"
            })
        }
        const question=await questionModel.findById(id);
        if(!question){
            return res.status(404).json({
                success:false,
                message:"question not found",
            })
        }
        
        return res.status(200).json({
            success:true,
            question
        })
    } catch (error) {
        console.log("Error in question controller-getQuestionById",error)
        return res.status(500).json({
            success:false,
            message:"Internal Server Error",
        })
    }
}

export const getQuestionsByInterview=async(req,res)=>{
    try {
        const {interviewId}=req.params;
        if(!mongoose.Types.ObjectId.isValid(interviewId)){
            return res.status(400).json({
                success:false,
                message:"Invalid Interview Id"
            })
        }
        const questions=await questionModel.find({interview:interviewId});
        return res.status(200).json({
            success:true,
            questions
        })
    } catch (error) {
        console.log("Error in getQuestionsByInterview of question controller", error);
        return res.status(500).json({
            success:false,
            message:"Internal Server Error"
        })
    }
}

export const submitAnswer=async(req,res)=>{
    try {
        const {id}=req.params;
        const {answer}=req.body;

        if(!mongoose.Types.ObjectId.isValid(id)){
            return res.status(400).json({
                success:false,
                message:"Invalid Question Id"
            })
        }

        const question=await questionModel.findById(id);
        if(!question){
            return res.status(404).json({
                success:false,
                message:"Question not found"
            })
        }

        const interview=await interviewModel.findById(question.interview);
        if(!interview){
            return res.status(404).json({
                success:false,
                message:"Interview not found for this question"
            })
        }

        // Evaluate answer using Gemini
        const prompt=`
You are an expert technical interviewer.
Evaluate the candidate's answer for the following question under the context of this job role and difficulty level.

Role: ${interview.role}
Difficulty: ${interview.difficulty}
Experience Level: ${interview.experience} years
Interview Type: ${interview.interviewType}

Question: "${question.question}"
Candidate's Answer: "${answer || "[No answer provided]"}"

Provide:
1. A score between 0 and 10 (inclusive) representing how well the answer addresses the question. If the answer is blank, incorrect, or empty, give it a score of 0.
2. Constructive feedback in a few sentences, explaining what was correct, what was missing, and how it could be improved.

Respond strictly in valid JSON format with no markdown blocks:
{
  "score": <integer_between_0_to_10>,
  "feedback": "<feedback_text>"
}
`;

        const evaluation=await evaluateAnswer(prompt);

        // Update the question
        question.answer = answer || "";
        question.score = typeof evaluation.score === 'number' ? evaluation.score : 0;
        question.aiFeedback = evaluation.feedback || "Feedback not generated.";
        await question.save();

        // Check if Adaptive Follow-up question should be created
        let followUpQuestionDoc = null;
        if (answer && answer.trim().length > 0 && !question.isFollowUp) {
          const adaptiveRes = await generateAdaptiveFollowUp(
            question.question,
            answer,
            question.score,
            [],
            interview.difficulty
          );

          if (adaptiveRes.shouldFollowUp && adaptiveRes.followUpQuestion) {
            // Create follow-up question document
            followUpQuestionDoc = await questionModel.create({
              interview: interview._id,
              question: `[Follow-up] ${adaptiveRes.followUpQuestion}`,
              isFollowUp: true,
              parentQuestionId: question._id,
              difficultyLevel: adaptiveRes.nextDifficulty || interview.difficulty,
            });

            interview.questions.push(followUpQuestionDoc._id);
            if (adaptiveRes.nextDifficulty && adaptiveRes.nextDifficulty !== interview.difficulty) {
              interview.difficulty = adaptiveRes.nextDifficulty;
            }
            await interview.save();
          }
        }

        // Update interview status to In Progress if it was Pending
        if(interview.status === "Pending"){
            interview.status = "In Progress";
            await interview.save();
        }

        // Check if all questions in the interview have been answered
        const allQuestions = await questionModel.find({ interview: interview._id });
        const allAnswered = allQuestions.every(q => q.answer !== "");

        if (allAnswered && !followUpQuestionDoc) {
            interview.status = "Completed";
            await interview.save();
        }

        return res.status(200).json({
            success:true,
            message:"Answer evaluated successfully",
            question,
            followUpQuestion: followUpQuestionDoc,
            interviewDifficulty: interview.difficulty,
        });

    } catch (error) {
        console.log("Error in submitAnswer of question controller", error);
        return res.status(500).json({
            success:false,
            message:"Internal Server Error: " + error.message
        })
    }
}

// Sandbox execution endpoint
export const executeCode = async (req, res) => {
  try {
    const { code, testCases = [] } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, message: "Code content is required" });
    }

    const testResults = executeJavaScriptSandbox(code, testCases);
    const passedCount = testResults.filter(r => r.passed).length;

    return res.status(200).json({
      success: true,
      message: "Code executed successfully",
      testResults,
      passedCount,
      totalCount: testCases.length,
    });
  } catch (error) {
    console.error("Error in executeCode controller:", error);
    return res.status(500).json({ success: false, message: "Sandbox execution failed: " + error.message });
  }
};

// Coding challenge submit with AI Code Review
export const submitCodingAnswer = async (req, res) => {
  try {
    const { id } = req.params;
    const { code, language = "javascript" } = req.body;

    const question = await questionModel.findById(id);
    if (!question) {
      return res.status(404).json({ success: false, message: "Coding question not found" });
    }

    const interview = await interviewModel.findById(question.interview);
    if (!interview) {
      return res.status(404).json({ success: false, message: "Interview record not found" });
    }

    // Execute against coding problem test cases if present
    const testCases = interview.codingProblem?.testCases || [
      { input: "5", expectedOutput: "5", explanation: "Sample validation" }
    ];

    const executionResults = executeJavaScriptSandbox(code, testCases);

    // AI Code Review with Gemini
    const problemContext = interview.codingProblem || {
      title: interview.role + " Coding Challenge",
      description: question.question,
    };

    const review = await evaluateCodeReview(problemContext, code, language, executionResults);

    // Update question document
    question.answer = code;
    question.codeSubmitted = code;
    question.score = Math.round((review.overallScore || 80) / 10);
    question.aiFeedback = review.feedback || "Code review generated.";
    question.codeEvaluation = {
      correctness: review.correctness || 8,
      codeQuality: review.codeQuality || 8,
      complexity: review.complexity || "O(N) Time",
      edgeCases: review.edgeCases || 8,
      overallScore: review.overallScore || 80,
      feedback: review.feedback || "",
      testResults: executionResults,
    };

    await question.save();

    interview.status = "Completed";
    await interview.save();

    return res.status(200).json({
      success: true,
      message: "Code submission reviewed and evaluated",
      question,
      codeEvaluation: question.codeEvaluation,
      review,
    });
  } catch (error) {
    console.error("Error in submitCodingAnswer controller:", error);
    return res.status(500).json({ success: false, message: "Code review failed: " + error.message });
  }
};