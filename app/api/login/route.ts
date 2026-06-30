import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";
import * as speakeasy from "speakeasy";
import {
  getClientIp,
  isIpBlocked,
  recordLoginFailure,
  recordLoginSuccess,
  logLoginAttempt,
} from "../../lib/security";

const COOKIE_NAME = "admin_session";
const ADMIN_PATH = "/dashboard";

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

function generateToken(password: string) {
  return crypto.createHmac("sha256", password).update("admin").digest("hex");
}

function redirect(path: string) {
  return NextResponse.redirect(
    new URL(path, process.env.NEXT_PUBLIC_APP_URL || "https://kos-ko.ru")
  );
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

    const adminUsername = getAdminUsername();
    const adminPassword = getAdminPassword();
    const totpSecret = getTotpSecret();

    if (username !== adminUsername || password !== adminPassword) {
      await recordLoginFailure(ip);
      await logLoginAttempt(ip, username, false, "invalid_credentials");
      return redirect(`${ADMIN_PATH}/login?error=invalid`);
    }

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

    const token = generateToken(adminPassword);
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return redirect(ADMIN_PATH);
  } catch (error) {
    console.error("Login error:", error);
    return redirect(`${ADMIN_PATH}/login?error=invalid`);
  }
}
