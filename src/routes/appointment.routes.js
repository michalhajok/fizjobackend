// const express = require("express");
// const router = express.Router();

// const appointmentController = require("../controllers/appointment.controller");
// const {
//   authenticateToken,
//   requirePermission,
// } = require("../middleware/auth.middleware");

// // Lista terminów
// router.get(
//   "/",
//   authenticateToken,
//   requirePermission("appointments:read"),
//   appointmentController.getAppointments
// );

// // Szczegóły terminu
// router.get(
//   "/:id",
//   authenticateToken,
//   requirePermission("appointments:read"),
//   appointmentController.getAppointmentById
// );

// // Dodaj nowy termin
// router.post(
//   "/",
//   authenticateToken,
//   requirePermission("appointments:write"),
//   appointmentController.createAppointment
// );

// // Edytuj termin
// router.put(
//   "/:id",
//   authenticateToken,
//   requirePermission("appointments:write"),
//   appointmentController.updateAppointment
// );

// // Usuń termin
// router.delete(
//   "/:id",
//   authenticateToken,
//   requirePermission("appointments:delete"),
//   appointmentController.deleteAppointment
// );

// router.patch(
//   "/:id/confirm",
//   authenticateToken,
//   requirePermission("appointments:write"),
//   appointmentController.confirmAppointment
// );

// router.patch(
//   "/:id/cancel",
//   authenticateToken,
//   requirePermission("appointments:write"),
//   appointmentController.cancelAppointment
// );

// router.patch(
//   "/:id/complete",
//   authenticateToken,
//   requirePermission("appointments:write"),
//   appointmentController.completeAppointment
// );

// router.get(
//   "/available-slots",
//   authenticateToken,
//   requirePermission("appointments:read"),
//   appointmentController.getAvailableSlots
// );

// module.exports = router;

// routes/appointment.routes.js
const express = require("express");
const router = express.Router();
const appointmentController = require("../controllers/appointment.controller");
const {
  authenticateToken,
  requirePermission,
} = require("../middleware/auth.middleware");

// const multer = require("multer");
// const upload = multer({ dest: "uploads/" }); // Konfiguruj odpowiednio w produkcji

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

// Pobierz i zastosuj szablon dokumentacji

// Pobierz logi audytu (historia zmian wizyty)
// router.get("/:id/audit-logs", appointmentController.getAuditLogs);

// // Dodaj załącznik do wizyty (upload pliku)
// router.post(
//   "/:id/attachments",
//   upload.single("file"),
//   appointmentController.uploadAttachment
// );

// // Opcjonalnie - usuń załącznik
// router.delete(
//   "/:id/attachments/:attachmentId",
//   appointmentController.deleteAttachment
// );

// // Dodaj badanie, rozpoznanie, skalę oceny itp.
// router.post("/:id/add-examination", appointmentController.addExamination);
// router.post("/:id/add-diagnosis", appointmentController.addDiagnosis);

// Możesz rozszerzyć o inne PATCH/PUT/DELETE do poszczególnych sekcji

// Pobierz jedną wizytę (pełne dane)
router.get("/:id", appointmentController.getAppointment);

module.exports = router;
