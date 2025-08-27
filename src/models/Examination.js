const mongoose = require('mongoose');

const examinationSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  examiner: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },

  subjectiveAssessment: {
    chiefComplaint: String,
    painScale: { type: Number, min: 0, max: 10 },
    painDescription: String,
    functionalLimitations: [String],
    patientGoals: [String],
    previousTreatments: String
  },

  objectiveAssessment: {
    posturalAnalysis: {
      anteriorView: String,
      lateralView: String,
      posteriorView: String
    },
    rangeOfMotion: [{
      joint: String,
      movement: String,
      activeROM: Number,
      passiveROM: Number,
      notes: String
    }],
    muscleStrength: [{
      muscle: String,
      grade: String, // Manual Muscle Testing scale
      notes: String
    }],
    specialTests: [{
      testName: String,
      result: String,
      significance: String
    }],
    neurologicalTests: {
      reflexes: String,
      sensation: String,
      coordination: String
    }
  },

  assessment: {
    primaryDiagnosis: String,
    secondaryDiagnoses: [String],
    prognosticFactors: [String],
    rehabilitationPotential: String
  },

  treatmentPlan: {
    shortTermGoals: [{
      goal: String,
      timeframe: String,
      measurable: String
    }],
    longTermGoals: [{
      goal: String,
      timeframe: String,
      measurable: String
    }],
    interventions: [String],
    frequency: String,
    duration: String,
    homeExerciseProgram: [String]
  },

  attachments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Document' }],

  // Metadane
  examinationDate: { type: Date, default: Date.now },
  status: { type: String, enum: ['draft', 'completed', 'reviewed'], default: 'draft' },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  reviewDate: Date
}, { timestamps: true });

module.exports = mongoose.model('Examination', examinationSchema);
