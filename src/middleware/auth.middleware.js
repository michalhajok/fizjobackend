const jwt = require("jsonwebtoken");
const User = require("../models/User");
const logger = require("../utils/logger");

// Główny middleware autentykacji
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token dostępowy jest wymagany",
      });
    }

    // Weryfikacja tokenu
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    // Sprawdzenie czy użytkownik nadal istnieje
    const user = await User.findById(decoded.userId).select(
      "-password -refreshTokens"
    );

    if (!user) {
      logger.security("Token belongs to non-existent user", {
        userId: decoded.userId,
        ip: req.ip,
      });

      return res.status(403).json({
        success: false,
        message: "Nieprawidłowy token - użytkownik nie istnieje",
      });
    }

    // Sprawdzenie czy konto jest aktywne
    if (!user.isActive) {
      logger.security("Inactive user attempted access", {
        userId: user._id,
        email: user.email,
        ip: req.ip,
      });

      return res.status(403).json({
        success: false,
        message: "Konto jest nieaktywne",
      });
    }

    // Sprawdzenie czy konto nie jest zablokowane
    if (user.isLocked) {
      logger.security("Locked user attempted access", {
        userId: user._id,
        email: user.email,
        ip: req.ip,
        lockUntil: user.lockUntil,
      });

      return res.status(423).json({
        success: false,
        message: "Konto jest tymczasowo zablokowane",
        lockUntil: user.lockUntil,
      });
    }

    // Aktualizacja ostatniej aktywności
    // user.updateLastActivity().catch((err) => {
    //   logger.error("Failed to update last activity", err);
    // });
    // Dodanie użytkownika do requestu
    req.user = user;

    // Log successful authentication
    logger.audit("User authenticated", {
      userId: user._id,
      email: user.email,
      role: user.role,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
    });

    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      logger.security("Invalid JWT token", {
        error: error.message,
        ip: req.ip,
      });

      return res.status(403).json({
        success: false,
        message: "Nieprawidłowy token",
      });
    }

    if (error.name === "TokenExpiredError") {
      logger.security("Expired JWT token", {
        error: error.message,
        ip: req.ip,
      });

      return res.status(403).json({
        success: false,
        message: "Token wygasł",
        expiredAt: error.expiredAt,
      });
    }

    logger.error("Authentication error:", error);
    return res.status(500).json({
      success: false,
      message: "Błąd weryfikacji tokenu",
    });
  }
};

// Middleware sprawdzający uprawnienia
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Wymagana autoryzacja",
      });
    }

    if (!req.user.hasPermission(permission)) {
      logger.security("Permission denied", {
        userId: req.user._id,
        email: req.user.email,
        requiredPermission: permission,
        userPermissions: req.user.permissions,
        ip: req.ip,
        url: req.originalUrl,
      });

      return res.status(403).json({
        success: false,
        message: `Brak uprawnień: ${permission}`,
      });
    }

    next();
  };
};

// Middleware logujący dostęp do wrażliwych endpoints
const logSensitiveAccess = (req, res, next) => {
  logger.audit("Sensitive endpoint access", {
    userId: req.user?._id,
    email: req.user?.email,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
  });

  next();
};

module.exports = {
  authenticateToken,
  requirePermission,
  logSensitiveAccess,
};
