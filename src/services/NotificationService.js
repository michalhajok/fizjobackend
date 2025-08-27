// services/NotificationService.js
const nodemailer = require("nodemailer");
const twilio = require("twilio");

class NotificationService {
  constructor() {
    // Konfiguracja email
    this.emailTransporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Konfiguracja SMS (Twilio)
    this.smsClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
  }

  // Powiadomienie o zmianie statusu
  async handleStatusChange(appointment, oldStatus, newStatus) {
    try {
      const messages = {
        confirmed: "Twoja wizyta została potwierdzona",
        "in-progress": "Twoja wizyta właśnie się rozpoczęła",
        completed: "Twoja wizyta została zakończona. Dziękujemy!",
        cancelled: "Twoja wizyta została anulowana",
        rescheduled: "Twoja wizyta została przełożona",
      };

      const message = messages[newStatus];
      if (!message) return;

      // Pobierz dane pacjenta
      await appointment.populate("patient");
      const patient = appointment.patient;

      // Wyślij email
      if (patient.personalInfo.email) {
        await this.sendEmail(
          patient.personalInfo.email,
          "Aktualizacja wizyty",
          message,
          this.generateAppointmentEmailTemplate(appointment, message)
        );
      }

      // Wyślij SMS
      if (patient.personalInfo.phone) {
        await this.sendSMS(patient.personalInfo.phone, message);
      }
    } catch (error) {
      console.error("Notification error:", error);
    }
  }

  // Przypomnienia o wizycie
  async sendAppointmentReminder(appointment, type) {
    try {
      await appointment.populate(["patient", "physiotherapist", "service"]);

      const reminderMessages = {
        "24h": `Przypomnienie: Jutro o ${this.formatTime(
          appointment.scheduledDateTime
        )} masz wizytę u ${appointment.physiotherapist.firstName} ${
          appointment.physiotherapist.lastName
        }`,
        "2h": `Przypomnienie: Za 2 godziny masz wizytę - ${appointment.service.name}`,
      };

      const message = reminderMessages[type];
      const patient = appointment.patient;

      // Email
      if (patient.personalInfo.email) {
        await this.sendEmail(
          patient.personalInfo.email,
          "Przypomnienie o wizycie",
          message,
          this.generateReminderEmailTemplate(appointment)
        );
      }

      // SMS
      if (patient.personalInfo.phone) {
        await this.sendSMS(patient.personalInfo.phone, message);
      }

      // Oznacz jako wysłane
      const updateField = `notifications.reminder${
        type === "24h" ? "24h" : "2h"
      }`;
      await appointment.updateOne({
        $set: {
          [`${updateField}.sent`]: true,
          [`${updateField}.sentAt`]: new Date(),
        },
      });
    } catch (error) {
      console.error("Reminder error:", error);
    }
  }

  async sendEmail(to, subject, text, html) {
    try {
      await this.emailTransporter.sendMail({
        from: process.env.FROM_EMAIL,
        to,
        subject,
        text,
        html,
      });
    } catch (error) {
      console.error("Email error:", error);
    }
  }

  async sendSMS(to, message) {
    try {
      await this.smsClient.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to,
      });
    } catch (error) {
      console.error("SMS error:", error);
    }
  }

  formatTime(date) {
    return new Date(date).toLocaleTimeString("pl-PL", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  generateAppointmentEmailTemplate(appointment, message) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2196F3;">Aktualizacja wizyty</h2>
        <p>${message}</p>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3>Szczegóły wizyty:</h3>
          <p><strong>Data:</strong> ${new Date(
            appointment.scheduledDateTime
          ).toLocaleDateString("pl-PL")}</p>
          <p><strong>Godzina:</strong> ${this.formatTime(
            appointment.scheduledDateTime
          )}</p>
          <p><strong>Usługa:</strong> ${appointment.service.name}</p>
          <p><strong>Terapeuta:</strong> ${
            appointment.physiotherapist.firstName
          } ${appointment.physiotherapist.lastName}</p>
        </div>
        <p>W razie pytań prosimy o kontakt.</p>
      </div>
    `;
  }

  generateReminderEmailTemplate(appointment) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4CAF50;">Przypomnienie o wizycie</h2>
        <div style="background: #e8f5e8; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3>Szczegóły wizyty:</h3>
          <p><strong>Data:</strong> ${new Date(
            appointment.scheduledDateTime
          ).toLocaleDateString("pl-PL")}</p>
          <p><strong>Godzina:</strong> ${this.formatTime(
            appointment.scheduledDateTime
          )}</p>
          <p><strong>Usługa:</strong> ${appointment.service.name}</p>
          <p><strong>Terapeuta:</strong> ${
            appointment.physiotherapist.firstName
          } ${appointment.physiotherapist.lastName}</p>
          <p><strong>Czas trwania:</strong> ${appointment.duration} min</p>
        </div>
        <p>Prosimy o punktualne przybycie. Jeśli potrzebujesz zmienić termin, skontaktuj się z nami jak najszybciej.</p>
      </div>
    `;
  }
}

module.exports = new NotificationService();
