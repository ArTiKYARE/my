// Серверное хранилище избранных лидов — data/lead_favorites.json,
// чтобы избранное жило между сессиями и браузерами, как остальные данные
// приложения в data/*.json (стиль app/lib/data.ts).

import { promises as fs } from "fs";
import path from "path";
import { HuntLead, leadKey } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const FAVORITES_FILE = path.join(DATA_DIR, "lead_favorites.json");

async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

async function readFavoritesFile(): Promise<HuntLead[]> {
  try {
    const content = await fs.readFile(FAVORITES_FILE, "utf-8");
    const parsed = JSON.parse(content);
    return Array.isArray(parsed) ? (parsed as HuntLead[]) : [];
  } catch {
    return [];
  }
}

async function writeFavoritesFile(leads: HuntLead[]): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(FAVORITES_FILE, JSON.stringify(leads, null, 2), "utf-8");
}

export async function getFavoriteLeads(): Promise<HuntLead[]> {
  return readFavoritesFile();
}

/** Добавить лид в избранное (дедупликация по leadKey). Возвращает полный список. */
export async function addFavoriteLead(lead: HuntLead): Promise<HuntLead[]> {
  const leads = await readFavoritesFile();
  const key = leadKey(lead);
  if (!leads.some((l) => leadKey(l) === key)) {
    leads.unshift(lead);
    await writeFavoritesFile(leads);
  }
  return leads;
}

/** Удалить лид из избранного по ключу leadKey (name|address в нижнем регистре). */
export async function removeFavoriteLead(key: string): Promise<HuntLead[]> {
  const leads = await readFavoritesFile();
  const filtered = leads.filter((l) => leadKey(l) !== key);
  if (filtered.length !== leads.length) {
    await writeFavoritesFile(filtered);
  }
  return filtered;
}
