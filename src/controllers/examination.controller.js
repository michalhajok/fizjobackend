const Examination = require('../models/Examination');
const Patient = require('../models/Patient');
const AuditLog = require('../models/AuditLog');
const { validationResult } = require('express-validator');
const { 
  asyncHandler, 
  ValidationError, 
  ResourceNotFoundError 
} = require('../utils/error-handler');
const logger = require('../utils/logger');

class ExaminationController {
  // Utworzenie nowego badania
  createExamination = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError('Validation error', errors.array());
    }

    const { patient: patientId } = req.body;

    // Sprawdź, czy pacjent istnieje
    const patient = await Patient.findById(patientId);
    if (!patient) {
      throw new ResourceNotFoundError('Patient', patientId);
    }

    const examinationData = {
      ...req.body,
      examiner: req.body.examiner || req.user._id,
      examinationDate: req.body.examinationDate || new Date()
    };

    const examination = new Examination(examinationData);
    await examination.save();

    // Log operacji
    await AuditLog.create({
      userId: req.user._id,
      action: 'CREATE_EXAMINATION',
      resourceType: 'Examination',
      resourceId: examination._id,
      details: `Created examination for patient: ${patient.personalInfo.firstName} ${patient.personalInfo.lastName}`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      severity: 'medium'
    });

    logger.info(`Examination created: ${examination._id}`, {
      userId: req.user._id,
      patientId,
      examinationId: examination._id
    });

    res.status(201).json({
      success: true,
      data: examination
    });
  });

  // Pobranie pojedynczego badania
  getExaminationById = asyncHandler(async (req, res) => {
    const examination = await Examination.findById(req.params.id)
      .populate('patient', 'personalInfo')
      .populate('examiner', 'personalInfo')
      .populate('reviewedBy', 'personalInfo');

    if (!examination) {
      throw new ResourceNotFoundError('Examination', req.params.id);
    }

    // Log operacji
    await AuditLog.create({
      userId: req.user._id,
      action: 'VIEW_EXAMINATION',
      resourceType: 'Examination',
      resourceId: examination._id,
      details: `Viewed examination`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      severity: 'low'
    });

    res.json({
      success: true,
      data: examination
    });
  });

  // Pobranie badań pacjenta
  getPatientExaminations = asyncHandler(async (req, res) => {
    const { patientId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    // Sprawdź, czy pacjent istnieje
    const patient = await Patient.findById(patientId);
    if (!patient) {
      throw new ResourceNotFoundError('Patient', patientId);
    }

    const examinations = await Examination.find({ patient: patientId })
      .populate('examiner', 'personalInfo')
      .populate('reviewedBy', 'personalInfo')
      .sort({ examinationDate: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Examination.countDocuments({ patient: patientId });

    res.json({
      success: true,
      data: examinations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  });

  // Aktualizacja badania
  updateExamination = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError('Validation error', errors.array());
    }

    const examinationId = req.params.id;
    let examination = await Examination.findById(examinationId);

    if (!examination) {
      throw new ResourceNotFoundError('Examination', examinationId);
    }

    // Zakończonego badania nie można edytować
    if (examination.status === 'completed' || examination.status === 'reviewed') {
      throw new ValidationError('Cannot edit a completed examination');
    }

    // Aktualizuj badanie
    const updateData = req.body;

    // Aktualizuj tylko przekazane pola
    for (const [key, value] of Object.entries(updateData)) {
      if (key !== '_id' && key !== 'patient' && key !== 'examiner') {
        examination[key] = value;
      }
    }

    await examination.save();

    // Log operacji
    await AuditLog.create({
      userId: req.user._id,
      action: 'UPDATE_EXAMINATION',
      resourceType: 'Examination',
      resourceId: examination._id,
      details: `Updated examination`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      severity: 'medium'
    });

    logger.info(`Examination updated: ${examination._id}`, {
      userId: req.user._id,
      examinationId: examination._id
    });

    res.json({
      success: true,
      data: examination,
      message: 'Examination updated successfully'
    });
  });

  // Zakończenie badania
  completeExamination = asyncHandler(async (req, res) => {
    const examinationId = req.params.id;
    const examination = await Examination.findById(examinationId);

    if (!examination) {
      throw new ResourceNotFoundError('Examination', examinationId);
    }

    // Nie można zakończyć już zakończonego badania
    if (examination.status === 'completed' || examination.status === 'reviewed') {
      throw new ValidationError('Examination is already completed');
    }

    examination.status = 'completed';
    await examination.save();

    // Log operacji
    await AuditLog.create({
      userId: req.user._id,
      action: 'COMPLETE_EXAMINATION',
      resourceType: 'Examination',
      resourceId: examination._id,
      details: `Completed examination`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      severity: 'medium'
    });

    res.json({
      success: true,
      data: examination,
      message: 'Examination completed successfully'
    });
  });

  // Weryfikacja badania przez innego specjalistę
  reviewExamination = asyncHandler(async (req, res) => {
    const examinationId = req.params.id;
    const examination = await Examination.findById(examinationId);

    if (!examination) {
      throw new ResourceNotFoundError('Examination', examinationId);
    }

    // Weryfikować można tylko zakończone badanie
    if (examination.status !== 'completed') {
      throw new ValidationError('Cannot review an incomplete examination');
    }

    // Nie można weryfikować własnego badania
    if (examination.examiner.toString() === req.user._id.toString()) {
      throw new ValidationError('Cannot review your own examination');
    }

    examination.status = 'reviewed';
    examination.reviewedBy = req.user._id;
    examination.reviewDate = new Date();
    await examination.save();

    // Log operacji
    await AuditLog.create({
      userId: req.user._id,
      action: 'REVIEW_EXAMINATION',
      resourceType: 'Examination',
      resourceId: examination._id,
      details: `Reviewed examination`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      severity: 'medium'
    });

    res.json({
      success: true,
      data: examination,
      message: 'Examination reviewed successfully'
    });
  });
}

module.exports = new ExaminationController();
