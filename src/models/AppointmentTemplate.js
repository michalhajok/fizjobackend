// models/AppointmentTemplate.js
const mongoose = require("mongoose");

const templateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: {
    type: String,
    enum: [
      "orthopedic",
      "neurological",
      "pediatric",
      "sports",
      "geriatric",
      "general",
    ],
    required: true,
  },
  description: String,

  // Predefiniowane sekcje SOAP
  soapTemplate: {
    subjectiveQuestions: [String],
    objectiveTests: [String],
    commonDiagnoses: [String],
    typicalInterventions: [String],
  },

  // Skale oceny dla tego typu wizyty
  recommendedScales: [String],

  // Typowe procedury ICD-9
  commonProcedures: [String],

  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("AppointmentTemplate", templateSchema);
