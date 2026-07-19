import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "../../../../lib/auth";
import { getJob } from "../../../../lib/leadgen/jobs";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const job = getJob(id);
  if (!job) {
    return NextResponse.json({ error: "Задача не найдена" }, { status: 404 });
  }

  return NextResponse.json(job);
}
