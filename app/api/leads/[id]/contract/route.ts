import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "../../../../lib/auth";
import { getLeads, getProfile } from "../../../../lib/data";
import { renderContractPdf } from "../../../../lib/pdf/contract";
import { renderContractDocx } from "../../../../lib/docx/contract";

const DOCX_CONTENT_TYPE =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Некорректный JSON" }, { status: 400 });
  }

  const customerName = typeof body.customerName === "string" ? body.customerName.trim() : "";
  const customerContact =
    typeof body.customerContact === "string" ? body.customerContact.trim() : "";
  if (!customerName || !customerContact) {
    return NextResponse.json(
      { error: "Укажите название и контакты заказчика" },
      { status: 400 }
    );
  }
  const executorName = typeof body.executorName === "string" ? body.executorName.trim() : "";
  const executorContact =
    typeof body.executorContact === "string" ? body.executorContact.trim() : "";
  const fmt = body.fmt === undefined ? "pdf" : body.fmt;
  if (fmt !== "pdf" && fmt !== "docx") {
    return NextResponse.json(
      { error: "Формат должен быть pdf или docx" },
      { status: 400 }
    );
  }

  try {
    const leads = await getLeads();
    const lead = leads.find((l) => l.id === id);
    if (!lead) {
      return NextResponse.json({ error: "Заявка не найдена" }, { status: 404 });
    }
    if (!lead.services || lead.services.length === 0) {
      return NextResponse.json(
        { error: "Сначала выберите услуги в карточке заявки" },
        { status: 400 }
      );
    }

    const profile = await getProfile();
    const parties = {
      customerName,
      customerContact,
      executorName: executorName || undefined,
      executorContact: executorContact || undefined,
    };

    if (fmt === "docx") {
      const docx = await renderContractDocx(lead, profile, parties);
      return new Response(new Uint8Array(docx), {
        headers: {
          "Content-Type": DOCX_CONTENT_TYPE,
          "Content-Disposition": `attachment; filename="Dogovor-${lead.id}.docx"`,
        },
      });
    }

    const pdf = await renderContractPdf(lead, profile, parties);

    return new Response(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Dogovor-${lead.id}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Contract error:", error);
    return NextResponse.json(
      { error: "Не удалось сформировать договор" },
      { status: 500 }
    );
  }
}
