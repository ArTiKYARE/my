import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import { cookies } from "next/headers";
import { put } from "@vercel/blob";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/svg+xml",
  "image/gif",
];

async function isAuthenticated() {
  try {
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword) return false;

    const cookieStore = await cookies();
    const token = cookieStore.get("admin_session")?.value;
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

export async function POST(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Файл не найден" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Недопустимый тип файла. Разрешены: JPEG, PNG, WebP, SVG, GIF" },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Файл слишком большой. Максимум 5MB" },
        { status: 400 }
      );
    }

    // Если настроен Vercel Blob, используем его (лучше для продакшена)
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const blob = await put(file.name, file, {
        access: "public",
        addRandomSuffix: true,
      });
      return NextResponse.json({ url: blob.url });
    }

    // Локальное сохранение (для локальной разработки и self-hosting)
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const ext = path.extname(file.name) || ".bin";
    const timestamp = Date.now();
    const random = crypto.randomBytes(4).toString("hex");
    const filename = `${timestamp}-${random}${ext}`;

    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    await fs.writeFile(path.join(UPLOAD_DIR, filename), buffer);

    return NextResponse.json({ url: `/uploads/${filename}` });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Ошибка при загрузке файла" },
      { status: 500 }
    );
  }
}
