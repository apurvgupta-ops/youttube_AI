import axios from "axios";
import logger from "../utils/logger.js";
import {
  asyncHandler,
  sendSuccessResponse,
  sendBadRequestResponse,
  sendServerErrorResponse,
} from "../utils/apiHelpers.js";

export const translate = asyncHandler(async (req, res) => {
  const { text, target, source } = req.body;

  if (!text) {
    return sendBadRequestResponse(res, 'Field "text" is required');
  }

  if (!target) {
    return sendBadRequestResponse(
      res,
      'Field "target" (target language code) is required'
    );
  }

  const key = process.env.GOOGLE_TRANSLATE_API_KEY;
  if (!key) {
    logger.error("GOOGLE_TRANSLATE_API_KEY is not set in environment");
    return sendServerErrorResponse(
      res,
      "Google Translate API key not configured"
    );
  }

  try {
    const params = {
      q: text,
      target,
      key,
    };

    if (source) {
      params.source = source;
    }

    const { data } = await axios.post(
      "https://translation.googleapis.com/language/translate/v2",
      null,
      { params }
    );

    const translation = data.data.translations[0];

    return sendSuccessResponse(res, "Translation successful", {
      translatedText: translation.translatedText,
      detectedSourceLanguage: translation.detectedSourceLanguage,
      target,
    });
  } catch (error) {
    logger.error(
      "Translation API error:",
      error?.response?.data || error.message
    );
    return sendServerErrorResponse(res, "Failed to translate text");
  }
});

export const detectLanguage = asyncHandler(async (req, res) => {
  const { text } = req.body;

  if (!text) {
    return sendBadRequestResponse(res, 'Field "text" is required');
  }

  const key = process.env.GOOGLE_TRANSLATE_API_KEY;
  if (!key) {
    logger.error("GOOGLE_TRANSLATE_API_KEY is not set in environment");
    return sendServerErrorResponse(
      res,
      "Google Translate API key not configured"
    );
  }

  try {
    const { data } = await axios.post(
      "https://translation.googleapis.com/language/translate/v2/detect",
      null,
      {
        params: {
          q: text,
          key,
        },
      }
    );

    const detection = data.data.detections[0][0];

    return sendSuccessResponse(res, "Language detection successful", {
      language: detection.language,
      confidence: detection.confidence,
    });
  } catch (error) {
    logger.error(
      "Language detection error:",
      error?.response?.data || error.message
    );
    return sendServerErrorResponse(res, "Failed to detect language");
  }
});

export default {
  translate,
  detectLanguage,
};
