const express = require("express");
const router = express.Router();

const adminController = require("../controllers/admin.controller");
const {
  authenticateToken,
  requirePermission,
} = require("../middleware/auth.middleware");

// Lista użytkowników (admin)
router.get(
  "/users",
  authenticateToken,
  requirePermission("admin:read"),
  adminController.getUsers
);

// Dodaj nowego użytkownika
router.post(
  "/users",
  authenticateToken,
  requirePermission("admin:write"),
  adminController.createUser
);

// Edytuj użytkownika
router.put(
  "/users/:id",
  authenticateToken,
  requirePermission("admin:write"),
  adminController.updateUser
);

// Usuń użytkownika
router.delete(
  "/users/:id",
  authenticateToken,
  requirePermission("admin:delete"),
  adminController.deleteUser
);

router.get(
  "/users/:id",
  authenticateToken,
  requirePermission("admin:read"),
  adminController.getUserById
);

router.get(
  "/settings",
  authenticateToken,
  requirePermission("admin:read"),
  adminController.getGlobalSettings
);

router.put(
  "/settings/global",
  authenticateToken,
  requirePermission("admin:write"),
  adminController.updateGlobalSettings
);

router.get(
  "/audit-logs",
  authenticateToken,
  requirePermission("admin:read"),
  adminController.getAuditLogs
);

module.exports = router;
