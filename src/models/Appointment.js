const mongoose = require("mongoose");

const interviewSchema = new mongoose.Schema({
  pastIllnesses: String, // Przebyte choroby
  cooccurringDiseases: String, // Choroby współistniejące
  operations: String, // Operacje
  medicines: String, // Leki
  allergies: String, // Alergie
  currentAilments: String, // Aktualne dolegliwości
  earlierTreatment: String, // Wcześniejsze leczenie
  styleLife: String, // Styl życia
  physicalActivity: String, // Aktywność fizyczna
  diet: String, // Dieta
  age: String, // Wiek
  work: String, // Praca
  attachments: [
    {
      url: String,
      filename: String,
      mimetype: String,
      category: {
        type: String,
        enum: ["xray", "mri", "ct", "ultrasound", "photo", "document", "other"],
        default: "document",
      },
      uploadedAt: { type: Date, default: Date.now },
      uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },
  ],
  expectations: String, // Oczekiwania pacjenta
});

const examinationsSchema = new mongoose.Schema({
  examinations: String, // Badanie
  palpation: String, // Palpacja
  rangeOfMotion: [
    {
      joint: String, // Staw
      movement: String, // Ruch
      degrees: Number, // Stopnie
    },
  ],

  muscleStrength: [
    {
      muscle: String, // Mięsień
      grade: String, // Ocena (0-5)
      notes: String,
    },
  ],
  posturalAssessment: String, // Ocena postawy
  gaitAnalysis: String, // Analiza chodu
  specialTests: [
    {
      testName: String,
      result: {
        type: String,
        enum: ["positive", "negative", "inconclusive"],
      },
      notes: String,
    },
  ],
  conclusions: String, // Wnioski
  scales: [], // Skale oceny (VAS, Barthel, WOMAC, Oswestry)
  attachments: [
    {
      url: String,
      filename: String,
      mimetype: String,
      category: {
        type: String,
        enum: ["video", "photo", "document", "other"],
        default: "document",
      },
      uploadedAt: { type: Date, default: Date.now },
      uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },
  ],
});

const planSchema = new mongoose.Schema({
  shortTermGoals: [String], // Cele krótkoterminowe
  longTermGoals: [String], // Cele długoterminowe
  frequency: String, // Częstotliwość
  functionalTechniques: String, // Zaplanowane techniki
  patientEducation: String, // Edukacja pacjenta
  followUpPlan: String, // Plan kontroli
});

const coursechema = new mongoose.Schema({
  activitiesPerformed: String, // Wykonane czynności
  patientResponse: String, // Reakcja pacjenta
  homeExerciseProgram: [
    {
      exercise: String,
      description: String,
      sets: Number,
      reps: Number,
      holdTime: String,
      frequency: String,
      instructions: String,
    },
  ],
  proceduresPerformed: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "Icd9Procedure",
  }, // Wykonane procedury
  comments: String, // Dodatkowe komentarze
});

// Schema dla skal oceny
const assessmentScalesSchema = new mongoose.Schema(
  {
    vas: {
      // Visual Analog Scale
      painAtRest: { type: Number, min: 0, max: 10 },
      painOnMovement: { type: Number, min: 0, max: 10 },
      painWorst24h: { type: Number, min: 0, max: 10 },
    },
    barthel: {
      // Barthel Index
      feeding: { type: Number, min: 0, max: 10 },
      bathing: { type: Number, min: 0, max: 5 },
      grooming: { type: Number, min: 0, max: 5 },
      dressing: { type: Number, min: 0, max: 10 },
      bowels: { type: Number, min: 0, max: 10 },
      bladder: { type: Number, min: 0, max: 10 },
      toilet: { type: Number, min: 0, max: 10 },
      transfers: { type: Number, min: 0, max: 15 },
      mobility: { type: Number, min: 0, max: 15 },
      stairs: { type: Number, min: 0, max: 10 },
      totalScore: { type: Number, min: 0, max: 100 },
    },
    womac: {
      // WOMAC (Western Ontario McMaster)
      pain: { type: Number, min: 0, max: 20 },
      stiffness: { type: Number, min: 0, max: 8 },
      function: { type: Number, min: 0, max: 68 },
      totalScore: { type: Number, min: 0, max: 96 },
    },
    oswestry: {
      // Oswestry Disability Index
      painIntensity: { type: Number, min: 0, max: 5 },
      personalCare: { type: Number, min: 0, max: 5 },
      lifting: { type: Number, min: 0, max: 5 },
      walking: { type: Number, min: 0, max: 5 },
      sitting: { type: Number, min: 0, max: 5 },
      standing: { type: Number, min: 0, max: 5 },
      sleeping: { type: Number, min: 0, max: 5 },
      sexLife: { type: Number, min: 0, max: 5 },
      socialLife: { type: Number, min: 0, max: 5 },
      traveling: { type: Number, min: 0, max: 5 },
      totalScore: { type: Number, min: 0, max: 50 },
      percentage: { type: Number, min: 0, max: 100 },
    },
  },
  { _id: false }
);

// Rozbudowany model Appointment
const appointmentSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Patient",
    required: true,
  },
  physiotherapist: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee",
    required: true,
  },
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Service",
    required: true,
  },

  // Podstawowe informacje o wizycie
  scheduledDateTime: { type: Date, required: true },
  duration: { type: Number, required: true },
  appointmentType: {
    type: String,
    enum: ["scheduled", "walk-in", "urgent", "follow-up", "initial-assessment"],
    default: "scheduled",
  },

  // Rozszerzony workflow statusów
  status: {
    type: String,
    enum: [
      "scheduled",
      "confirmed",
      "checked-in",
      "in-progress",
      "completed",
      "cancelled",
      "no-show",
      "rescheduled",
    ],
    default: "scheduled",
  },

  // Historia statusów
  statusHistory: [
    {
      status: String,
      changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      changedAt: { type: Date, default: Date.now },
      reason: String,
      _id: false,
    },
  ],

  interview: interviewSchema, // Wywiad z pacjentem
  plan: planSchema, // Plan leczenia
  examinations: examinationsSchema, // Badania i oceny
  course: coursechema, // Przebieg leczenia

  // Istniejące pola z poprzedniej implementacji
  diagnoses: [
    {
      code: String,
      description: String,
      isPrimary: { type: Boolean, default: false },
    },
  ],

  // Podpis cyfrowy
  digitalSignature: {
    signedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    signedAt: Date,
    signatureHash: String,
    ipAddress: String,
  },

  // Powiadomienia
  notifications: {
    reminder24h: { sent: { type: Boolean, default: false }, sentAt: Date },
    reminder2h: { sent: { type: Boolean, default: false }, sentAt: Date },
    followUp: { sent: { type: Boolean, default: false }, sentAt: Date },
  },

  // Template używany dla tej wizyty
  template: {
    name: String,
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
    },
  },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Middleware dla aktualizacji statusu
appointmentSchema.pre("save", function (next) {
  this.updatedAt = Date.now();

  // Dodaj do historii statusów jeśli status się zmienił
  if (this.isModified("status") && !this.isNew) {
    this.statusHistory.push({
      status: this.status,
      changedAt: new Date(),
      // changedBy będzie ustawione w kontrolerze
    });
  }

  next();
});

// Indeksy dla wydajności
appointmentSchema.index({ patient: 1, scheduledDateTime: -1 });
appointmentSchema.index({ physiotherapist: 1, scheduledDateTime: 1 });
appointmentSchema.index({ status: 1, scheduledDateTime: 1 });
appointmentSchema.index({ scheduledDateTime: 1 });

module.exports = mongoose.model("Appointment", appointmentSchema);
