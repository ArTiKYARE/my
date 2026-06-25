import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const LEADS_FILE = path.join(process.cwd(), "data", "leads.json");

interface Lead {
  id: string;
  name: string;
  contact: string;
  description: string;
  status: "new" | "in-progress" | "done" | "archived";
  createdAt: string;
}

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const name = String(formData.get("name") || "").trim();
    const contact = String(formData.get("contact") || "").trim();
    const description = String(formData.get("description") || "").trim();

    if (!name || !contact) {
      return NextResponse.json(
        { error: "Укажите имя и способ связи" },
        { status: 400 }
      );
    }

    if (name.length > 100 || contact.length > 100 || description.length > 2000) {
      return NextResponse.json(
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

    return NextResponse.json({ success: true, id: lead.id });
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { error: "Не удалось отправить заявку" },
      { status: 500 }
    );
  }
}
