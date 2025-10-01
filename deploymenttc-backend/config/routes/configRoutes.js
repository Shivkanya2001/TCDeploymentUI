// routes/configRoutes.js
import { Router } from "express";
import {
  getConfig,
  upsertConfig,
  patchConfig,
  addHost,
  updateHost,
  removeHost,
  toggleDefaultHost,
} from "../controller/configController.js";

const r = Router();

// Config (CRUD)
r.get("/", getConfig);
r.put("/", upsertConfig); // create/update whole config
r.patch("/", patchConfig); // partial update (only changed keys)

// Hosts (sub-CRUD)
r.post("/hosts", addHost);
r.patch("/hosts/:id", updateHost);
r.delete("/hosts/:id", removeHost);
r.post("/hosts/:id/toggle-default", toggleDefaultHost);

export default r;
