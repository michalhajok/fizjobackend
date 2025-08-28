// const Appointment = require("../models/Appointment");
// const { startOfDay, endOfDay } = require("date-fns");

// exports.createAppointment = async (req, res) => {
//   const appointment = new Appointment({ ...req.body, createdBy: req.user._id });
//   try {
//     await appointment.save();
//     res.status(201).json({ success: true, data: appointment });
//   } catch (error) {
//     return res.status(400).json({ success: false, message: error.message });
//   }
// };

// exports.updateAppointment = async (req, res) => {
//   const appointment = await Appointment.findByIdAndUpdate(
//     req.params.id,
//     req.body,
//     { new: true }
//   );
//   if (!appointment)
//     return res
//       .status(404)
//       .json({ success: false, message: "Nie znaleziono terminu" });
//   res.json({ success: true, data: appointment });
// };

// exports.deleteAppointment = async (req, res) => {
//   const appointment = await Appointment.findByIdAndDelete(req.params.id);
//   if (!appointment)
//     return res
//       .status(404)
//       .json({ success: false, message: "Nie znaleziono terminu" });
//   res.json({ success: true, message: "Termin usunięty" });
// };

// exports.confirmAppointment = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const appt = await Appointment.findByIdAndUpdate(
//       id,
//       { status: "confirmed" },
//       { new: true }
//     );
//     if (!appt) return res.status(404).json({ error: "Appointment not found" });
//     res.json(appt);
//   } catch (err) {
//     res.status(500).json({ error: "Server error", message: err.message });
//   }
// };

// exports.cancelAppointment = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { reason } = req.body;
//     const appt = await Appointment.findByIdAndUpdate(
//       id,
//       { status: "cancelled", notes: reason || appt.notes },
//       { new: true }
//     );
//     if (!appt) return res.status(404).json({ error: "Appointment not found" });
//     res.json(appt);
//   } catch (err) {
//     res.status(500).json({ error: "Server error", message: err.message });
//   }
// };

// exports.completeAppointment = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const appt = await Appointment.findByIdAndUpdate(
//       id,
//       { status: "completed" },
//       { new: true }
//     );
//     if (!appt) return res.status(404).json({ error: "Appointment not found" });
//     res.json(appt);
//   } catch (err) {
//     res.status(500).json({ error: "Server error", message: err.message });
//   }
// };

// exports.getAvailableSlots = async (req, res) => {
//   try {
//     const { employeeId, date } = req.query;
//     if (!employeeId || !date) {
//       return res
//         .status(400)
//         .json({ error: "employeeId and date are required" });
//     }
//     const start = startOfDay(new Date(date));
//     const end = endOfDay(new Date(date));

//     // Pobierz wszystkie wizyty pracownika w tym dniu
//     const taken = await Appointment.find({
//       employee: employeeId,
//       startTime: { $gte: start, $lte: end },
//     }).select("startTime endTime -_id");

//     const slots = [];
//     const opening = new Date(start.setHours(8, 0, 0, 0));
//     for (
//       let dt = new Date(opening);
//       dt.getHours() < 17;
//       dt.setHours(dt.getHours() + 1)
//     ) {
//       const slotStart = new Date(dt);
//       const slotEnd = new Date(dt);
//       slotEnd.setHours(slotEnd.getHours() + 1);

//       const conflict = taken.some(
//         (t) => t.startTime < slotEnd && t.endTime > slotStart
//       );
//       if (!conflict) {
//         slots.push({ startTime: slotStart, endTime: slotEnd });
//       }
//     }

//     res.json(slots);
//   } catch (err) {
//     res.status(500).json({ error: "Server error", message: err.message });
//   }
// };

// controllers/appointmentController.js
const Appointment = require("../models/Appointment");
const Employee = require("../models/Employee");
const AuditLog = require("../models/AuditLog");
//const NotificationService = require("../services/NotificationService");
const {
  startOfDay,
  endOfDay,
  addMinutes,
  isBefore,
  isAfter,
} = require("date-fns");

const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

function toLocalISOString(d) {
  const offsetMs = d.getTimezoneOffset() * 60000;
  const local = new Date(d.getTime() - offsetMs);
  return local.toISOString().slice(0, 19); // "YYYY-MM-DDTHH:mm:ss"
}

