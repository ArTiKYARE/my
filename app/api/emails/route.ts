import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "../../lib/auth";
import { getEmailThreads } from "../../lib/data";
import { sendClientEmail } from "../../lib/email-client";

export const dynamic = "force-dynamic";

export async function GET() {
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const threads = await getEmailThreads();
    return NextResponse.json({ threads });
  } catch (error) {
    console.error("Emails GET error:", error);
    return NextResponse.json(
      { error: "Не удалось загрузить переписки" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const result = await sendClientEmail(formData);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Email send error:", error);
    return NextResponse.json(
      { error: "Не удалось отправить письмо" },
      { status: 500 }
    );
  }
}
