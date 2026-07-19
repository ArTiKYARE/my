import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "../../../../lib/auth";
import { generateMessage } from "../../../../lib/leadgen/outreach";
import { SenderProfile } from "../../../../lib/leadgen/types";

const MAX_BATCH = 500;

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

  if (!Array.isArray(body.leads) || body.leads.length === 0) {
    return NextResponse.json({ error: "Укажите список лидов (leads)" }, { status: 400 });
  }
  if (body.leads.length > MAX_BATCH) {
    return NextResponse.json(
      { error: `Максимум ${MAX_BATCH} лидов за раз` },
      { status: 400 }
    );
  }

  const sender = buildSender(body.sender);
  const messages = body.leads.map((rawLead) => {
    const lead = (rawLead && typeof rawLead === "object" ? rawLead : {}) as Record<
      string,
      unknown
    >;
    const msg = generateMessage(lead, sender);
    return {
      name: typeof lead.name === "string" ? lead.name : "",
      email: typeof lead.email === "string" ? lead.email : "",
      phone: typeof lead.phone === "string" ? lead.phone : "",
      website: typeof lead.website === "string" ? lead.website : "",
      ...msg,
    };
  });

  return NextResponse.json({ messages });
}
