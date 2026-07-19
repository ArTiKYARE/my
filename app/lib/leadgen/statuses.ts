// Статусы hunt-лидов (воронка обзвона/рассылки) — data/hunt_lead_status.json.
// Формат: { [leadKey]: status }, где leadKey = leadKey(lead) из types.ts.
// Стиль — как favorites.ts. Дополнительно: перенос «согласившихся»
// в основную воронку заявок (data/leads.json, тип Lead из app/lib/types.ts).

import { promises as fs } from "fs";
import path from "path";
import { Lead } from "../types";
import { HuntLead } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const STATUSES_FILE = path.join(DATA_DIR, "hunt_lead_status.json");
const LEADS_FILE = path.join(DATA_DIR, "leads.json");

export type HuntLeadStatus = "new" | "contacted" | "replied" | "agreed" | "rejected";

export const HUNT_LEAD_STATUSES: HuntLeadStatus[] = [
  "new",
  "contacted",
  "replied",
  "agreed",
  "rejected",
];

async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

async function readStatusesFile(): Promise<Record<string, HuntLeadStatus>> {
  try {
    const content = await fs.readFile(STATUSES_FILE, "utf-8");
    const parsed = JSON.parse(content);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return parsed as Record<string, HuntLeadStatus>;
  } catch {
    return {};
  }
}

async function writeStatusesFile(statuses: Record<string, HuntLeadStatus>): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(STATUSES_FILE, JSON.stringify(statuses, null, 2), "utf-8");
}

export async function getHuntStatuses(): Promise<Record<string, HuntLeadStatus>> {
  return readStatusesFile();
}

/** Сохранить статус лида. Возвращает полный объект статусов. */
export async function setHuntStatus(
  key: string,
  status: HuntLeadStatus
): Promise<Record<string, HuntLeadStatus>> {
  const statuses = await readStatusesFile();
  statuses[key] = status;
  await writeStatusesFile(statuses);
  return statuses;
}

// Формат id — как в app/api/contact/route.ts
function generateLeadId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Перенести «согласившегося» лида в основную воронку заявок (data/leads.json).
 * Дедуп по name+contact (нижний регистр). Возвращает true, если заявка создана.
 */
export async function addHuntLeadToFunnel(lead: HuntLead): Promise<boolean> {
  const name = (lead.name || "").trim();
  const contact = (lead.phone || lead.email || "").trim();
  if (!name) return false;

  let leads: Lead[] = [];
  try {
    const content = await fs.readFile(LEADS_FILE, "utf-8");
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed)) leads = parsed as Lead[];
  } catch {
    // файла ещё нет — начинаем с пустого списка
  }

  const dupKey = `${name.toLowerCase()}|${contact.toLowerCase()}`;
  const exists = leads.some(
    (l) => `${(l.name || "").trim().toLowerCase()}|${(l.contact || "").trim().toLowerCase()}` === dupKey
  );
  if (exists) return false;

  const description = [
    `Ниша: ${lead.category || "—"}`,
    `Город: ${lead.city || "—"}`,
    `Сайт: ${lead.website || "нет"} (${lead.site_status || "не проверялся"})`,
    `Источник: Поиск лидов (${lead.source})`,
  ].join("\n");

  leads.push({
    id: generateLeadId(),
    name,
    contact,
    description,
    status: "new",
    createdAt: new Date().toISOString(),
  });

  await ensureDataDir();
  await fs.writeFile(LEADS_FILE, JSON.stringify(leads, null, 2), "utf-8");
  return true;
}
