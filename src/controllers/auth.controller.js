const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { validationResult } = require("express-validator");
const User = require("../models/User");
const Role = require("../models/Role");
const AuditLog = require("../models/AuditLog");
const {
  asyncHandler,
  AuthenticationError,
  ValidationError,
} = require("../utils/error-handler");

const logger = require("../utils/logger");
const config = require("../config/app");

class AuthController {
  // Rejestracja nowego użytkownika
  register = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError("Validation error", errors.array());
    }

    const { firstName, lastName, email, password, role } = req.body;

    // Sprawdź, czy użytkownik już istnieje
    const userExists = await User.findOne({ email });
    if (userExists) {
      throw new ValidationError("User already exists with this email");
    }

    // Sprawdź rolę
    const userRole = await Role.findById(role);
    if (!userRole) {
      throw new ValidationError("Invalid role");
    }

    // Utwórz nowego użytkownika
    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      role: userRole._id,
      permissions: [],
    });

    // Log operacji
    await AuditLog.create({
      userId: req.user ? req.user._id : user._id,
      action: "USER_REGISTER",
      resourceType: "User",
      resourceId: user._id,
      details: `User registered: ${user.email}`,
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
      severity: "medium",
    });

    logger.info(`User registered: ${user.email}`, { userId: user._id });

    // Wygenerowanie tokenów
    const tokens = this._generateTokens(user._id);

    // Zapisz refresh token
    // Poprzednio: user.refreshTokens.push(tokens.refreshToken)
    user.refreshTokens.push({ token: tokens.refreshToken });

    user.lastLogin = new Date();
    await user.save();

    res.status(201).json({
      success: true,
      data: {
        user: {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: userRole,
          permissions: user.permissions,
        },
        tokens,
      },
    });
  });

  // Logowanie użytkownika
  login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Sprawdź dane wejściowe
    if (!email || !password) {
      throw new ValidationError("Please provide email and password");
    }

    // Znajdź użytkownika i załaduj rolę
    const user = await User.findOne({ email }).populate("role");

    if (!user) {
      throw new AuthenticationError("Invalid credentials");
    }

    // Sprawdź status konta
    if (!user.isActive) {
      throw new AuthenticationError(
        "Your account is inactive. Please contact an administrator."
      );
    }

    // Sprawdź hasło
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      // Log nieudanego logowania
      await AuditLog.create({
        userId: user._id,
        action: "FAILED_LOGIN",
        details: "Failed login attempt: invalid password",
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
        severity: "high",
      });

      throw new AuthenticationError("Invalid credentials");
    }

    // Wygeneruj tokeny
    const tokens = this._generateTokens(user._id);

    // Zapisz refresh token
    user.refreshTokens.push({ token: tokens.refreshToken });

    // Usuń stare tokeny, jeśli jest ich za dużo
    // if (user.refreshTokens.length > 5) {
    //   user.refreshTokens = user.refreshTokens.slice(-5);
    // }

    user.lastLogin = new Date();
    await user.save();

    // Log udanego logowania
    await AuditLog.create({
      userId: user._id,
      action: "USER_LOGIN",
      details: "User logged in successfully",
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
      severity: "low",
    });

    logger.info(`User logged in: ${user.email}`, { userId: user._id });

    res.json({
      success: true,
      data: {
        user: {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
        },
        tokens,
      },
    });
  });

  // Odświeżanie tokenu
  refresh = asyncHandler(async (req, res) => {
    // Middleware refreshToken już zweryfikował token i załadował użytkownika
    // req.user i req.accessToken są już dostępne

    res.json({
      success: true,
      data: {
        accessToken: req.accessToken,
      },
    });
  });

  // Wylogowanie
  logout = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new ValidationError("Refresh token is required");
    }

    const user = await User.findById(req.user._id);

    // Usuń refresh token
    user.refreshTokens = user.refreshTokens.filter(
      (t) => t.token !== refreshToken
    );

    await user.save();

    // Log wylogowania
    await AuditLog.create({
      userId: user._id,
      action: "USER_LOGOUT",
      details: "User logged out",
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
      severity: "low",
    });

    logger.info(`User logged out: ${user.email}`, { userId: user._id });

    res.json({
      success: true,
      message: "Logged out successfully",
    });
  });

  // Zmiana hasła
  changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    // Sprawdź dane wejściowe
    if (!currentPassword || !newPassword) {
      throw new ValidationError("Current and new password are required");
    }

    const user = await User.findById(req.user._id);

    // Sprawdź aktualne hasło
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      throw new AuthenticationError("Current password is incorrect");
    }

    // Ustaw nowe hasło
    user.password = newPassword;
    user.passwordChangedAt = new Date();

    // Wyloguj ze wszystkich urządzeń
    user.refreshTokens = [];

    await user.save();

    // Log zmiany hasła
    await AuditLog.create({
      userId: user._id,
      action: "PASSWORD_CHANGE",
      details: "User changed password",
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
      severity: "medium",
    });

    logger.info(`Password changed for user: ${user.email}`, {
      userId: user._id,
    });

    res.json({
      success: true,
      message: "Password changed successfully",
    });
  });

  // Żądanie resetowania hasła
  requestPasswordReset = asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email) {
      throw new ValidationError("Email is required");
    }

    const user = await User.findOne({ email });

    // Nie informujemy, czy użytkownik istnieje (security)
    if (!user) {
      return res.json({
        success: true,
        message:
          "If your email is in our system, you will receive a reset link",
      });
    }

    // Generuj token resetowania (ważny przez 1h)
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Hash tokenu
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Zapisz token i czas wygaśnięcia
    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = new Date(Date.now() + 3600000);
    await user.save({ validateBeforeSave: false });

    // TODO: Wysłać email z linkiem resetowania (implementacja w serwisie email)

    // Log żądania resetowania
    await AuditLog.create({
      userId: user._id,
      action: "PASSWORD_RESET_REQUEST",
      details: "Password reset requested",
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
      severity: "medium",
    });

    logger.info(`Password reset requested for: ${user.email}`, {
      userId: user._id,
    });

    res.json({
      success: true,
      message: "If your email is in our system, you will receive a reset link",
    });
  });

  // Helper do generowania tokenów
  _generateTokens(userId) {
    // Access token (krótki czas życia)
    const accessToken = jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: config.auth.accessTokenExpiry,
    });

    // Refresh token (długi czas życia)
    const refreshToken = jwt.sign(
      { userId },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: config.auth.refreshTokenExpiry }
    );

    return {
      accessToken,
      refreshToken,
    };
  }

  async getProfile(req, res) {
    try {
      const user = await User.findById(req.user.id).select("-password");
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (err) {
      console.error("getProfile error:", err);
      res.status(500).json({ error: "Server error" });
    }
  }

  async getVerifiedUser(req, res) {
    try {
      const user = await User.findById(req.user.id).select("-password");
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      if (!user.isVerified) {
        return res.status(403).json({ error: "User is not verified" });
      }
      res.json({
        user: {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          permissions: user.permissions,
        },
      });
    } catch (err) {
      console.error("getVerifiedUser error:", err);
      res.status(500).json({ error: "Server error" });
    }
  }
}

module.exports = new AuthController();
