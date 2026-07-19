import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "../../../lib/auth";
import {
  addFavoriteLead,
  getFavoriteLeads,
  removeFavoriteLead,
} from "../../../lib/leadgen/favorites";
import { HuntLead } from "../../../lib/leadgen/types";

export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const leads = await getFavoriteLeads();
    return NextResponse.json({ leads });
  } catch (error) {
    console.error("Favorites GET error:", error);
    return NextResponse.json(
      { error: "Не удалось загрузить избранное" },
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
    const lead = body?.lead;
    if (!lead || typeof lead !== "object" || typeof lead.name !== "string") {
      return NextResponse.json({ error: "Неверные данные" }, { status: 400 });
    }

    const leads = await addFavoriteLead(lead as HuntLead);
    return NextResponse.json({ success: true, leads });
  } catch (error) {
    console.error("Favorites POST error:", error);
    return NextResponse.json(
      { error: "Не удалось добавить в избранное" },
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
    const key = body?.key;
    if (typeof key !== "string" || !key) {
      return NextResponse.json({ error: "Неверные данные" }, { status: 400 });
    }

    const leads = await removeFavoriteLead(key);
    return NextResponse.json({ success: true, leads });
  } catch (error) {
    console.error("Favorites DELETE error:", error);
    return NextResponse.json(
      { error: "Не удалось удалить из избранного" },
      { status: 500 }
    );
  }
}
