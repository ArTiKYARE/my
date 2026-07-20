import { NextRequest, NextResponse } from "next/server";
import { getSession } from "../../lib/auth";
import {
  createUser,
  deleteUser,
  findUser,
  getUsers,
  publicUser,
  updateUser,
  USER_ROLES,
  UserRole,
} from "../../lib/users";

const USERNAME_RE = /^[a-zA-Z0-9_.-]{3,32}$/;

// Управление аккаунтами — только для role === "admin"
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

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const users = await getUsers();
    return NextResponse.json({ users: users.map(publicUser) });
  } catch (e) {
    console.error("Accounts GET error:", e);
    return NextResponse.json(
      { error: "Не удалось загрузить пользователей" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await request.json();
    const username = typeof body.username === "string" ? body.username.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const role = body.role;

    if (!USERNAME_RE.test(username)) {
      return NextResponse.json(
        { error: "Логин: 3–32 символа, латиница, цифры и _ . -" },
        { status: 400 }
      );
    }
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Пароль должен быть не короче 6 символов" },
        { status: 400 }
      );
    }
    if (!USER_ROLES.includes(role as UserRole)) {
      return NextResponse.json({ error: "Неверная роль" }, { status: 400 });
    }
    if (await findUser(username)) {
      return NextResponse.json(
        { error: "Пользователь с таким логином уже существует" },
        { status: 400 }
      );
    }

    const user = await createUser({ username, password, role: role as UserRole });
    return NextResponse.json({ success: true, user: publicUser(user) });
  } catch (e) {
    console.error("Accounts POST error:", e);
    return NextResponse.json(
      { error: "Не удалось создать пользователя" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const { session, error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await request.json();
    const id = typeof body.id === "string" ? body.id : "";
    if (!id) {
      return NextResponse.json({ error: "Неверные данные" }, { status: 400 });
    }

    const active =
      body.active === undefined
        ? undefined
        : typeof body.active === "boolean"
          ? body.active
          : null;
    const password =
      body.password === undefined
        ? undefined
        : typeof body.password === "string"
          ? body.password
          : null;
    if (active === null || password === null) {
      return NextResponse.json({ error: "Неверные данные" }, { status: 400 });
    }
    if (password !== undefined && password.length < 6) {
      return NextResponse.json(
        { error: "Пароль должен быть не короче 6 символов" },
        { status: 400 }
      );
    }

    const users = await getUsers();
    const target = users.find((u) => u.id === id);
    if (!target) {
      return NextResponse.json(
        { error: "Пользователь не найден" },
        { status: 404 }
      );
    }
    if (active === false && target.username === session!.username) {
      return NextResponse.json(
        { error: "Нельзя деактивировать свой аккаунт" },
        { status: 400 }
      );
    }

    const updated = await updateUser(id, { active, password });
    return NextResponse.json({ success: true, user: publicUser(updated!) });
  } catch (e) {
    console.error("Accounts PATCH error:", e);
    return NextResponse.json(
      { error: "Не удалось обновить пользователя" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const { session, error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await request.json();
    const id = typeof body.id === "string" ? body.id : "";
    if (!id) {
      return NextResponse.json({ error: "Неверные данные" }, { status: 400 });
    }

    const users = await getUsers();
    const target = users.find((u) => u.id === id);
    if (!target) {
      return NextResponse.json(
        { error: "Пользователь не найден" },
        { status: 404 }
      );
    }
    if (target.username === session!.username) {
      return NextResponse.json(
        { error: "Нельзя удалить свой аккаунт" },
        { status: 400 }
      );
    }

    await deleteUser(id);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Accounts DELETE error:", e);
    return NextResponse.json(
      { error: "Не удалось удалить пользователя" },
      { status: 500 }
    );
  }
}
