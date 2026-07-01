import nodemailer from "nodemailer";

interface Lead {
  id: string;
  name: string;
  contact: string;
  description: string;
  createdAt: string;
}

function getEnv(name: string): string | undefined {
  return process.env[name]?.trim();
}

function createTransporter() {
  const host = getEnv("SMTP_HOST") || "mail.safescanget.ru";
  const port = Number(getEnv("SMTP_PORT") || "465");
  const user = getEnv("SMTP_USER");
  const pass = getEnv("SMTP_PASS");

  if (!user || !pass) {
    throw new Error("SMTP_USER и SMTP_PASS не настроены");
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    tls: {
      rejectUnauthorized: process.env.NODE_ENV === "production",
    },
  });
}

function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
    .replace(/\n/g, "<br>");
}

function renderEmailHtml(lead: Lead): string {
  const adminUrl = "https://kos-ko.ru/dashboard";
  const date = formatDate(lead.createdAt);
  const description = lead.description
    ? escapeHtml(lead.description)
    : '<span style="color:#9ca3af;font-style:italic;">Не указано</span>';

  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Новая заявка с сайта Kos-Ko</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f4f4f5;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
          <!-- Header -->
          <tr>
            <td style="background-color:#0b0b0d;padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#fafafa;font-size:24px;font-weight:600;letter-spacing:-0.02em;">Kos-Ko</h1>
              <p style="margin:8px 0 0;color:#9ca3af;font-size:14px;">Новая заявка с сайта</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <p style="margin:0 0 24px;color:#111827;font-size:16px;line-height:1.5;">
                Поступила новая заявка. Детали ниже.
              </p>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f9fafb;border-radius:10px;border:1px solid #e5e7eb;">
                <tr>
                  <td style="padding:20px 24px;border-bottom:1px solid #e5e7eb;">
                    <p style="margin:0 0 4px;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;">Имя</p>
                    <p style="margin:0;color:#111827;font-size:16px;font-weight:500;">${escapeHtml(lead.name)}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:20px 24px;border-bottom:1px solid #e5e7eb;">
                    <p style="margin:0 0 4px;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;">Контакт</p>
                    <p style="margin:0;color:#111827;font-size:16px;font-weight:500;">${escapeHtml(lead.contact)}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:20px 24px;border-bottom:1px solid #e5e7eb;">
                    <p style="margin:0 0 4px;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;">Описание проекта</p>
                    <p style="margin:0;color:#111827;font-size:15px;line-height:1.55;">${description}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 4px;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;">Дата и время</p>
                    <p style="margin:0;color:#111827;font-size:14px;">${date}</p>
                  </td>
                </tr>
              </table>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:28px;">
                <tr>
                  <td align="center">
                    <a href="${adminUrl}" style="display:inline-block;padding:14px 28px;background-color:#2563eb;color:#ffffff;text-decoration:none;border-radius:8px;font-size:15px;font-weight:500;">Открыть в админке</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f9fafb;padding:24px 40px;text-align:center;border-top:1px solid #e5e7eb;">
              <p style="margin:0 0 6px;color:#6b7280;font-size:13px;">Kos-Ko — разработка сайтов и веб-приложений</p>
              <p style="margin:0;color:#9ca3af;font-size:12px;">ID заявки: ${lead.id}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function renderEmailText(lead: Lead): string {
  const date = formatDate(lead.createdAt);
  return [
    `Новая заявка с сайта Kos-Ko`,
    ``,
    `Имя: ${lead.name}`,
    `Контакт: ${lead.contact}`,
    `Описание: ${lead.description || "не указано"}`,
    `Дата: ${date}`,
    `ID: ${lead.id}`,
    ``,
    `Открыть в админке: https://kos-ko.ru/dashboard`,
  ].join("\n");
}

export async function sendLeadNotification(lead: Lead): Promise<boolean> {
  try {
    const transporter = createTransporter();

    const to = getEnv("SMTP_TO") || "support@kos-ko.ru";
    const from = getEnv("SMTP_FROM") || getEnv("SMTP_USER") || "support@kos-ko.ru";

    await transporter.sendMail({
      from: `"Kos-Ko site" <${from}>`,
      to,
      subject: `Новая заявка от ${lead.name}`,
      text: renderEmailText(lead),
      html: renderEmailHtml(lead),
    });

    return true;
  } catch (error) {
    console.error("Failed to send lead email:", error);
    return false;
  }
}
