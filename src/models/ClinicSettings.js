const mongoose = require("mongoose");

const clinicSettingsSchema = new mongoose.Schema(
  {
    // Informacje podstawowe
    clinicInfo: {
      name: { type: String, required: true },
      description: String,
      logo: String,
      address: {
        street: String,
        city: String,
        postalCode: String,
        country: { type: String, default: "Poland" },
      },
      contact: {
        phone: String,
        email: String,
        website: String,
        fax: String,
      },
      taxInfo: {
        nip: String,
        regon: String,
        krs: String,
      },
    },

    // Godziny pracy
    operatingHours: [
      {
        dayOfWeek: { type: Number, min: 0, max: 6 },
        isOpen: { type: Boolean, default: true },
        openTime: String,
        closeTime: String,
        breakStart: String,
        breakEnd: String,
      },
    ],

    // Ustawienia terminowania
    bookingSettings: {
      allowOnlineBooking: { type: Boolean, default: true },
      maxAdvanceBookingDays: { type: Number, default: 30 },
      minAdvanceBookingHours: { type: Number, default: 2 },
      defaultAppointmentDuration: { type: Number, default: 45 },
      cancellationDeadlineHours: { type: Number, default: 24 },
      noShowPenalty: { type: Number, default: 0 },
      overbookingAllowed: { type: Boolean, default: false },
    },

    // Powiadomienia
    notificationSettings: {
      emailSettings: {
        enabled: { type: Boolean, default: true },
        smtpHost: String,
        smtpPort: Number,
        username: String,
        password: String,
        fromAddress: String,
        fromName: String,
      },
      smsSettings: {
        enabled: { type: Boolean, default: false },
        provider: String,
        apiKey: String,
        fromNumber: String,
      },
      reminderSettings: {
        enabled: { type: Boolean, default: true },
        reminderDaysBefore: [{ type: Number }],
        reminderHoursBefore: [{ type: Number }],
      },
    },

    // Bezpieczeństwo
    securitySettings: {
      passwordPolicy: {
        minLength: { type: Number, default: 8 },
        requireUppercase: { type: Boolean, default: true },
        requireLowercase: { type: Boolean, default: true },
        requireNumbers: { type: Boolean, default: true },
        requireSpecialChars: { type: Boolean, default: true },
        passwordExpireDays: { type: Number, default: 90 },
      },
      sessionSettings: {
        sessionTimeoutMinutes: { type: Number, default: 30 },
        maxConcurrentSessions: { type: Number, default: 3 },
        requireTwoFactor: { type: Boolean, default: false },
      },
      auditSettings: {
        logAllActions: { type: Boolean, default: true },
        logRetentionDays: { type: Number, default: 2555 }, // 7 lat
        sensitiveDataLogging: { type: Boolean, default: false },
      },
    },

    // RODO/GDPR
    gdprSettings: {
      dataRetentionPeriod: { type: Number, default: 2555 }, // dni (7 lat)
      automaticDeletion: { type: Boolean, default: false },
      consentRequired: { type: Boolean, default: true },
      rightToBeForgotten: { type: Boolean, default: true },
      dataPortability: { type: Boolean, default: true },
    },

    // Ustawienia systemowe
    systemSettings: {
      timezone: { type: String, default: "Europe/Warsaw" },
      language: { type: String, default: "pl" },
      dateFormat: { type: String, default: "DD.MM.YYYY" },
      timeFormat: { type: String, default: "24h" },
      maintenanceMode: { type: Boolean, default: false },
      maintenanceMessage: String,
    },

    // Metadane
    lastUpdatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    version: { type: Number, default: 1 },
  },
  {
    timestamps: true,
    collection: "clinic_settings",
  }
);

// Może być tylko jeden dokument z ustawieniami
clinicSettingsSchema.index(
  {},
  { unique: true, partialFilterExpression: { _id: { $exists: true } } }
);

module.exports = mongoose.model("ClinicSettings", clinicSettingsSchema);
