import mongoose from "mongoose";
import userModel from "../models/user.model.js"
import bycrpt from "bcryptjs"
import generateToken from "../utils/utils.js";
import jwt from "jsonwebtoken"

const ensureDbReady = () => {
    if (mongoose.connection.readyState !== 1) {
        throw new Error("Database is unavailable. Please try again later.");
    }
};

{/* Signup controller*/}
export const signup=async(req,res)=>{
    const {fullname,email,password}=req.body;
    try {
        ensureDbReady();

        if(!fullname||!email||!password){
            return res.status(400).json({message:"All fields are required"})
        }
        if(password.length<6){
            return res.status(400).json({message:"Password must be at least 6 character"})
        }

        const existingUser=await userModel.findOne({
            email
        })
        if(existingUser){
            return res.status(400).json({message:"User already exists"})
        }

        const salt=await bycrpt.genSalt(10)
        const hashedPassword=await bycrpt.hash(password,salt);

        const user=await userModel.create({
            fullname,
            email,
            password:hashedPassword
        })

        if(user){
            res.status(201).json({
                message: "Account created successfully. Please login.",
                _id: user._id,
                fullname: user.fullname,
                email: user.email,
            })
        }else{
            res.status(400).json({message:"Invalid user data"})
        }
        
        
    } catch (error) {
        console.error("Error in signup controller:", error.message || error);
        res.status(500).json({
            message: error.message || "Internal server error"
        })
    }
}


{/* Login controller*/}
export const login=async (req,res)=>{
    
    const {email,password}=req.body;
    try {
        ensureDbReady();
        const user=await userModel.findOne({email})
        if(!user){
            return res.status(400).json({ message: "Invalid Credentials" });
        }
        const isPasswordMatched=await bycrpt.compare(password,user.password)
        if(!isPasswordMatched){
            return res.status(400).json({ message: "Invalid Credentials" });
        }
        generateToken(user._id,res)
        res.status(200).json({
            _id:user._id,
            fullname:user.fullname,
            email:user.email,
        })
    } catch (error) {
        console.error("Error in login controller:", error.message || error);
        const statusCode = error.message?.includes("Database is unavailable") ? 503 : 500;
        return res.status(statusCode).json({ message: error.message || "Internal Server Error" })
    }
}

{/* logout controller*/}

export const logout= (req,res)=>{
    try {
        res.cookie("token", "", {
            maxAge: 0,
            httpOnly: true,
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            secure: process.env.NODE_ENV === "production",
        })
        res.status(200).json({message:"Logged out successfully"})
    } catch(error) {
        console.log("Error in logout controller",error.message);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}


{/* check controller*/}
export const checkAuth = async (req, res) => {
  try {
    res.status(200).json(req.user);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};