require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const compression = require("compression");
const mongoSanitize = require("express-mongo-sanitize");
const helmet = require("helmet");
const hpp = require("hpp");

const {
  securityHeaders,
  limiter,
} = require("./middleware/security.middleware");
// const SocketHandler = require("./websocket/socket.handler");
// const NotificationService = require("./services/notification.service");
const logger = require("./utils/logger");
const { connectDB } = require("./config/database");

// Import routes
const authRoutes = require("./routes/auth.routes");
const patientRoutes = require("./routes/patient.routes");
const employeeRoutes = require("./routes/employee.routes");
// const visitRoutes = require("./routes/visit.routes");
const appointmentRoutes = require("./routes/appointment.routes");
// const scheduleRoutes = require("./routes/schedule.routes");
// const notificationRoutes = require("./routes/notification.routes");
const reportRoutes = require("./routes/report.routes");
const adminRoutes = require("./routes/admin.routes");
const servicesRoutes = require("./routes/services.routes");
const icdRoutes = require("./routes/icd9.routes");
const icfRoutes = require("./routes/icf.routes");

const app = express();
const server = http.createServer(app);

// Inicjalizacja WebSocket
// const socketHandler = new SocketHandler(server);
// const notificationService = new NotificationService(socketHandler);

// Udostępnienie serwisów w req
// app.use((req, res, next) => {
//   req.socketHandler = socketHandler;
//   req.notificationService = notificationService;
//   next();
// });

// Trust proxy - important for production
app.set("trust proxy", 1);

// Middleware globalne
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "ws:", "wss:"],
      },
    },
  })
);

app.use(compression());
app.use(hpp()); // Prevent HTTP Parameter Pollution
app.use(mongoSanitize()); // Prevent NoSQL injection
app.use(limiter);

app.use(
  cors({
    origin: function (origin, callback) {
      const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [
        "http://localhost:3000",
      ];
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

app.use(
  express.json({
    limit: "10mb",
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Logging middleware
app.use((req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.originalUrl}`, {
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      userId: req.user?.id || "anonymous",
    });
  });

  next();
});

// Health check endpoisnt
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: require("../package.json").version,
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/employees", employeeRoutes);
// app.use("/api/visits", visitRoutes);
app.use("/api/appointments", appointmentRoutes);
// app.use("/api/schedules", scheduleRoutes);
// app.use("/api/notifications", notificationRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/services", servicesRoutes);
app.use("/api/icd9", icdRoutes);
app.use("/api/icf", icfRoutes);

// Serve static files
app.use(
  "/uploads",
  express.static("uploads", {
    maxAge: "1d",
    etag: true,
  })
);

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Resource not found",
    path: req.originalUrl,
  });
});

// Global error handler
app.use((error, req, res, next) => {
  logger.error("Unhandled error:", {
    error: error.message,
    stack: error.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userId: req.user?.id,
  });

  // Don't leak error details in production
  const message =
    process.env.NODE_ENV === "production"
      ? "Internal server error"
      : error.message;

  res.status(error.statusCode || 500).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && {
      stack: error.stack,
    }),
  });
});

// Async error handler
process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

// Graceful shutdown
const gracefulShutdown = () => {
  logger.info("Starting graceful shutdown...");

  server.close(() => {
    logger.info("HTTP server closed");

    mongoose.connection.close(() => {
      logger.info("MongoDB connection closed");
      process.exit(0);
    });
  });

  // Force close after 30 seconds
  setTimeout(() => {
    logger.error(
      "Could not close connections in time, forcefully shutting down"
    );
    process.exit(1);
  }, 30000);
};

process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);

// Start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      logger.info(
        `Server running on port ${PORT} in ${process.env.NODE_ENV} mode`
      );
      // logger.info(`API documentation: http://localhost:${PORT}/api/docs`);
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
