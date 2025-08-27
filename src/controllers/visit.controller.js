const Visit = require('../models/Visit');
const Patient = require('../models/Patient');
const Employee = require('../models/Employee');
const Appointment = require('../models/Appointment');
const AuditLog = require('../models/AuditLog');
const { validationResult } = require('express-validator');
const { 
  asyncHandler, 
  ValidationError, 
  ResourceNotFoundError 
} = require('../utils/error-handler');
const logger = require('../utils/logger');

class VisitController {
  // Utworzenie nowej wizyty
  createVisit = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError('Validation error', errors.array());
    }

    const { patient: patientId, employee: employeeId, appointment: appointmentId } = req.body;

    // Sprawdź, czy pacjent istnieje
    const patient = await Patient.findById(patientId);
    if (!patient) {
      throw new ResourceNotFoundError('Patient', patientId);
    }

    // Sprawdź, czy pracownik istnieje
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      throw new ResourceNotFoundError('Employee', employeeId);
    }

    // Jeśli podano ID terminu, sprawdź czy istnieje
    if (appointmentId) {
      const appointment = await Appointment.findById(appointmentId);
      if (!appointment) {
        throw new ResourceNotFoundError('Appointment', appointmentId);
      }

      // Aktualizuj status terminu
      appointment.status = 'in-progress';
      await appointment.save();
    }

    const visitData = {
      ...req.body,
      visitDate: req.body.visitDate || new Date(),
      status: 'in-progress'
    };

    const visit = new Visit(visitData);
    await visit.save();

    // Dodaj wizytę do pacjenta
    patient.visits.push(visit._id);
    await patient.save();

    // Log operacji
    await AuditLog.create({
      userId: req.user._id,
      action: 'CREATE_VISIT',
      resourceType: 'Visit',
      resourceId: visit._id,
      details: `Created visit for patient: ${patient.personalInfo.firstName} ${patient.personalInfo.lastName}`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      severity: 'medium'
    });

    logger.info(`Visit created: ${visit._id}`, {
      userId: req.user._id,
      patientId,
      visitId: visit._id
    });

    res.status(201).json({
      success: true,
      data: visit
    });
  });

  // Pobranie pojedynczej wizyty
  getVisitById = asyncHandler(async (req, res) => {
    const visit = await Visit.findById(req.params.id)
      .populate('patient', 'personalInfo')
      .populate('employee', 'personalInfo')
      .populate('services.service');

    if (!visit) {
      throw new ResourceNotFoundError('Visit', req.params.id);
    }

    // Log operacji
    await AuditLog.create({
      userId: req.user._id,
      action: 'VIEW_VISIT',
      resourceType: 'Visit',
      resourceId: visit._id,
      details: `Viewed visit`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      severity: 'low'
    });

    res.json({
      success: true,
      data: visit
    });
  });

  // Pobranie wizyt pacjenta
  getPatientVisits = asyncHandler(async (req, res) => {
    const { patientId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    // Sprawdź, czy pacjent istnieje
    const patient = await Patient.findById(patientId);
    if (!patient) {
      throw new ResourceNotFoundError('Patient', patientId);
    }

    const visits = await Visit.find({ patient: patientId })
      .populate('employee', 'personalInfo professionalInfo.position')
      .populate('services.service', 'name')
      .sort({ visitDate: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Visit.countDocuments({ patient: patientId });

    res.json({
      success: true,
      data: visits,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  });

  // Pobranie wizyt pracownika
  getEmployeeVisits = asyncHandler(async (req, res) => {
    const { employeeId } = req.params;
    const { page = 1, limit = 20, date } = req.query;

    // Sprawdź, czy pracownik istnieje
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      throw new ResourceNotFoundError('Employee', employeeId);
    }

    const query = { employee: employeeId };

    // Filtrowanie po dacie
    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);

      query.visitDate = {
        $gte: startDate,
        $lte: endDate
      };
    }

    const visits = await Visit.find(query)
      .populate('patient', 'personalInfo')
      .populate('services.service', 'name duration')
      .sort({ visitDate: 1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Visit.countDocuments(query);

    res.json({
      success: true,
      data: visits,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  });

  // Aktualizacja wizyty
  updateVisit = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError('Validation error', errors.array());
    }

    const visitId = req.params.id;
    let visit = await Visit.findById(visitId);

    if (!visit) {
      throw new ResourceNotFoundError('Visit', visitId);
    }

    // Zakończonej wizyty nie można edytować
    if (visit.status === 'completed' || visit.status === 'cancelled') {
      throw new ValidationError('Cannot edit a completed or cancelled visit');
    }

    // Aktualizuj wizytę
    const updateData = req.body;

    // Nie pozwalamy na zmianę pacjenta i pracownika
    delete updateData.patient;
    delete updateData.employee;

    // Aktualizuj tylko przekazane pola
    for (const [key, value] of Object.entries(updateData)) {
      if (key !== '_id') {
        visit[key] = value;
      }
    }

    await visit.save();

    // Log operacji
    await AuditLog.create({
      userId: req.user._id,
      action: 'UPDATE_VISIT',
      resourceType: 'Visit',
      resourceId: visit._id,
      details: `Updated visit`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      severity: 'medium'
    });

    logger.info(`Visit updated: ${visit._id}`, {
      userId: req.user._id,
      visitId: visit._id
    });

    res.json({
      success: true,
      data: visit,
      message: 'Visit updated successfully'
    });
  });

  // Zakończenie wizyty
  completeVisit = asyncHandler(async (req, res) => {
    const visitId = req.params.id;
    const visit = await Visit.findById(visitId)
      .populate('appointment');

    if (!visit) {
      throw new ResourceNotFoundError('Visit', visitId);
    }

    // Nie można zakończyć już zakończonej wizyty
    if (visit.status === 'completed') {
      throw new ValidationError('Visit is already completed');
    }

    visit.status = 'completed';

    // Opcjonalne dane zakończenia wizyty
    if (req.body.treatmentNotes) {
      visit.treatmentNotes = {
        ...visit.treatmentNotes,
        ...req.body.treatmentNotes
      };
    }

    if (req.body.progressAssessment) {
      visit.progressAssessment = {
        ...visit.progressAssessment,
        ...req.body.progressAssessment
      };
    }

    if (req.body.followUp) {
      visit.followUp = {
        ...visit.followUp,
        ...req.body.followUp
      };
    }

    if (req.body.billing) {
      visit.billing = {
        ...visit.billing,
        ...req.body.billing
      };
    }

    await visit.save();

    // Jeśli wizyta jest powiązana z terminem, zakończ również termin
    if (visit.appointment) {
      const appointment = await Appointment.findById(visit.appointment);
      if (appointment) {
        appointment.status = 'completed';
        appointment.visit = visit._id;
        await appointment.save();
      }
    }

    // Log operacji
    await AuditLog.create({
      userId: req.user._id,
      action: 'COMPLETE_VISIT',
      resourceType: 'Visit',
      resourceId: visit._id,
      details: `Completed visit`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      severity: 'medium'
    });

    res.json({
      success: true,
      data: visit,
      message: 'Visit completed successfully'
    });
  });

  // Anulowanie wizyty
  cancelVisit = asyncHandler(async (req, res) => {
    const { reason } = req.body;
    const visitId = req.params.id;

    const visit = await Visit.findById(visitId)
      .populate('appointment');

    if (!visit) {
      throw new ResourceNotFoundError('Visit', visitId);
    }

    // Nie można anulować zakończonej wizyty
    if (visit.status === 'completed') {
      throw new ValidationError('Cannot cancel a completed visit');
    }

    // Nie można anulować już anulowanej wizyty
    if (visit.status === 'cancelled') {
      throw new ValidationError('Visit is already cancelled');
    }

    visit.status = 'cancelled';
    visit.cancellation = {
      reason: reason || 'No reason provided',
      cancelledBy: req.user._id,
      cancelledAt: new Date()
    };

    await visit.save();

    // Jeśli wizyta jest powiązana z terminem, anuluj również termin
    if (visit.appointment) {
      const appointment = await Appointment.findById(visit.appointment);
      if (appointment) {
        appointment.status = 'cancelled';
        appointment.cancellation = {
          reason: reason || 'Visit cancelled',
          cancelledBy: req.user._id,
          cancelledAt: new Date()
        };
        await appointment.save();
      }
    }

    // Log operacji
    await AuditLog.create({
      userId: req.user._id,
      action: 'CANCEL_VISIT',
      resourceType: 'Visit',
      resourceId: visit._id,
      details: `Cancelled visit. Reason: ${reason || 'No reason provided'}`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      severity: 'medium'
    });

    res.json({
      success: true,
      data: visit,
      message: 'Visit cancelled successfully'
    });
  });
}

module.exports = new VisitController();
