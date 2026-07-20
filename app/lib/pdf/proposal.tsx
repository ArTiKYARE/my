// Шаблон коммерческого предложения (PDF) по выбранным в заявке услугам.

import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer,
} from "@react-pdf/renderer";
import { Lead } from "../types";
import { Profile } from "../types";
import { calcLeadTotals, fmt, CalcRow, LeadTotals } from "./calc";
import { registerPdfFonts } from "./fonts";

// Контакты студии в КП — фиксированные (Telegram в КП не выводим)
const STUDIO_EMAIL = "support@kos-ko.ru";
const STUDIO_PHONE = "+7 960 983 90 64";

const ACCENT = "#3b82f6";
const INK = "#0f172a";
const GRAY = "#64748b";
const LINE = "#e2e8f0";
const CAT_BG = "#f1f5f9";
const ZEBRA_BG = "#f8fafc";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Roboto",
    fontSize: 9,
    color: INK,
    paddingTop: 42,
    paddingBottom: 64,
    paddingHorizontal: 46,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  brand: { fontSize: 17, fontWeight: 700 },
  brandSub: { fontSize: 9, color: GRAY, marginTop: 2 },
  docTitle: { fontSize: 12, fontWeight: 500, textAlign: "right" },
  docMeta: { fontSize: 8.5, color: GRAY, textAlign: "right", marginTop: 2 },
  accentLine: {
    height: 2,
    backgroundColor: ACCENT,
    marginTop: 12,
    marginBottom: 18,
  },
  forBlock: { marginBottom: 16 },
  forLabel: { fontSize: 8, color: GRAY, textTransform: "uppercase", letterSpacing: 0.6 },
  forName: { fontSize: 12, fontWeight: 700, marginTop: 3 },
  forContact: { fontSize: 9.5, color: INK, marginTop: 2 },
  table: { borderWidth: 1, borderColor: LINE, borderRadius: 3 },
  tr: { flexDirection: "row", alignItems: "flex-start" },
  trHead: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: LINE,
    paddingVertical: 5,
    paddingHorizontal: 8,
  },
  th: { fontSize: 8, fontWeight: 700, color: GRAY, textTransform: "uppercase", letterSpacing: 0.4 },
  trCat: {
    flexDirection: "row",
    backgroundColor: CAT_BG,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  tdCat: { fontSize: 8.5, fontWeight: 700 },
  trRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 5,
    paddingHorizontal: 8,
  },
  cNum: { width: 22 },
  cName: { flexGrow: 1, paddingRight: 8 },
  cQty: { width: 52, textAlign: "center" },
  cPrice: { width: 72, textAlign: "right" },
  cSum: { width: 82, textAlign: "right" },
  rowNote: { fontSize: 7.5, color: GRAY, marginTop: 1 },
  rowSum: { fontWeight: 500 },
  totals: { marginTop: 14, alignItems: "flex-end" },
  totalMain: { fontSize: 12, fontWeight: 700 },
  totalMonthly: { fontSize: 10, fontWeight: 500, marginTop: 3 },
  notes: { marginTop: 22 },
  noteLine: { fontSize: 7.5, color: GRAY, marginBottom: 2 },
  footer: {
    position: "absolute",
    bottom: 28,
    left: 46,
    right: 46,
    borderTopWidth: 1,
    borderTopColor: LINE,
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: { fontSize: 8, color: GRAY },
});

function profileContacts(profile: Profile): string {
  const c = profile.contacts ?? {};
  const parts: (string | undefined)[] = [c.website];
  if (c.email && c.email !== STUDIO_EMAIL) parts.push(c.email);
  parts.push(STUDIO_EMAIL);
  if (c.phone && c.phone !== STUDIO_PHONE) parts.push(c.phone);
  parts.push(STUDIO_PHONE);
  return parts.filter(Boolean).join("  ·  ");
}

function groupByCategory(rows: CalcRow[]): [string, CalcRow[]][] {
  const groups: [string, CalcRow[]][] = [];
  for (const row of rows) {
    const last = groups[groups.length - 1];
    if (last && last[0] === row.category) {
      last[1].push(row);
    } else {
      groups.push([row.category, [row]]);
    }
  }
  return groups;
}

