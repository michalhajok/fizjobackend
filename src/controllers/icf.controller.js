const ICFAssessment = require("../models/ICFAssessment");
const Appointment = require("../models/Appointment");
const { validationResult } = require("express-validator");

exports.getICFAssessment = async (req, res) => {
  const { appointmentId } = req.params;
  console.log("Fetching ICF for appointment:", appointmentId);

  const appointment = await Appointment.findById(appointmentId);
  if (!appointment)
    return res
      .status(404)
      .json({ success: false, error: "Appointment not found" });
  if (
    appointment.physiotherapist.toString() !== req.user.id &&
    req.user.role !== "admin"
  )
    return res.status(403).json({ success: false, error: "Not authorized" });
  const assessment = await ICFAssessment.findOne({
    appointmentId: appointmentId,
  });
  if (!assessment)
    return res.status(404).json({ success: false, error: "ICF not found" });
  const data = assessment.toObject();
  data.body_functions = Object.fromEntries(assessment.body_functions);
  data.body_structures = Object.fromEntries(assessment.body_structures);
  data.activities_participation = Object.fromEntries(
    assessment.activities_participation
  );
  data.environmental_factors = Object.fromEntries(
    assessment.environmental_factors
  );
  data.summary = assessment.calculateSummary();
  res.json({ success: true, data });
};

exports.createOrUpdateICFAssessment = async (req, res) => {
  console.log("ICF payload:", req.body);

  //   const errors = validationResult(req);
  //   console.log(errors);

  //   if (!errors.isEmpty())
  //     return res.status(400).json({ success: false, errors: errors.array() });
  const { appointmentId } = req.params;
  const appointment = await Appointment.findById(appointmentId);
  if (!appointment)
    return res
      .status(404)
      .json({ success: false, error: "Appointment not found" });
  if (
    appointment.physiotherapist.toString() !== req.user.id &&
    req.user.role !== "admin"
  )
    return res.status(403).json({ success: false, error: "Not authorized" });
  let assessment = await ICFAssessment.findOne({ appointmentId });
  const payload = {
    coreSet: req.body.coreSet,
    body_functions: new Map(Object.entries(req.body.body_functions || {})),
    body_structures: new Map(Object.entries(req.body.body_structures || {})),
    activities_participation: new Map(
      Object.entries(req.body.activities_participation || {})
    ),
    environmental_factors: new Map(
      Object.entries(req.body.environmental_factors || {})
    ),
    assessmentDate: req.body.assessmentDate || new Date(),
    additionalNotes: req.body.additionalNotes || "",
    status: req.body.status || "draft",
  };
  if (assessment) {
    Object.assign(assessment, payload);
    assessment.updatedBy = req.user.id;
    assessment.version += 1;
  } else {
    assessment = new ICFAssessment({
      patientId: appointment.patient,
      appointmentId,
      assessorId: req.user.id,
      ...payload,
      createdBy: req.user.id,
    });
  }
  await assessment.save();
  res.json({ success: true, data: { id: assessment._id } });
};

exports.deleteICFAssessment = async (req, res) => {
  const { appointmentId } = req.params;
  const assessment = await ICFAssessment.findOne({ appointmentId });
  if (!assessment)
    return res.status(404).json({ success: false, error: "Not found" });
  if (
    assessment.createdBy.toString() !== req.user.id &&
    req.user.role !== "admin"
  )
    return res.status(403).json({ success: false, error: "Not authorized" });
  await ICFAssessment.deleteOne({ _id: assessment._id });
  await Appointment.updateOne(
    { _id: appointmentId },
    { $unset: { icfAssessment: "" } }
  );
  res.json({ success: true });
};

exports.getPatientICFHistory = async (req, res) => {
  const { patientId } = req.params;
  const assessments = await ICFAssessment.find({ patientId })
    .sort({ createdAt: -1 })
    .limit(20);
  const data = assessments.map((doc) => ({
    ...doc.toObject(),
    body_functions: Object.fromEntries(doc.body_functions),
    body_structures: Object.fromEntries(doc.body_structures),
    activities_participation: Object.fromEntries(doc.activities_participation),
    environmental_factors: Object.fromEntries(doc.environmental_factors),
  }));
  res.json({ success: true, data });
};

exports.generateICFReport = async (req, res) => {
  const { appointmentId } = req.params;
  const assessment = await ICFAssessment.findOne({ appointmentId });
  if (!assessment)
    return res.status(404).json({ success: false, error: "Not found" });
  const report = assessment.generateReport();
  res.json({ success: true, report });
};
