import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { exec } from "child_process"; // For executing Git clone
import fs from "fs";
import path from "path";
import { listFiles, runDeployment } from "../../services/deploymentService.js";

/**
 * ---------------------------
 * Helpers for Git providers
 * ---------------------------
 */

const getGitHubBase = (req) =>
  req.query.base_url?.replace(/\/+$/, "") ||
  process.env.GITHUB_API_BASE?.replace(/\/+$/, "") ||
  "https://api.github.com";

const githubHeaders = (token) => ({
  Authorization: `Bearer ${token}`,
  Accept: "application/vnd.github+json",
  "User-Agent": "192.168.80.76",
});
// controllers/deploymentController.js
export const requireAuth = (req, res, next) => {
  const h = req.headers.authorization || "";
  const xp = req.headers["x-pat"]; // dev convenience
  const qb = req.query.token || req.body?.token; // dev convenience

  let token = null;
  if (h.startsWith("Bearer ")) token = h.slice(7);
  else if (xp) token = xp;
  else if (process.env.ALLOW_INSECURE_TOKENS === "true") token = qb;

  if (!token)
    return res
      .status(401)
      .json({ error: "Missing Bearer token in Authorization header" });
  req.token = token;
  next();
};

// --- GitHub helpers (you already have these) ---
// const getGitHubBase = (req) => (req.query.base_url?.replace(/\/+$/, "") || process.env.GITHUB_API_BASE?.replace(/\/+$/, "") || "https://api.github.com");
// const githubHeaders = (token) => ({ Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "User-Agent": "plm-deploy/1.0" });

// --- Azure DevOps helpers (add these once if not present) ---
const getAzureBase = (req) =>
  req.query.base_url?.replace(/\/+$/, "") ||
  process.env.AZURE_DEVOPS_BASE?.replace(/\/+$/, "") ||
  "https://dev.azure.com";

// Azure PAT must be sent as Basic auth where username is empty and password = PAT
const azureHeaders = (token) => ({
  Authorization: `Basic ${Buffer.from(":" + token).toString("base64")}`,
});

/**
 * POST /api/git/connect
 * headers: Authorization: Bearer <PAT>
 * body:
 *  - { provider: "github" }
 *  - { provider: "azure", organization?: "<ORG>" }  // optional org to pre-validate projects
 */
export const connectGit = async (req, res) => {
  try {
    const { provider, organization } = req.body || {};

    // --- GitHub ---
    if (provider === "github") {
      const base = getGitHubBase(req);
      const r = await axios.get(`${base}/user`, {
        headers: githubHeaders(req.token),
      });
      return res.json({
        ok: true,
        provider,
        user: { login: r.data.login, id: r.data.id },
      });
    }

    // --- Azure DevOps ---
    if (provider === "azure") {
      const base = getAzureBase(req);

      // If org is provided, validate access by listing projects (confirms PAT + org)
      if (organization) {
        const pr = await axios.get(
          `${base}/${organization}/_apis/projects?api-version=7.0`,
          {
            headers: azureHeaders(req.token),
          }
        );
        return res.json({
          ok: true,
          provider,
          organization,
          projects: (pr.data?.value || []).map((p) => p.name),
        });
      }

      // Else, just validate the PAT by hitting the profile endpoint
      const r = await axios.get(
        `https://app.vssps.visualstudio.com/_apis/profile/profiles/me?api-version=7.0`,
        { headers: azureHeaders(req.token) }
      );
      return res.json({
        ok: true,
        provider,
        user: { id: r.data?.id, displayName: r.data?.displayName },
      });
    }

    // Fallback: unsupported
    return res
      .status(400)
      .json({ error: "Unsupported provider. Use 'github' or 'azure'." });
  } catch (err) {
    return res
      .status(err.response?.status || 500)
      .json({ ok: false, error: err.response?.data || err.message });
  }
};

/**
 * GET /api/git/repos?provider=github
 * header: Authorization: Bearer <PAT>
 */

export const listReposGit = async (req, res) => {
  try {
    const { provider } = req.query;
    if (provider === "github") {
      const base = getGitHubBase(req);
      const r = await axios.get(`${base}/user/repos?per_page=100`, {
        headers: githubHeaders(req.token),
      });
      const items = (r.data || []).map((x) => ({
        id: x.id,
        fullName: x.full_name,
        url: x.html_url,
        private: x.private,
      }));
      return res.json({ items });
    }

    if (provider === "azure") {
      const { organization, project } = req.query;
      if (!organization || !project)
        return res
          .status(400)
          .json({ error: "Missing organization or project" });
      const base = getAzureBase(req);
      const r = await axios.get(
        `${base}/${organization}/${project}/_apis/git/repositories?api-version=7.0`,
        { headers: azureHeaders(req.token) }
      );
      const items = (r.data?.value || []).map((x) => ({
        id: x.id,
        fullName: `${organization}/${project}/${x.name}`,
        url: x.webUrl,
        private: true,
      }));
      return res.json({ items });
    }

    return res
      .status(400)
      .json({ error: "Unsupported provider. Only 'github' or 'azure'." });
  } catch (err) {
    return res
      .status(err.response?.status || 500)
      .json({ error: err.response?.data || err.message });
  }
};

