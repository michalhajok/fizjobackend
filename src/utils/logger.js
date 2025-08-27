const winston = require("winston");
const path = require("path");
const fs = require("fs");

// Ensure logs directory exists
const logDir = process.env.LOG_DIR || "./logs";
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Custom format for better readability
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: "YYYY-MM-DD HH:mm:ss",
  }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let logMessage = `${timestamp} [${level.toUpperCase()}]: ${message}`;

    if (Object.keys(meta).length > 0) {
      logMessage += ` ${JSON.stringify(meta, null, 2)}`;
    }

    return logMessage;
  })
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: "HH:mm:ss",
  }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let logMessage = `${timestamp} ${level}: ${message}`;

    if (Object.keys(meta).length > 0) {
      logMessage += ` ${JSON.stringify(meta)}`;
    }

    return logMessage;
  })
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.json(),
  defaultMeta: {
    service: "physiotherapy-backend",
    pid: process.pid,
    hostname: require("os").hostname(),
  },
  transports: [
    // Error logs - separate file for errors only
    new winston.transports.File({
      filename: path.join(logDir, "error.log"),
      level: "error",
      format: logFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 10,
      tailable: true,
    }),

    // Combined logs - all levels
    new winston.transports.File({
      filename: path.join(logDir, "combined.log"),
      format: logFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 20,
      tailable: true,
    }),

    // Audit logs - for sensitive operations
    new winston.transports.File({
      filename: path.join(logDir, "audit.log"),
      level: "info",
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
        winston.format.label({ label: "AUDIT" })
      ),
      maxsize: 10485760, // 10MB
      maxFiles: 50,
      tailable: true,
    }),
  ],

  // Handle exceptions and rejections
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logDir, "exceptions.log"),
      format: logFormat,
      maxsize: 5242880,
      maxFiles: 5,
    }),
  ],
});

// Add console transport for development
if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: consoleFormat,
      level: "debug",
    })
  );
}

// Add specific methods for different types of logging
logger.audit = (message, meta = {}) => {
  logger.info(message, { ...meta, type: "audit" });
};

logger.security = (message, meta = {}) => {
  logger.warn(message, { ...meta, type: "security" });
};

logger.medical = (message, meta = {}) => {
  // Remove or mask sensitive medical data
  const sanitizedMeta = { ...meta };

  // List of fields to mask in medical logs
  const sensitiveFields = [
    "pesel",
    "personalInfo",
    "medicalHistory",
    "diagnosis",
  ];

  sensitiveFields.forEach((field) => {
    if (sanitizedMeta[field]) {
      sanitizedMeta[field] = "[PROTECTED]";
    }
  });

  logger.info(message, { ...sanitizedMeta, type: "medical" });
};

module.exports = logger;
