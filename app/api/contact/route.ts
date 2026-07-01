import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { sendLeadNotification } from "../../lib/email";

const LEADS_FILE = path.join(process.cwd(), "data", "leads.json");

interface Lead {
  id: string;
  name: string;
  contact: string;
  description: string;
  status: "new" | "in-progress" | "done" | "archived";
  createdAt: string;
}

interface ContactPayload {
  name?: string;
  contact?: string;
  description?: string;
}

function corsResponse(body: unknown, init?: ResponseInit) {
  return NextResponse.json(body, {
    ...init,
    headers: {
      ...(init?.headers || {}),
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body: ContactPayload = await request.json();

    const name = String(body.name || "").trim();
    const contact = String(body.contact || "").trim();
    const description = String(body.description || "").trim();

    if (!name || !contact) {
      return corsResponse(
        { error: "Укажите имя и способ связи" },
        { status: 400 }
      );
    }

    if (name.length > 100 || contact.length > 100 || description.length > 2000) {
      return corsResponse(
        { error: "Одно из полей слишком длинное" },
        { status: 400 }
      );
    }

    const lead: Lead = {
      id: generateId(),
      name,
      contact,
      description,
      status: "new",
      createdAt: new Date().toISOString(),
    };

    let leads: Lead[] = [];
    try {
      const existing = await fs.readFile(LEADS_FILE, "utf-8");
      leads = JSON.parse(existing);
    } catch {
      // файла ещё нет — начинаем с пустого списка
    }

    leads.push(lead);
    await fs.mkdir(path.dirname(LEADS_FILE), { recursive: true });
    await fs.writeFile(LEADS_FILE, JSON.stringify(leads, null, 2));

    const emailSent = await sendLeadNotification(lead);
    if (!emailSent) {
      console.error(`Email notification failed for lead ${lead.id}`);
    }

    return corsResponse({ success: true, id: lead.id, emailSent });
  } catch (error) {
    console.error("Contact form error:", error);
    return corsResponse(
      { error: "Не удалось отправить заявку" },
      { status: 500 }
    );
  }
}
