"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import crypto from "crypto";
import * as speakeasy from "speakeasy";

const COOKIE_NAME = "admin_session";
const ADMIN_PATH = "/dashboard";

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

function generateToken(password: string) {
  return crypto.createHmac("sha256", password).update("admin").digest("hex");
}

export async function login(formData: FormData) {
  "use server";
  const username = (formData.get("username") as string) || "";
  const password = (formData.get("password") as string) || "";
  const totpCode = (formData.get("totp") as string) || "";

  const adminUsername = getAdminUsername();
  const adminPassword = getAdminPassword();
  const totpSecret = getTotpSecret();

  if (username !== adminUsername || password !== adminPassword) {
    redirect(`${ADMIN_PATH}/login?error=invalid`);
  }

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

  const token = generateToken(adminPassword);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 дней
  });

  redirect(ADMIN_PATH);
}

export async function logout() {
  "use server";
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
  redirect(`${ADMIN_PATH}/login`);
}

export async function isAuthenticated(): Promise<boolean> {
  try {
    const adminPassword = getAdminPassword();
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    if (!token) return false;

    const expected = generateToken(adminPassword);
    return token === expected;
  } catch {
    return false;
  }
}

export async function requireAuth() {
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    redirect(`${ADMIN_PATH}/login`);
  }
}

