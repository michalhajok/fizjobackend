const express = require("express");
const router = express.Router();

const patientController = require("../controllers/patient.controller");
const {
  authenticateToken,
  requirePermission,
  logSensitiveAccess,
} = require("../middleware/auth.middleware");
const { validateCreatePatient } = require("../validators/patient.validator");

// Middleware dla wszystkich tras
router.use(authenticateToken);

// GET /api/patients - Lista pacjentów
router.get(
  "/",
  requirePermission("patients:read"),
  patientController.getPatients
);

// GET /api/patients/:id - Szczegóły pacjenta
router.get(
  "/:id",
  requirePermission("patients:read"),
  //logSensitiveAccess,
  patientController.getPatientById
);

// POST /api/patients - Nowy pacjent
router.post(
  "/",
  requirePermission("patients:write"),
  validateCreatePatient,
  logSensitiveAccess,
  patientController.createPatient
);

router.get(
  "/search",
  authenticateToken,
  requirePermission("patients:read"),
  patientController.search
);

module.exports = router;
