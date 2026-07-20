import { NextResponse } from "next/server";
import { getSession } from "../../../lib/auth";
import { getActivity } from "../../../lib/activity";

// Журнал активности — только для role === "admin"
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.role !== "admin") {
    return NextResponse.json({ error: "Доступ запрещён" }, { status: 403 });
  }

  try {
    const activity = await getActivity();
    return NextResponse.json({ activity });
  } catch (error) {
    console.error("Activity GET error:", error);
    return NextResponse.json(
      { error: "Не удалось загрузить журнал" },
      { status: 500 }
    );
  }
}
