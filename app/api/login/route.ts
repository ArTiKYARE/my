import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";

function getAdminPassword(): string {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    throw new Error("ADMIN_PASSWORD не настроен.");
  }
  return password;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const password = formData.get("password") as string;
    const adminPassword = getAdminPassword();

    if (password !== adminPassword) {
      return NextResponse.redirect(new URL("/admin/login?error=invalid", request.url));
    }

    const token = crypto
      .createHmac("sha256", adminPassword)
      .update("admin")
      .digest("hex");

    const cookieStore = await cookies();
    cookieStore.set("admin_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return NextResponse.redirect(new URL("/admin", request.url));
  } catch {
    return NextResponse.redirect(new URL("/admin/login?error=invalid", request.url));
  }
}
