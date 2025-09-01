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
