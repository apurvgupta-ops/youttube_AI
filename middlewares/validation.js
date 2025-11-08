import { sendValidationErrorResponse } from "../utils/apiHelpers.js";
import { validationResult } from "express-validator";

/**
 * Middleware to handle express-validator errors
 */
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((error) => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value,
    }));

    return sendValidationErrorResponse(res, "Validation failed", errorMessages);
  }

  next();
};

/**
 * Custom validation middleware for request body
 */
export const validateBody = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true,
    });

    if (error) {
      const errorMessages = error.details.map((detail) => ({
        field: detail.path.join("."),
        message: detail.message,
        value: detail.context?.value,
      }));

      return sendValidationErrorResponse(
        res,
        "Validation failed",
        errorMessages
      );
    }

    // Replace request body with validated and sanitized data
    req.body = value;
    next();
  };
};

/**
 * Custom validation middleware for query parameters
 */
export const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      allowUnknown: true,
      stripUnknown: true,
    });

    if (error) {
      const errorMessages = error.details.map((detail) => ({
        field: detail.path.join("."),
        message: detail.message,
        value: detail.context?.value,
      }));

      return sendValidationErrorResponse(
        res,
        "Query validation failed",
        errorMessages
      );
    }

    req.query = value;
    next();
  };
};

/**
 * Custom validation middleware for URL parameters
 */
export const validateParams = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true,
    });

    if (error) {
      const errorMessages = error.details.map((detail) => ({
        field: detail.path.join("."),
        message: detail.message,
        value: detail.context?.value,
      }));

      return sendValidationErrorResponse(
        res,
        "Parameter validation failed",
        errorMessages
      );
    }

    req.params = value;
    next();
  };
};