/**
 * POST /api/git/resolve
 * body: { provider: "github", url: "https://github.com/org/repo(.git)" }
 */
export const resolveRepo = async (req, res) => {
  try {
    const { provider, url } = req.body || {};
    if (provider !== "github") {
      return res
        .status(400)
        .json({ error: "Only GitHub URL resolve implemented." });
    }
    const m = String(url || "").match(
      /github\.com\/([^/]+)\/([^/]+?)(?:\.git|\/)?$/i
    );
    if (!m)
      return res.status(400).json({ error: "Unrecognized GitHub URL format" });
    const fullName = `${m[1]}/${m[2]}`;
    return res.json({ repo: { id: fullName, fullName, url } });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/git/branches?provider=github&repo=owner/name
 */

export const listBranchesGit = async (req, res) => {
  try {
    const { provider } = req.query || {};

    if (provider === "github") {
      const { repo } = req.query;
      if (!repo)
        return res.status(400).json({ error: "Missing ?repo=owner/name" });
      const base = getGitHubBase(req);
      const r = await axios.get(`${base}/repos/${repo}/branches?per_page=100`, {
        headers: githubHeaders(req.token),
      });
      const items = (r.data || []).map((b) => ({
        name: b.name,
        commit: b.commit?.sha,
      }));
      return res.json({ items });
    }

    if (provider === "azure") {
      const { organization, project, repo } = req.query;
      if (!organization || !project || !repo)
        return res
          .status(400)
          .json({ error: "Missing organization, project, or repo" });
      const base = getAzureBase(req);
      const repoId = await azureGetRepoId({
        base,
        token: req.token,
        organization,
        project,
        repo,
      });
      const r = await axios.get(
        `${base}/${organization}/${project}/_apis/git/repositories/${repoId}/refs?filter=heads/&api-version=7.0`,
        { headers: azureHeaders(req.token) }
      );
      const items = (r.data?.value || []).map((x) => {
        const parts = String(x.name || "").split("/");
        return { name: parts[parts.length - 1], commit: x.objectId };
      });
      return res.json({ items });
    }

    return res
      .status(400)
      .json({ error: "Unsupported provider. Only 'github' or 'azure'." });
  } catch (err) {
    return res
      .status(err.response?.status || 500)
      .json({ error: err.response?.data || err.message });
  }
};

/**
 * GET /api/git/tree?provider=github&repo=owner/name&branch=main
 * Returns a flattened list of { path, type: "file"|"dir" }
 */

export const getRepoTree = async (req, res) => {
  try {
    const { provider } = req.query || {};

    if (provider === "github") {
      // (use the fixed GitHub implementation from Fix #2 above)
      // ...
    }

    if (provider === "azure") {
      const {
        organization,
        project,
        repo,
        branch,
        path: prefix = "",
      } = req.query || {};
      if (!organization || !project || !repo || !branch) {
        return res
          .status(400)
          .json({ error: "Missing organization, project, repo or branch" });
      }
      const base = getAzureBase(req);
      const repoId = await azureGetRepoId({
        base,
        token: req.token,
        organization,
        project,
        repo,
      });

      const url =
        `${base}/${organization}/${project}/_apis/git/repositories/${repoId}/items` +
        `?recursionLevel=Full&includeContentMetadata=true` +
        `&versionDescriptor.versionType=branch&versionDescriptor.version=${encodeURIComponent(
          branch
        )}` +
        `&api-version=7.0`;

      const r = await axios.get(url, { headers: azureHeaders(req.token) });
      let items = (r.data?.value || []).map((i) => ({
        path: String(i.path || "").replace(/^\//, ""),
        type: i.isFolder ? "dir" : "file",
      }));
      if (prefix) items = items.filter((i) => i.path.startsWith(prefix));
      return res.json({ items });
    }

    return res
      .status(400)
      .json({ error: "Unsupported provider. Only 'github' or 'azure'." });
  } catch (err) {
    return res
      .status(err.response?.status || 500)
      .json({ error: err.response?.data || err.message });
  }
};

/**
 
 * POST /api/git/detect
 * body: { items: [{path, type}] }
 * Returns { bmide:[], preferences:[], stylesheets:[] }
 */
export const detectArtifacts = async (req, res) => {
  try {
    const { items = [] } = req.body || {};
    const lower = (p) => String(p || "").toLowerCase();

    const bmide = items
      .filter(
        (t) => t.type === "file" && /bmide\/.+\.(zip|xml|txt)$/i.test(t.path)
      )
      .map((t) => t.path);

    const preferences = items
      .filter(
        (t) =>
          t.type === "file" &&
          /(^|\/)prefs?|preferences\/.+\.(xml|ini)$/i.test(lower(t.path))
      )
      .map((t) => t.path);

    const stylesheets = items
      .filter((t) => t.type === "file" && /\.(xsl|xslt)$/i.test(t.path || ""))
      .map((t) => t.path);

    return res.json({ bmide, preferences, stylesheets });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * ---------------------------
 * Your existing controllers
 * ---------------------------
 */

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
