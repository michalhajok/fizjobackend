const mongoose = require("mongoose");

const patientSchema = new mongoose.Schema(
  {
    // Informacje osobowe
    personalInfo: {
      firstName: {
        type: String,
        required: [true, "Imię jest wymagane"],
        trim: true,
        maxlength: [50, "Imię nie może być dłuższe niż 50 znaków"],
      },
      lastName: {
        type: String,
        required: [true, "Nazwisko jest wymagane"],
        trim: true,
        maxlength: [50, "Nazwisko nie może być dłuższe niż 50 znaków"],
      },
      pesel: {
        type: String,
        required: [true, "PESEL jest wymagany"],
        unique: true,
        validate: {
          validator: function (v) {
            return /^\d{11}$/.test(v);
          },
          message: "PESEL musi składać się z 11 cyfr",
        },
      },
      dateOfBirth: {
        type: Date,
        required: [true, "Data urodzenia jest wymagana"],
      },
      gender: {
        type: String,
        enum: ["M", "F", "Other"],
        required: [true, "Płeć jest wymagana"],
      },
      contact: {
        phone: {
          type: String,
          required: [true, "Numer telefonu jest wymagany"],
        },
        email: {
          type: String,
          required: [true, "Email jest wymagany"],
          lowercase: true,
        },
      },
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
    },

    // Informacje medyczne
    medicalInfo: {
      allergies: [String],
      medications: [
        {
          name: String,
          dosage: String,
          frequency: String,
        },
      ],
      chronicConditions: [String],
      medicalHistory: [String],
      specialNotes: String,
    },

    // Metadane
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isActive: { type: Boolean, default: true },
    consentGiven: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        delete ret.__v;
        delete ret.personalInfo.pesel; // Ukryj PESEL w JSON response
        return ret;
      },
    },
  }
);

// Indeksy
patientSchema.index({
  "personalInfo.lastName": 1,
  "personalInfo.firstName": 1,
});
patientSchema.index({ "personalInfo.pesel": 1 });

// Wirtualne pola
patientSchema.virtual("fullName").get(function () {
  return `${this.personalInfo.firstName} ${this.personalInfo.lastName}`;
});

// Metody instancji
patientSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.personalInfo.pesel;
  return obj;
};

module.exports = mongoose.model("Patient", patientSchema);
