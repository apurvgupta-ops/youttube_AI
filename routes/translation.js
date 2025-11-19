import express from "express";
const router = express.Router();

import {
  translate,
  detectLanguage,
} from "../controllers/translationController.js";

// Public: POST /api/v1/translation/translate
router.post("/translate", translate);

// Public: POST /api/v1/translation/detect
router.post("/detect", detectLanguage);

export default router;
