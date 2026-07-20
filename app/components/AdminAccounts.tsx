"use client";

import { FormEvent, useEffect, useState } from "react";

interface AccountUser {
  id: string;
  username: string;
  role: "admin" | "employee";
  active: boolean;
  createdAt: string;
}

interface ActivityEntry {
  ts: string;
  username: string;
  action: string;
  details: string;
}

const actionLabels: Record<string, string> = {
  login: "Вход",
  lead_create: "Создал заявку",
  lead_update: "Обновил заявку",
  lead_delete: "Удалил заявку",
  hunt_status: "Статус лида",
};

function formatActivityDate(ts: string): string {
  return new Date(ts).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminAccounts() {
  const [users, setUsers] = useState<AccountUser[]>([]);
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Add account form
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "employee">("employee");
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");

  // Per-row inline actions
  const [resetId, setResetId] = useState<string | null>(null);
  const [resetPassword, setResetPassword] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");

  async function load() {
    try {
      setLoading(true);
      setError("");
      const [usersRes, activityRes] = await Promise.all([
        fetch("/api/accounts"),
        fetch("/api/accounts/activity"),
      ]);
      const usersData = await usersRes.json();
      if (!usersRes.ok) {
        throw new Error(usersData.error || "Ошибка загрузки аккаунтов");
      }
      setUsers(usersData.users || []);
      if (activityRes.ok) {
        const activityData = await activityRes.json();
        setActivity(activityData.activity || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function addAccount(e: FormEvent) {
    e.preventDefault();
    setFormError("");
    setFormLoading(true);
    try {
      const response = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password, role }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Не удалось создать аккаунт");
      }
      setUsers((prev) => [...prev, data.user]);
      setUsername("");
      setPassword("");
      setRole("employee");
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Не удалось создать аккаунт"
      );
    } finally {
      setFormLoading(false);
    }
  }

  async function toggleActive(user: AccountUser) {
    setActionError("");
    try {
      const response = await fetch("/api/accounts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: user.id, active: !user.active }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Не удалось обновить аккаунт");
      }
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, active: !user.active } : u))
      );
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Не удалось обновить аккаунт"
      );
    }
  }

  async function savePassword(id: string) {
    setActionError("");
    try {
      const response = await fetch("/api/accounts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, password: resetPassword }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Не удалось сменить пароль");
      }
      setResetId(null);
      setResetPassword("");
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Не удалось сменить пароль"
      );
    }
  }

  async function deleteAccount(id: string) {
    setActionError("");
    try {
      const response = await fetch("/api/accounts", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Не удалось удалить аккаунт");
      }
      setUsers((prev) => prev.filter((u) => u.id !== id));
      setDeleteId(null);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Не удалось удалить аккаунт"
      );
    }
  }

  if (loading) {
    return <p className="text-muted">Загрузка аккаунтов...</p>;
  }

  if (error) {
    return <p className="text-red-400">{error}</p>;
  }

  return (
    <div className="space-y-8">
      {/* Add account */}
      <form onSubmit={addAccount} className="panel p-5 space-y-4">
        <h3 className="text-lg font-semibold">Добавить аккаунт</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Логин</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Пароль</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Роль</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as "admin" | "employee")}
              className="input-field"
            >
              <option value="employee">Сотрудник</option>
              <option value="admin">Админ</option>
            </select>
          </div>
        </div>
        {formError && <p className="text-sm text-red-400">{formError}</p>}
        <button
          type="submit"
          disabled={formLoading}
          className="btn-primary px-5 py-2.5 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {formLoading ? "Добавление..." : "Добавить"}
        </button>
      </form>

      {/* Users table */}
      <section className="space-y-3">
        <h3 className="text-lg font-semibold">Сотрудники</h3>
        {actionError && <p className="text-sm text-red-400">{actionError}</p>}
        <div className="panel overflow-x-auto" data-lenis-prevent>
          <table className="w-full table-auto text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted text-xs uppercase tracking-wider">
                <th className="px-4 py-3 font-medium min-w-[140px]">Логин</th>
                <th className="px-4 py-3 font-medium">Роль</th>
                <th className="px-4 py-3 font-medium">Статус</th>
                <th className="px-4 py-3 font-medium">Создан</th>
                <th className="px-4 py-3 font-medium min-w-[300px]">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-border last:border-0 hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-4 py-3 font-medium break-words">
                    {user.username}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-1 border ${
                        user.role === "admin"
                          ? "text-accent border-accent/30 bg-accent/10"
                          : "text-muted border-border bg-surface-elevated"
                      }`}
                    >
                      {user.role === "admin" ? "Админ" : "Сотрудник"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-1 border ${
                        user.active
                          ? "text-emerald-400 border-emerald-400/30 bg-emerald-400/10"
                          : "text-red-400 border-red-400/30 bg-red-400/10"
                      }`}
                    >
                      {user.active ? "Активен" : "Отключён"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted whitespace-nowrap">
                    {new Date(user.createdAt).toLocaleDateString("ru-RU")}
                  </td>
                  <td className="px-4 py-3">
                    {resetId === user.id ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          type="password"
                          value={resetPassword}
                          onChange={(e) => setResetPassword(e.target.value)}
                          placeholder="Новый пароль"
                          className="bg-surface border border-border text-xs px-2 py-1.5 w-40 text-foreground focus:border-primary transition-colors"
                        />
                        <button
                          onClick={() => savePassword(user.id)}
                          className="btn-secondary px-3 py-1.5 text-xs"
                        >
                          Сохранить
                        </button>
                        <button
                          onClick={() => {
                            setResetId(null);
                            setResetPassword("");
                          }}
                          className="px-3 py-1.5 text-xs text-muted hover:text-foreground transition-colors"
                        >
                          Отмена
                        </button>
                      </div>
                    ) : deleteId === user.id ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs text-red-400">
                          Точно удалить?
                        </span>
                        <button
                          onClick={() => deleteAccount(user.id)}
                          className="px-3 py-1.5 text-xs border border-red-400/30 text-red-400 hover:bg-red-400/10 transition-colors"
                        >
                          Да
                        </button>
                        <button
                          onClick={() => setDeleteId(null)}
                          className="px-3 py-1.5 text-xs text-muted hover:text-foreground transition-colors"
                        >
                          Отмена
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => toggleActive(user)}
                          className="btn-secondary px-3 py-1.5 text-xs"
                        >
                          {user.active ? "Отключить" : "Включить"}
                        </button>
                        <button
                          onClick={() => {
                            setResetId(user.id);
                            setResetPassword("");
                          }}
                          className="btn-secondary px-3 py-1.5 text-xs"
                        >
                          Сбросить пароль
                        </button>
                        <button
                          onClick={() => setDeleteId(user.id)}
                          className="px-3 py-1.5 text-xs border border-red-400/30 text-red-400 hover:bg-red-400/10 transition-colors"
                        >
                          Удалить
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted">
                    Аккаунтов пока нет.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Activity log */}
      <section className="space-y-3">
        <h3 className="text-lg font-semibold">Журнал активности</h3>
        <div
          className="panel-elevated max-h-96 overflow-y-auto p-4 font-mono text-xs space-y-1.5"
          data-lenis-prevent
        >
          {activity.length === 0 ? (
            <p className="text-muted">Записей пока нет.</p>
          ) : (
            activity.map((entry, i) => (
              <p key={i}>
                <span className="text-muted/60">
                  {formatActivityDate(entry.ts)}
                </span>{" "}
                <span className="text-foreground">{entry.username}</span>{" "}
                <span className="text-accent">
                  {actionLabels[entry.action] ?? entry.action}
                </span>{" "}
                {entry.details && (
                  <span className="text-muted">{entry.details}</span>
                )}
              </p>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
