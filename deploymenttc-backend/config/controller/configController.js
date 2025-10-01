// controllers/configController.js
import Config from "../model/ConfigModel.js";

const ALLOWED_FIELDS = new Set([
  "repo",
  "branch",
  "action",
  "user",
  "group",
  "pwFile",
  "git",
  "hosts",
  "defaultSelectedHostIds",
  "useAppDefaults",
]);

const pick = (obj) =>
  Object.fromEntries(
    Object.entries(obj || {}).filter(([k]) => ALLOWED_FIELDS.has(k))
  );

export const getConfig = async (req, res) => {
  const doc = await Config.findOne({ key: "app-defaults" }).lean();
  res.json(doc || {});
};

export const upsertConfig = async (req, res) => {
  const payload = pick(req.body);
  // never accept raw tokens; enforce policy
  if (payload.git?.tokenRef && typeof payload.git.tokenRef !== "string") {
    return res
      .status(400)
      .json({ error: "tokenRef must be a reference string" });
  }
  const doc = await Config.findOneAndUpdate(
    { key: "app-defaults" },
    { $set: payload, $setOnInsert: { key: "app-defaults" } },
    { new: true, upsert: true }
  ).lean();
  res.json(doc);
};

// Partial updates (PATCH)
export const patchConfig = async (req, res) => {
  const payload = pick(req.body);
  const doc = await Config.findOneAndUpdate(
    { key: "app-defaults" },
    { $set: payload },
    { new: true, upsert: true }
  ).lean();
  res.json(doc);
};

// ----- Hosts sub-collection ops -----

export const addHost = async (req, res) => {
  const { id, name, address } = req.body || {};
  if (!id || !name || !address) {
    return res.status(400).json({ error: "id, name, address are required" });
  }
  const doc = await Config.findOneAndUpdate(
    { key: "app-defaults", "hosts.id": { $ne: id } },
    { $push: { hosts: { id, name, address } } },
    { new: true, upsert: true }
  ).lean();
  res.json(doc);
};

export const updateHost = async (req, res) => {
  const { id } = req.params;
  const { name, address } = req.body || {};
  const set = {};
  if (typeof name === "string") set["hosts.$.name"] = name;
  if (typeof address === "string") set["hosts.$.address"] = address;

  const doc = await Config.findOneAndUpdate(
    { key: "app-defaults", "hosts.id": id },
    { $set: set },
    { new: true }
  ).lean();
  if (!doc) return res.status(404).json({ error: "host not found" });
  res.json(doc);
};

// controllers/configController.js
export const removeHost = async (req, res) => {
  try {
    const { id } = req.params; // /api/config/hosts/:id
    if (!id) return res.status(400).json({ error: "id is required" });

    const doc = await Config.findOneAndUpdate(
      { key: "app-defaults" },
      {
        // remove host object where hosts.id == :id
        $pull: {
          hosts: { id },
          // and also remove the same id from defaultSelectedHostIds
          defaultSelectedHostIds: id,
        },
      },
      { new: true, runValidators: true }
    ).lean();

    if (!doc) return res.status(404).json({ error: "config not found" });
    return res.json(doc);
  } catch (err) {
    console.error("removeHost error:", err);
    return res.status(500).json({ error: "internal error" });
  }
};

export const toggleDefaultHost = async (req, res) => {
  const { id } = req.params;
  const { selected } = req.body || {};
  const op = selected ? "$addToSet" : "$pull";
  const doc = await Config.findOneAndUpdate(
    { key: "app-defaults" },
    { [op]: { defaultSelectedHostIds: id } },
    { new: true, upsert: true }
  ).lean();
  res.json(doc);
};
