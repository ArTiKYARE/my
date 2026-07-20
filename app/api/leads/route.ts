import { NextRequest, NextResponse } from "next/server";
import { getSession, isAuthenticated } from "../../lib/auth";
import { addLead, deleteLead, getLeads, updateLead } from "../../lib/data";
import { appendActivity } from "../../lib/activity";
import { LeadStatus } from "../../lib/types";

const VALID_STATUSES: LeadStatus[] = ["new", "in-progress", "done", "archived"];

export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const leads = await getLeads();
    return NextResponse.json({ leads });
  } catch (error) {
    console.error("Leads GET error:", error);
    return NextResponse.json(
      { error: "Не удалось загрузить заявки" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const contact = typeof body.contact === "string" ? body.contact.trim() : "";
    const description =
      typeof body.description === "string" ? body.description.trim() : "";

    if (!name || !contact) {
      return NextResponse.json(
        { error: "Укажите имя и способ связи" },
        { status: 400 }
      );
    }
    if (description.length > 2000) {
      return NextResponse.json(
        { error: "Описание слишком длинное" },
        { status: 400 }
      );
    }

    const lead = await addLead({ name, contact, description });

    const session = await getSession();
    await appendActivity(session?.username ?? "unknown", "lead_create", name);

    return NextResponse.json({ success: true, lead });
  } catch (error) {
    console.error("Leads POST error:", error);
    return NextResponse.json(
      { error: "Не удалось создать заявку" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, status, comment, services, quantities } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Неверные данные" },
        { status: 400 }
      );
    }
    if (status !== undefined && !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: "Неверные данные" },
        { status: 400 }
      );
    }
    if (comment !== undefined && typeof comment !== "string") {
      return NextResponse.json(
        { error: "Неверные данные" },
        { status: 400 }
      );
    }
    if (
      services !== undefined &&
      (!Array.isArray(services) || services.some((s) => typeof s !== "string"))
    ) {
      return NextResponse.json(
        { error: "Неверные данные" },
        { status: 400 }
      );
    }
    if (
      quantities !== undefined &&
      (typeof quantities !== "object" || quantities === null || Array.isArray(quantities))
    ) {
      return NextResponse.json(
        { error: "Неверные данные" },
        { status: 400 }
      );
    }

    const updated = await updateLead(id, { status, comment, services, quantities });
    if (!updated) {
      return NextResponse.json(
        { error: "Заявка не найдена" },
        { status: 404 }
      );
    }

    const changed: string[] = [];
    if (status !== undefined) changed.push("статус");
    if (services !== undefined || quantities !== undefined) changed.push("услуги");
    if (comment !== undefined) changed.push("заметка");
    if (changed.length) {
      const session = await getSession();
      await appendActivity(
        session?.username ?? "unknown",
        "lead_update",
        `${updated.name} (изменено: ${changed.join(", ")})`
      );
    }

    return NextResponse.json({ success: true, lead: updated });
  } catch (error) {
    console.error("Leads PATCH error:", error);
    return NextResponse.json(
      { error: "Не удалось обновить заявку" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const id = typeof body.id === "string" ? body.id : "";
    if (!id) {
      return NextResponse.json(
        { error: "Неверные данные" },
        { status: 400 }
      );
    }

    const leads = await getLeads();
    const target = leads.find((l) => l.id === id);

    const deleted = await deleteLead(id);
    if (!deleted) {
      return NextResponse.json(
        { error: "Заявка не найдена" },
        { status: 404 }
      );
    }

    const session = await getSession();
    await appendActivity(
      session?.username ?? "unknown",
      "lead_delete",
      target?.name ?? id
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Leads DELETE error:", error);
    return NextResponse.json(
      { error: "Не удалось удалить заявку" },
      { status: 500 }
    );
  }
}
