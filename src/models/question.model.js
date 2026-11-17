import mongoose from "mongoose";

const questionSchema=new mongoose.Schema({
    interview:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Interview",
        required:true,
    },
    question:{
        type:String,
        required:true,
        trim:true,
    },
    answer:{
        type:String,
        default:"",
    },
    aiFeedback:{
        type:String,
        default:"",
    },
    score:{
        type:Number,
        min:0,
        max:10,
        default:0,
    },
    isFollowUp:{
        type:Boolean,
        default:false,
    },
    parentQuestionId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Question",
        default:null,
    },
    difficultyLevel:{
        type:String,
        enum:["Easy","Medium","Hard","Expert"],
        default:"Medium",
    },
    codeSubmitted:{
        type:String,
        default:"",
    },
    codeEvaluation:{
        correctness: Number,
        codeQuality: Number,
        complexity: String,
        edgeCases: Number,
        overallScore: Number,
        feedback: String,
        testResults: [{
            input: String,
            expected: String,
            actual: String,
            passed: Boolean,
        }]
    }
},{timestamps:true}
)

const questionModel=mongoose.model("Question",questionSchema);
export default questionModel;