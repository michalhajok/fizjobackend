const mongoose = require("mongoose");

const visitSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },
    physiotherapist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    visitDate: {
      type: Date,
      required: true,
      default: Date.now,
    },

    duration: {
      type: Number, // w minutach
      required: true,
      min: 15,
      max: 180,
    },

    visitType: {
      type: String,
      enum: [
        "Konsultacja wstępna",
        "Terapia manualna",
        "Ćwiczenia terapeutyczne",
        "Fizjoterapia",
        "Masaż leczniczy",
        "Elektroterapia",
        "Kontrola",
      ],
      required: true,
    },

    status: {
      type: String,
      enum: ["Zaplanowana", "W trakcie", "Zakończona", "Anulowana"],
      default: "Zaplanowana",
    },

    // Dokumentacja SOAP
    soapNotes: {
      subjective: {
        chiefComplaint: String,
        painLevel: { type: Number, min: 0, max: 10 },
        functionalLimitations: String,
      },
      objective: {
        observations: String,
        measurements: [
          {
            parameter: String,
            value: String,
            unit: String,
          },
        ],
      },
      assessment: {
        clinicalImpression: String,
        progressNotes: String,
      },
      plan: {
        interventions: [String],
        homeExercises: [String],
        nextAppointment: String,
      },
    },

    // Rozliczenie
    billing: {
      cost: { type: Number, required: true },
      paymentStatus: {
        type: String,
        enum: ["Nieopłacone", "Opłacone", "Częściowo opłacone"],
        default: "Nieopłacone",
      },
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indeksy
visitSchema.index({ patient: 1, visitDate: -1 });
visitSchema.index({ physiotherapist: 1, visitDate: -1 });

module.exports = mongoose.model("Visit", visitSchema);
