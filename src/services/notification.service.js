const schedule = require("node-schedule");
const Notification = require("../models/Notification");
const emailService = require("./email.service");
const logger = require("../utils/logger");

class NotificationService {
  constructor(socketHandler) {
    this.socketHandler = socketHandler;
    this.scheduledJobs = new Map();
    this.setupScheduledNotifications();
  }

  async createNotification(data) {
    try {
      const notification = new Notification({
        ...data,
        status: "pending",
      });

      await notification.save();

      // Real-time notification
      if (data.recipient) {
        this.sendRealTimeNotification(data.recipient, notification);
      }

      // Email notification
      if (data.channels && data.channels.includes("email")) {
        await this.sendEmailNotification(notification);
      }

      return notification;
    } catch (error) {
      logger.error("Error creating notification:", error);
      throw error;
    }
  }

  sendRealTimeNotification(userId, notification) {
    if (this.socketHandler) {
      this.socketHandler.sendNotificationToUser(userId, {
        id: notification._id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        timestamp: notification.createdAt,
      });
    }
  }

  setupScheduledNotifications() {
    // Przypomnienia o wizytach - codziennie o 9:00
    this.scheduleJob("daily-reminders", "0 9 * * *", async () => {
      await this.sendDailyAppointmentReminders();
    });

    // Pilne przypomnienia - co 30 minut
    this.scheduleJob("urgent-reminders", "*/30 * * * *", async () => {
      await this.sendUrgentAppointmentReminders();
    });
  }

  scheduleJob(name, cronExpression, task) {
    if (this.scheduledJobs.has(name)) {
      this.scheduledJobs.get(name).cancel();
    }

    const job = schedule.scheduleJob(cronExpression, async () => {
      try {
        await task();
      } catch (error) {
        logger.error(`Error in scheduled job ${name}:`, error);
      }
    });

    this.scheduledJobs.set(name, job);
  }

  async sendDailyAppointmentReminders() {
    const Appointment = require("../models/Appointment");
    const moment = require("moment");

    const tomorrow = moment().add(1, "day");
    const startOfTomorrow = tomorrow.clone().startOf("day").toDate();
    const endOfTomorrow = tomorrow.clone().endOf("day").toDate();

    const appointments = await Appointment.find({
      scheduledDateTime: {
        $gte: startOfTomorrow,
        $lt: endOfTomorrow,
      },
      status: { $in: ["scheduled", "confirmed"] },
    }).populate("patient physiotherapist service");

    for (const appointment of appointments) {
      await this.createNotification({
        type: "appointment_reminder_24h",
        recipient: appointment.patient._id,
        title: "Przypomnienie o wizycie",
        message: `Jutro masz wizytę o ${moment(
          appointment.scheduledDateTime
        ).format("HH:mm")}`,
        channels: ["push", "email"],
        metadata: { appointmentId: appointment._id },
      });
    }
  }
}

module.exports = NotificationService;
