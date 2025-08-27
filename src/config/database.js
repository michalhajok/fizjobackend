const mongoose = require("mongoose");
const logger = require("../utils/logger");

const connectDB = async () => {
  try {
    const mongoURI =
      process.env.NODE_ENV === "test"
        ? process.env.MONGODB_TEST_URI
        : process.env.MONGODB_URI;

    if (!mongoURI) {
      throw new Error(
        "MongoDB connection string not found in environment variables"
      );
    }

    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10, // Maximum number of connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      family: 4, // Use IPv4, skip trying IPv6
    };

    // Connect to MongoDB
    const conn = await mongoose.connect(mongoURI, options);

    logger.info(
      `MongoDB Connected: ${conn.connection.host}:${conn.connection.port}/${conn.connection.name}`
    );

    // Handle connection events
    mongoose.connection.on("connected", () => {
      logger.info("Mongoose connected to MongoDB");
    });

    mongoose.connection.on("error", (err) => {
      logger.error("Mongoose connection error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      logger.warn("Mongoose disconnected from MongoDB");
    });

    // Handle application termination
    process.on("SIGINT", async () => {
      await mongoose.connection.close();
      logger.info("Mongoose connection closed due to application termination");
      process.exit(0);
    });

    return conn;
  } catch (error) {
    logger.error("MongoDB connection error:", error);
    throw error;
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    logger.info("MongoDB disconnected successfully");
  } catch (error) {
    logger.error("Error disconnecting from MongoDB:", error);
    throw error;
  }
};

// Database health check
const checkDBHealth = async () => {
  try {
    const isConnected = mongoose.connection.readyState === 1;

    if (!isConnected) {
      throw new Error("MongoDB not connected");
    }

    // Test the connection with a simple operation
    await mongoose.connection.db.admin().ping();

    return {
      status: "healthy",
      connection: "active",
      database: mongoose.connection.name,
      host: mongoose.connection.host,
      port: mongoose.connection.port,
    };
  } catch (error) {
    return {
      status: "unhealthy",
      error: error.message,
      connection: "inactive",
    };
  }
};

module.exports = {
  connectDB,
  disconnectDB,
  checkDBHealth,
};
