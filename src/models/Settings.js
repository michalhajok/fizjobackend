const mongoose = require("mongoose");

const SettingsSchema = new mongoose.Schema({
  clinicName: { type: String, required: true },
  address: { type: String },
  phone: { type: String },
  email: { type: String },
  openingHours: { type: String },
  logoUrl: { type: String },
  sessionTimeout: { type: Number, default: 30 }, // in minutes
  loginAttemptsLimit: { type: Number, default: 5 },
  passwordExpiryDays: { type: Number, default: 90 },
  dataRetentionYears: { type: Number, default: 7 },
  anonymizeAfterDays: { type: Number, default: 365 },
  autoBackup: { type: Boolean, default: true },
  backupRetentionDays: { type: Number, default: 30 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

SettingsSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Settings", SettingsSchema);