exports.getAppointments = async (req, res) => {
  const appointments = await Appointment.find()
    .populate("patient", "personalInfo")
    .populate("physiotherapist", "personalInfo")
    .populate("service", "name description");
  res.json({ success: true, data: appointments });
};

// Pobierz wizytę z pełnymi danymi
exports.getAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const appointment = await Appointment.findById(id)
      .populate([
        { path: "patient", select: "personalInfo medicalHistory" },
        {
          path: "physiotherapist",
          select: "personalInfo",
        },
        { path: "service", select: "name duration category" },
        { path: "statusHistory.changedBy", select: "firstName lastName" },
        { path: "digitalSignature.signedBy", select: "firstName lastName" },
      ])
      .lean();

    if (!appointment) {
      return res
        .status(404)
        .json({ success: false, message: "Appointment not found" });
    }

    res.json({ success: true, data: appointment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getAppointmentsByPatient = async (req, res) => {
  const { patientId } = req.params;
  const appointments = await Appointment.find({ patient: patientId })
    .populate("physiotherapist", "personalInfo")
    .populate("service", "name description");
  res.json({ success: true, data: appointments });
};

exports.createAppointment = async (req, res) => {
  const appointment = new Appointment({ ...req.body, createdBy: req.user._id });
  try {
    await appointment.save();
    res.status(201).json({ success: true, data: appointment });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

exports.updateAppointment = async (req, res) => {
  const appointment = await Appointment.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  )
    .populate("patient", "personalInfo")
    .populate("physiotherapist", "personalInfo")
    .populate("service", "name description");

  if (!appointment)
    return res
      .status(404)
      .json({ success: false, message: "Nie znaleziono terminu" });
  res.json({ success: true, data: appointment });
};

// Aktualizuj status wizyty
exports.updateAppointmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const appointment = await Appointment.findById(id)
      .populate("patient", "personalInfo")
      .populate("physiotherapist", "personalInfo")
      .populate("service", "name description");
    if (!appointment) {
      return res
        .status(404)
        .json({ success: false, message: "Appointment not found" });
    }

    const oldStatus = appointment.status;
    appointment.status = status;

    // Dodaj do historii z informacją kto zmienił
    appointment.statusHistory.push({
      status,
      changedBy: req.user._id,
      changedAt: new Date(),
    });

    await appointment.save();

    // Log audytu
    await AuditLog.create({
      userId: req.user._id,
      action: "UPDATE_APPOINTMENT_STATUS",
      resourceType: "Appointment",
      resourceId: appointment._id,
      details: `Status changed from ${oldStatus} to ${status}`,
      metadata: { oldStatus, newStatus: status },
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
    });

    res.json({ success: true, data: appointment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Cyfrowy podpis dokumentacji
exports.signAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { signatureHash } = req.body;

    const appointment = await Appointment.findByIdAndUpdate(
      id,
      {
        $set: {
          digitalSignature: {
            signedBy: req.user._id,
            signedAt: new Date(),
            signatureHash,
            ipAddress: req.ip,
          },
          status: "completed",
        },
      },
      { new: true }
    )
      .populate("patient", "personalInfo")
      .populate("physiotherapist", "personalInfo")
      .populate("service", "name description");
    if (!appointment) {
      return res
        .status(404)
        .json({ success: false, message: "Appointment not found" });
    }

    // Log audytu
    await AuditLog.create({
      userId: req.user._id,
      action: "SIGN_APPOINTMENT",
      resourceType: "Appointment",
      resourceId: appointment._id,
      details: "Appointment documentation signed digitally",
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
    });

    res.json({ success: true, data: appointment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// controllers/appointment.controller.js
// Helper do konwersji na lokalne ISO
function toLocalISOString(date) {
  const offsetMs = date.getTimezoneOffset() * 60000;
  const local = new Date(date.getTime() - offsetMs);
  return local.toISOString().slice(0, 19);
}

exports.getAvailableSlots = async (req, res) => {
  try {
    const { therapist, date, duration = 45 } = req.query;

    if (!therapist || !date) {
      return res.status(400).json({
        success: false,
        message: "therapist i date są wymagane",
      });
    }

    // Pobierz harmonogram terapeuty
    const therapistData = await Employee.findById(therapist).select(
      "schedule personalInfo"
    );
    if (!therapistData) {
      return res.status(404).json({
        success: false,
        message: "Nie znaleziono terapeuty",
      });
    }

    const targetDate = new Date(date + "T00:00:00");
    const weekday = targetDate.getDay();

    // Znajdź harmonogram dla tego dnia
    const daySchedule = therapistData.schedule.find(
      (s) => s.dayOfWeek === weekday
    );
    if (
      !daySchedule ||
      daySchedule.startHour === 0 ||
      daySchedule.endHour === 0
    ) {
      const dayNames = [
        "niedziela",
        "poniedziałek",
        "wtorek",
        "środa",
        "czwartek",
        "piątek",
        "sobota",
      ];
      return res.json({
        success: true,
        slots: [],
        message: `${therapistData.personalInfo.firstName} ${therapistData.personalInfo.lastName} nie pracuje w ${dayNames[weekday]}`,
      });
    }

    const workStart = daySchedule.startHour;
    const workEnd = daySchedule.endHour;

    // Pobierz istniejące wizyty
    const dayStart = new Date(targetDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(targetDate);
    dayEnd.setHours(23, 59, 59, 999);

    const bookedAppointments = await Appointment.find({
      physiotherapist: therapist,
      scheduledDateTime: { $gte: dayStart, $lte: dayEnd },
      status: { $nin: ["cancelled", "no-show"] },
    }).select("scheduledDateTime duration");

    console.log(`📅 Working hours: ${workStart}:00 - ${workEnd}:00`);
    console.log(`📋 Found ${bookedAppointments.length} appointments`);

    // Generuj sloty co 30 minut
    const slotInterval = 30;
    const allSlots = [];

    const durationHours = Math.ceil(parseInt(duration) / 60);
    const maxStartHour = workEnd - durationHours;

    for (let hour = workStart; hour <= maxStartHour; hour++) {
      for (let minute = 0; minute < 60; minute += slotInterval) {
        const slotStart = new Date(targetDate);
        slotStart.setHours(hour, minute, 0, 0);

        const slotEnd = new Date(slotStart);
        slotEnd.setMinutes(slotEnd.getMinutes() + parseInt(duration));

        const slotEndHour = slotEnd.getHours();
        const slotEndMinute = slotEnd.getMinutes();
        const slotEndTotalMinutes = slotEndHour * 60 + slotEndMinute;
        const workEndTotalMinutes = workEnd * 60;

        if (slotEndTotalMinutes > workEndTotalMinutes) continue;

        allSlots.push({
          start: slotStart,
          end: slotEnd,
          time: `${hour.toString().padStart(2, "0")}:${minute
            .toString()
            .padStart(2, "0")}`,
        });
      }
    }

    const availableSlots = allSlots.filter((slot) => {
      return !bookedAppointments.some((apt) => {
        const aptStart = new Date(apt.scheduledDateTime);
        const aptEnd = new Date(aptStart);
        aptEnd.setMinutes(aptEnd.getMinutes() + apt.duration);

        return slot.start < aptEnd && slot.end > aptStart;
      });
    });

    console.log(
      `⏰ Generated ${allSlots.length} slots, ${availableSlots.length} available`
    );

    // Odpowiedź
    const slots = availableSlots.map((slot) => ({
      time: slot.time,
      start: toLocalISOString(slot.start),
      end: toLocalISOString(slot.end),
      available: true,
    }));

    res.json({
      success: true,
      slots,
      therapistName: `${therapistData.personalInfo.firstName} ${therapistData.personalInfo.lastName}`,
      workingHours: {
        start: `${workStart.toString().padStart(2, "0")}:00`,
        end: `${workEnd.toString().padStart(2, "0")}:00`,
      },
      debug: {
        date,
        weekday,
        workStart,
        workEnd,
        maxStartHour,
        totalSlots: allSlots.length,
        availableSlots: availableSlots.length,
        foundAppointments: bookedAppointments.length,
      },
    });
  } catch (err) {
    console.error("Error in getAvailableSlots:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

module.exports = exports;
