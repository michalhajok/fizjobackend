const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,

  type: {
    type: String,
    required: true,
    enum: [
      'medical_record',
      'examination_result',
      'treatment_plan',
      'consent_form',
      'invoice',
      'report',
      'image',
      'scan',
      'referral',
      'prescription',
      'insurance_form',
      'other'
    ]
  },

  // Plik
  file: {
    originalName: String,
    filename: String,
    path: String,
    mimetype: String,
    size: Number,
    checksum: String
  },

  // Powiązania
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' },
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  visit: { type: mongoose.Schema.Types.ObjectId, ref: 'Visit' },
  examination: { type: mongoose.Schema.Types.ObjectId, ref: 'Examination' },

  // Metadane
  tags: [String],
  isConfidential: { type: Boolean, default: true },
  accessLevel: {
    type: String,
    enum: ['public', 'internal', 'confidential', 'restricted'],
    default: 'confidential'
  },

  // GDPR
  retentionPeriod: Number, // w dniach
  scheduledDeletion: Date,

  // Workflow
  status: {
    type: String,
    enum: ['draft', 'pending_review', 'approved', 'rejected', 'archived'],
    default: 'draft'
  },

  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt: Date,

  version: { type: Number, default: 1 },
  previousVersion: { type: mongoose.Schema.Types.ObjectId, ref: 'Document' },

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { 
  timestamps: true,
  toJSON: { virtuals: true }
});

// Indeksy
documentSchema.index({ patient: 1, type: 1 });
documentSchema.index({ createdAt: -1 });
documentSchema.index({ tags: 1 });

module.exports = mongoose.model('Document', documentSchema);
