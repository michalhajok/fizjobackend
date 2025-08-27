const express = require("express");
const router = express.Router();

const reportController = require("../controllers/report.controller");
const {
  authenticateToken,
  requirePermission,
} = require("../middleware/auth.middleware");

// Wygeneruj raport pacjentów
router.get(
  "/patients",
  authenticateToken,
  requirePermission("reports:read"),
  reportController.generatePatientReport
);

// Wygeneruj raport wizyt
router.get(
  "/visits",
  authenticateToken,
  requirePermission("reports:read"),
  reportController.generateVisitReport
);

// Wygeneruj raport usług
router.get(
  "/services",
  authenticateToken,
  requirePermission("reports:read"),
  reportController.generateServiceReport
);

// Inne raporty możesz dodać analogicznie

module.exports = router;
