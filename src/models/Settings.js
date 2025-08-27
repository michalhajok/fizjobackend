const mongoose = require("mongoose");

const SettingsSchema = new mongoose.Schema({
  clinicName: { type: String, required: true },
  address: { type: String },
  phone: { type: String },
  email: { type: String },
  openingHours: { type: String },
  logoUrl: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

SettingsSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Settings", SettingsSchema);
