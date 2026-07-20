// Пользователи админки (многопользовательская система с ролями).
// Хранилище: data/users.json. Пароли — scryptSync(password, salt, 64) hex.

import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

const DATA_DIR = path.join(process.cwd(), "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");

export type UserRole = "admin" | "employee";
export const USER_ROLES: UserRole[] = ["admin", "employee"];

export interface User {
  id: string;
  username: string;
  passwordHash: string;
  salt: string;
  role: UserRole;
  active: boolean;
  createdAt: string;
}

/** Публичная форма пользователя — без хеша и соли. */
export interface PublicUser {
  id: string;
  username: string;
  role: UserRole;
  active: boolean;
  createdAt: string;
}

export function publicUser(user: User): PublicUser {
  return {
    id: user.id,
    username: user.username,
    role: user.role,
    active: user.active,
    createdAt: user.createdAt,
  };
}

function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString("hex");
}

async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

async function readUsersFile(): Promise<User[]> {
  try {
    const content = await fs.readFile(USERS_FILE, "utf-8");
    const parsed = JSON.parse(content);
    return Array.isArray(parsed) ? (parsed as User[]) : [];
  } catch {
    return [];
  }
}

async function writeUsersFile(users: User[]): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
}

export async function getUsers(): Promise<User[]> {
  return readUsersFile();
}

export async function findUser(username: string): Promise<User | null> {
  const users = await readUsersFile();
  const needle = username.trim().toLowerCase();
  return users.find((u) => u.username.toLowerCase() === needle) ?? null;
}

export async function createUser(data: {
  username: string;
  password: string;
  role: UserRole;
}): Promise<User> {
  const users = await readUsersFile();
  const salt = crypto.randomBytes(16).toString("hex");
  const user: User = {
    id: crypto.randomUUID(),
    username: data.username.trim(),
    passwordHash: hashPassword(data.password, salt),
    salt,
    role: data.role,
    active: true,
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  await writeUsersFile(users);
  return user;
}

export async function updateUser(
  id: string,
  patch: { active?: boolean; password?: string }
): Promise<User | null> {
  const users = await readUsersFile();
  const index = users.findIndex((u) => u.id === id);
  if (index === -1) return null;

  if (patch.active !== undefined) {
    users[index].active = patch.active;
  }
  if (patch.password !== undefined) {
    const salt = crypto.randomBytes(16).toString("hex");
    users[index].salt = salt;
    users[index].passwordHash = hashPassword(patch.password, salt);
  }

  await writeUsersFile(users);
  return users[index];
}

export async function deleteUser(id: string): Promise<boolean> {
  const users = await readUsersFile();
  const filtered = users.filter((u) => u.id !== id);
  if (filtered.length === users.length) return false;
  await writeUsersFile(filtered);
  return true;
}

/** Проверка логина/пароля. Не проверяет active — это делает вызывающий код. */
export async function verifyUser(
  username: string,
  password: string
): Promise<User | null> {
  const user = await findUser(username);
  if (!user) return null;
  const hash = hashPassword(password, user.salt);
  const a = Buffer.from(hash, "hex");
  const b = Buffer.from(user.passwordHash, "hex");
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  return user;
}
