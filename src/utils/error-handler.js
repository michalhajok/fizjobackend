// Klasa ErrorResponse do standardowej struktury błędów
class ErrorResponse extends Error {
  constructor(message, statusCode, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.timestamp = new Date().toISOString();

    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      success: false,
      error: {
        message: this.message,
        statusCode: this.statusCode,
        timestamp: this.timestamp,
        details: this.details
      }
    };
  }
}

// Funkcja do obsługi asynchronicznych middleware z obsługą błędów
const asyncHandler = fn => (req, res, next) => 
  Promise.resolve(fn(req, res, next)).catch(next);

// Klasa BusinessLogicError dla błędów biznesowych
class BusinessLogicError extends ErrorResponse {
  constructor(message, details = null) {
    super(message, 400, details);
  }
}

// Klasa AuthenticationError dla błędów autoryzacji
class AuthenticationError extends ErrorResponse {
  constructor(message, details = null) {
    super(message, 401, details);
  }
}

// Klasa AuthorizationError dla błędów uprawnień
class AuthorizationError extends ErrorResponse {
  constructor(message, details = null) {
    super(message, 403, details);
  }
}

// Klasa ResourceNotFoundError dla nieznalezionych zasobów
class ResourceNotFoundError extends ErrorResponse {
  constructor(resource, id, details = null) {
    super(`${resource} not found with id ${id}`, 404, details);
    this.resource = resource;
    this.resourceId = id;
  }
}

// Klasa ValidationError dla błędów walidacji
class ValidationError extends ErrorResponse {
  constructor(message, validationErrors, details = null) {
    super(message, 400, details);
    this.validationErrors = validationErrors;
  }

  toJSON() {
    const json = super.toJSON();
    json.error.validationErrors = this.validationErrors;
    return json;
  }
}

// Klasa ConflictError dla konfliktów danych
class ConflictError extends ErrorResponse {
  constructor(message, details = null) {
    super(message, 409, details);
  }
}

module.exports = {
  ErrorResponse,
  asyncHandler,
  BusinessLogicError,
  AuthenticationError,
  AuthorizationError,
  ResourceNotFoundError,
  ValidationError,
  ConflictError
};
