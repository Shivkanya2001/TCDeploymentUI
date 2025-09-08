import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { exec } from "child_process"; // For executing Git clone
import fs from "fs";
import path from "path";
import { listFiles, runDeployment } from "../services/deploymentService.js";

/**
 * GET /files?type=preferences|stylesheet|bmide|all
 */
export const getFiles = async (req, res) => {
  try {
    const { type } = req.query;
    const files = await listFiles();

    // Normalize response
    const result = {
      preferences: files.filter((f) => f.toLowerCase().includes("preferences")),
      stylesheets: files.filter((f) => f.toLowerCase().includes("stylesheet")),
      bmide: files.filter((f) => f.toLowerCase().includes("bmide")),
    };

    if (!type || type === "all") {
      // Return everything
      return res.json(result);
    }

    // Return only the requested type
    if (result[type]) {
      return res.json({ [type]: result[type] });
    }

    // If invalid type
    return res.status(400).json({
      error: "Invalid type. Use all, preferences, stylesheets, bmide",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * POST /deploy
 */
export const deploy = (req, res) => {
  try {
    const payload = req.body;
    const result = runDeployment(payload);
    res.json(result);
  } catch (err) {
    console.error("Deployment error:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Backend controller to trigger deployment on a Python agent
 */
export const deployAgent = async (req, res) => {
  const payload = req.body;
  const requestId = uuidv4();

  try {
    // Ensure host is provided in payload
    if (!payload.host) {
      return res.status(400).json({
        request_id: requestId,
        status: "failed",
        error: "Host is required",
      });
    }

    // Git clone step (if repo URL is provided)
    const gitRepoUrl = payload.gitRepoUrl;
    if (gitRepoUrl) {
      console.log(`[${requestId}] Cloning repository: ${gitRepoUrl}`);
      await cloneRepository(gitRepoUrl); // Clone the repository
      console.log(`[${requestId}] Repository cloned successfully.`);
    } else {
      console.log(
        `[${requestId}] No Git repository URL provided. Skipping Git clone.`
      );
    }

    // Build agent URL dynamically based on payload.host
    const agentUrl = `http://${payload.host}:5000/deploy-preferences`;
    const enrichedPayload = { ...payload, request_id: requestId };

    console.log(`[${requestId}] Forwarding deployment request to ${agentUrl}`);

    // Call Python agent and stream logs
    const response = await axios.post(agentUrl, enrichedPayload, {
      timeout: 1000 * 60 * 5, // optional: 5 min timeout for long deployments
      responseType: "stream", // Stream the logs
    });

    // Create a response stream for logs
    response.data.on("data", (chunk) => {
      // Forward the logs as they're received to the client
      res.write(chunk);
    });

    response.data.on("end", () => {
      // Once done, send a final message
      res.end();
    });

    response.data.on("error", (err) => {
      console.error(`[${requestId}] Error in streaming logs: ${err.message}`);
      res.status(500).json({
        request_id: requestId,
        status: "failed",
        error: err.message,
      });
    });
  } catch (err) {
    console.error(`[${requestId}] ❌ Deployment failed`, err.message);

    return res.status(500).json({
      request_id: requestId,
      status: "failed",
      error: err.response?.data?.error || err.message,
    });
  }
};

const cloneRepository = async (repoUrl) => {
  return new Promise((resolve, reject) => {
    const targetDir = "C:/DeploymentUI/repo"; // Path where the repo will be cloned

    // Ensure the parent directory exists
    const parentDir = path.dirname(targetDir);
    if (!fs.existsSync(parentDir)) {
      console.log(`Directory ${parentDir} does not exist. Creating it...`);
      fs.mkdirSync(parentDir, { recursive: true });
    }

    // Check if the target directory exists, if yes, delete it
    if (fs.existsSync(targetDir)) {
      console.log(`Directory ${targetDir} already exists. Deleting...`);
      fs.rmSync(targetDir, { recursive: true, force: true });
    }

    // Run git clone command
    const command = `git clone "${repoUrl}" "${targetDir}"`; // Ensure paths are wrapped in quotes

    exec(command, (err, stdout, stderr) => {
      if (err) {
        console.error(`Git clone failed: ${stderr}`);
        reject(err);
      } else {
        console.log(`Git clone successful into: ${targetDir}`);
        resolve(stdout); // Return the successful clone output
      }
    });
  });
};

export const downloadLogFile = async (req, res) => {
  const { log_file, host } = req.body;

  try {
    // Ensure that log file path and host are provided
    if (!log_file || !host) {
      return res.status(400).json({
        status: "failed",
        error: "Both log file path and host are required",
      });
    }

    // Call the FastAPI agent to download the log file
    const response = await axios.get(
      `http://${host}:5000/download-logfile`, // Correct template string usage for URL
      {
        params: { log_file }, // Pass the log file path as query parameter
        responseType: "stream", // To handle the file as a stream
      }
    );

    // Set the headers for downloading the file
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${log_file.split("/").pop()}` // Extract filename from path
    );
    res.setHeader("Content-Type", "text/plain");

    // Pipe the response from FastAPI to the client
    response.data.pipe(res);
  } catch (err) {
    console.error("Error downloading log file:", err.message);
    return res.status(500).json({
      status: "failed",
      error: err.message,
    });
  }
};
