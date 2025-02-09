import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connect = async () => {
    try {
        if (!process.env.MONGODB_URL) {
            throw new Error("MONGODB_URL is undefined. Check your .env file.");
        }

        const uri = `${process.env.MONGODB_URL}/${DB_NAME}`;
        console.log("Connecting to MongoDB:", uri); // Debugging

        const connectionInstance = await mongoose.connect(uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log(`\nDatabase connected successfully! HOST: ${connectionInstance.connection.host}`);
    } catch (error) {
        console.error("Database connection error:", error);
        process.exit(1);
    }
};

export default connect;
