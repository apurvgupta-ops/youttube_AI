import axios from "axios";
import logger from "../utils/logger.js";
import {
  asyncHandler,
  sendSuccessResponse,
  sendBadRequestResponse,
  sendServerErrorResponse,
} from "../utils/apiHelpers.js";

export const search = asyncHandler(async (req, res) => {
  const q = req.query.q;
  const maxResults = Math.min(parseInt(req.query.maxResults) || 10, 50);

  if (!q) {
    return sendBadRequestResponse(res, 'Query parameter "q" is required');
  }

  const key = process.env.YT_API_KEY;
  if (!key) {
    logger.error("YT_API_KEY is not set in environment");
    return sendServerErrorResponse(res, "YouTube API key not configured");
  }

  try {
    const params = {
      part: "snippet",
      q,
      type: "video",
      maxResults,
      key,
    };

    const { data } = await axios.get(
      "https://www.googleapis.com/youtube/v3/search",
      {
        params,
        headers: {
          Referer: process.env.ALLOWED_ORIGINS || "http://localhost:5000",
        },
      }
    );

    return sendSuccessResponse(res, "YouTube search results", data.items);
  } catch (error) {
    logger.error(
      "YouTube search error:",
      error?.response?.data || error.message
    );
    return sendServerErrorResponse(res, "Failed to fetch YouTube results");
  }
});

export default {
  search,
};
