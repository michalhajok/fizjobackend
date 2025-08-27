const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  type: { 
    type: String, 
    required: true,
    enum: [
      'appointment_reminder',
      'appointment_confirmed',
      'appointment_cancelled',
      'visit_completed',
      'payment_due',
      'system_maintenance',
      'security_alert',
      'document_ready',
      'schedule_change'
    ]
  },

  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  title: { type: String, required: true },
  message: { type: String, required: true },

  channels: [{
    type: String,
    enum: ['push', 'email', 'sms', 'in-app']
  }],

  status: {
    type: String,
    enum: ['pending', 'sent', 'delivered', 'failed', 'read'],
    default: 'pending'
  },

  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },

  scheduledFor: Date,
  sentAt: Date,
  readAt: Date,

  metadata: mongoose.Schema.Types.Mixed,

  // Retry mechanism
  retryCount: { type: Number, default: 0 },
  maxRetries: { type: Number, default: 3 },

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { 
  timestamps: true 
});

// Indeksy
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ status: 1, scheduledFor: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
