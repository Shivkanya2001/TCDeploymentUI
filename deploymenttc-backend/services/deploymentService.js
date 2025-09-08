import { getDeploymentFiles } from "../model/deploymentModel.js";
import simpleGit from "simple-git";
import path from "path";
import fs from "fs";

const repoDir = path.join(process.cwd(), "repo-deployments");
const gitRepoUrl = process.env.GIT_REPO_URL;
const gitBranch = process.env.GIT_BRANCH || "main";

export const syncRepo = async () => {
  const git = simpleGit();

  try {
    if (!fs.existsSync(repoDir)) {
      console.log(`📥 Cloning repo: ${gitRepoUrl} (branch: ${gitBranch})`);
      await git.clone(gitRepoUrl, repoDir, ["-b", gitBranch]);
    } else {
      console.log(`🔄 Pulling latest changes from ${gitBranch}...`);
      await git.cwd(repoDir).pull("origin", gitBranch);
    }
    console.log("✅ Repo sync complete");
  } catch (err) {
    console.error("❌ Git sync failed:", err.message);
  }
};

export const listFiles = async () => {
  await syncRepo();
  return getDeploymentFiles();
};

export const runDeployment = (payload) => {
  console.log("🚀 Deployment triggered:", payload);
  return { success: true, message: "Deployment started!" };
};
