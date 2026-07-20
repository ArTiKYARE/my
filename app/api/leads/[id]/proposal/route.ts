import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "../../../../lib/auth";
import { getLeads, getProfile } from "../../../../lib/data";
import { renderProposalPdf } from "../../../../lib/pdf/proposal";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

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
    const pdf = await renderProposalPdf(lead, profile);

    return new Response(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="KP-${lead.id}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Proposal PDF error:", error);
    return NextResponse.json(
      { error: "Не удалось сформировать КП" },
      { status: 500 }
    );
  }
}
