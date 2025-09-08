import express from "express";
import {
  getFiles,
  deploy,
  deployAgent,
  downloadLogFile,
} from "../controller/deploymentController.js";

const router = express.Router();

router.get("/files", getFiles);
router.post("/run", deploy);
router.post("/runAgent", deployAgent);
router.post("/downloadLogFile", downloadLogFile);
export default router;
