// src/controllers/usersController.js
import Joi from "joi";
import User from "../model/User.js";

/** ───────────────────────────────── VALIDATION ───────────────────────────────── */
const createSchema = Joi.object({
  displayName: Joi.string().min(2).max(120).trim().required(),
  email: Joi.string().email().lowercase().trim().required(),
  role: Joi.string().valid("admin", "operator", "user").default("user"),
  orgId: Joi.string().trim().required(),
  lastLoginAt: Joi.date().optional(),
});

const querySchema = Joi.object({
  email: Joi.string().email().optional(),
  q: Joi.string().optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  orgId: Joi.string().optional(),
});

/** ───────────────────────────────── CONTROLLERS ───────────────────────────────── */
export async function createUser(req, res, next) {
  try {
    const payload = await createSchema.validateAsync(req.body, {
      abortEarly: false,
    });
    const doc = await User.create(payload);

    return res.status(201).json({
      message: "User created",
      user: {
        _id: doc._id,
        displayName: doc.displayName,
        email: doc.email,
        role: doc.role,
        orgId: doc.orgId,
        lastLoginAt: doc.lastLoginAt,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
      },
    });
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({ error: "Email already exists" });
    }
    if (err.isJoi) {
      return res.status(400).json({
        error: "Validation failed",
        details: err.details.map((d) => d.message),
      });
    }
    next(err);
  }
}

export async function listUsers(req, res, next) {
  try {
    const { email, q, page, limit, orgId } = await querySchema.validateAsync(
      req.query,
      { abortEarly: false }
    );

    const filter = {};
    if (orgId) filter.orgId = orgId;
    if (email) filter.email = email.toLowerCase();

    if (!email && q) {
      const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$or = [{ displayName: rx }, { email: rx }];
    }

    // If email provided → return single user
    if (email) {
      const user = await User.findOne(filter, {
        passwordHash: 0,
        apiTokenHash: 0,
      }).lean();
      if (!user) return res.status(404).json({ error: "User not found" });
      return res.json({ user });
    }

    // Otherwise paginate
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      User.find(filter, { passwordHash: 0, apiTokenHash: 0 })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
    ]);

    return res.json({
      items,
      page,
      limit,
      total,
      pages: Math.ceil(total / limit) || 1,
    });
  } catch (err) {
    if (err.isJoi) {
      return res.status(400).json({
        error: "Validation failed",
        details: err.details.map((d) => d.message),
      });
    }
    next(err);
  }
}

export async function getUserById(req, res, next) {
  try {
    const projection = { passwordHash: 0, apiTokenHash: 0 };
    const user = await User.findById(req.params.id, projection).lean();
    if (!user) return res.status(404).json({ error: "User not found" });
    return res.json({ user });
  } catch (err) {
    next(err);
  }
}
