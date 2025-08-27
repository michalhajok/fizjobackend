const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema(
  {
    // Podstawowe informacje
    firstName: {
      type: String,
      required: [true, "Imię jest wymagane"],
      trim: true,
      maxlength: [50, "Imię nie może być dłuższe niż 50 znaków"],
    },
    lastName: {
      type: String,
      required: [true, "Nazwisko jest wymagane"],
      trim: true,
      maxlength: [50, "Nazwisko nie może być dłuższe niż 50 znaków"],
    },
    email: {
      type: String,
      required: [true, "Email jest wymagany"],
      unique: true,
      lowercase: true,
      validate: {
        validator: function (v) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: "Nieprawidłowy adres email",
      },
    },
    password: {
      type: String,
      required: [true, "Hasło jest wymagane"],
      minlength: [8, "Hasło musi mieć co najmniej 8 znaków"],
      validate: {
        validator: function (v) {
          return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(
            v
          );
        },
        message:
          "Hasło musi zawierać małe i duże litery, cyfry oraz znaki specjalne",
      },
    },

    // Rola i uprawnienia
    role: {
      type: String,
      enum: {
        values: [
          "admin",
          "manager",
          "physiotherapist",
          "receptionist",
          "assistant",
        ],
        message: "Nieprawidłowa rola użytkownika",
      },
      default: "assistant",
    },
    permissions: [
      {
        type: String,
        enum: [
          "patients:read",
          "patients:write",
          "patients:delete",
          "employees:read",
          "employees:write",
          "employees:delete",
          "visits:read",
          "visits:write",
          "visits:delete",
          "examinations:read",
          "examinations:write",
          "examinations:delete",
          "appointments:read",
          "appointments:write",
          "appointments:delete",
          "schedules:read",
          "schedules:write",
          "schedules:delete",
          "reports:read",
          "reports:write",
          "settings:read",
          "settings:write",
          "admin:read",
          "admin:write",
          "admin:delete",
          "logs:read",
          "admin:all",
        ],
      },
    ],

    // Status konta
    isActive: {
      type: Boolean,
      default: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    lastLogin: {
      type: Date,
    },

    // Bezpieczeństwo
    refreshTokens: [
      {
        token: String,
        createdAt: {
          type: Date,
          default: Date.now,
          expires: "7d", // Automatyczne usuwanie po 7 dniach
        },
      },
      { _id: false },
    ],
    loginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: Date,

    // Ustawienia użytkownika
    settings: {
      language: {
        type: String,
        enum: ["pl", "en"],
        default: "pl",
      },
      notifications: {
        email: {
          type: Boolean,
          default: true,
        },
        push: {
          type: Boolean,
          default: true,
        },
        sms: {
          type: Boolean,
          default: false,
        },
      },
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        delete ret.password;
        delete ret.refreshTokens;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Middleware pre-save
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    this.password = await bcrypt.hash(this.password, saltRounds);
    next();
  } catch (error) {
    next(error);
  }
});

// Metody instancji
userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error("Błąd porównania hasła");
  }
};

userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      userId: this._id,
      email: this.email,
      role: this.role,
      permissions: this.permissions,
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "15m" }
  );
};

userSchema.methods.hasPermission = function (permission) {
  return (
    this.permissions.includes(permission) ||
    this.permissions.includes("admin:all")
  );
};

module.exports = mongoose.model("User", userSchema);
