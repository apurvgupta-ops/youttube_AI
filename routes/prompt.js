import express from "express";
const router = express.Router();

import {
  createPrompt,
  getPromptById,
  deletePrompt,
  updatePrompt,
} from "../controllers/promptsController.js";
import { authenticate } from "../middlewares/auth.js";

router.get("/", getPromptById);

router.use(authenticate);

router.post("/", createPrompt);
router.delete("/:id", deletePrompt);
router.put("/:id", updatePrompt);

export default router;
