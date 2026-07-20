"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import crypto from "crypto";
import * as speakeasy from "speakeasy";
import { UserRole, verifyUser } from "./users";

const COOKIE_NAME = "admin_session";
const ADMIN_PATH = "/dashboard";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 дней

function getAdminPassword(): string {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    throw new Error(
      "ADMIN_PASSWORD не настроен. Установите пароль в переменных окружения."
    );
  }
  return password;
}

function getAdminUsername(): string {
  return process.env.ADMIN_USERNAME || "admin";
}

function getTotpSecret(): string | undefined {
  return process.env.ADMIN_TOTP_SECRET;
}

// Токен старого формата (чистый HMAC) — поддерживаем для обратной совместимости
function generateToken(password: string) {
  return crypto.createHmac("sha256", password).update("admin").digest("hex");
}

// ---------------------------------------------------------------------------
// Сессии нового формата: base64url(JSON{u,r,exp}) + "." + HMAC-SHA256(payload)
// ---------------------------------------------------------------------------

export interface Session {
  username: string;
  role: UserRole;
}

function signPayload(payload: string): string {
  return crypto
    .createHmac("sha256", getAdminPassword())
    .update(payload)
    .digest("hex");
}

export async function createSessionValue(
  username: string,
  role: UserRole
): Promise<string> {
  const payload = Buffer.from(
    JSON.stringify({ u: username, r: role, exp: Date.now() + SESSION_TTL_MS }),
    "utf-8"
  ).toString("base64url");
  return `${payload}.${signPayload(payload)}`;
}

/** Текущая сессия или null. Старый формат cookie = сессия env-админа. */
export async function getSession(): Promise<Session | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const dot = token.indexOf(".");
    if (dot > 0) {
      const payload = token.slice(0, dot);
      const sig = token.slice(dot + 1);
      const expected = signPayload(payload);
      const a = Buffer.from(sig);
      const b = Buffer.from(expected);
      if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

      const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf-8"));
      if (
        typeof data?.u !== "string" ||
        (data?.r !== "admin" && data?.r !== "employee") ||
        typeof data?.exp !== "number" ||
        data.exp <= Date.now()
      ) {
        return null;
      }
      return { username: data.u, role: data.r };
    }

    // Обратная совместимость: старый формат (чистый HMAC от env-пароля)
    if (token === generateToken(getAdminPassword())) {
      return { username: getAdminUsername(), role: "admin" };
    }
    return null;
  } catch {
    return null;
  }
}

async function setSessionCookie(value: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
}

export async function login(formData: FormData) {
  "use server";
  const username = ((formData.get("username") as string) || "").trim();
  const password = (formData.get("password") as string) || "";
  const totpCode = (formData.get("totp") as string) || "";

  // 1) env-админ (как раньше, с TOTP)
  if (username === getAdminUsername() && password === getAdminPassword()) {
    const totpSecret = getTotpSecret();
    if (totpSecret) {
      const verified = speakeasy.totp.verify({
        secret: totpSecret,
        encoding: "base32",
        token: totpCode,
        window: 1,
      });
      if (!verified) {
        redirect(`${ADMIN_PATH}/login?error=totp`);
      }
    }
    await setSessionCookie(await createSessionValue(username, "admin"));
    redirect(ADMIN_PATH);
  }

  // 2) пользователи из users.json
  const user = await verifyUser(username, password);
  if (!user || !user.active) {
    redirect(`${ADMIN_PATH}/login?error=invalid`);
  }
  await setSessionCookie(await createSessionValue(user.username, user.role));
  redirect(ADMIN_PATH);
}

export async function logout() {
  "use server";
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
  redirect(`${ADMIN_PATH}/login`);
}

export async function isAuthenticated(): Promise<boolean> {
  return (await getSession()) !== null;
}

export async function requireAuth() {
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    redirect(`${ADMIN_PATH}/login`);
  }
}
