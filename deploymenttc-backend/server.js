import express from "express";
import cors from "cors";
import "dotenv/config";

import deploymentRoutes from "./routes/deploymentRoutes.js"; // 👈 include .js

const app = express();

// Read CORS URL from environment variables
const corsOptions = {
  origin: process.env.CORS_ORIGIN || "*", // Default to "*" if not set in .env
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE", // Allow these HTTP methods
  allowedHeaders: "Content-Type,Authorization", // Allow specific headers
  credentials: true, // Allow credentials if required
};

// Middleware
app.use(cors(corsOptions)); // Apply the CORS configuration
app.use(express.json());

// Routes
app.use("/api/deployment", deploymentRoutes);

// Port
const PORT = process.env.PORT || 4000;

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
