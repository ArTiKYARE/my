import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "../../lib/auth";
import { getLeads, updateLead } from "../../lib/data";
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

    return NextResponse.json({ success: true, lead: updated });
  } catch (error) {
    console.error("Leads PATCH error:", error);
    return NextResponse.json(
      { error: "Не удалось обновить заявку" },
      { status: 500 }
    );
  }
}
