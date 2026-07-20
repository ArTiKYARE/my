import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import * as speakeasy from "speakeasy";
import { createSessionValue } from "../../lib/auth";
import { verifyUser } from "../../lib/users";
import { appendActivity } from "../../lib/activity";
import {
  getClientIp,
  isIpBlocked,
  recordLoginFailure,
  recordLoginSuccess,
  logLoginAttempt,
} from "../../lib/security";

const COOKIE_NAME = "admin_session";
const ADMIN_PATH = "/dashboard";
const SESSION_TTL_S = 7 * 24 * 60 * 60; // 7 дней

function getAdminPassword(): string {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    throw new Error("ADMIN_PASSWORD не настроен.");
  }
  return password;
}

function getAdminUsername(): string {
  return process.env.ADMIN_USERNAME || "admin";
}

function getTotpSecret(): string | undefined {
  return process.env.ADMIN_TOTP_SECRET;
}

function redirect(path: string) {
  return NextResponse.redirect(
    new URL(path, process.env.NEXT_PUBLIC_APP_URL || "https://kos-ko.ru")
  );
}

async function setSessionCookie(value: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_TTL_S,
  });
}

export async function POST(request: NextRequest) {
  try {
    const ip = await getClientIp(request);

    if (await isIpBlocked(ip)) {
      await logLoginAttempt(ip, "", false, "ip_blocked");
      return redirect(`${ADMIN_PATH}/login?error=blocked`);
    }

    const formData = await request.formData();
    const username = String(formData.get("username") || "").trim();
    const password = String(formData.get("password") || "");
    const totpCode = String(formData.get("totp") || "").trim();

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
          await recordLoginFailure(ip);
          await logLoginAttempt(ip, username, false, "invalid_totp");
          return redirect(`${ADMIN_PATH}/login?error=totp`);
        }
      }

      await recordLoginSuccess(ip);
      await logLoginAttempt(ip, username, true);
      await appendActivity(username, "login", "успешный вход (env-админ)");
      await setSessionCookie(await createSessionValue(username, "admin"));
      return redirect(ADMIN_PATH);
    }

    // 2) пользователи из users.json
    const user = await verifyUser(username, password);
    if (!user) {
      await recordLoginFailure(ip);
      await logLoginAttempt(ip, username, false, "invalid_credentials");
      await appendActivity(username || "unknown", "login", "неверный логин или пароль");
      return redirect(`${ADMIN_PATH}/login?error=invalid`);
    }
    if (!user.active) {
      await recordLoginFailure(ip);
      await logLoginAttempt(ip, username, false, "user_disabled");
      await appendActivity(username, "login", "отказ: аккаунт деактивирован");
      return redirect(`${ADMIN_PATH}/login?error=invalid`);
    }

    await recordLoginSuccess(ip);
    await logLoginAttempt(ip, username, true);
    await appendActivity(username, "login", "успешный вход");
    await setSessionCookie(await createSessionValue(user.username, user.role));
    return redirect(ADMIN_PATH);
  } catch (error) {
    console.error("Login error:", error);
    return redirect(`${ADMIN_PATH}/login?error=invalid`);
  }
}
