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

module.exports = router;
