// Расчёт стоимости по выбранным в заявке услугам — общая логика для PDF
// (та же, что в UI карточки заявки).

import { Lead } from "../types";
import { getServiceCatalog, ServiceItem } from "../services";

export interface CalcRow {
  category: string; // категория из каталога (для группировки в таблице)
  name: string;
  note?: string;
  qty?: number; // количество (для unit "час"/"шт")
  unit?: string; // "час" | "шт" | "мес" | "%"
  price: number; // базовая цена (для percent — значение процента)
  sum: number; // итог по строке в рублях
  monthly: boolean; // true — ежемесячная услуга
  percent: boolean; // true — price это процент от суммы разовых работ
}

export interface LeadTotals {
  rows: CalcRow[];
  oneTime: number; // итого разово (включая percent-позиции)
  monthly: number; // итого ежемесячно
}

/** Форматирование суммы: 12 345 ₽ */
export function fmt(n: number): string {
  return new Intl.NumberFormat("ru-RU").format(n) + " ₽";
}

function isMonthly(item: ServiceItem): boolean {
  return item.unit === "мес";
}

function hasQty(item: ServiceItem): boolean {
  return item.unit === "час" || item.unit === "шт";
}

export async function calcLeadTotals(lead: Lead): Promise<LeadTotals> {
  const catalog = await getServiceCatalog();
  const selected = new Set(lead.services ?? []);
  const quantities = lead.quantities ?? {};

  const rows: CalcRow[] = [];
  let oneTimeBase = 0; // сумма разовых работ без percent-позиций
  let monthly = 0;
  const percentRows: CalcRow[] = [];

  for (const category of catalog) {
    for (const item of category.items) {
      if (!selected.has(item.id)) continue;

      if (item.percent) {
        // сумму посчитаем после остальных разовых позиций
        percentRows.push({
          category: category.category,
          name: item.name,
          note: item.note,
          unit: "%",
          price: item.price,
          sum: 0,
          monthly: false,
          percent: true,
        });
        continue;
      }

      if (isMonthly(item)) {
        monthly += item.price;
        rows.push({
          category: category.category,
          name: item.name,
          note: item.note,
          unit: "мес",
          price: item.price,
          sum: item.price,
          monthly: true,
          percent: false,
        });
        continue;
      }

      const qty = hasQty(item) ? Math.max(1, Math.round(quantities[item.id] ?? 1)) : undefined;
      const sum = item.price * (qty ?? 1);
      oneTimeBase += sum;
      rows.push({
        category: category.category,
        name: item.name,
        note: item.note,
        qty,
        unit: item.unit,
        price: item.price,
        sum,
        monthly: false,
        percent: false,
      });
    }
  }

  // percent-позиции — процент от суммы остальных разовых работ
  let percentTotal = 0;
  for (const row of percentRows) {
    row.sum = Math.round((oneTimeBase * row.price) / 100);
    percentTotal += row.sum;
    rows.push(row);
  }

  return { rows, oneTime: oneTimeBase + percentTotal, monthly };
}
