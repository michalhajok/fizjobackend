const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: String,
    category: { type: String, required: true },

    // Szczegóły usługi
    duration: { type: Number, required: true }, // w minutach

    // Metadane
    isActive: { type: Boolean, default: true },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Ustawienia terminowania
    bookingSettings: {
      advanceBookingDays: { type: Number, default: 30 },
      cancellationDeadlineHours: { type: Number, default: 24 },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

// Indeksy
serviceSchema.index({ name: 1 });
serviceSchema.index({ category: 1 });

module.exports = mongoose.model("Service", serviceSchema);
