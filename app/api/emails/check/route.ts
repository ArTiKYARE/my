import { NextResponse } from "next/server";
import { isAuthenticated } from "../../../lib/auth";
import { checkEmailReplies } from "../../../lib/email-client";

export const dynamic = "force-dynamic";

export async function GET() {
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await checkEmailReplies();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Check replies error:", error);
    return NextResponse.json(
      { success: false, newReplies: 0, error: String(error) },
      { status: 500 }
    );
  }
}
