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

export async function sendLeadNotification(lead: Lead): Promise<boolean> {
  try {
    const transporter = createTransporter();

    const to = getEnv("SMTP_TO") || "support@kos-ko.ru";
    const from = getEnv("SMTP_FROM") || getEnv("SMTP_USER") || "support@kos-ko.ru";

    const date = new Date(lead.createdAt).toLocaleString("ru-RU");

    await transporter.sendMail({
      from: `"Kos-Ko site" <${from}>`,
      to,
      subject: `Новая заявка с сайта от ${lead.name}`,
      text: [
        `Имя: ${lead.name}`,
        `Контакт: ${lead.contact}`,
        `Описание: ${lead.description || "не указано"}`,
        `Дата: ${date}`,
        `ID: ${lead.id}`,
      ].join("\n"),
      html: [
        `<h2>Новая заявка с сайта Kos-Ko</h2>`,
        `<p><strong>Имя:</strong> ${escapeHtml(lead.name)}</p>`,
        `<p><strong>Контакт:</strong> ${escapeHtml(lead.contact)}</p>`,
        `<p><strong>Описание:</strong> ${escapeHtml(lead.description) || "не указано"}</p>`,
        `<p><strong>Дата:</strong> ${date}</p>`,
        `<p><strong>ID:</strong> ${lead.id}</p>`,
      ].join(""),
    });

    return true;
  } catch (error) {
    console.error("Failed to send lead email:", error);
    return false;
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
