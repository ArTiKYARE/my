import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "../../../lib/auth";
import { generateMessage } from "../../../lib/leadgen/outreach";
import { SenderProfile } from "../../../lib/leadgen/types";

function buildSender(raw: unknown): SenderProfile {
  const s = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  return {
    name: typeof s.name === "string" ? s.name : "",
    portfolio: typeof s.portfolio === "string" ? s.portfolio : "",
    contact: typeof s.contact === "string" ? s.contact : "",
    usp: typeof s.usp === "string" ? s.usp : "",
  };
}

export async function POST(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Некорректный JSON" }, { status: 400 });
  }

  if (!body.lead || typeof body.lead !== "object" || Array.isArray(body.lead)) {
    return NextResponse.json({ error: "Укажите лид (lead)" }, { status: 400 });
  }

  const message = generateMessage(
    body.lead as Record<string, unknown>,
    buildSender(body.sender)
  );
  return NextResponse.json(message);
}
