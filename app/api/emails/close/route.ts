import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "../../../lib/auth";
import { updateEmailThreadStatus } from "../../../lib/data";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id } = body;
    if (!id) {
      return NextResponse.json({ error: "ID не указан" }, { status: 400 });
    }

    const thread = await updateEmailThreadStatus(id, "closed");
    if (!thread) {
      return NextResponse.json({ error: "Диалог не найден" }, { status: 404 });
    }

    return NextResponse.json({ success: true, thread });
  } catch (error) {
    console.error("Close thread error:", error);
    return NextResponse.json(
      { error: "Не удалось закрыть диалог" },
      { status: 500 }
    );
  }
}
