import logger from "../utils/logger.js";
import {
  asyncHandler,
  sendSuccessResponse,
  sendBadRequestResponse,
  sendServerErrorResponse,
} from "../utils/apiHelpers.js";

export const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    return sendBadRequestResponse(res, "No image file uploaded");
  }

  try {
    const fileInfo = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
      url: `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`,
    };

    logger.info(`Image uploaded successfully: ${req.file.filename}`);

    return sendSuccessResponse(res, "Image uploaded successfully", fileInfo);
  } catch (error) {
    logger.error("Image upload error:", error.message);
    return sendServerErrorResponse(res, "Failed to process uploaded image");
  }
});

export const uploadMultipleImages = asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return sendBadRequestResponse(res, "No image files uploaded");
  }

  try {
    const filesInfo = req.files.map((file) => ({
      filename: file.filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      path: file.path,
      url: `${req.protocol}://${req.get("host")}/uploads/${file.filename}`,
    }));

    logger.info(`${req.files.length} images uploaded successfully`);

    return sendSuccessResponse(
      res,
      `${req.files.length} images uploaded successfully`,
      filesInfo
    );
  } catch (error) {
    logger.error("Multiple images upload error:", error.message);
    return sendServerErrorResponse(res, "Failed to process uploaded images");
  }
});

export default {
  uploadImage,
  uploadMultipleImages,
};
