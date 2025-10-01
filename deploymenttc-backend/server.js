import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import { bootstrap } from "./servers/bootstrap.js";
import { metricsMiddleware, mountMetrics } from "./servers/metrics.js";
import deploymentRoutes from "./routes/deploymentRoutes.js";
import userRoutes from "./routes/users.js";
import configRoutes from "./config/routes/configRoutes.js";
import gitRoutes from "./gitConfig/routes/git.routes.js";
import mongoose from "mongoose"; // Add this for MongoDB

const app = express();

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB connected successfully");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1); // Exit the process if the connection fails
  }
};

// Connect to MongoDB before starting the server
connectDB();

/** CORS config */
const allowedOrigins = (process.env.CORS_ORIGIN || "*")
  .split(",")
  .map((x) => x.trim())
  .filter(Boolean);

const corsOptions = {
  origin: (origin, cb) => {
    if (
      !origin ||
      allowedOrigins.includes("*") ||
      allowedOrigins.includes(origin)
    ) {
      return cb(null, true);
    }
    return cb(new Error(`CORS blocked: ${origin}`), false);
  },
  methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  optionsSuccessStatus: 204,
};

/** Core middleware */
app.disable("x-powered-by");
app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json({ limit: "1mb" }));
app.use(morgan("tiny"));
if (process.env.TRUST_PROXY) app.set("trust proxy", true);

/** DevOps scaffolding */
bootstrap(app);
app.use(metricsMiddleware);
mountMetrics(app);

/** Health check */
app.get("/health", async (_req, res) => {
  try {
    const dbStatus = mongoose.connection.readyState; // Check the MongoDB connection status
    res.json({ ok: true, dbStatus });
  } catch (error) {
    res.status(500).json({ error: "Database not connected", details: error });
  }
});

/** APIs */
app.use("/api/deployment", deploymentRoutes);
app.use("/api/user", userRoutes);
app.use("/api/config", configRoutes);
app.use("/api/gitconfig", gitRoutes);

/** 404 */
app.use((req, res) => {
  res.status(404).json({ error: "Not Found", path: req.originalUrl });
});

/** Error handler */
app.use((err, _req, res, _next) => {
  console.error("[ERROR]", err?.message || err);
  res.status(err.status || 500).json({
    error: err.message || "Internal Server Error",
    stack: process.env.NODE_ENV === "production" ? null : err.stack, // show stack trace in development mode
  });
});

/** Boot */
const PORT = Number(process.env.PORT || 4000);
app.listen(PORT, () => {
  console.log(`➜ API listening at http://localhost:${PORT}`);
  console.log(`   CORS origins: ${allowedOrigins.join(", ") || "*"}`);
});
