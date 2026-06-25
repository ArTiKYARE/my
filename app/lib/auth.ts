"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import crypto from "crypto";

const COOKIE_NAME = "admin_session";

function getAdminPassword(): string {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    throw new Error(
      "ADMIN_PASSWORD не настроен. Установите пароль в переменных окружения."
    );
  }
  return password;
}

export async function login(formData: FormData) {
  "use server";
  const password = formData.get("password") as string;
  const adminPassword = getAdminPassword();

  if (password !== adminPassword) {
    redirect("/admin/login?error=invalid");
  }

  const token = crypto
    .createHmac("sha256", adminPassword)
    .update("admin")
    .digest("hex");

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 дней
  });

  redirect("/admin");
}

export async function logout() {
  "use server";
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
  redirect("/admin/login");
}

export async function isAuthenticated(): Promise<boolean> {
  try {
    const adminPassword = getAdminPassword();
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    if (!token) return false;

    const expected = crypto
      .createHmac("sha256", adminPassword)
      .update("admin")
      .digest("hex");

    return token === expected;
  } catch {
    return false;
  }
}

export async function requireAuth() {
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    redirect("/admin/login");
  }
}
