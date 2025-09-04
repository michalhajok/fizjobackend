const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },

    action: {
      type: String,
      required: true,
      enum: [
        "USER_LOGIN",
        "CREATE_PATIENT",
        "UPDATE_PATIENT",
        "DELETE_PATIENT",
        "VIEW_PATIENT",
        "LOGIN",
        "UPLOAD_ATTACHMENT",
        "DELETE_ATTACHMENT",
        "LOGOUT",
        "FAILED_LOGIN",
        "CREATE_VISIT",
        "UPDATE_VISIT",
        "DELETE_VISIT",
        "GENERATE_RESET_LINK",
        "SEND_RESET_EMAIL",
        "VALIDATE_RESET_TOKEN",
        "RESET_PASSWORD",
        "REVOKE_RESET_TOKEN",
        "CREATE_APPOINTMENT",
        "UPDATE_APPOINTMENT",
        "UPDATE_APPOINTMENT_STATUS",
        "UPDATE_SOAP_NOTES",
        "SIGN_APPOINTMENT",
        "APPLY_TEMPLATE",
        "GET_TEMPLATES",
        "GET_AUDIT_LOGS",
        "UPLOAD_ATTACHMENT",
        "DELETE_ATTACHMENT",
        "ADD_EXAMINATION",
        "ADD_DIAGNOSIS",
        "ADD_NOTE",
        "ADD_PRESCRIPTION",
        "ADD_SERVICE",
        "UPDATE_SERVICE",
        "DELETE_SERVICE",
        "ADD_ICD9_PROCEDURE",
        "UPDATE_ICD9_PROCEDURE",
        "DELETE_ICD9_PROCEDURE",
        "GET_ICD9_PROCEDURES",
        "CANCEL_APPOINTMENT",
        "GENERATE_REPORT",
        "EXPORT_DATA",
        "PERMISSION_DENIED",
        "UNAUTHORIZED_ACCESS",
        "CREATE_SERVICE",
        "UPDATE_SERVICE",
        "DELETE_SERVICE",
      ],
    },

    resourceType: {
      type: String,
      enum: ["Patient", "User", "Visit", "Appointment", "Report", "Service"],
    },

    resourceId: mongoose.Schema.Types.ObjectId,
    details: { type: String, required: true },

    // Informacje techniczne
    ipAddress: String,
    userAgent: String,
    timestamp: { type: Date, default: Date.now },

    // Poziom ważności
    severity: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },

    // Metadane
    metadata: mongoose.Schema.Types.Mixed,

    // GDPR
    gdprRelevant: { type: Boolean, default: false },
    retentionUntil: {
      type: Date,
      default: function () {
        const date = new Date();
        date.setFullYear(date.getFullYear() + 7);
        return date;
      },
    },
  },
  {
    timestamps: false,
    collection: "audit_logs",
  }
);

// Indeksy
auditLogSchema.index({ userId: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ severity: 1, timestamp: -1 });
auditLogSchema.index({ retentionUntil: 1 }, { expireAfterSeconds: 0 });

// Metody statyczne
auditLogSchema.statics.createEntry = async function (data) {
  try {
    const entry = new this(data);
    await entry.save();
    return entry;
  } catch (error) {
    console.error("Failed to create audit log entry:", error);
    throw error;
  }
};

module.exports = mongoose.model("AuditLog", auditLogSchema);
