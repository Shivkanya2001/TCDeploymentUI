// db.js (or connectDB.js)

import mongoose from "mongoose";
import dotenv from "dotenv";

// Load environment variables from .env
dotenv.config();

const connectDB = async () => {
  try {
    // Attempt to connect to MongoDB using Mongoose
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB connected successfully");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1); // Exit the process if connection fails
  }
};

// Call the function to connect to MongoDB
connectDB();
