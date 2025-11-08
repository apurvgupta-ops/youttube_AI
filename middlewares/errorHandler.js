import logger from "../utils/logger.js";
import { sendErrorResponse } from "../utils/apiHelpers.js";

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  logger.error(`Error ${err.name}: ${err.message}`);
  if (process.env.NODE_ENV === "development") {
    logger.error(err.stack);
  }

  let message = error.message || "Server Error";
  let statusCode = error.statusCode || 500;
  let errors = null;

  // Mongoose bad ObjectId
  if (err.name === "CastError") {
    message = "Resource not found";
    statusCode = 404;
  }

  // Sequelize validation error
  if (err.name === "SequelizeValidationError") {
    message = "Validation failed";
    statusCode = 422;
    errors = err.errors.map((error) => ({
      field: error.path,
      message: error.message,
      value: error.value,
    }));
  }

  // Sequelize unique constraint error
  if (err.name === "SequelizeUniqueConstraintError") {
    message = "Duplicate field value entered";
    statusCode = 400;
    const field = err.errors[0]?.path || "field";
    errors = [`${field} already exists`];
  }

  // Sequelize foreign key constraint error
  if (err.name === "SequelizeForeignKeyConstraintError") {
    message = "Foreign key constraint violation";
    statusCode = 400;
    errors = [`Referenced ${err.table} does not exist`];
  }

  // Sequelize database connection error
  if (err.name === "SequelizeConnectionError") {
    message = "Database connection failed";
    statusCode = 503;
  }

  // Sequelize timeout error
  if (err.name === "SequelizeTimeoutError") {
    message = "Database operation timed out";
    statusCode = 408;
  }

  // Sequelize database error
  if (err.name === "SequelizeDatabaseError") {
    message = "Database error occurred";
    statusCode = 500;
    if (err.message.includes("syntax error")) {
      message = "Invalid query syntax";
      statusCode = 400;
    }
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    message = "Invalid token";
    statusCode = 401;
  }

  if (err.name === "TokenExpiredError") {
    message = "Token expired";
    statusCode = 401;
  }

  // OpenAI API errors
  if (err.message && err.message.includes("OpenAI")) {
    message = "AI service temporarily unavailable";
    statusCode = 503;
  }

  // Rate limiting errors
  if (err.statusCode === 429) {
    message = "Too many requests, please try again later";
    statusCode = 429;
  }

  // Multer file upload errors
  if (err.code === "LIMIT_FILE_SIZE") {
    message = "File too large";
    statusCode = 400;
  }

  if (err.code === "LIMIT_UNEXPECTED_FILE") {
    message = "Unexpected file field";
    statusCode = 400;
  }

  // Send standardized error response
  const responseData =
    process.env.NODE_ENV === "development"
      ? {
          stack: err.stack,
          error: err,
        }
      : null;

  return sendErrorResponse(res, message, statusCode, responseData, errors);
};

export default errorHandler;
