// jobs/appointmentReminders.js
const cron = require("node-cron");
const Appointment = require("../models/Appointment");
const NotificationService = require("../services/NotificationService");

class AppointmentReminderJobs {
  static init() {
    // Przypomnienia 24h przed wizytą (codziennie o 9:00)
    cron.schedule("0 9 * * *", async () => {
      try {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);

        const dayAfterTomorrow = new Date(tomorrow);
        dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

        const appointments = await Appointment.find({
          scheduledDateTime: {
            $gte: tomorrow,
            $lt: dayAfterTomorrow,
          },
          status: { $in: ["scheduled", "confirmed"] },
          "notifications.reminder24h.sent": false,
        });

        for (const appointment of appointments) {
          await NotificationService.sendAppointmentReminder(appointment, "24h");
        }

        console.log(
          `Sent 24h reminders for ${appointments.length} appointments`
        );
      } catch (error) {
        console.error("24h reminder job error:", error);
      }
    });

    // Przypomnienia 2h przed wizytą (co godzinę)
    cron.schedule("0 * * * *", async () => {
      try {
        const now = new Date();
        const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
        const threeHoursFromNow = new Date(now.getTime() + 3 * 60 * 60 * 1000);

        const appointments = await Appointment.find({
          scheduledDateTime: {
            $gte: twoHoursFromNow,
            $lt: threeHoursFromNow,
          },
          status: { $in: ["scheduled", "confirmed"] },
          "notifications.reminder2h.sent": false,
        });

        for (const appointment of appointments) {
          await NotificationService.sendAppointmentReminder(appointment, "2h");
        }

        console.log(
          `Sent 2h reminders for ${appointments.length} appointments`
        );
      } catch (error) {
        console.error("2h reminder job error:", error);
      }
    });

    // Automatyczne oznaczanie no-show (codziennie o północy)
    cron.schedule("0 0 * * *", async () => {
      try {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(23, 59, 59, 999);

        const result = await Appointment.updateMany(
          {
            scheduledDateTime: { $lt: yesterday },
            status: { $in: ["scheduled", "confirmed"] },
          },
          {
            $set: { status: "no-show" },
            $push: {
              statusHistory: {
                status: "no-show",
                changedAt: new Date(),
                reason: "Automatic no-show after appointment time passed",
              },
            },
          }
        );

        console.log(`Marked ${result.modifiedCount} appointments as no-show`);
      } catch (error) {
        console.error("No-show job error:", error);
      }
    });
  }
}

module.exports = AppointmentReminderJobs;
