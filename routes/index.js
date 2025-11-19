import express from "express";
import { sendSuccessResponse } from "../utils/apiHelpers.js";
const router = express.Router();

// Import route modules
import healthRoutes from "./health.js";
import userRoutes from "./user.js";
import promptRoutes from "./prompt.js";
import youtubeRoutes from "./youtube.js";
import translationRoutes from "./translation.js";
// import authRoutes from './auth.js';

// Health routes
router.use("/health", healthRoutes);

// API versioning
router.use("/api/v1", (req, res, next) => {
  // Add API versioning logic here
  next();
});

// Routes
router.use("/api/v1/users", userRoutes);
router.use("/api/v1/prompt", promptRoutes);
router.use("/api/v1/youtube", youtubeRoutes);
router.use("/api/v1/translation", translationRoutes);

export default router;
