const express = require("express");
const router = express.Router();

const scheduleController = require("../controllers/schedule.controller");
const {
  authenticateToken,
  requirePermission,
} = require("../middleware/auth.middleware");

// Lista harmonogramów pracowników
router.get(
  "/",
  authenticateToken,
  requirePermission("schedules:read"),
  scheduleController.getSchedules
);

// Szczegóły harmonogramu
router.get(
  "/:id",
  authenticateToken,
  requirePermission("schedules:read"),
  scheduleController.getScheduleById
);

// Dodaj nowy harmonogram
router.post(
  "/",
  authenticateToken,
  requirePermission("schedules:write"),
  scheduleController.createSchedule
);

// Edytuj harmonogram
router.put(
  "/:id",
  authenticateToken,
  requirePermission("schedules:write"),
  scheduleController.updateSchedule
);

// Usuń harmonogram
router.delete(
  "/:id",
  authenticateToken,
  requirePermission("schedules:delete"),
  scheduleController.deleteSchedule
);

module.exports = router;
