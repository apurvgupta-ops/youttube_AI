import {
  sendSuccessResponse,
  sendCreatedResponse,
  sendNotFoundResponse,
  sendBadRequestResponse,
  sendServerErrorResponse,
} from "../utils/apiHelpers.js";
import { asyncHandler } from "../utils/apiHelpers.js";
import logger from "../utils/logger.js";
import { User } from "../models/index.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import OpenAI from "openai";
import { YoutubeTranscript } from "youtube-transcript-plus";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const loginUser = asyncHandler(async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return sendBadRequestResponse(res, "Email and password are required");
    }

    const user = await User.scope("withPassword").findOne({ where: { email } });

    if (!user) {
      return sendBadRequestResponse(res, "Invalid email or password");
    }
    const passwordMatch = await user.checkPassword(password);
    const a = await bcrypt.compare(password, user.password);
    console.log(passwordMatch, a);
    if (!passwordMatch) {
      return sendBadRequestResponse(res, "Invalid email or password");
    }

    const { password: _, ...userData } = user.toJSON();

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET, // Store secret in environment variable
      { expiresIn: "1h" }
    );

    // Send userData and token
    return sendSuccessResponse(res, "Login successful", { ...userData, token });
  } catch (error) {
    logger.error("Error logging in user:", error);
    return sendServerErrorResponse(res, "Failed to log in user");
  }
});

export const signupUser = asyncHandler(async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return sendBadRequestResponse(
        res,
        "Name, email, and password are required"
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return sendBadRequestResponse(res, "Email already in use");
    }

    // Create new user
    const newUser = await User.create({
      name,
      email,
      password,
    });

    const userData = newUser.toSafeJSON();

    // sign JWT token
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email },
      process.env.JWT_SECRET, // Store secret in environment variable
      { expiresIn: "1h" }
    );

    userData.token = token;

    return sendCreatedResponse(res, "User created successfully", userData);
  } catch (error) {
    logger.error("Error signing up user:", error);
    return sendServerErrorResponse(res, "Failed to sign up user");
  }
});

export const convertYoutubeUrlToCourse = asyncHandler(async (req, res) => {
  try {
    const { youtubeUrl, title, presenter, transcript } = req.body;

    // Validate input - either transcript or YouTube URL must be provided
    if (
      (!transcript || !transcript.trim()) &&
      (!youtubeUrl || !youtubeUrl.trim())
    ) {
      return sendBadRequestResponse(
        res,
        "Either transcript or YouTube URL must be provided"
      );
    }

    // If transcript is empty, we will fetch from YouTube
    let transcriptText =
      transcript && transcript.trim() ? transcript.trim() : "";

    // If no transcript given, fetch it from the YouTube URL
    if (!transcriptText) {
      // Validate YouTube URL format
      const youtubeRegex =
        /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
      if (!youtubeRegex.test(youtubeUrl)) {
        return sendBadRequestResponse(res, "Invalid YouTube URL");
      }

      // Extract video ID safely
      let videoId = null;
      try {
        const urlObj = new URL(youtubeUrl);
        videoId = urlObj.searchParams.get("v");
        if (!videoId && urlObj.hostname === "youtu.be") {
          videoId = urlObj.pathname.slice(1);
        }
      } catch {
        return sendBadRequestResponse(res, "Invalid YouTube URL format");
      }

      if (!videoId) {
        return sendBadRequestResponse(res, "Could not extract video ID");
      }

      // Fetch the transcript from YouTube
      try {
        const ytTranscript = await YoutubeTranscript.fetchTranscript(videoId, {
          userAgent:
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0 Safari/537.36",
        });

        if (ytTranscript && ytTranscript.length > 0) {
          transcriptText = ytTranscript.map((item) => item.text).join(" ");
        } else {
          logger.warn("Transcript available but returned empty text");
        }
      } catch (err) {
        logger.warn("Transcript fetch failed:", err.message);
      }

      if (!transcriptText.trim()) {
        return sendBadRequestResponse(
          res,
          "No textual content found. Please ensure the video has captions or provide transcript manually."
        );
      }
    }

    // System prompt for GPT course creation
    //     const systemPrompt = `
    // You are an expert course content creator. Given the following text (from a YouTube transcript and related data),
    // create a structured course with title, description, slug, 5 tags, and course_content in markdown format (~2000 words, 5 sections).

    // Output strictly as JSON:
    // {
    //   "title": "string",
    //   "slug": "string",
    //   "description": "string",
    //   "tags": ["string", "string", "string", "string", "string"],
    //   "course_content": "string (markdown, ~1000 words or 5 paragraphs)"
    // }
    // `;

    const systemPrompt = `
You are an expert course content creator.

Given the following text (from a YouTube transcript and related data), create a structured course with this exact layout:

1. Introduction paragraph (1 short engaging paragraph).
2. Learning objectives: exactly 3 bullet points, each starting with a strong action verb.
3. Main content: up to 10 numbered sub-headings (1–10). 
   - Each numbered heading has a title and 1–3 short paragraphs of explanatory text.
4. Video section: a small section titled "Video" that briefly explains how the original video supports the learning.
5. Practice activity: a section titled "Practice Activity" with a concrete activity or exercise for learners.
6. Course summary: a short section recapping the key takeaways.
7. Presenter acknowledgement: a short acknowledgement for the presenter (leave placeholders if no name is provided).

Return JSON ONLY in the following format:

{
  "title": "string",
  "slug": "string",
  "description": "string",
  "tags": ["string", "string", "string", "string", "string"],
  "course_content": "string (markdown with the structure described above)"
}

Important:
- "course_content" must be valid markdown.
- Use headings and subheadings (##, ###, etc.) where appropriate.
- Follow the structure strictly and in the same order.
`;

    // Call OpenAI GPT-4 to generate the course from the transcript text
    const youtubeData = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: transcriptText },
      ],
      response_format: { type: "json_object" },
    });

    const courseData = JSON.parse(youtubeData.choices[0].message.content);

    // Override title if provided in request body
    if (title) {
      courseData.title = title;
    }
    // Add presenter info in description if provided
    if (presenter) {
      courseData.presenter = presenter;
      courseData.description = `${courseData.description}\n\nPresented by: ${presenter}`;
    }

    return sendCreatedResponse(
      res,
      "Course created successfully from YouTube video",
      courseData
    );
  } catch (error) {
    logger.error("Error converting YouTube URL to course:", error);
    return sendServerErrorResponse(
      res,
      "Failed to convert YouTube URL to course"
    );
  }
});
