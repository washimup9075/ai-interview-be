import mongoose from "mongoose";

const interviewSchema=new mongoose.Schema({
     user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    role:{
        type:String,
        required:true,
        trim:true,
    },
    experience:{
        type:Number,
        required:true,
        min:0,
    },
    interviewType:{
        type:String,
        required:true,
        enum:["MERN","DSA","HR","System design","Behavioral","Resume-Based","Job-Description","Coding","Company-Based"],
    },
    difficulty:{
        type:String,
        required:true,
        enum:["Easy","Medium","Hard","Expert","Adaptive"],
    },
    numberOfQuestions:{
        type:Number,
        required:true,
        min:1,
        max:20,
    },
    mode:{
        type:String,
        enum:["standard","resume","jd","voice","coding","company"],
        default:"standard",
    },
    // Company-Based Interview fields
    company:{
        type:String,
        default:"",
        trim:true,
    },
    companyHiringStyle:{
        roundTypes: [String],        // e.g. ["Online Assessment", "Technical Round", "HR Round"]
        focusAreas: [String],        // e.g. ["DSA", "System Design", "Leadership"]
        difficultyNote: String,      // e.g. "Google interviews are highly algorithm-focused"
    },
    resumeText:{
        type:String,
        default:"",
    },
    resumeAnalysis:{
        skills: [String],
        experience: String,
        projects: [String],
        technologies: [String],
        education: String,
        suggestedTopics: [String],
    },
    jobDescriptionText:{
        type:String,
        default:"",
    },
    jdAnalysis:{
        jobTitle: String,
        requiredSkills: [String],
        preferredSkills: [String],
        experienceLevel: String,
        seniority: String,
        matchScore: Number,
        missingSkills: [String],
    },
    codingProblem:{
        title: String,
        description: String,
        constraints: String,
        sampleInput: String,
        sampleOutput: String,
        initialCode: String,
        language: String,
        testCases: [{
            input: String,
            expectedOutput: String,
            explanation: String,
        }]
    },
    // Payment / Access Control
    isPaid:{
        type:Boolean,
        default:false,
    },
    isUnlocked:{
        type:Boolean,
        default:true,   // free interviews are always unlocked; paid interviews start false
    },
    paymentId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Payment",
        default:null,
    },
    status:{
        type:String,
        enum:["Pending","In Progress","Completed"],
        default:"Pending",
    },
    questions:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref:"Question",
        }
    ]
},
    {timestamps:true},
)

const interviewModel=mongoose.model("Interview",interviewSchema);

export default interviewModel;