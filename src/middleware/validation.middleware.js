const { validationResult } = require('express-validator');
const logger = require('../utils/logger');

// Middleware do obsługi błędów walidacji
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    logger.warn(`Validation errors for ${req.method} ${req.originalUrl}:`, {
      errors: errors.array(),
      userId: req.user ? req.user._id : null,
      ip: req.ip
    });

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }

  next();
};

// Middleware do walidacji MongoDB ObjectId
const validateObjectId = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName];

    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: `Invalid ${paramName} format`
      });
    }

    next();
  };
};

// Middleware do walidacji dat
const validateDateRange = (startDateParam, endDateParam) => {
  return (req, res, next) => {
    const startDate = req.query[startDateParam];
    const endDate = req.query[endDateParam];

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (isNaN(start.getTime())) {
        return res.status(400).json({
          success: false,
          message: `Invalid ${startDateParam} format`
        });
      }

      if (isNaN(end.getTime())) {
        return res.status(400).json({
          success: false,
          message: `Invalid ${endDateParam} format`
        });
      }

      if (start >= end) {
        return res.status(400).json({
          success: false,
          message: 'Start date must be before end date'
        });
      }
    }

    next();
  };
};

// Middleware do walidacji paginacji
const validatePagination = (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;

  if (page < 1) {
    return res.status(400).json({
      success: false,
      message: 'Page must be greater than 0'
    });
  }

  if (limit < 1 || limit > 100) {
    return res.status(400).json({
      success: false,
      message: 'Limit must be between 1 and 100'
    });
  }

  req.pagination = { page, limit };
  next();
};

module.exports = {
  handleValidationErrors,
  validateObjectId,
  validateDateRange,
  validatePagination
};
