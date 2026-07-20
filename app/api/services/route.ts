import { NextRequest, NextResponse } from "next/server";
import { getSession } from "../../lib/auth";
import {
  addServiceItem,
  deleteServiceItem,
  getServiceCatalog,
  ServiceItemInput,
  updateServiceItem,
} from "../../lib/services";

const UNITS = ["час", "шт", "мес"] as const;

async function requireAdmin() {
  const session = await getSession();
  if (!session) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  if (session.role !== "admin") {
    return {
      error: NextResponse.json({ error: "Доступ запрещён" }, { status: 403 }),
    };
  }
  return { session };
}

/** Валидация полей услуги. Возвращает очищенный объект или строку с ошибкой. */
function validateItem(raw: unknown): ServiceItemInput | string {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return "Неверные данные услуги";
  }
  const r = raw as Record<string, unknown>;

  const name = typeof r.name === "string" ? r.name.trim() : "";
  if (name.length < 2 || name.length > 80) {
    return "Название услуги: от 2 до 80 символов";
  }
  const price = Number(r.price);
  if (!Number.isFinite(price) || price < 0) {
    return "Цена должна быть числом не меньше 0";
  }
  const unit = r.unit === undefined ? undefined : r.unit;
  if (unit !== undefined && !UNITS.includes(unit as (typeof UNITS)[number])) {
    return "Единица должна быть: час, шт или мес";
  }
  const note =
    r.note === undefined ? undefined : typeof r.note === "string" ? r.note.trim() : null;
  if (note === null) {
    return "Неверные данные услуги";
  }
  const percent = r.percent === true ? true : undefined;

  return {
    name,
    note: note || undefined,
    price,
    unit: unit as ServiceItemInput["unit"],
    percent,
  };
}

function validateCategory(raw: unknown): string | null {
  const category = typeof raw === "string" ? raw.trim() : "";
  if (category.length < 2 || category.length > 60) return null;
  return category;
}

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const catalog = await getServiceCatalog();
    return NextResponse.json({ catalog });
  } catch (error) {
    console.error("Services GET error:", error);
    return NextResponse.json(
      { error: "Не удалось загрузить каталог" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await request.json();
    const category = validateCategory(body.category);
    if (!category) {
      return NextResponse.json(
        { error: "Категория: от 2 до 60 символов" },
        { status: 400 }
      );
    }
    const item = validateItem(body.item);
    if (typeof item === "string") {
      return NextResponse.json({ error: item }, { status: 400 });
    }

    const catalog = await addServiceItem(category, item);
    return NextResponse.json({ success: true, catalog });
  } catch (error) {
    console.error("Services POST error:", error);
    return NextResponse.json(
      { error: "Не удалось добавить услугу" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await request.json();
    const id = typeof body.id === "string" ? body.id : "";
    if (!id) {
      return NextResponse.json({ error: "Неверные данные" }, { status: 400 });
    }

    const patch: Partial<ServiceItemInput> & { category?: string } = {};
    const raw = (body.patch ?? {}) as Record<string, unknown>;
    if (raw.name !== undefined) {
      const name = typeof raw.name === "string" ? raw.name.trim() : "";
      if (name.length < 2 || name.length > 80) {
        return NextResponse.json(
          { error: "Название услуги: от 2 до 80 символов" },
          { status: 400 }
        );
      }
      patch.name = name;
    }
    if (raw.note !== undefined) {
      if (typeof raw.note !== "string") {
        return NextResponse.json({ error: "Неверные данные" }, { status: 400 });
      }
      patch.note = raw.note.trim() || undefined;
    }
    if (raw.price !== undefined) {
      const price = Number(raw.price);
      if (!Number.isFinite(price) || price < 0) {
        return NextResponse.json(
          { error: "Цена должна быть числом не меньше 0" },
          { status: 400 }
        );
      }
      patch.price = price;
    }
    if (raw.unit !== undefined) {
      if (!UNITS.includes(raw.unit as (typeof UNITS)[number])) {
        return NextResponse.json(
          { error: "Единица должна быть: час, шт или мес" },
          { status: 400 }
        );
      }
      patch.unit = raw.unit as ServiceItemInput["unit"];
    }
    if (raw.percent !== undefined) {
      if (typeof raw.percent !== "boolean") {
        return NextResponse.json({ error: "Неверные данные" }, { status: 400 });
      }
      patch.percent = raw.percent || undefined;
    }
    if (raw.category !== undefined) {
      const category = validateCategory(raw.category);
      if (!category) {
        return NextResponse.json(
          { error: "Категория: от 2 до 60 символов" },
          { status: 400 }
        );
      }
      patch.category = category;
    }

    const catalog = await updateServiceItem(id, patch);
    if (!catalog) {
      return NextResponse.json({ error: "Услуга не найдена" }, { status: 404 });
    }
    return NextResponse.json({ success: true, catalog });
  } catch (error) {
    console.error("Services PATCH error:", error);
    return NextResponse.json(
      { error: "Не удалось обновить услугу" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await request.json();
    const id = typeof body.id === "string" ? body.id : "";
    if (!id) {
      return NextResponse.json({ error: "Неверные данные" }, { status: 400 });
    }

    const catalog = await deleteServiceItem(id);
    if (!catalog) {
      return NextResponse.json({ error: "Услуга не найдена" }, { status: 404 });
    }
    return NextResponse.json({ success: true, catalog });
  } catch (error) {
    console.error("Services DELETE error:", error);
    return NextResponse.json(
      { error: "Не удалось удалить услугу" },
      { status: 500 }
    );
  }
}
