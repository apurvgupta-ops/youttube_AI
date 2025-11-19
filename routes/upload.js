import express from "express";
const router = express.Router();

import upload from "../utils/fileUpload.js";
import {
  uploadImage,
  uploadMultipleImages,
} from "../controllers/uploadController.js";

// Single image upload: POST /api/v1/upload/image
router.post("/image", upload.single("image"), uploadImage);

// Multiple images upload: POST /api/v1/upload/images
router.post("/images", upload.array("images", 5), uploadMultipleImages);

export default router;
