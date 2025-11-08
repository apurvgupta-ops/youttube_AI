/**
 * Generic API response handler
 */
export class ApiResponse {
  constructor(success, message, data = null, statusCode = 200, meta = null) {
    this.success = success;
    this.message = message;
    this.data = data;
    this.statusCode = statusCode;
    this.timestamp = new Date().toISOString();
    if (meta) this.meta = meta;
  }

  static success(message, data = null, statusCode = 200, meta = null) {
    return new ApiResponse(true, message, data, statusCode, meta);
  }

  static error(message, statusCode = 500, data = null, errors = null) {
    const response = new ApiResponse(false, message, data, statusCode);
    if (errors) response.errors = errors;
    return response;
  }

  static created(message, data = null, meta = null) {
    return new ApiResponse(true, message, data, 201, meta);
  }

  static badRequest(message, errors = null) {
    const response = new ApiResponse(false, message, null, 400);
    if (errors) response.errors = errors;
    return response;
  }

  static unauthorized(message = "Unauthorized") {
    return new ApiResponse(false, message, null, 401);
  }

  static forbidden(message = "Forbidden") {
    return new ApiResponse(false, message, null, 403);
  }

  static notFound(message = "Resource not found") {
    return new ApiResponse(false, message, null, 404);
  }

  static conflict(message = "Resource already exists") {
    return new ApiResponse(false, message, null, 409);
  }

  static validationError(message = "Validation failed", errors = []) {
    const response = new ApiResponse(false, message, null, 422);
    response.errors = errors;
    return response;
  }

  static serverError(message = "Internal server error") {
    return new ApiResponse(false, message, null, 500);
  }
}

/**
 * Response handler functions for Express routes
 */
export const sendSuccessResponse = (
  res,
  message,
  data = null,
  statusCode = 200,
  meta = null
) => {
  const response = ApiResponse.success(message, data, statusCode, meta);
  return res.status(response.statusCode).json(response);
};

export const sendErrorResponse = (
  res,
  message,
  statusCode = 500,
  data = null,
  errors = null
) => {
  const response = ApiResponse.error(message, statusCode, data, errors);
  return res.status(response.statusCode).json(response);
};

export const sendCreatedResponse = (res, message, data = null, meta = null) => {
  const response = ApiResponse.created(message, data, meta);
  return res.status(response.statusCode).json(response);
};

export const sendBadRequestResponse = (res, message, errors = null) => {
  const response = ApiResponse.badRequest(message, errors);
  return res.status(response.statusCode).json(response);
};

export const sendUnauthorizedResponse = (res, message = "Unauthorized") => {
  const response = ApiResponse.unauthorized(message);
  return res.status(response.statusCode).json(response);
};

export const sendForbiddenResponse = (res, message = "Forbidden") => {
  const response = ApiResponse.forbidden(message);
  return res.status(response.statusCode).json(response);
};

export const sendNotFoundResponse = (res, message = "Resource not found") => {
  const response = ApiResponse.notFound(message);
  return res.status(response.statusCode).json(response);
};

export const sendConflictResponse = (
  res,
  message = "Resource already exists"
) => {
  const response = ApiResponse.conflict(message);
  return res.status(response.statusCode).json(response);
};

export const sendValidationErrorResponse = (
  res,
  message = "Validation failed",
  errors = []
) => {
  const response = ApiResponse.validationError(message, errors);
  return res.status(response.statusCode).json(response);
};

export const sendServerErrorResponse = (
  res,
  message = "Internal server error"
) => {
  const response = ApiResponse.serverError(message);
  return res.status(response.statusCode).json(response);
};

/**
 * Pagination utility
 */
export class Pagination {
  constructor(page = 1, limit = 10, total = 0) {
    this.page = parseInt(page);
    this.limit = parseInt(limit);
    this.total = total;
    this.pages = Math.ceil(total / limit);
    this.hasNext = page < this.pages;
    this.hasPrev = page > 1;
  }

  getOffset() {
    return (this.page - 1) * this.limit;
  }

  static fromQuery(query) {
    const page = parseInt(query.page) || 1;
    const limit = Math.min(parseInt(query.limit) || 10, 100); // Max 100 items
    return new Pagination(page, limit);
  }
}

/**
 * Async handler wrapper to eliminate try-catch in controllers
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Database transaction wrapper
 */
export const withTransaction = async (callback) => {
  const { sequelize } = await import("../models/index.js");
  const transaction = await sequelize.transaction();

  try {
    const result = await callback(transaction);
    await transaction.commit();
    return result;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};