function ProposalDocument({
  lead,
  profile,
  totals,
}: {
  lead: Lead;
  profile: Profile;
  totals: LeadTotals;
}) {
  const { rows, oneTime, monthly } = totals;
  const today = new Date().toLocaleDateString("ru-RU");
  const groups = groupByCategory(rows);
  let rowIndex = 0;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.brand}>Kos-Ko</Text>
            <Text style={styles.brandSub}>веб-студия</Text>
          </View>
          <View>
            <Text style={styles.docTitle}>Коммерческое предложение</Text>
            <Text style={styles.docMeta}>№ КП-{lead.id}</Text>
            <Text style={styles.docMeta}>{today}</Text>
          </View>
        </View>
        <View style={styles.accentLine} />

        <View style={styles.forBlock}>
          <Text style={styles.forLabel}>Подготовлено для</Text>
          <Text style={styles.forName}>{lead.name}</Text>
          <Text style={styles.forContact}>{lead.contact}</Text>
        </View>

        <View style={styles.table}>
          <View style={styles.trHead} fixed>
            <Text style={[styles.th, styles.cNum]}>№</Text>
            <Text style={[styles.th, styles.cName]}>Услуга</Text>
            <Text style={[styles.th, styles.cQty]}>Кол-во</Text>
            <Text style={[styles.th, styles.cPrice]}>Цена</Text>
            <Text style={[styles.th, styles.cSum]}>Сумма</Text>
          </View>
          {groups.map(([category, categoryRows]) => (
            <View key={category}>
              <View style={styles.trCat}>
                <Text style={styles.tdCat}>{category}</Text>
              </View>
              {categoryRows.map((row) => {
                rowIndex += 1;
                const zebra = rowIndex % 2 === 0;
                return (
                  <View
                    key={`${category}-${rowIndex}`}
                    style={[styles.trRow, zebra ? { backgroundColor: ZEBRA_BG } : {}]}
                  >
                    <Text style={styles.cNum}>{rowIndex}</Text>
                    <View style={styles.cName}>
                      <Text>{row.name}</Text>
                      {row.note ? <Text style={styles.rowNote}>{row.note}</Text> : null}
                    </View>
                    <Text style={styles.cQty}>
                      {row.qty ? `${row.qty} ${row.unit}` : row.monthly ? "мес" : "—"}
                    </Text>
                    <Text style={styles.cPrice}>
                      {row.percent ? `${row.price} %` : fmt(row.price)}
                    </Text>
                    <Text style={[styles.cSum, styles.rowSum]}>
                      {fmt(row.sum)}
                      {row.monthly ? "/мес" : ""}
                    </Text>
                  </View>
                );
              })}
            </View>
          ))}
        </View>

        <View style={styles.totals}>
          <Text style={styles.totalMain}>Итого разово: {fmt(oneTime)}</Text>
          {monthly > 0 ? (
            <Text style={styles.totalMonthly}>Ежемесячно: {fmt(monthly)}/мес</Text>
          ) : null}
        </View>

        <View style={styles.notes}>
          <Text style={styles.noteLine}>
            Цены базовые («от»): точная смета рассчитывается после согласования
            технического задания.
          </Text>
          <Text style={styles.noteLine}>
            Настоящее предложение не является публичной офертой.
          </Text>
          <Text style={styles.noteLine}>
            Сроки выполнения работ уточняются после согласования объёма.
          </Text>
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>Kos-Ko — веб-студия</Text>
          <Text style={styles.footerText}>{profileContacts(profile)}</Text>
        </View>
      </Page>
    </Document>
  );
}

export async function renderProposalPdf(lead: Lead, profile: Profile): Promise<Buffer> {
  registerPdfFonts();
  const totals = await calcLeadTotals(lead);
  return renderToBuffer(<ProposalDocument lead={lead} profile={profile} totals={totals} />);
}
