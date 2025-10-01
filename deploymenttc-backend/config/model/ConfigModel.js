// models/Config.js
import mongoose from "mongoose";

const HostSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const GitSchema = new mongoose.Schema(
  {
    authMethod: { type: String, enum: ["PAT", "SSH"], default: "PAT" },
    username: { type: String, trim: true },
    sshKeyRef: { type: String, trim: true },
    tokenRef: { type: String, trim: true },
  },
  { _id: false }
);

const ConfigSchema = new mongoose.Schema(
  {
    // single-tenant: keep one config doc with a fixed key
    key: { type: String, unique: true, default: "app-defaults", index: true },

    // App / Repo
    repo: { type: String, trim: true },
    branch: { type: String, trim: true },
    action: { type: String, trim: true },

    // Identity (non-secret)
    user: { type: String, trim: true },
    group: { type: String, trim: true },
    pwFile: { type: String, trim: true },

    // Git (non-secret metadata only)
    git: GitSchema,

    // Hosts
    hosts: { type: [HostSchema], default: [] },
    defaultSelectedHostIds: { type: [String], default: [] },

    // Feature flag mirrored from your UI
    useAppDefaults: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("Config", ConfigSchema);
