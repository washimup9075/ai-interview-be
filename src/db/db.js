import mongoose from "mongoose";

mongoose.set("bufferCommands", false);

const connectToDB = async () => {
    try {
        const mongoUrl = process.env.MONGODB_URL;

        if (!mongoUrl) {
            throw new Error("MONGODB_URL is not defined in environment variables");
        }

        await mongoose.connect(mongoUrl, {
            serverSelectionTimeoutMS: 15000,
            maxPoolSize: 10,
            retryWrites: true,
        });

        console.log("MongoDB connected successfully");
        return true;
    } catch (error) {
        console.error("MongoDB connection error:", error.message || error);
        return false;
    }
};

export default connectToDB;