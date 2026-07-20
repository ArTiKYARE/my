// Шаблон договора на разработку сайта (PDF) по выбранным в заявке услугам.
// Юридически нейтральный типовой текст — реквизиты сторон заполняет менеджер.

import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer,
} from "@react-pdf/renderer";
import { Lead, Profile } from "../types";
import { calcLeadTotals, fmt, LeadTotals } from "./calc";
import { registerPdfFonts } from "./fonts";

export interface ContractParties {
  customerName: string;
  customerContact: string;
  executorName?: string;
  executorContact?: string;
}

const INK = "#111827";
const GRAY = "#6b7280";
const LINE = "#d1d5db";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Roboto",
    fontSize: 9.5,
    lineHeight: 1.45,
    color: INK,
    paddingTop: 46,
    paddingBottom: 56,
    paddingHorizontal: 52,
  },
  title: { fontSize: 14, fontWeight: 700, textAlign: "center" },
  subtitle: { fontSize: 11, fontWeight: 500, textAlign: "center", marginTop: 3 },
  cityDate: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 14,
    marginBottom: 12,
  },
  cityDateText: { fontSize: 9.5 },
  preamble: { marginBottom: 12, textAlign: "justify" },
  sectionTitle: { fontSize: 10.5, fontWeight: 700, marginTop: 12, marginBottom: 5 },
  para: { marginBottom: 5, textAlign: "justify" },
  listItem: { flexDirection: "row", marginBottom: 3 },
  listNum: { width: 20 },
  listBody: { flexGrow: 1 },
  listNote: { color: GRAY, fontSize: 8.5 },
  parties: { flexDirection: "row", marginTop: 18 },
  partyCol: { width: "48%" },
  partyTitle: { fontSize: 10, fontWeight: 700, marginBottom: 6 },
  partyText: { fontSize: 9, marginBottom: 3 },
  signLine: {
    borderBottomWidth: 1,
    borderBottomColor: LINE,
    marginTop: 26,
    marginBottom: 3,
    width: "85%",
  },
  signHint: { fontSize: 8, color: GRAY },
  spacerCol: { width: "4%" },
  footer: {
    position: "absolute",
    bottom: 26,
    left: 52,
    right: 52,
    fontSize: 8,
    color: GRAY,
    textAlign: "center",
  },
});

function profileContactLine(profile: Profile): string {
  const c = profile.contacts ?? {};
  return [c.website, c.email, c.phone, c.telegram && `Telegram: ${c.telegram}`]
    .filter(Boolean)
    .join(", ");
}

