const Patient = require("../models/Patient");
const AuditLog = require("../models/AuditLog");
const { validationResult } = require("express-validator");
const logger = require("../utils/logger");

class PatientController {
  async createPatient(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Błędy walidacji",
          errors: errors.array(),
        });
      }

      const patientData = {
        ...req.body,
        createdBy: req.user._id,
        consentDate: new Date(),
      };

      const patient = new Patient(patientData);
      await patient.save();

      // Log operacji
      await AuditLog.createEntry({
        userId: req.user._id,
        action: "CREATE_PATIENT",
        resourceType: "Patient",
        resourceId: patient._id,
        details: `Utworzono pacjenta: ${patient.personalInfo.firstName} ${patient.personalInfo.lastName}`,
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });

      logger.audit("Patient created", {
        userId: req.user._id,
        patientId: patient._id,
      });

      res.status(201).json({
        success: true,
        data: patient.toSafeObject(),
        message: "Pacjent utworzony pomyślnie",
      });
    } catch (error) {
      logger.error("Error creating patient:", error);
      res.status(500).json({
        success: false,
        message: "Błąd wewnętrzny serwera",
      });
    }
  }

  async getPatients(req, res) {
    try {
      const { page = 1, limit = 20, search } = req.query;
      const query = {};

      if (search) {
        query.$or = [
          { "personalInfo.firstName": { $regex: search, $options: "i" } },
          { "personalInfo.lastName": { $regex: search, $options: "i" } },
        ];
      }

      const patients = await Patient.find(query)
        .select("-personalInfo.pesel")
        .populate("createdBy", "firstName lastName")
        .sort({ "personalInfo.lastName": 1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await Patient.countDocuments(query);

      res.json({
        success: true,
        data: patients,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.log(error);

      logger.error("Error fetching patients:", error);
      res.status(500).json({
        success: false,
        message: "Błąd pobierania listy pacjentów",
      });
    }
  }

  async getPatientById(req, res) {
    try {
      const { id } = req.params;

      const patient = await Patient.findById(id).populate(
        "createdBy",
        "firstName lastName"
      );

      if (!patient) {
        return res.status(404).json({
          success: false,
          message: "Pacjent nie znaleziony",
        });
      }

      // Log dostępu do danych pacjenta
      await AuditLog.createEntry({
        userId: req.user._id,
        action: "VIEW_PATIENT",
        resourceType: "Patient",
        resourceId: patient._id,
        details: `Wyświetlono dane pacjenta: ${patient.fullName}`,
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });

      res.json({
        success: true,
        data: patient,
      });
    } catch (error) {
      logger.error("Error fetching patient:", error);
      res.status(500).json({
        success: false,
        message: "Błąd pobierania danych pacjenta",
      });
    }
  }

  async search(req, res) {
    try {
      const q = req.query.q;
      if (!q)
        return res.status(400).json({ error: "Parametr q jest wymagany" });
      const regex = new RegExp(q, "i");
      const patients = await Patient.find({
        $or: [
          { "personalInfo.firstName": regex },
          { "personalInfo.lastName": regex },
          { "personalInfo.contact.email": regex },
        ],
      });
      res.status(200).json(patients);
    } catch (err) {
      res.status(500).json({ error: "Błąd serwera", message: err.message });
    }
  }
}

module.exports = new PatientController();
