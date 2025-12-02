import axios from "axios";
import logger from "../utils/logger.js";
import {
  asyncHandler,
  sendSuccessResponse,
  sendBadRequestResponse,
  sendServerErrorResponse,
} from "../utils/apiHelpers.js";

function parseIsoDurationToSeconds(iso) {
  // Simple ISO 8601 duration parser (PT#H#M#S)
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] || "0", 10);
  const minutes = parseInt(match[2] || "0", 10);
  const seconds = parseInt(match[3] || "0", 10);
  return hours * 3600 + minutes * 60 + seconds;
}

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
    // 1) Search only education videos
    const searchParams = {
      part: "snippet",
      q,
      type: "video",
      maxResults,
      key,
      videoCategoryId: "27", // Education category
      videoDuration: "any", // we'll filter manually for <= 60 min
      // You could also use 'long' or 'medium' if you want rough filtering
    };

    const { data: searchData } = await axios.get(
      "https://www.googleapis.com/youtube/v3/search",
      {
        params: searchParams,
        headers: {
          Referer: process.env.ALLOWED_ORIGINS || "http://localhost:5000",
        },
      }
    );

    const items = searchData.items || [];
    if (items.length === 0) {
      return sendSuccessResponse(res, "No videos found", []);
    }

    // 2) Fetch durations and channel info with videos.list
    const videoIds = items.map((item) => item.id.videoId).join(",");
    const videoParams = {
      part: "contentDetails,snippet",
      id: videoIds,
      key,
    };

    const { data: videosData } = await axios.get(
      "https://www.googleapis.com/youtube/v3/videos",
      {
        params: videoParams,

        headers: {
          Referer: process.env.ALLOWED_ORIGINS || "http://localhost:5000",
        },
      }
    );

    const videoDetailsMap = new Map();
    (videosData.items || []).forEach((video) => {
      const id = video.id;
      const isoDuration = video.contentDetails?.duration;
      const seconds = isoDuration ? parseIsoDurationToSeconds(isoDuration) : 0;
      const channelTitle = video.snippet?.channelTitle || "Unknown";
      videoDetailsMap.set(id, {
        durationSeconds: seconds,
        channelTitle,
        duration: isoDuration,
      });
    });

    // 3) Filter by <= 60 minutes (3600 seconds) and add presenter + duration
    const MAX_SECONDS = 60 * 60;
    const filteredItems = items
      .filter((item) => {
        const vid = item.id.videoId;
        const details = videoDetailsMap.get(vid);
        const durationSec = details?.durationSeconds ?? 0;
        return durationSec > 0 && durationSec <= MAX_SECONDS;
      })
      .map((item) => {
        const vid = item.id.videoId;
        const details = videoDetailsMap.get(vid);
        return {
          ...item,
          presenterName: details?.channelTitle || "Unknown",
          duration: details?.duration || "PT0S",
          durationSeconds: details?.durationSeconds || 0,
        };
      });

    return sendSuccessResponse(
      res,
      "YouTube search results (education, <= 60 min)",
      filteredItems
    );
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
