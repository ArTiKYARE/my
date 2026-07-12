"use server";

import nodemailer from "nodemailer";
import crypto from "crypto";
import { getEmailThreads, saveEmailThread, getEmailThreadById } from "./data";
import { EmailThread, EmailMessage } from "./types";

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

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
    .replace(/\n/g, "<br>");
}

function renderClientEmailHtml(body: string, threadId: string): string {
  const escapedBody = escapeHtml(body);
  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f4f4f5;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
          <tr>
            <td style="background-color:#0b0b0d;padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#fafafa;font-size:24px;font-weight:600;letter-spacing:-0.02em;">Kos-Ko</h1>
              <p style="margin:8px 0 0;color:#9ca3af;font-size:14px;">Веб-студия полного цикла</p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              <div style="color:#111827;font-size:16px;line-height:1.6;">${escapedBody}</div>
            </td>
          </tr>
          <tr>
            <td style="background-color:#f9fafb;padding:24px 40px;text-align:center;border-top:1px solid #e5e7eb;">
              <p style="margin:0 0 6px;color:#6b7280;font-size:13px;">С уважением, команда Kos-Ko</p>
              <p style="margin:0;color:#9ca3af;font-size:12px;"><a href="https://kos-ko.ru" style="color:#2563eb;text-decoration:none;">kos-ko.ru</a> · <a href="mailto:support@kos-ko.ru" style="color:#2563eb;text-decoration:none;">support@kos-ko.ru</a></p>
              <p style="margin:12px 0 0;color:#d1d5db;font-size:11px;">ID диалога: ${threadId}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

interface SendClientEmailData {
  to: string;
  toName?: string;
  subject: string;
  body: string;
  threadId?: string;
}

export async function sendClientEmail(data: SendClientEmailData) {
  const to = data.to.trim();
  const toName = (data.toName || "").trim();
  const subject = data.subject.trim();
  const body = data.body.trim();
  const threadId = data.threadId || crypto.randomUUID();

  if (!to || !subject || !body) {
    return { error: "Получатель, тема и текст письма обязательны" };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(to)) {
    return { error: "Некорректный email получателя" };
  }

  const transporter = createTransporter();
  const from = getEnv("SMTP_FROM") || getEnv("SMTP_USER") || "support@kos-ko.ru";
  const messageId = `${threadId}@kos-ko.ru`;

  try {
    await transporter.sendMail({
      from: `"Kos-Ko" <${from}>`,
      to: toName ? `"${toName}" <${to}>` : to,
      subject,
      text: body,
      html: renderClientEmailHtml(body, threadId),
      messageId,
      headers: {
        "X-KosKo-Thread": threadId,
      },
    });
  } catch (error) {
    console.error("Failed to send client email:", error);
    return { error: "Не удалось отправить письмо" };
  }

  const existingThread = await getEmailThreadById(threadId);
  const now = new Date().toISOString();

  const message: EmailMessage = {
    id: crypto.randomUUID(),
    from: "me",
    body,
    html: renderClientEmailHtml(body, threadId),
    createdAt: now,
  };

  if (existingThread) {
    existingThread.messages.push(message);
    existingThread.updatedAt = now;
    existingThread.status = existingThread.status === "replied" ? "replied" : "sent";
    await saveEmailThread(existingThread);
    return { success: true, thread: existingThread };
  }

  const thread: EmailThread = {
    id: threadId,
    to,
    toName,
    subject,
    messages: [message],
    status: "sent",
    createdAt: now,
    updatedAt: now,
    messageId,
  };

  await saveEmailThread(thread);
  return { success: true, thread };
}

export async function checkEmailReplies(): Promise<{
  success: boolean;
  newReplies: number;
  error?: string;
}> {
  try {
    const threads = await getEmailThreads();
    if (threads.length === 0) return { success: true, newReplies: 0 };

    const host = "mail.kos-ko.ru";
    const user = getEnv("SMTP_USER");
    const pass = getEnv("SMTP_PASS");
    if (!user || !pass) {
      return { success: false, newReplies: 0, error: "SMTP credentials not set" };
    }

    const imap = await import("imapflow").then((m) => m.default || m);
    // dynamic import to avoid bundling issues
    const { ImapFlow } = imap;
    const client = new ImapFlow({
      host,
      port: 993,
      secure: true,
      auth: { user, pass },
      logger: false,
    });

    await client.connect();
    await client.mailboxOpen("INBOX", { readOnly: true });

    let newReplies = 0;

    for (const thread of threads) {
      const searchResult = await client.search({
        seen: false,
        header: { "in-reply-to": thread.messageId },
      });

      if (!searchResult || searchResult.length === 0) continue;

      for (const uid of searchResult) {
        const msg = await client.fetchOne(uid.toString(), { source: true });
        if (!msg || !msg.source) continue;
        const source = msg.source;

        const parsed = await import("mailparser").then((m) =>
          m.simpleParser(source)
        );

        const replyBody =
          parsed.text ||
          (parsed.html ? parsed.html.replace(/<[^>]+>/g, " ") : "");
        if (!replyBody.trim()) continue;

        const alreadyExists = thread.messages.some(
          (m) =>
            m.from === "client" &&
            Math.abs(
              new Date(m.createdAt).getTime() -
                (parsed.date?.getTime() || Date.now())
            ) < 60000
        );
        if (alreadyExists) continue;

        thread.messages.push({
          id: crypto.randomUUID(),
          from: "client",
          body: replyBody.trim(),
          html: parsed.html || undefined,
          createdAt: parsed.date?.toISOString() || new Date().toISOString(),
        });
        thread.status = "replied";
        thread.updatedAt = new Date().toISOString();
        newReplies++;
      }
    }

    if (newReplies > 0) {
      const threadsToSave = await getEmailThreads();
      for (const thread of threads) {
        const idx = threadsToSave.findIndex((t) => t.id === thread.id);
        if (idx >= 0) {
          threadsToSave[idx] = thread;
        }
      }
      // save via saveEmailThread for each updated thread
      for (const thread of threads) {
        if (thread.status === "replied") {
          await saveEmailThread(thread);
        }
      }
    }

    await client.logout();
    return { success: true, newReplies };
  } catch (error) {
    console.error("Check email replies error:", error);
    return { success: false, newReplies: 0, error: String(error) };
  }
}
