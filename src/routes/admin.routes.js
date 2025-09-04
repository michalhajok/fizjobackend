const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin.controller");

// const { validateRequest } = require("../middleware/validation");
const rateLimit = require("express-rate-limit");

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

router.put(
  "/users/:id/role",
  authenticateToken,
  requirePermission("admin:write"),
  adminController.updateUserRole
);

router.put(
  "/users/:id/permissions",
  authenticateToken,
  requirePermission("admin:write"),
  adminController.updateUserPermissions
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

// // Rate limiting dla akcji administracyjnych
const adminActionLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuta
  max: 20, // maksymalnie 20 akcji na minutę
  message: {
    success: false,
    message: "Za dużo akcji administracyjnych. Spróbuj ponownie za chwilę.",
  },
});

// Middleware - wszystkie routes wymagają autentykacji i uprawnień admin
// router.use(authenticateToken);
// router.use(checkPermissions(["admin:all", "settings:write"]));
// router.use(adminActionLimiter);

// Generowanie linku resetowania hasła
router.post(
  "/users/:id/generate-reset-link",
  authenticateToken,
  // validateRequest([
  //   {
  //     field: "id",
  //     location: "params",
  //     required: true,
  //     type: "string",
  //     pattern: /^[0-9a-fA-F]{24}$/,
  //     message: "ID użytkownika musi być prawidłowym ObjectId",
  //   },
  // ]),
  adminController.generateResetLink
);

// Wysłanie emaila z linkiem resetowania
router.post(
  "/users/:id/send-reset-email",
  authenticateToken,
  // validateRequest([
  //   {
  //     field: "id",
  //     location: "params",
  //     required: true,
  //     type: "string",
  //     pattern: /^[0-9a-fA-F]{24}$/,
  //     message: "ID użytkownika musi być prawidłowym ObjectId",
  //   },
  //   {
  //     field: "customMessage",
  //     required: false,
  //     type: "string",
  //     maxLength: 500,
  //     message: "Wiadomość nie może być dłuższa niż 500 znaków",
  //   },
  //   {
  //     field: "expiresIn",
  //     required: false,
  //     type: "number",
  //     min: 1,
  //     max: 168, // maksymalnie 7 dni
  //     message: "Czas wygaśnięcia musi być między 1 a 168 godzinami",
  //   },
  // ]),
  adminController.sendResetEmail
);

// Pobierz listę aktywnych tokenów resetowania (dodatkowy endpoint dla monitoringu)
router.get(
  "/reset-tokens/active",
  requirePermission(["admin:all"]), // Tylko dla super adminów
  adminController.getActiveResetTokens
);

// Anuluj token resetowania
router.delete(
  "/users/:id/reset-token",
  // validateRequest([
  //   {
  //     field: "id",
  //     location: "params",
  //     required: true,
  //     type: "string",
  //     pattern: /^[0-9a-fA-F]{24}$/,
  //     message: "ID użytkownika musi być prawidłowym ObjectId",
  //   },
  // ]),
  adminController.revokeResetToken
);

module.exports = router;
