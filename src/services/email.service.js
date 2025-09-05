const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");
const { MailtrapTransport } = require("mailtrap");

// Konfiguracja transportera email - POPRAWKA: createTransport zamiast createTransporter
const createTransporter = () => {
  if (process.env.NODE_ENV === "production") {
    // Produkcja - użyj rzeczywistego SMTP
    return nodemailer.createTransport(
      MailtrapTransport({
        token: TOKEN,
        bulk: true,
      })
    );
  } else {
    // Development - użyj testowy transporter lub loguj do konsoli
    console.log("🔧 Development mode - creating test email transporter");

    const TOKEN = process.env.TOKEN;

    // Opcja 1: Testowy transporter (nie wysyła prawdziwych emaili)
    return nodemailer.createTransport(
      MailtrapTransport({
        token: TOKEN,
        bulk: true,
      })
    );

    // Opcja 2: Ethereal Email (jeśli chcesz testować prawdziwe wysyłanie)
    // return nodemailer.createTransport({
    //   host: 'smtp.ethereal.email',
    //   port: 587,
    //   auth: {
    //     user: 'ethereal.user@ethereal.email',
    //     pass: 'ethereal.pass'
    //   }
    // });
  }
};

// Funkcja do ładowania szablonów email
const loadEmailTemplate = (templateName) => {
  try {
    const templatePath = path.join(
      __dirname,
      "../templates/emails",
      `${templateName}.html`
    );

    // Sprawdź czy plik istnieje
    if (!fs.existsSync(templatePath)) {
      console.warn(`Email template not found: ${templatePath}`);
      return null;
    }

    return fs.readFileSync(templatePath, "utf8");
  } catch (error) {
    console.error(`Error loading email template ${templateName}:`, error);
    return null;
  }
};

// Funkcja do zastępowania zmiennych w szablonie
const replaceTemplateVariables = (template, data) => {
  let result = template;

  Object.keys(data).forEach((key) => {
    const regex = new RegExp(`{{${key}}}`, "g");
    result = result.replace(regex, data[key] || "");
  });

  return result;
};

// Główna funkcja wysyłania emaila
const sendEmail = async ({ to, subject, template, data, html, text }) => {
  try {
    console.log(`📧 Sending email to: ${to}, subject: ${subject}`);

    const transporter = createTransporter();

    let emailHtml = html;
    let emailText = text;

    // Jeśli podano szablon, załaduj go i zastąp zmienne
    if (template && data) {
      console.log(`📄 Loading email template: ${template}`);
      const templateContent = loadEmailTemplate(template);
      if (templateContent) {
        emailHtml = replaceTemplateVariables(templateContent, data);
      } else {
        console.warn(`Template ${template} not found, using default template`);
      }
    }

    // Jeśli nie ma HTML, użyj domyślnego szablonu
    if (!emailHtml) {
      emailHtml = generateDefaultTemplate(subject, data);
    }

    const mailOptions = {
      from: `${process.env.EMAIL_FROM_NAME || "fizjocare@demomailtrap.co"} <${
        process.env.EMAIL_FROM || "fizjocare@demomailtrap.co"
      }>`,
      to: to,
      subject: subject,
      html: emailHtml,
      text: emailText || data?.message || subject,
    };

    console.log(`📤 Mail options prepared for: ${to}`);

    const result = await transporter.sendMail(mailOptions);

    if (process.env.NODE_ENV !== "production") {
      console.log("✅ Email sent (development mode):", {
        to: to,
        subject: subject,
        messageId: result.messageId,
        // W development mode z jsonTransport
        response: result.response || "Test email logged",
        previewUrl: result.response
          ? null
          : "Development mode - no preview URL",
      });

      // Jeśli używasz jsonTransport, pokaż wygenerowany email
      if (result.message) {
        console.log("📄 Generated email content:", result.message);
      }
    } else {
      console.log("✅ Email sent (production):", {
        to: to,
        messageId: result.messageId,
      });
    }

    return {
      success: true,
      messageId: result.messageId,
      response: result.response,
      previewUrl: process.env.NODE_ENV !== "production" ? null : null,
    };
  } catch (error) {
    console.error("❌ Error sending email:", error);

    // Bardziej szczegółowe logowanie błędu
    if (error.code) {
      console.error("Email error code:", error.code);
    }
    if (error.response) {
      console.error("Email error response:", error.response);
    }

    throw error;
  }
};

// Domyślny szablon HTML gdy nie ma dedykowanego szablonu
const generateDefaultTemplate = (subject, data) => {
  const currentYear = new Date().getFullYear();

  return `
<!DOCTYPE html>
<html lang="pl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${subject}</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            max-width: 600px; 
            margin: 0 auto; 
            padding: 20px;
            background-color: #f4f4f4;
        }
        .email-container {
            background-color: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header { 
            background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%);
            color: white; 
            padding: 30px; 
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 300;
        }
        .content { 
            padding: 30px;
        }
        .button { 
            display: inline-block; 
            background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
            color: white; 
            padding: 15px 30px; 
            text-decoration: none; 
            border-radius: 25px; 
            margin: 20px 0;
            font-weight: bold;
        }
        .footer { 
            background-color: #f8f9fa;
            text-align: center; 
            font-size: 14px; 
            color: #666; 
            padding: 20px;
            border-top: 1px solid #e9ecef;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>🏥 FizjoCare</h1>
            <p>${subject}</p>
        </div>
        <div class="content">
            ${
              data?.customMessage ||
              data?.message ||
              "Wiadomość z systemu FizjoCare"
            }
            ${
              data?.resetUrl
                ? `<p style="text-align: center;"><a href="${data.resetUrl}" class="button">Ustaw hasło</a></p>`
                : ""
            }
            ${
              data?.expiresAt
                ? `<p><small><strong>Link wygasa:</strong> ${data.expiresAt}</small></p>`
                : ""
            }
            
            ${
              data?.resetUrl
                ? `
            <p>Jeśli nie możesz kliknąć w przycisk, skopiuj i wklej ten link do przeglądarki:</p>
            <p style="word-break: break-all; background-color: #f8f9fa; padding: 10px; border-radius: 4px; font-family: monospace; font-size: 14px;">
                ${data.resetUrl}
            </p>
            `
                : ""
            }
        </div>
        <div class="footer">
            <p><strong>© ${currentYear} FizjoCare</strong></p>
            <p>Wszystkie prawa zastrzeżone.</p>
            ${
              data?.supportEmail
                ? `<p>Potrzebujesz pomocy? <a href="mailto:${data.supportEmail}">${data.supportEmail}</a></p>`
                : ""
            }
            <p style="font-size: 12px; color: #999; margin-top: 15px;">
                Jeśli nie spodziewałeś się tego emaila, zignoruj tę wiadomość.
            </p>
        </div>
    </div>
</body>
</html>`;
};

module.exports = {
  sendEmail,
  loadEmailTemplate,
  replaceTemplateVariables,
};
