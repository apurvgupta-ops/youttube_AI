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
import { Op } from "sequelize";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

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
