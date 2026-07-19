import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "../../../lib/auth";
import { createJob } from "../../../lib/leadgen/jobs";
import { SearchParams, SearchSource } from "../../../lib/leadgen/types";
import { TWOGIS_KEY_ERROR } from "../../../lib/leadgen/providers";

const VALID_SOURCES: SearchSource[] = ["yandex", "2gis", "both"];

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

  const city = typeof body.city === "string" ? body.city.trim() : "";
  if (!city) {
    return NextResponse.json({ error: "Укажите город" }, { status: 400 });
  }

  const queries = (Array.isArray(body.queries) ? body.queries : [])
    .filter((q): q is string => typeof q === "string")
    .map((q) => q.trim())
    .filter(Boolean)
    .slice(0, 30);
  if (!queries.length) {
    return NextResponse.json({ error: "Укажите хотя бы одну нишу" }, { status: 400 });
  }

  if (!VALID_SOURCES.includes(body.source as SearchSource)) {
    return NextResponse.json(
      { error: "Неверный источник: ожидается yandex, 2gis или both" },
      { status: 400 }
    );
  }
  const source = body.source as SearchSource;

  let limit = Number(body.limit);
  if (!Number.isFinite(limit)) limit = 20;
  limit = Math.min(50, Math.max(5, Math.round(limit)));

  const analyze = typeof body.analyze === "boolean" ? body.analyze : true;
  const find_email = typeof body.find_email === "boolean" ? body.find_email : true;
  const api_key = typeof body.api_key === "string" ? body.api_key.trim() : "";

  if ((source === "2gis" || source === "both") && !api_key && !process.env.TWOGIS_API_KEY) {
    return NextResponse.json({ error: TWOGIS_KEY_ERROR }, { status: 400 });
  }

  const params: SearchParams = { city, queries, source, limit, analyze, find_email, api_key };
  const job_id = createJob(params);
  return NextResponse.json({ job_id });
}
