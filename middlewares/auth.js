import logger from "../utils/logger.js";
import jwt from "jsonwebtoken";

import {
  sendUnauthorizedResponse,
  sendForbiddenResponse,
  sendBadRequestResponse,
} from "../utils/apiHelpers.js";

export const requestLogger = (req, res, next) => {
  const start = Date.now();
  const { method, url, ip } = req;

  res.on("finish", () => {
    const duration = Date.now() - start;
    const { statusCode } = res;

    logger.info(`${method} ${url} ${statusCode} ${duration}ms - ${ip}`);
  });

  next();
};

export const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return sendBadRequestResponse(res, "Validation error", errors);
    }
    next();
  };
};

export const authenticate = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return sendUnauthorizedResponse(res, "Access denied. No token provided.");
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    next();
  } catch (error) {
    logger.error("Authentication error:", error);
    return sendUnauthorizedResponse(res, "Invalid token");
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendUnauthorizedResponse(
        res,
        "Access denied. User not authenticated."
      );
    }

    if (!roles.includes(req.user.role)) {
      return sendForbiddenResponse(
        res,
        "Access denied. Insufficient permissions."
      );
    }

    next();
  };
};

export const cache = (duration = 300) => {
  // 5 minutes default
  return (req, res, next) => {
    if (req.method !== "GET") {
      return next();
    }

    const key = req.originalUrl;
    // Add Redis cache implementation here

    next();
  };
};
