const mongoose = require("mongoose");

const ICFItemSchema = new mongoose.Schema({
  code: { type: String, required: true },
  qualifier: { type: String, required: true, default: "0" },
  notes: { type: String, default: "" },
});

const ICFAssessmentSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Patient",
    required: true,
    index: true,
  },
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Appointment",
    required: true,
    index: true,
  },
  assessorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  coreSet: {
    type: String,
    enum: [
      "lowBackPain",
      "stroke",
      "rheumatoidArthritis",
      "shoulderPain",
      "custom",
    ],
    default: "custom",
  },
  body_functions: { type: Map, of: ICFItemSchema, default: new Map() },
  body_structures: { type: Map, of: ICFItemSchema, default: new Map() },
  activities_participation: {
    type: Map,
    of: ICFItemSchema,
    default: new Map(),
  },
  environmental_factors: { type: Map, of: ICFItemSchema, default: new Map() },

  assessmentDate: { type: Date, default: Date.now, required: true },
  additionalNotes: { type: String, default: "" },

  status: {
    type: String,
    enum: ["draft", "completed", "reviewed", "archived"],
    default: "draft",
  },
  version: { type: Number, default: 1 },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: { type: Date, default: Date.now },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  updatedAt: { type: Date, default: Date.now },
});

// Indexes
ICFAssessmentSchema.index({ patientId: 1, createdAt: -1 });
ICFAssessmentSchema.index({ appointmentId: 1 });
ICFAssessmentSchema.index({ assessorId: 1, createdAt: -1 });

// Methods
ICFAssessmentSchema.methods.calculateSummary = function () {
  const summary = {
    totalCategories: 0,
    problemCategories: 0,
    barrierFactors: 0,
    facilitatorFactors: 0,
  };
  ["body_functions", "body_structures", "activities_participation"].forEach(
    (key) => {
      for (const item of this[key].values()) {
        summary.totalCategories++;
        if (parseInt(item.qualifier) >= 2) summary.problemCategories++;
      }
    }
  );
  for (const item of this.environmental_factors.values()) {
    summary.totalCategories++;
    if (item.qualifier.startsWith("-")) summary.barrierFactors++;
    if (item.qualifier.startsWith("+")) summary.facilitatorFactors++;
  }
  return summary;
};

ICFAssessmentSchema.methods.generateReport = function () {
  const summary = this.calculateSummary();
  return {
    patientId: this.patientId,
    appointmentId: this.appointmentId,
    assessmentDate: this.assessmentDate,
    coreSet: this.coreSet,
    summary,
    recommendations: [
      summary.problemCategories > 0 &&
        `Zidentyfikowano ${summary.problemCategories} problemów`,
      summary.barrierFactors > 0 &&
        `Występuje ${summary.barrierFactors} barier`,
      summary.facilitatorFactors > 0 &&
        `Dostępne ${summary.facilitatorFactors} ułatwień`,
    ].filter(Boolean),
  };
};

// Pre-save update timestamp
ICFAssessmentSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model("ICFAssessment", ICFAssessmentSchema);
