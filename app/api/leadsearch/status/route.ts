import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "../../../lib/auth";
import {
  addHuntLeadToFunnel,
  getHuntStatuses,
  HUNT_LEAD_STATUSES,
  HuntLeadStatus,
  setHuntStatus,
} from "../../../lib/leadgen/statuses";
import { HuntLead } from "../../../lib/leadgen/types";

export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const statuses = await getHuntStatuses();
    return NextResponse.json({ statuses });
  } catch (error) {
    console.error("Hunt status GET error:", error);
    return NextResponse.json(
      { error: "Не удалось загрузить статусы" },
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
    const key = typeof body?.key === "string" ? body.key.trim() : "";
    const status = body?.status;

    if (!key || !HUNT_LEAD_STATUSES.includes(status as HuntLeadStatus)) {
      return NextResponse.json({ error: "Неверные данные" }, { status: 400 });
    }

    const statuses = await setHuntStatus(key, status as HuntLeadStatus);

    // «Согласен» — переносим лида в основную воронку заявок
    let addedToLeads: boolean | undefined;
    if (status === "agreed") {
      const lead = body?.lead;
      if (!lead || typeof lead !== "object" || typeof lead.name !== "string") {
        return NextResponse.json(
          { error: "Для статуса agreed нужен объект lead" },
          { status: 400 }
        );
      }
      addedToLeads = await addHuntLeadToFunnel(lead as HuntLead);
    }

    return NextResponse.json({ success: true, statuses, addedToLeads });
  } catch (error) {
    console.error("Hunt status POST error:", error);
    return NextResponse.json(
      { error: "Не удалось сохранить статус" },
      { status: 500 }
    );
  }
}
