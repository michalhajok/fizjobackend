const mongoose = require("mongoose");

const scheduleSchema = new mongoose.Schema({
  dayOfWeek: { type: Number, min: 0, max: 6 }, // 0 = niedziela, …, 6 = sobota
  startHour: { type: Number, min: 0, max: 23 }, // np. 8
  endHour: { type: Number, min: 0, max: 24 }, // np. 18
});

const employeeSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    personalInfo: {
      firstName: { type: String, required: true },
      lastName: { type: String, required: true },
      dateOfBirth: Date,
      gender: { type: String, enum: ["M", "F", "Other"] },
      address: {
        street: String,
        city: String,
        postalCode: String,
        country: { type: String, default: "Polska" },
      },
      contact: {
        phone: String,
        email: { type: String },
      },
    },

    professionalInfo: {
      position: { type: String },
      specializations: [String],
      licenses: [
        {
          type: String,
          number: String,
          issuedDate: Date,
          expiryDate: Date,
        },
      ],
      education: [
        {
          institution: String,
          degree: String,
          field: String,
          graduationYear: Number,
        },
      ],
      certifications: [
        {
          name: String,
          issuedBy: String,
          issuedDate: Date,
          expiryDate: Date,
        },
      ],
      biography: String,
      yearsOfExperience: Number,
    },

    // employmentInfo: {
    //   employmentDate: Date,
    //   contractType: {
    //     type: String,
    //     enum: ["full-time", "part-time", "contract"],
    //   },
    //   department: String,
    //   supervisor: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
    //   managedServices: [
    //     { type: mongoose.Schema.Types.ObjectId, ref: "Service" },
    //   ],
    // },

    // Metadane
    isActive: { type: Boolean, default: true },
    deactivatedAt: Date,
    deactivatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    deactivationReason: String,

    // Dodatkowe dokumenty
    documents: [{ type: mongoose.Schema.Types.ObjectId, ref: "Document" }],
    schedule: {
      type: [scheduleSchema],
      default: function () {
        // Domyślny harmonogram: pon-pt 8:00-16:00
        return [
          { dayOfWeek: 1, startHour: 8, endHour: 16 },
          { dayOfWeek: 2, startHour: 8, endHour: 16 },
          { dayOfWeek: 3, startHour: 8, endHour: 16 },
          { dayOfWeek: 4, startHour: 8, endHour: 16 },
          { dayOfWeek: 5, startHour: 8, endHour: 16 },
          { dayOfWeek: 6, startHour: 0, endHour: 0 },
          { dayOfWeek: 0, startHour: 0, endHour: 0 },
        ];
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indeksy
employeeSchema.index({
  "personalInfo.lastName": 1,
  "personalInfo.firstName": 1,
});
employeeSchema.index({ "professionalInfo.position": 1 });
employeeSchema.index({ "professionalInfo.specializations": 1 });

module.exports = mongoose.model("Employee", employeeSchema);
