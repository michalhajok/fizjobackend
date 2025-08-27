const nodemailer = require("nodemailer");
const config = require("../config/app");
const logger = require("../utils/logger");

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  initializeTransporter() {
    try {
      if (
        !process.env.EMAIL_HOST ||
        !process.env.EMAIL_USER ||
        !process.env.EMAIL_PASS
      ) {
        logger.warn(
          "Email configuration incomplete. Email service will not be available."
        );
        return;
      }

      this.transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT || 587,
        secure: process.env.EMAIL_PORT === "465",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
        tls: {
          rejectUnauthorized: false,
        },
      });

      // Weryfikacja połączenia
      this.transporter.verify((error, success) => {
        if (error) {
          logger.error("Email service verification failed:", error);
        } else {
          logger.info("Email service is ready");
        }
      });
    } catch (error) {
      logger.error("Error initializing email service:", error);
    }
  }

  async sendEmail(to, subject, text, html = null) {
    if (!this.transporter) {
      throw new Error("Email service not configured");
    }

    const mailOptions = {
      from: config.email.from,
      to,
      subject,
      text,
      html: html || text,
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);

      logger.info("Email sent successfully", {
        to,
        subject,
        messageId: result.messageId,
      });

      return result;
    } catch (error) {
      logger.error("Error sending email:", {
        to,
        subject,
        error: error.message,
      });
      throw error;
    }
  }

  async sendNotificationEmail(notification) {
    if (!notification.recipient) {
      throw new Error("Notification recipient is required");
    }

    // Pobierz użytkownika żeby mieć jego email
    const User = require("../models/User");
    const recipient = await User.findById(notification.recipient);

    if (!recipient) {
      throw new Error("Recipient not found");
    }

    const subject = `[Placówka Fizjoterapeutyczna] ${notification.title}`;
    const text = notification.message;

    // Prosta wersja HTML emaila
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #007bff; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .footer { background: #f8f9fa; padding: 10px; text-align: center; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>Placówka Fizjoterapeutyczna</h2>
          </div>
          <div class="content">
            <h3>${notification.title}</h3>
            <p>${notification.message}</p>
            ${
              notification.metadata?.appointmentId
                ? "<p><small>To powiadomienie dotyczy Twojej wizyty w placówce.</small></p>"
                : ""
            }
          </div>
          <div class="footer">
            <p>To jest automatyczne powiadomienie. Prosimy nie odpowiadać na ten email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail(recipient.email, subject, text, html);
  }

  async sendWelcomeEmail(user, temporaryPassword = null) {
    const subject = "Witamy w systemie placówki fizjoterapeutycznej";

    const text = `
      Witaj ${user.firstName}!

      Twoje konto zostało utworzone w systemie placówki fizjoterapeutycznej.

      Email: ${user.email}
      ${temporaryPassword ? `Hasło tymczasowe: ${temporaryPassword}` : ""}

      ${
        temporaryPassword
          ? "Prosimy zmienić hasło przy pierwszym logowaniu."
          : ""
      }

      Pozdrawiamy,
      Zespół Placówki Fizjoterapeutycznej
    `;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #007bff; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .credentials { background: #f8f9fa; padding: 15px; margin: 15px 0; border-left: 4px solid #007bff; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>Witamy w systemie!</h2>
          </div>
          <div class="content">
            <p>Witaj <strong>${user.firstName}</strong>!</p>
            <p>Twoje konto zostało utworzone w systemie placówki fizjoterapeutycznej.</p>

            <div class="credentials">
              <p><strong>Dane logowania:</strong></p>
              <p>Email: <strong>${user.email}</strong></p>
              ${
                temporaryPassword
                  ? `<p>Hasło tymczasowe: <strong>${temporaryPassword}</strong></p>`
                  : ""
              }
            </div>

            ${
              temporaryPassword
                ? "<p><em>Prosimy zmienić hasło przy pierwszym logowaniu ze względów bezpieczeństwa.</em></p>"
                : ""
            }

            <p>Pozdrawiamy,<br>Zespół Placówki Fizjoterapeutycznej</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail(user.email, subject, text, html);
  }

  async sendPasswordResetEmail(user, resetLink) {
    const subject = "Reset hasła - Placówka Fizjoterapeutyczna";

    const text = `
      Witaj ${user.firstName}!

      Otrzymaliśmy żądanie zresetowania hasła do Twojego konta.

      Aby zresetować hasło, kliknij w poniższy link:
      ${resetLink}

      Link jest ważny przez 1 godzinę.

      Jeśli nie prosiłeś o reset hasła, zignoruj tę wiadomość.

      Pozdrawiamy,
      Zespół Placówki Fizjoterapeutycznej
    `;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc3545; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .button { background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; }
          .warning { background: #fff3cd; padding: 15px; margin: 15px 0; border-left: 4px solid #ffc107; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>Reset hasła</h2>
          </div>
          <div class="content">
            <p>Witaj <strong>${user.firstName}</strong>!</p>
            <p>Otrzymaliśmy żądanie zresetowania hasła do Twojego konta.</p>

            <p style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" class="button">Zresetuj hasło</a>
            </p>

            <div class="warning">
              <p><strong>Uwaga:</strong></p>
              <ul>
                <li>Link jest ważny przez 1 godzinę</li>
                <li>Jeśli nie prosiłeś o reset hasła, zignoruj tę wiadomość</li>
                <li>Nigdy nie udostępniaj tego linku innym osobom</li>
              </ul>
            </div>

            <p>Pozdrawiamy,<br>Zespół Placówki Fizjoterapeutycznej</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail(user.email, subject, text, html);
  }

  async sendAppointmentConfirmation(appointment) {
    const User = require("../models/User");

    // Pobierz użytkownika na podstawie pacjenta
    const patient = await appointment.populate("patient");

    if (!patient.personalInfo.contact.email) {
      throw new Error("Patient email not found");
    }

    const subject = "Potwierdzenie wizyty - Placówka Fizjoterapeutyczna";

    const appointmentDate =
      appointment.scheduledDateTime.toLocaleDateString("pl-PL");
    const appointmentTime = appointment.scheduledDateTime.toLocaleTimeString(
      "pl-PL",
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    );

    const text = `
      Witaj ${patient.personalInfo.firstName}!

      Potwierdzamy Twoją wizytę:

      Data: ${appointmentDate}
      Godzina: ${appointmentTime}
      Czas trwania: ${appointment.duration} minut
      ${appointment.room ? `Gabinet: ${appointment.room}` : ""}

      Prosimy przybyć punktualnie.

      Pozdrawiamy,
      Zespół Placówki Fizjoterapeutycznej
    `;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #28a745; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .appointment-details { background: #f8f9fa; padding: 15px; margin: 15px 0; border-left: 4px solid #28a745; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>Potwierdzenie wizyty</h2>
          </div>
          <div class="content">
            <p>Witaj <strong>${patient.personalInfo.firstName}</strong>!</p>
            <p>Potwierdzamy Twoją wizytę:</p>

            <div class="appointment-details">
              <p><strong>Szczegóły wizyty:</strong></p>
              <p>📅 Data: <strong>${appointmentDate}</strong></p>
              <p>🕐 Godzina: <strong>${appointmentTime}</strong></p>
              <p>⏱️ Czas trwania: <strong>${
                appointment.duration
              } minut</strong></p>
              ${
                appointment.room
                  ? `<p>🏥 Gabinet: <strong>${appointment.room}</strong></p>`
                  : ""
              }
            </div>

            <p><em>Prosimy przybyć punktualnie.</em></p>

            <p>Pozdrawiamy,<br>Zespół Placówki Fizjoterapeutycznej</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail(
      patient.personalInfo.contact.email,
      subject,
      text,
      html
    );
  }
}

module.exports = new EmailService();
