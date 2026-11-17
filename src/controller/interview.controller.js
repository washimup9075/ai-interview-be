import interviewModel from "../models/interview.model.js"
import questionModel from "../models/question.model.js"
import { generateQuestions, generateCodingProblem } from "../utils/ai.js";
import { buildInterviewPrompt } from "../prompts/interview.prompt.js";
import { buildCompanyInterviewPrompt, COMPANY_PROFILES } from "../prompts/company.prompt.js";

export const createInterview=async(req,res)=>{
    try {
        // accessing the data from frontend
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
        } = req.body;

        // validation
        if(!role || experience===undefined || !interviewType || !difficulty || !numberOfQuestions){
            return res.status(400).json({
                success:false,
                message:"All required fields must be provided",
            })
        }

        // Company-based interviews above a question threshold require payment
        // Free interviews: up to 5 questions; paid unlock happens via payment flow
        // This free endpoint only handles free interviews (no company-based >5 or paid)

        let codingProblemData = null;
        let generatedQuestionsList = [];
        let companyHiringStyle = {};

        if (mode === "coding" || interviewType === "Coding") {
            // Generate structured coding challenge via Gemini
            codingProblemData = await generateCodingProblem(role, difficulty, "javascript");
            
            // Create initial question doc for the coding challenge
            generatedQuestionsList = [
                {
                    question: `Coding Problem: ${codingProblemData.title}\n\n${codingProblemData.description}\n\nConstraints: ${codingProblemData.constraints}`,
                    answer: codingProblemData.initialCode,
                    difficulty: difficulty,
                    topic: "Coding"
                }
            ];
        } else if (mode === "company" || interviewType === "Company-Based") {
            // Company-based interview — build company-specific prompt
            if (!company || company.trim() === "") {
                return res.status(400).json({
                    success: false,
                    message: "Company name is required for Company-Based interviews.",
                });
            }

            const companyPrompt = buildCompanyInterviewPrompt({
                role,
                experience,
                interviewType: interviewType === "Company-Based" ? "Company-Based" : interviewType,
                difficulty,
                numberOfQuestions,
                company,
            });

            generatedQuestionsList = await generateQuestions(companyPrompt, {
                role,
                experience,
                interviewType,
                difficulty,
                numberOfQuestions,
            });

            // Capture company hiring style for the record
            const companyKey = company.toLowerCase().replace(/\s+/g, "").replace(/[^a-z]/g, "");
            const profile = COMPANY_PROFILES[companyKey] || null;
            if (profile) {
                companyHiringStyle = {
                    roundTypes: profile.roundTypes,
                    focusAreas: profile.focusAreas,
                    difficultyNote: profile.difficultyNote,
                };
            }
        } else {
            // Standard, Resume-based, or JD-based question prompt
            const prompt = buildInterviewPrompt({
                role,
                experience,
                interviewType,
                difficulty,
                numberOfQuestions,
                resumeText,
                jobDescriptionText,
            });

            generatedQuestionsList = await generateQuestions(prompt, {
                role,
                experience,
                interviewType,
                difficulty,
                numberOfQuestions,
                resumeText,
                jobDescriptionText,
            });
        }

        // checking question is generated or not
        if(!generatedQuestionsList || generatedQuestionsList.length===0){
            return res.status(500).json({
                success:false,
                message:"Failed to generate interview questions.",
            })
        }
      
        // creating interview
        const interview = await interviewModel.create({
            user: req.user._id,
            role,
            experience,
            interviewType: mode === "company" ? "Company-Based" : interviewType,
            difficulty,
            numberOfQuestions: generatedQuestionsList.length,
            mode,
            company: company || "",
            companyHiringStyle,
            resumeText,
            resumeAnalysis,
            jobDescriptionText,
            jdAnalysis,
            codingProblem: codingProblemData,
            isPaid: false,
            isUnlocked: true,
        });

        // preparing question documents
        const questionDocs = generatedQuestionsList.map((q) => ({
            interview: interview._id,
            question: q.question,
            difficultyLevel: q.difficulty || difficulty,
        }));

        // save all questions at once
        const savedQuestions = await questionModel.insertMany(questionDocs);
        interview.questions = savedQuestions.map((q)=>q._id);
        await interview.save();

        return res.status(201).json({
            success:true,
            message:"Interview created successfully",
            interviewId:interview._id,
            interview,
        })

    } catch (error) {
        console.log("Error in Interview Controller",error.message);
        res.status(500).json({
            success:false,
            message:"Internal server error: " + error.message
        })

    }
}
// getting all the interview
export const getInterviews=async(req,res)=>{
    try {
        const interviews=await interviewModel.find({user:req.user._id}).sort({createdAt:-1})
        res.status(200).json({
            success:true,
            count:interviews.length,
            interviews
        })
    } catch (error) {
        console.log("Error in getInterviews of interview controller")
        res.status(500).json({
            success:false,
            message:"Internal Server Error"
        })
    }
}

// getting single interview by id
export const getInterviewById=async(req,res)=>{
    try {
        const {id}=req.params;
        const interview=await interviewModel.findOne({
            _id:id,
            user:req.user._id,
        }).populate("questions")

        if(!interview){
            return res.status(404).json({
                success:false,
                message:"Interview not found"
            })
        }

        // Access control: if interview is paid but not unlocked, deny questions
        if(interview.isPaid && !interview.isUnlocked){
            return res.status(403).json({
                success:false,
                message:"This is a paid interview. Please complete payment to unlock.",
                requiresPayment: true,
                interviewId: interview._id,
            })
        }

        return res.status(200).json({
            success:true,
            interview
        })
    } catch (error) {
        console.log("Error in getInterviewById of interview Controller",error)
        return res.status(500).json({
            success:false,
            message:"Internal server error"
        })
    }
}
// deleting interview
export const deleteInterview=async(req,res)=>{
    try {
        const {id}=req.params;
        const interview=await interviewModel.findOne({
            _id:id,
            user:req.user._id,
        })
        // if interview is not found
        if(!interview){
            return res.status(404).json({
                success:false,
                message:"Interview not found",
            })
        }
        // deleting all questions related to this interview
        await questionModel.deleteMany({
            interview:interview._id,
        })
        // deleting interview
        await interviewModel.findByIdAndDelete(interview._id);
        return res.status(200).json({
            success:true,
            message:"Interview deleted successfully"
        })

    } catch (error) {
        console.log("Error in deleteInterview of interview controller",error)
        return res.status(500).json({
            success:false,
            message:"Internal Server Error"
        })
    }
}
