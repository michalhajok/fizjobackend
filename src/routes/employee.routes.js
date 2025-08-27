const express = require("express");
const router = express.Router();

const employeeController = require("../controllers/employee.controller");
const {
  authenticateToken,
  requirePermission,
} = require("../middleware/auth.middleware");

// Lista pracowników
router.get(
  "/",
  authenticateToken,
  requirePermission("employees:read"),
  employeeController.getEmployees
);

router.get(
  "/type/:role",
  authenticateToken,
  requirePermission("employees:read"),
  employeeController.getEmployeesType
);

// Szczegóły pracownika
router.get(
  "/:id",
  authenticateToken,
  requirePermission("employees:read"),
  employeeController.getEmployeeById
);

// Dodaj nowego pracownika
router.post(
  "/",
  authenticateToken,
  requirePermission("employees:write"),
  employeeController.createEmployee
);

// Edytuj pracownika
router.put(
  "/:id",
  authenticateToken,
  requirePermission("employees:write"),
  employeeController.updateEmployee
);

// Usuń pracownika
router.delete(
  "/:id",
  authenticateToken,
  requirePermission("employees:delete"),
  employeeController.deleteEmployee
);

// router.get(
//   "/",
//   authenticateToken,
//   requirePermission("employees:read"),
//   employeeController.getAll // już obsługuje req.query.role
// );

// Harmonogram, wizyty etc.

// Aktualizacja statusu pracownika
router.patch(
  "/:id/status",
  authenticateToken,
  requirePermission("employees:write"),
  employeeController.updateStatus
);

// Resetowanie hasła
router.post(
  "/:id/reset-password",
  authenticateToken,
  requirePermission("employees:write"),
  employeeController.resetPassword
);

// Obciążenie pracownika w okresie ?start=YYYY-MM-DD&end=YYYY-MM-DD
router.get(
  "/:id/workload",
  authenticateToken,
  requirePermission("employees:read"),
  employeeController.getWorkload
);
router.get(
  "/:id/availability",
  authenticateToken,
  requirePermission("employees:read"),
  employeeController.getAvailability
);

router.get("/:id/schedule", employeeController.getEmployeeSchedule);
router.put("/:id/schedule", employeeController.updateEmployeeSchedule);

module.exports = router;
