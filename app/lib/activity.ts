// Журнал активности админки — data/activity.json.
// Формат: [{ts, username, action, details}], новые первыми, кэп 1000 записей.

import { promises as fs } from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const ACTIVITY_FILE = path.join(DATA_DIR, "activity.json");
const CAP = 1000;

export interface ActivityEntry {
  ts: string; // ISO
  username: string;
  action: string;
  details: string;
}

async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

async function readActivityFile(): Promise<ActivityEntry[]> {
  try {
    const content = await fs.readFile(ACTIVITY_FILE, "utf-8");
    const parsed = JSON.parse(content);
    return Array.isArray(parsed) ? (parsed as ActivityEntry[]) : [];
  } catch {
    return [];
  }
}

export async function appendActivity(
  username: string,
  action: string,
  details: string
): Promise<void> {
  const entries = await readActivityFile();
  entries.unshift({
    ts: new Date().toISOString(),
    username,
    action,
    details,
  });
  if (entries.length > CAP) {
    entries.length = CAP; // отрезаем самые старые
  }
  await ensureDataDir();
  await fs.writeFile(ACTIVITY_FILE, JSON.stringify(entries, null, 2), "utf-8");
}

/** Журнал, новые записи первыми. */
export async function getActivity(): Promise<ActivityEntry[]> {
  return readActivityFile();
}
