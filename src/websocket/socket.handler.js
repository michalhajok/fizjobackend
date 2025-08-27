const socketIo = require("socket.io");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const logger = require("../utils/logger");

class SocketHandler {
  constructor(server) {
    this.io = socketIo(server, {
      cors: {
        origin: process.env.SOCKET_IO_CORS_ORIGIN || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true,
      },
    });

    this.connectedUsers = new Map();
    this.setupMiddleware();
    this.setupEventHandlers();
  }

  setupMiddleware() {
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth?.token;

        if (!token) {
          return next(new Error("Authentication error"));
        }

        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const user = await User.findById(decoded.userId);

        if (!user || !user.isActive) {
          return next(new Error("Authentication error"));
        }

        socket.userId = user._id.toString();
        socket.userRole = user.role;
        socket.user = user;

        next();
      } catch (err) {
        next(new Error("Authentication error"));
      }
    });
  }

  setupEventHandlers() {
    this.io.on("connection", (socket) => {
      const userId = socket.userId;

      logger.info(`User connected via WebSocket: ${userId}`);

      this.connectedUsers.set(userId, socket);

      // Dołącz do pokoju użytkownika
      socket.join(`user_${userId}`);
      socket.join(`role_${socket.userRole}`);

      socket.on("disconnect", () => {
        logger.info(`User disconnected: ${userId}`);
        this.connectedUsers.delete(userId);
      });
    });
  }

  sendNotificationToUser(userId, notification) {
    const socket = this.connectedUsers.get(userId.toString());
    if (socket) {
      socket.emit("notification", notification);
      return true;
    }
    return false;
  }

  sendNotificationToRole(role, notification) {
    this.io.to(`role_${role}`).emit("notification", notification);
  }
}

module.exports = SocketHandler;
