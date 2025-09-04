const express = require("express");
const router = express.Router();

const authController = require("../controllers/auth.controller");
const {
  authLimiter,
  bruteForceProtection,
} = require("../middleware/security.middleware");

const {
  authenticateToken,
  requirePermission,
} = require("../middleware/auth.middleware");

// POST /api/auth/login
router.post(
  "/login",
  //authLimiter,
  //bruteForceProtection(5, 15 * 60 * 1000),
  authController.login
);

// POST /api/auth/logout
router.post("/logout", authController.logout);

router.get("/profile", authenticateToken, authController.getProfile);

router.get("/verify", authenticateToken, authController.getVerifiedUser);

router.post("/refresh", authController.refresh);

// Rate limiting dla resetowania hasła
// const resetPasswordLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minut
//   max: 5, // maksymalnie 5 prób na 15 minut
//   message: {
//     success: false,
//     message: "Za dużo prób resetowania hasła. Spróbuj ponownie za 15 minut.",
//   },
//   standardHeaders: true,
//   legacyHeaders: false,
// });

// Walidacja tokenu resetowania hasła
router.post(
  "/validate-reset-token",
  // resetPasswordLimiter,
  // validateRequest([
  //   {
  //     field: 'token',
  //     required: true,
  //     type: 'string',
  //     minLength: 32,
  //     message: 'Token musi być prawidłowym ciągiem znaków'
  //   }
  // ]),
  authController.validateResetToken
);

// Reset hasła z tokenem
router.post(
  "/reset-password",
  // resetPasswordLimiter,
  // validateRequest([
  //   {
  //     field: 'token',
  //     required: true,
  //     type: 'string',
  //     minLength: 32,
  //     message: 'Token jest wymagany'
  //   },
  //   {
  //     field: 'password',
  //     required: true,
  //     type: 'string',
  //     minLength: 8,
  //     pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
  //     message: 'Hasło musi mieć co najmniej 8 znaków i zawierać małą literę, wielką literę oraz cyfrę'
  //   }
  // ]),
  authController.resetPassword
);

module.exports = router;
