import { User, Prompt } from "../models/index.js";
import { asyncHandler } from "../utils/apiHelpers.js";
import {
  sendSuccessResponse,
  sendCreatedResponse,
  sendNotFoundResponse,
  sendBadRequestResponse,
  sendServerErrorResponse,
} from "../utils/apiHelpers.js";
import logger from "../utils/logger.js";

export const createPrompt = asyncHandler(async (req, res) => {
  try {
    const user_id = req.user.id;
    const { title, description, prompt } = req.body;
    if (!title || !prompt) {
      return sendBadRequestResponse(res, "Title and content are required");
    }

    await Prompt.create({
      user_id,
      title,
      description,
      prompt,
    });

    return sendCreatedResponse(res, "Prompt created successfully");
  } catch (error) {
    logger.error("Error creating prompt:", error);
    return sendServerErrorResponse(res, "Failed to create prompt");
  }
});

export const getPromptById = asyncHandler(async (req, res) => {
  try {
    const user_id = req.user.id;
    const prompts = await Prompt.findAll({ where: { user_id } });
    return sendSuccessResponse(res, "Prompts retrieved successfully", prompts);
  } catch (error) {
    logger.error("Error retrieving prompts:", error);
    return sendServerErrorResponse(res, "Failed to retrieve prompts");
  }
});

export const deletePrompt = asyncHandler(async (req, res) => {
  try {
    const user_id = req.user.id;
    const promptId = req.params.id;
    const prompt = await Prompt.findOne({
      where: { id: promptId, user_id },
    });
    if (!prompt) {
      return sendNotFoundResponse(res, "Prompt not found");
    }
    await prompt.destroy();
    return sendSuccessResponse(res, "Prompt deleted successfully");
  } catch (error) {
    logger.error("Error deleting prompt:", error);
    return sendServerErrorResponse(res, "Failed to delete prompt");
  }
});

export const updatePrompt = asyncHandler(async (req, res) => {
  try {
    const user_id = req.user.id;
    const promptId = req.params.id;
    const data = req.body;
    const prompt = await Prompt.findOne({
      where: { id: promptId, user_id },
    });
    if (!prompt) {
      return sendNotFoundResponse(res, "Prompt not found");
    }
    await prompt.update(data);
    return sendSuccessResponse(res, "Prompt updated successfully", prompt);
  } catch (error) {
    logger.error("Error updating prompt:", error);
    return sendServerErrorResponse(res, "Failed to update prompt");
  }
});
