import jwt from "jsonwebtoken";
import userModel from "../models/user.model.js";

async function authMiddleware(req,res,next) {
    const authorization = req.headers.authorization;
    const bearerToken = authorization?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();
    // Prefer the current bearer token; cookies can contain an older JWT from a previous login.
    const token = bearerToken || req.cookies?.token;
    if (!token) {
        return res.status(401).json({
            message: "Unauthorized access, Please login"
        });
    }
    if (!process.env.JWT_SECRET) {
        console.error("JWT_SECRET is not configured");
        return res.status(503).json({ message: "Authentication is temporarily unavailable" });
    }

    let decode;
    try {
        decode = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        const cookieToken = req.cookies?.token;
        if (cookieToken && cookieToken !== token) {
            try {
                decode = jwt.verify(cookieToken, process.env.JWT_SECRET);
            } catch (cookieError) {
                console.log("Invalid or expired JWT:", cookieError.message);
                return res.status(401).json({ message: "Invalid or expired token, please login again" });
            }
        } else {
            console.log("Invalid or expired JWT:", error.message);
            return res.status(401).json({ message: "Invalid or expired token, please login again" });
        }
    }

    if (!decode?.userId) {
        return res.status(401).json({ message: "Invalid token, please login again" });
    }

    try {
        const user = await userModel.findById(decode.userId).select("-password");

        if (!user) {
        return res.status(404).json({
            message: "User not found",
        });
        }
        req.user=user;
        next()
    } catch (error) {
        console.error("Unable to load authenticated user:", error.message);
        return res.status(503).json({ message: "Authentication service is temporarily unavailable" });
    }
}

export default authMiddleware;