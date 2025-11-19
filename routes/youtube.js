import express from "express";
const router = express.Router();

import { search } from "../controllers/youtubeController.js";

// Public: GET /api/v1/youtube/search?q=your+query
router.get("/search", search);

export default router;