function ContractDocument({
  lead,
  profile,
  parties,
  totals,
}: {
  lead: Lead;
  profile: Profile;
  parties: ContractParties;
  totals: LeadTotals;
}) {
  const { rows, oneTime, monthly } = totals;
  const today = new Date().toLocaleDateString("ru-RU");
  const executorName = parties.executorName || profile.name || "Kos-Ko";
  const executorContact = parties.executorContact || profileContactLine(profile);
  const oneTimeRows = rows.filter((r) => !r.monthly);
  const monthlyRows = rows.filter((r) => r.monthly);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>ДОГОВОР № ______</Text>
        <Text style={styles.subtitle}>на разработку сайта</Text>
        <View style={styles.cityDate}>
          <Text style={styles.cityDateText}>г. ______________</Text>
          <Text style={styles.cityDateText}>{today}</Text>
        </View>

        <Text style={styles.preamble}>
          {executorName} ({executorContact}), именуемый в дальнейшем «Исполнитель»,
          с одной стороны, и {parties.customerName} ({parties.customerContact}),
          именуемый в дальнейшем «Заказчик», с другой стороны, заключили настоящий
          договор о нижеследующем.
        </Text>

        <Text style={styles.sectionTitle}>1. Предмет договора</Text>
        <Text style={styles.para}>
          1.1. Исполнитель обязуется выполнить, а Заказчик — принять и оплатить
          следующие работы:
        </Text>
        {oneTimeRows.map((row, i) => (
          <View key={i} style={styles.listItem}>
            <Text style={styles.listNum}>{i + 1}.</Text>
            <View style={styles.listBody}>
              <Text>
                {row.name}
                {row.qty ? ` — ${row.qty} ${row.unit}` : ""}
                {row.percent ? ` (${row.price}% от стоимости работ)` : ""}
              </Text>
              {row.note ? <Text style={styles.listNote}>{row.note}</Text> : null}
            </View>
          </View>
        ))}
        {monthlyRows.length > 0 ? (
          <Text style={styles.para}>
            1.2. Дополнительно Заказчик поручает, а Исполнитель принимает на себя
            ежемесячное обслуживание:{" "}
            {monthlyRows.map((r) => r.name.toLowerCase()).join(", ")}.
          </Text>
        ) : null}

        <Text style={styles.sectionTitle}>2. Стоимость и порядок оплаты</Text>
        <Text style={styles.para}>
          2.1. Общая стоимость работ по п. 1.1 составляет {fmt(oneTime)}.
        </Text>
        <Text style={styles.para}>
          2.2. Заказчик вносит предоплату в размере 50% стоимости работ в течение
          5 (пяти) рабочих дней с даты подписания договора. Оставшиеся 50%
          оплачиваются после подписания акта сдачи-приёмки работ.
        </Text>
        {monthly > 0 ? (
          <Text style={styles.para}>
            2.3. Ежемесячное обслуживание оплачивается отдельно: {fmt(monthly)} в
            месяц, не позднее 5 (пятого) числа расчётного месяца.
          </Text>
        ) : null}

        <Text style={styles.sectionTitle}>3. Сроки выполнения работ</Text>
        <Text style={styles.para}>
          3.1. Ориентировочные сроки выполнения работ указываются в техническом
          задании, являющемся неотъемлемой частью настоящего договора.
        </Text>
        <Text style={styles.para}>
          3.2. При срочной разработке к стоимости работ применяется повышающий
          коэффициент от 1,3 до 1,5 по согласованию сторон.
        </Text>

        <Text style={styles.sectionTitle}>4. Порядок сдачи-приёмки</Text>
        <Text style={styles.para}>
          4.1. В стоимость включены два раунда правок по каждому этапу работ.
          Дополнительные правки и доработки сверх согласованного объёма
          оплачиваются по часовой ставке 1 500 ₽/час.
        </Text>
        <Text style={styles.para}>
          4.2. Заказчик рассматривает результат работ в течение 5 (пяти) рабочих
          дней и подписывает акт сдачи-приёмки либо направляет мотивированный
          перечень замечаний.
        </Text>

        <Text style={styles.sectionTitle}>5. Гарантии</Text>
        <Text style={styles.para}>
          5.1. Исполнитель предоставляет гарантию 3 (три) месяца на исправление
          технических ошибок в выполненных работах с момента подписания акта
          сдачи-приёмки.
        </Text>

        <Text style={styles.sectionTitle}>6. Прочие условия</Text>
        <Text style={styles.para}>
          6.1. Расходы на домен, хостинг и сторонние лицензии (плагины, фотографии,
          сервисы) оплачивает Заказчик.
        </Text>
        <Text style={styles.para}>
          6.2. Договор составлен в двух экземплярах, имеющих равную юридическую
          силу, по одному для каждой из сторон.
        </Text>

        <Text style={styles.sectionTitle}>7. Реквизиты и подписи сторон</Text>
        <View style={styles.parties}>
          <View style={styles.partyCol}>
            <Text style={styles.partyTitle}>Исполнитель</Text>
            <Text style={styles.partyText}>{executorName}</Text>
            <Text style={styles.partyText}>{executorContact}</Text>
            <View style={styles.signLine} />
            <Text style={styles.signHint}>подпись / ФИО / дата</Text>
          </View>
          <View style={styles.spacerCol} />
          <View style={styles.partyCol}>
            <Text style={styles.partyTitle}>Заказчик</Text>
            <Text style={styles.partyText}>{parties.customerName}</Text>
            <Text style={styles.partyText}>{parties.customerContact}</Text>
            <View style={styles.signLine} />
            <Text style={styles.signHint}>подпись / ФИО / дата</Text>
          </View>
        </View>

        <Text style={styles.footer}>
          Договор № ______ на разработку сайта · {executorName}
        </Text>
      </Page>
    </Document>
  );
}

export async function renderContractPdf(
  lead: Lead,
  profile: Profile,
  parties: ContractParties
): Promise<Buffer> {
  registerPdfFonts();
  const totals = await calcLeadTotals(lead);
  return renderToBuffer(
    <ContractDocument lead={lead} profile={profile} parties={parties} totals={totals} />
  );
}
