import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "../../../../../lib/auth";
import { getJobLeads, getJobRawStatus } from "../../../../../lib/leadgen/jobs";
import { HuntLead } from "../../../../../lib/leadgen/types";

// Колонки как в Python exporter.py (leadgen/models.py COLUMNS)
const COLUMNS: [keyof HuntLead, string][] = [
  ["name", "Название"],
  ["category", "Рубрика"],
  ["city", "Город"],
  ["address", "Адрес"],
  ["phone", "Телефон"],
  ["email", "Email"],
  ["website", "Сайт"],
  ["site_status", "Статус сайта"],
  ["site_cms", "CMS/конструктор"],
  ["score", "Оценка лида"],
  ["notes", "Примечания"],
  ["rating", "Рейтинг"],
  ["reviews", "Отзывов"],
  ["source", "Источник"],
  ["source_url", "Ссылка на карточку"],
];

function csvCell(value: unknown): string {
  const s = value === null || value === undefined ? "" : String(value);
  if (/[;"\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const fmt = request.nextUrl.searchParams.get("fmt") || "csv";
  if (fmt !== "csv") {
    return NextResponse.json(
      { error: "Поддерживается только fmt=csv" },
      { status: 400 }
    );
  }

  const { id } = await params;
  const status = getJobRawStatus(id);
  if (!status) {
    return NextResponse.json({ error: "Задача не найдена" }, { status: 404 });
  }
  if (status !== "done") {
    return NextResponse.json(
      { error: "Задача ещё не завершена" },
      { status: 409 }
    );
  }

  const leads = getJobLeads(id) ?? [];
  const header = COLUMNS.map(([, label]) => csvCell(label)).join(";");
  const rows = leads.map((lead) =>
    COLUMNS.map(([key]) => csvCell(lead[key])).join(";")
  );
  // \uFEFF — BOM, чтобы Excel корректно открывал кириллицу (аналог utf-8-sig)
  const csv = "\uFEFF" + [header, ...rows].join("\r\n") + "\r\n";

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="leads-${id}.csv"`,
    },
  });
}
