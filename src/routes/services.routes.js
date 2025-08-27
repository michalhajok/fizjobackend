const express = require("express");
const { body } = require("express-validator");
const servicesController = require("../controllers/services.controller");

const {
  authenticateToken,
  requirePermission,
} = require("../middleware/auth.middleware");
const {
  handleValidationErrors,
  validateObjectId,
  validatePagination,
} = require("../middleware/validation.middleware");

const { auditLogger } = require("../middleware/audit.middleware");

const router = express.Router();

// Get all services
router.get(
  "/",
  authenticateToken,
  requirePermission("admin:read"),
  validatePagination,
  handleValidationErrors,
  servicesController.getAllServices
);

// Get single service by ID
router.get(
  "/:id",
  authenticateToken,
  requirePermission("admin:read"),
  validateObjectId,
  handleValidationErrors,
  servicesController.getServiceById
);

// Create new service
router.post(
  "/",
  authenticateToken,
  requirePermission("admin:write"),
  body("name").notEmpty().withMessage("Name is required"),
  handleValidationErrors,
  auditLogger("CREATE_SERVICE", "Service"),
  servicesController.createService
);

// Update service
router.put(
  "/:id",
  authenticateToken,
  requirePermission("admin:update"),
  validateObjectId,
  body("name").optional().notEmpty().withMessage("Name cannot be empty"),
  handleValidationErrors,
  auditLogger("UPDATE_SERVICE", "Service"),
  servicesController.updateService
);

// Delete service
router.delete(
  "/:id",
  authenticateToken,
  requirePermission("admin:delete"),
  validateObjectId,
  handleValidationErrors,
  auditLogger("DELETE_SERVICE", "Service"),
  servicesController.deleteService
);

module.exports = router;
