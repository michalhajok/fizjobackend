// routes/appointment.routes.js

const express = require("express");
const multer = require("multer");

const router = express.Router();

const appointmentController = require("../controllers/appointment.controller");
const {
  authenticateToken,
  requirePermission,
} = require("../middleware/auth.middleware");

const upload = multer({ dest: "uploads/" }); // Konfiguruj odpowiednio w produkcji

// Wszystkie trasy poniżej wymagają autoryzacji
router.use(authenticateToken);

router.get("/slots", appointmentController.getAvailableSlots);

// Pobierz wiele wizyt (z filtrami; opcjonalnie)
router.get("/", appointmentController.getAppointments);

// Pobierz wizyty pacjenta (z filtrami; opcjonalnie)
router.get(
  "/patient/:patientId",
  appointmentController.getAppointmentsByPatient
);

// Utwórz nową wizytę (opcjonalnie)
router.post("/", appointmentController.createAppointment);

// Aktualizuj wszystkie główne sekcje wizyty (PUT/PATCH)
router.put("/:id", appointmentController.updateAppointment);

// Zmiana tylko statusu wizyty (workflow, np. potwierdzenie/przyjęcie/rozpoczęcie/zakończenie)
router.put("/:id/status", appointmentController.updateAppointmentStatus);

// Podpisz dokumentację (cyfrowy podpis, finalizacja)
router.post("/:id/sign", appointmentController.signAppointment);

// Dodaj załącznik do wizyty (upload pliku)
router.post(
  "/:id/attachments",
  upload.single("file"),
  appointmentController.uploadAttachment
);

// Opcjonalnie - usuń załącznik
router.delete(
  "/:id/attachments/:attachmentId",
  appointmentController.deleteAttachment
);

// // Dodaj badanie, rozpoznanie, skalę oceny itp.
// router.post("/:id/add-examination", appointmentController.addExamination);
// router.post("/:id/add-diagnosis", appointmentController.addDiagnosis);

router.get("/:id", appointmentController.getAppointment);

module.exports = router;
