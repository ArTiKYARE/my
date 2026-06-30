import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const ADMIN_PATH = "/dashboard";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete("admin_session");
  return NextResponse.redirect(
    new URL(`${ADMIN_PATH}/login`, process.env.NEXT_PUBLIC_APP_URL || "https://kos-ko.ru")
  );
}
