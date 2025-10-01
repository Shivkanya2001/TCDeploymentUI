// routes/git.routes.js
import express from "express";
import {
  requireAuth,
  connectGit,
  listReposGit,
  resolveRepo,
  listBranchesGit,
  getRepoTree,
  detectArtifacts,
} from "../controller/git.controller.js";

const router = express.Router();

router.post("/connect", requireAuth, connectGit);
router.get("/repos", requireAuth, listReposGit);
router.post("/resolve", requireAuth, resolveRepo);
router.get("/branches", requireAuth, listBranchesGit);
router.get("/tree", requireAuth, getRepoTree);
router.post("/detect", requireAuth, detectArtifacts);

export default router;
