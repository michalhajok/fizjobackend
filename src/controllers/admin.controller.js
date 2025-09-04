const crypto = require("crypto");
const { sendEmail } = require("../services/email.service");

const User = require("../models/User");
const Employee = require("../models/Employee");
const Settings = require("../models/Settings");
const AuditLog = require("../models/AuditLog");

// Pobierz listę użytkowników
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password -refreshTokens");

    res.json({ success: true, data: users });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Błąd pobierania użytkowników" });
  }
};

// Utwórz nowego użytkownika
exports.createUser = async (req, res) => {
  try {
    let savedUser = null;

    const user = new User(req.body);
    savedUser = await user.save();

    const employeeData = {
      user: savedUser._id,
      personalInfo: {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        contact: {
          email: req.body.email,
        },
      },
      professionalInfo: {
        position: req.body.role,
      },
    };

    const employee = new Employee(employeeData);
    await employee.save();

    res.status(201).json({ success: true, data: user, employee: employee });
  } catch (error) {
    console.log("Error creating user:", error);

    res.status(400).json({
      success: false,
      message: "Błąd tworzenia użytkownika",
      error: error.message,
    });
  }
};

// Edytuj użytkownika
exports.updateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).select("-password -refreshTokens");
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "Nie znaleziono użytkownika" });
    }
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Błąd edycji użytkownika",
      error: error.message,
    });
  }
};

exports.updateUserPermissions = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "Nie znaleziono użytkownika" });
    }
    user.permissions = req.body.permissions;
    await user.save();
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Błąd edycji uprawnień użytkownika",
      error: error.message,
    });
  }
};

exports.updateUserRole = (req, res) => {
  try {
    const user = User.findById(req.params.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "Nie znaleziono użytkownika" });
    }
    user.role = req.body.role;
    user.save();
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Błąd edycji roli użytkownika",
      error: error.message,
    });
  }
};

// Usuń użytkownika
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "Nie znaleziono użytkownika" });
    }
    res.json({ success: true, message: "Użytkownik usunięty" });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Błąd usuwania użytkownika" });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select(
      "-password -refreshTokens"
    );
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "Nie znaleziono użytkownika" });
    }
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Błąd pobierania użytkownika",
      error: error.message,
    });
  }
};

// Pobierz ustawienia globalne
exports.getGlobalSettings = async (req, res) => {
  try {
    const settings = await Settings.findOne();
    if (!settings) {
      return res.status(404).json({
        success: false,
        message: "Ustawienia globalne nie zostały znalezione",
      });
    }
    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Błąd pobierania ustawień globalnych",
      error: error.message,
    });
  }
};
// Edytuj ustawienia globalne
exports.updateGlobalSettings = async (req, res) => {
  try {
    const settings = await Settings.findOneAndUpdate({}, req.body, {
      new: true,
      runValidators: true,
    });
    if (!settings) {
      return res.status(404).json({
        success: false,
        message: "Ustawienia globalne nie zostały znalezione",
      });
    }
    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Błąd edycji ustawień globalnych",
      error: error.message,
    });
  }
};

exports.getAuditLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find()
      .populate({
        path: "userId",
        model: "User",
        select: "firstName lastName",
        strictPopulate: false,
      })
      .sort({ timestamp: -1 });
    res.json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Błąd pobierania logów audytu",
      error: error.message,
    });
  }
};

// Generowanie linku resetowania hasła przez admina
exports.generateResetLink = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("Generating reset link for user ID:", req.params);

    // Sprawdź czy użytkownik istnieje
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Użytkownik nie został znaleziony",
      });
    }

    // Generuj bezpieczny token resetowania
    const resetToken = crypto.randomBytes(32).toString("hex");
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 godziny

    console.log("Generated reset token:", resetToken);

    // Zapisz token w bazie danych
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = tokenExpiry;
    await user.save();

    // // Log audytu
    await AuditLog.create({
      userId: req.user._id,
      action: "GENERATE_RESET_LINK",
      resourceType: "User",
      resourceId: user._id,
      details: `Generated password reset link for user ${user.email}`,
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
    });

    res.json({
      success: true,
      message: "Link resetowania hasła został wygenerowany",
      data: {
        token: resetToken,
        expiresAt: tokenExpiry,
        userId: user._id,
        userEmail: user.email,
        resetUrl: `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`,
      },
    });
  } catch (error) {
    console.error("Error generating reset link:", error);
    res.status(500).json({
      success: false,
      message: "Błąd serwera podczas generowania linku resetowania",
    });
  }
};

