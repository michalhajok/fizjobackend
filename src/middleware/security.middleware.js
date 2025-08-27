const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const slowDown = require("express-slow-down");
const logger = require("../utils/logger");

// Rate limiting configuration
const createRateLimiter = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      message,
      retryAfter: Math.ceil(windowMs / 1000),
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logger.security("Rate limit exceeded", {
        ip: req.ip,
        userAgent: req.get("User-Agent"),
        url: req.originalUrl,
        method: req.method,
      });

      res.status(429).json({
        success: false,
        message,
        retryAfter: Math.ceil(windowMs / 1000),
      });
    },
  });
};

// General API rate limiter
const limiter = createRateLimiter(
  parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 900, // 100 requests per window
  "Too many requests from this IP, please try again later"
);

// Strict rate limiter for authentication endpoints
const authLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  5, // 5 attempts per window
  "Too many authentication attempts, please try again later"
);

// Very strict rate limiter for password reset
const passwordResetLimiter = createRateLimiter(
  60 * 60 * 1000, // 1 hour
  3, // 3 attempts per hour
  "Too many password reset attempts, please try again later"
);

// Security headers configuration
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "ws:", "wss:"],
    },
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
});

// Prevent brute force attacks
const bruteForceProtection = (maxAttempts = 5, windowMs = 15 * 60 * 1000) => {
  const attempts = new Map();

  return (req, res, next) => {
    const key = `${req.ip}:${req.originalUrl}`;
    const now = Date.now();

    // Clean old attempts
    for (const [k, v] of attempts.entries()) {
      if (now - v.firstAttempt > windowMs) {
        attempts.delete(k);
      }
    }

    const attempt = attempts.get(key);

    if (!attempt) {
      attempts.set(key, { count: 1, firstAttempt: now });
      next();
    } else if (attempt.count < maxAttempts) {
      attempt.count++;
      next();
    } else {
      logger.security("Brute force attack detected", {
        ip: req.ip,
        url: req.originalUrl,
        attempts: attempt.count,
        userAgent: req.get("User-Agent"),
      });

      res.status(429).json({
        success: false,
        message: "Too many failed attempts, please try again later",
      });
    }
  };
};

module.exports = {
  limiter,
  authLimiter,
  passwordResetLimiter,
  securityHeaders,
  bruteForceProtection,
};
