// Договор на разработку сайта в формате DOCX.
// Те же 7 разделов и тексты, что в app/lib/pdf/contract.tsx.

import {
  AlignmentType,
  BorderStyle,
  Document,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import { Lead, Profile } from "../types";
import { calcLeadTotals, fmt } from "../pdf/calc";
import { ContractParties } from "../pdf/contract";

const FONT = "Roboto";

function text(t: string, opts?: { bold?: boolean; size?: number; color?: string }): TextRun {
  return new TextRun({
    text: t,
    font: FONT,
    bold: opts?.bold,
    size: opts?.size ?? 20, // half-points: 20 = 10pt
    color: opts?.color,
  });
}

function para(t: string, opts?: { bold?: boolean; size?: number; color?: string; align?: (typeof AlignmentType)[keyof typeof AlignmentType]; spacingAfter?: number }): Paragraph {
  return new Paragraph({
    children: [text(t, opts)],
    alignment: opts?.align,
    spacing: { after: opts?.spacingAfter ?? 100 },
  });
}

function sectionTitle(t: string): Paragraph {
  return new Paragraph({
    children: [text(t, { bold: true, size: 22 })],
    spacing: { before: 240, after: 120 },
  });
}

function profileContactLine(profile: Profile): string {
  const c = profile.contacts ?? {};
  return [c.website, c.email, c.phone, c.telegram && `Telegram: ${c.telegram}`]
    .filter(Boolean)
    .join(", ");
}

const SIGN_LINE = "_____________________________";

export async function renderContractDocx(
  lead: Lead,
  profile: Profile,
  parties: ContractParties
): Promise<Buffer> {
  const { rows, oneTime, monthly } = await calcLeadTotals(lead);
  const today = new Date().toLocaleDateString("ru-RU");
  const executorName = parties.executorName || profile.name || "Kos-Ko";
  const executorContact = parties.executorContact || profileContactLine(profile);
  const oneTimeRows = rows.filter((r) => !r.monthly);
  const monthlyRows = rows.filter((r) => r.monthly);

  const children: (Paragraph | Table)[] = [];

  // Шапка
  children.push(
    para("ДОГОВОР № ______", { bold: true, size: 30, align: AlignmentType.CENTER }),
    para("на разработку сайта", { bold: true, size: 24, align: AlignmentType.CENTER, spacingAfter: 240 }),
    new Paragraph({
      children: [
        text("г. ______________"),
        text("\t\t" + today),
      ],
      spacing: { after: 240 },
    }),
    para(
      `${executorName} (${executorContact}), именуемый в дальнейшем «Исполнитель», с одной стороны, и ${parties.customerName} (${parties.customerContact}), именуемый в дальнейшем «Заказчик», с другой стороны, заключили настоящий договор о нижеследующем.`,
      { spacingAfter: 200 }
    )
  );

  // 1. Предмет договора
  children.push(
    sectionTitle("1. Предмет договора"),
    para(
      "1.1. Исполнитель обязуется выполнить, а Заказчик — принять и оплатить следующие работы:"
    )
  );
  oneTimeRows.forEach((row, i) => {
    const line =
      `${i + 1}. ${row.name}` +
      (row.qty ? ` — ${row.qty} ${row.unit}` : "") +
      (row.percent ? ` (${row.price}% от стоимости работ)` : "") +
      (row.note ? `. ${row.note}` : "");
    children.push(para(line, { spacingAfter: 60 }));
  });
  if (monthlyRows.length > 0) {
    children.push(
      para(
        `1.2. Дополнительно Заказчик поручает, а Исполнитель принимает на себя ежемесячное обслуживание: ${monthlyRows
          .map((r) => r.name.toLowerCase())
          .join(", ")}.`,
        { spacingAfter: 120 }
      )
    );
  }

  // 2. Стоимость и порядок оплаты
  children.push(
    sectionTitle("2. Стоимость и порядок оплаты"),
    para(`2.1. Общая стоимость работ по п. 1.1 составляет ${fmt(oneTime)}.`),
    para(
      "2.2. Заказчик вносит предоплату в размере 50% стоимости работ в течение 5 (пяти) рабочих дней с даты подписания договора. Оставшиеся 50% оплачиваются после подписания акта сдачи-приёмки работ."
    )
  );
  if (monthly > 0) {
    children.push(
      para(
        `2.3. Ежемесячное обслуживание оплачивается отдельно: ${fmt(monthly)} в месяц, не позднее 5 (пятого) числа расчётного месяца.`
      )
    );
  }

  // 3. Сроки
  children.push(
    sectionTitle("3. Сроки выполнения работ"),
    para(
      "3.1. Ориентировочные сроки выполнения работ указываются в техническом задании, являющемся неотъемлемой частью настоящего договора."
    ),
    para(
      "3.2. При срочной разработке к стоимости работ применяется повышающий коэффициент от 1,3 до 1,5 по согласованию сторон."
    )
  );

  // 4. Сдача-приёмка
  children.push(
    sectionTitle("4. Порядок сдачи-приёмки"),
    para(
      "4.1. В стоимость включены два раунда правок по каждому этапу работ. Дополнительные правки и доработки сверх согласованного объёма оплачиваются по часовой ставке 1 500 ₽/час."
    ),
    para(
      "4.2. Заказчик рассматривает результат работ в течение 5 (пяти) рабочих дней и подписывает акт сдачи-приёмки либо направляет мотивированный перечень замечаний."
    )
  );

  // 5. Гарантии
  children.push(
    sectionTitle("5. Гарантии"),
    para(
      "5.1. Исполнитель предоставляет гарантию 3 (три) месяца на исправление технических ошибок в выполненных работах с момента подписания акта сдачи-приёмки."
    )
  );

  // 6. Прочие условия
  children.push(
    sectionTitle("6. Прочие условия"),
    para(
      "6.1. Расходы на домен, хостинг и сторонние лицензии (плагины, фотографии, сервисы) оплачивает Заказчик."
    ),
    para(
      "6.2. Договор составлен в двух экземплярах, имеющих равную юридическую силу, по одному для каждой из сторон."
    )
  );

  // 7. Реквизиты и подписи — две колонки без границ
  children.push(sectionTitle("7. Реквизиты и подписи сторон"));
  const noBorders = {
    top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
    bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
    left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
    right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  };
  const partyCell = (title: string, name: string, contact: string) =>
    new TableCell({
      borders: noBorders,
      width: { size: 50, type: WidthType.PERCENTAGE },
      children: [
        para(title, { bold: true, size: 22 }),
        para(name),
        para(contact),
        para("", { spacingAfter: 480 }),
        para(SIGN_LINE, { spacingAfter: 40 }),
        para("подпись / ФИО / дата", { size: 16, color: "6b7280" }),
      ],
    });
  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: noBorders,
      rows: [
        new TableRow({
          children: [
            partyCell("Исполнитель", executorName, executorContact),
            partyCell("Заказчик", parties.customerName, parties.customerContact),
          ],
        }),
      ],
    })
  );

  const doc = new Document({
    sections: [{ children }],
  });
  return Packer.toBuffer(doc);
}