// Wysyłanie emaila z linkiem resetowania przez admina
exports.sendResetEmail = async (req, res) => {
  try {
    const { id: userId } = req.params;
    const { customMessage, expiresIn } = req.body;

    // Sprawdź czy użytkownik istnieje
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Użytkownik nie został znaleziony",
      });
    }

    // Sprawdź czy użytkownik ma adres email
    if (!user.email) {
      return res.status(400).json({
        success: false,
        message: "Użytkownik nie ma przypisanego adresu email",
      });
    }

    // Generuj token resetowania
    const resetToken = crypto.randomBytes(32).toString("hex");
    const expireTime = expiresIn || 24; // domyślnie 24 godziny
    const tokenExpiry = new Date(Date.now() + expireTime * 60 * 60 * 1000);

    // Zapisz token w bazie danych
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = tokenExpiry;
    await user.save();

    // Przygotuj link resetowania
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    // Pobierz dane admina wysyłającego
    const adminUser = await User.findById(req.user._id);

    // Wyślij email
    try {
      await sendEmail({
        to: user.email,
        subject: "Ustawienie hasła w systemie FizjoCare",
        template: "admin-password-reset",
        data: {
          userFirstName: user.firstName,
          userLastName: user.lastName,
          adminName: `${adminUser.firstName} ${adminUser.lastName}`,
          resetUrl: resetUrl,
          customMessage:
            customMessage ||
            `Administrator wygenerował dla Ciebie link do ustawienia hasła w systemie FizjoCare.`,
          expiresIn: expireTime,
          expiresAt: tokenExpiry.toLocaleString("pl-PL"),
          supportEmail: process.env.SUPPORT_EMAIL || "support@fizjocare.pl",
          companyName: "FizjoCare",
        },
      });

      // Log audytu
      await AuditLog.create({
        userId: req.user._id,
        action: "SEND_RESET_EMAIL",
        resourceType: "User",
        resourceId: user._id,
        details: `Sent password reset email to ${user.email}`,
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });

      res.json({
        success: true,
        message: `Email z linkiem resetowania został wysłany do ${user.email}`,
        data: {
          sentTo: user.email,
          expiresAt: tokenExpiry,
          tokenId: resetToken.substring(0, 8) + "...", // Pokaż tylko początek tokenu
        },
      });
    } catch (emailError) {
      console.error("Error sending reset email:", emailError);

      // Usuń token jeśli email się nie wysłał
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();

      return res.status(500).json({
        success: false,
        message: "Błąd podczas wysyłania emaila. Spróbuj ponownie.",
      });
    }
  } catch (error) {
    console.error("Error sending reset email:", error);
    res.status(500).json({
      success: false,
      message: "Błąd serwera podczas wysyłania emaila",
    });
  }
};

// Pobierz listę aktywnych tokenów resetowania (dla admina)
exports.getActiveResetTokens = async (req, res) => {
  try {
    const activeTokens = await User.find({
      resetPasswordToken: { $exists: true },
      resetPasswordExpires: { $gt: new Date() },
    }).select("firstName lastName email resetPasswordExpires createdAt");

    res.json({
      success: true,
      data: {
        tokens: activeTokens,
        count: activeTokens.length,
      },
    });
  } catch (error) {
    console.error("Error fetching active reset tokens:", error);
    res.status(500).json({
      success: false,
      message: "Błąd podczas pobierania aktywnych tokenów",
    });
  }
};

// Anulowanie tokenu resetowania (dla admina)
exports.revokeResetToken = async (req, res) => {
  try {
    const { id: userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Użytkownik nie został znaleziony",
      });
    }

    // Sprawdź czy użytkownik ma aktywny token
    if (!user.resetPasswordToken) {
      return res.status(400).json({
        success: false,
        message: "Użytkownik nie ma aktywnego tokenu resetowania",
      });
    }

    // Usuń token
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    // Log audytu
    await AuditLog.create({
      userId: req.user._id,
      action: "REVOKE_RESET_TOKEN",
      resourceType: "User",
      resourceId: user._id,
      details: `Revoked password reset token for user ${user.email}`,
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
    });

    res.json({
      success: true,
      message: `Token resetowania dla użytkownika ${user.email} został anulowany`,
    });
  } catch (error) {
    console.error("Error revoking reset token:", error);
    res.status(500).json({
      success: false,
      message: "Błąd podczas anulowania tokenu",
    });
  }
};
