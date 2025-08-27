module.exports = {
  // Limiters
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minut
    max: 100, // limit 100 zapytań na okno czasowe
  },

  // Pliki
  upload: {
    maxFileSize: process.env.MAX_FILE_SIZE || 10485760, // 10MB
    allowedMimeTypes: [
      "image/jpeg",
      "image/png",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
  },

  // Authentication
  auth: {
    accessTokenExpiry: "60m",
    refreshTokenExpiry: "7d",
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12,
  },

  // Emails
  email: {
    from: `"Placówka Fizjoterapeutyczna" <${process.env.EMAIL_USER}>`,
    templates: {
      welcome: "welcome",
      appointmentReminder: "appointment-reminder",
      appointmentConfirmation: "appointment-confirmation",
      passwordReset: "password-reset",
    },
  },
};
