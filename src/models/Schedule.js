const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },

  // Szablon harmonogramu
  templateName: String,
  isTemplate: { type: Boolean, default: false },

  // Zakres czasowy
  validFrom: { type: Date, required: true },
  validTo: { type: Date, required: true },

  // Harmonogram tygodniowy
  weeklySchedule: [{
    dayOfWeek: { type: Number, min: 0, max: 6 }, // 0 = niedziela
    shifts: [{
      startTime: { type: String, required: true }, // "08:00"
      endTime: { type: String, required: true },   // "16:00"
      breakStart: String,  // "12:00"
      breakEnd: String,    // "13:00"
      location: String,    // sala/gabinet
      services: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Service' }],
      maxPatients: Number,
      notes: String
    }]
  }],

  // Wyjątki od harmonogramu
  exceptions: [{
    date: Date,
    type: { type: String, enum: ['unavailable', 'custom', 'holiday'] },
    reason: String,
    customShifts: [{
      startTime: String,
      endTime: String,
      services: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Service' }]
    }]
  }],

  // Metadane
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['draft', 'active', 'archived'], default: 'draft' }
}, { timestamps: true });

module.exports = mongoose.model('Schedule', scheduleSchema);
