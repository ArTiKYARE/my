"use server";

import { promises as fs } from "fs";
import path from "path";
import { readJsonFile } from "./data";

const ATTEMPTS_FILE = path.join(process.cwd(), "data", "login_attempts.json");
const LOGS_FILE = path.join(process.cwd(), "data", "login_logs.json");

const MAX_ATTEMPTS = 5;
const BLOCK_DURATION_MS = 15 * 60 * 1000; // 15 минут

interface AttemptRecord {
  ip: string;
  failures: number;
  lastFailure: string;
  blockedUntil?: string;
}

interface LoginLog {
  timestamp: string;
  ip: string;
  username: string;
  success: boolean;
  reason?: string;
}

export async function getClientIp(request?: Request): Promise<string> {
  if (!request) return "unknown";
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "unknown";
}

export async function isIpBlocked(ip: string): Promise<boolean> {
  const attempts = await readJsonFile<AttemptRecord[]>(ATTEMPTS_FILE, []);
  const record = attempts.find((a) => a.ip === ip);
  if (!record) return false;

  const now = Date.now();
  if (record.blockedUntil) {
    if (new Date(record.blockedUntil).getTime() > now) {
      return true;
    }
    // блокировка истекла — сбрасываем
    record.blockedUntil = undefined;
    record.failures = 0;
    await writeAttempts(attempts);
  }
  return false;
}

export async function recordLoginFailure(ip: string): Promise<void> {
  const attempts = await readJsonFile<AttemptRecord[]>(ATTEMPTS_FILE, []);
  const index = attempts.findIndex((a) => a.ip === ip);
  const now = new Date().toISOString();

  if (index === -1) {
    attempts.push({ ip, failures: 1, lastFailure: now });
  } else {
    attempts[index].failures += 1;
    attempts[index].lastFailure = now;
    if (attempts[index].failures >= MAX_ATTEMPTS) {
      attempts[index].blockedUntil = new Date(
        Date.now() + BLOCK_DURATION_MS
      ).toISOString();
    }
  }

  await writeAttempts(attempts);
}

export async function recordLoginSuccess(ip: string): Promise<void> {
  const attempts = await readJsonFile<AttemptRecord[]>(ATTEMPTS_FILE, []);
  const filtered = attempts.filter((a) => a.ip !== ip);
  await writeAttempts(filtered);
}

async function writeAttempts(attempts: AttemptRecord[]) {
  await fs.mkdir(path.dirname(ATTEMPTS_FILE), { recursive: true });
  await fs.writeFile(ATTEMPTS_FILE, JSON.stringify(attempts, null, 2));
}

export async function logLoginAttempt(
  ip: string,
  username: string,
  success: boolean,
  reason?: string
): Promise<void> {
  const logs = await readJsonFile<LoginLog[]>(LOGS_FILE, []);
  logs.push({
    timestamp: new Date().toISOString(),
    ip,
    username,
    success,
    reason,
  });
  // ограничиваем размер лога последними 500 записями
  const trimmed = logs.slice(-500);
  await fs.mkdir(path.dirname(LOGS_FILE), { recursive: true });
  await fs.writeFile(LOGS_FILE, JSON.stringify(trimmed, null, 2));
}
