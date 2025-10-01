// src/routes/users.js
import { Router } from "express";
import {
  createUser,
  listUsers,
  getUserById,
} from "../controller/usersController.js";

const router = Router();

// Create
router.post("/add", createUser);

// Read (list/search or by email)
router.get("/", listUsers);

// Read (by id)
router.get("/:id", getUserById);

export default router;
