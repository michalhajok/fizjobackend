const express = require("express");
const router = express.Router();

const notificationController = require("../controllers/notification.controller");
const {
  authenticateToken,
  requirePermission,
} = require("../middleware/auth.middleware");

// Lista powiadomień
router.get(
  "/",
  authenticateToken,
  requirePermission("notifications:read"),
  notificationController.getNotifications
);

// Szczegóły powiadomienia
router.get(
  "/:id",
  authenticateToken,
  requirePermission("notifications:read"),
  notificationController.getNotificationById
);

// Dodaj nowe powiadomienie
router.post(
  "/",
  authenticateToken,
  requirePermission("notifications:write"),
  notificationController.createNotification
);

// Edytuj powiadomienie
router.put(
  "/:id",
  authenticateToken,
  requirePermission("notifications:write"),
  notificationController.updateNotification
);

// Usuń powiadomienie
router.delete(
  "/:id",
  authenticateToken,
  requirePermission("notifications:delete"),
  notificationController.deleteNotification
);

module.exports = router;
