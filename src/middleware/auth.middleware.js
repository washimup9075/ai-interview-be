import jwt from "jsonwebtoken";
import userModel from "../models/user.model.js";

async function authMiddleware(req,res,next) {
    const token = req.cookies.token || (req.headers.authorization && req.headers.authorization.startsWith("Bearer ") ? req.headers.authorization.split(" ")[1] : null);
    if (!token) {
        return res.status(401).json({
            message: "Unauthorized access, Please login"
        });
    }
    try {
        const decode=jwt.verify(token,process.env.JWT_SECRET);
        const user = await userModel.findById(decode.userId).select("-password");

        if (!user) {
        return res.status(404).json({
            message: "User not found",
        });
        }
        req.user=user;
        next()
    } catch (error) {
        console.log("Error occur in auth middleware",error.message)
        return res.status(400).json({
            message:"Invalid token, please login again"
        })
    }
}

export default authMiddleware;