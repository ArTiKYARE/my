"use client";

import { FormEvent, useEffect, useState } from "react";
import { ServiceCategory, ServiceItem } from "../lib/services";

const NEW_CATEGORY = "__new__";

const unitOptions: { id: "" | "час" | "шт" | "мес"; label: string }[] = [
  { id: "", label: "—" },
  { id: "час", label: "час" },
  { id: "шт", label: "шт" },
  { id: "мес", label: "мес" },
];

interface ServiceFormState {
  name: string;
  note: string;
  price: string;
  unit: "" | "час" | "шт" | "мес";
  percent: boolean;
  category: string;
  newCategory: string;
}

const emptyForm: ServiceFormState = {
  name: "",
  note: "",
  price: "",
  unit: "",
  percent: false,
  category: "",
  newCategory: "",
};

function formatPrice(n: number): string {
  return new Intl.NumberFormat("ru-RU").format(n) + " ₽";
}

function formatItemPrice(item: {
  price: number;
  unit?: "час" | "шт" | "мес";
  percent?: boolean;
}): string {
  if (item.percent) return `+${item.price} %`;
  if (item.unit) return `${formatPrice(item.price)}/${item.unit}`;
  return `от ${formatPrice(item.price)}`;
}

export default function AdminServices() {
  const [catalog, setCatalog] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");

  // Add form
  const [form, setForm] = useState<ServiceFormState>(emptyForm);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");

  // Inline edit
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<ServiceFormState>(emptyForm);
  const [editLoading, setEditLoading] = useState(false);

  // Delete confirm
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/services")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.catalog) {
          setCatalog(data.catalog);
        } else {
          setError(data?.error || "Ошибка загрузки прайса");
        }
      })
      .catch(() => setError("Ошибка загрузки прайса"))
      .finally(() => setLoading(false));
  }, []);

  function resolveCategory(state: ServiceFormState): string {
    return state.category === NEW_CATEGORY
      ? state.newCategory.trim()
      : state.category;
  }

  function buildItem(state: ServiceFormState) {
    return {
      name: state.name.trim(),
      ...(state.note.trim() ? { note: state.note.trim() } : {}),
      price: Number(state.price) || 0,
      ...(state.percent
        ? { percent: true as const }
        : state.unit
          ? { unit: state.unit }
          : {}),
    };
  }

  function validate(state: ServiceFormState): string {
    if (!state.name.trim()) return "Укажите название услуги.";
    if (!resolveCategory(state)) return "Укажите категорию.";
    if (!state.price || Number(state.price) <= 0)
      return "Укажите цену больше нуля.";
    return "";
  }

  async function addService(e: FormEvent) {
    e.preventDefault();
    setFormError("");
    const validation = validate(form);
    if (validation) {
      setFormError(validation);
      return;
    }
    setFormLoading(true);
    try {
      const response = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: resolveCategory(form),
          item: buildItem(form),
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Не удалось добавить услугу");
      }
      if (data.catalog) setCatalog(data.catalog);
      setForm(emptyForm);
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Не удалось добавить услугу"
      );
    } finally {
      setFormLoading(false);
    }
  }

  function startEdit(item: ServiceItem, category: string) {
    setEditingId(item.id);
    setDeleteId(null);
    setEditForm({
      name: item.name,
      note: item.note ?? "",
      price: String(item.price),
      unit: item.unit ?? "",
      percent: item.percent ?? false,
      category,
      newCategory: "",
    });
  }

  async function saveEdit(id: string) {
    setActionError("");
    const validation = validate(editForm);
    if (validation) {
      setActionError(validation);
      return;
    }
    setEditLoading(true);
    try {
      const response = await fetch("/api/services", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          patch: {
            ...buildItem(editForm),
            category: resolveCategory(editForm),
          },
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Не удалось обновить услугу");
      }
      if (data.catalog) setCatalog(data.catalog);
      setEditingId(null);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Не удалось обновить услугу"
      );
    } finally {
      setEditLoading(false);
    }
  }

  async function deleteService(id: string) {
    setActionError("");
    try {
      const response = await fetch("/api/services", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Не удалось удалить услугу");
      }
      if (data.catalog) setCatalog(data.catalog);
      setDeleteId(null);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Не удалось удалить услугу"
      );
    }
  }

  function categorySelect(
    state: ServiceFormState,
    update: (patch: Partial<ServiceFormState>) => void
  ) {
    return (
      <>
        <select
          value={state.category}
          onChange={(e) => update({ category: e.target.value })}
          className="input-field"
        >
          <option value="" disabled>
            Выберите категорию
          </option>
          {catalog.map((cat) => (
            <option key={cat.category} value={cat.category}>
              {cat.category}
            </option>
          ))}
          <option value={NEW_CATEGORY}>Новая категория</option>
        </select>
        {state.category === NEW_CATEGORY && (
          <input
            type="text"
            value={state.newCategory}
            onChange={(e) => update({ newCategory: e.target.value })}
            placeholder="Название новой категории"
            className="input-field mt-2"
          />
        )}
      </>
    );
  }

  if (loading) {
    return <p className="text-muted">Загрузка прайса...</p>;
  }

  if (error) {
    return <p className="text-red-400">{error}</p>;
  }

  return (
    <div className="space-y-8">
      {/* Add service */}
      <form onSubmit={addService} className="panel p-5 space-y-4">
        <h3 className="text-lg font-semibold">Добавить услугу</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Название *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Категория *
            </label>
            {categorySelect(form, (patch) => setForm({ ...form, ...patch }))}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Примечание
            </label>
            <input
              type="text"
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              className="input-field"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Цена, ₽ *
              </label>
              <input
                type="number"
                min={1}
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Единица
              </label>
              <select
                value={form.unit}
                onChange={(e) =>
                  setForm({
                    ...form,
                    unit: e.target.value as ServiceFormState["unit"],
                  })
                }
                disabled={form.percent}
                className="input-field disabled:opacity-50"
              >
                {unitOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <label className="flex items-center gap-2.5 text-sm cursor-pointer w-fit">
          <input
            type="checkbox"
            checked={form.percent}
            onChange={(e) =>
              setForm({ ...form, percent: e.target.checked, unit: "" })
            }
            className="w-4 h-4 accent-primary"
          />
          % от суммы (надбавка)
        </label>
        {formError && <p className="text-sm text-red-400">{formError}</p>}
        <button
          type="submit"
          disabled={formLoading}
          className="btn-primary px-5 py-2.5 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {formLoading ? "Добавление..." : "Добавить"}
        </button>
      </form>

      {actionError && <p className="text-sm text-red-400">{actionError}</p>}

      {/* Catalog by category */}
      {catalog.map((category) => (
        <section key={category.category}>
          <span className="section-label">{category.category}</span>
          <div className="panel overflow-x-auto" data-lenis-prevent>
            <table className="w-full table-auto text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted text-xs uppercase tracking-wider">
                  <th className="px-4 py-3 font-medium min-w-[220px]">
                    Название
                  </th>
                  <th className="px-4 py-3 font-medium min-w-[130px]">Цена</th>
                  <th className="px-4 py-3 font-medium min-w-[160px]">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody>
                {category.items.map((item) =>
                  editingId === item.id ? (
                    <tr key={item.id} className="border-b border-border last:border-0">
                      <td colSpan={3} className="px-4 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <input
                            type="text"
                            value={editForm.name}
                            onChange={(e) =>
                              setEditForm({ ...editForm, name: e.target.value })
                            }
                            placeholder="Название"
                            className="input-field py-2 text-sm"
                          />
                          <div>
                            {categorySelect(editForm, (patch) =>
                              setEditForm({ ...editForm, ...patch })
                            )}
                          </div>
                          <input
                            type="text"
                            value={editForm.note}
                            onChange={(e) =>
                              setEditForm({ ...editForm, note: e.target.value })
                            }
                            placeholder="Примечание"
                            className="input-field py-2 text-sm"
                          />
                          <div className="grid grid-cols-2 gap-3">
                            <input
                              type="number"
                              min={1}
                              value={editForm.price}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  price: e.target.value,
                                })
                              }
                              placeholder="Цена, ₽"
                              className="input-field py-2 text-sm"
                            />
                            <select
                              value={editForm.unit}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  unit: e.target
                                    .value as ServiceFormState["unit"],
                                })
                              }
                              disabled={editForm.percent}
                              className="input-field py-2 text-sm disabled:opacity-50"
                            >
                              {unitOptions.map((option) => (
                                <option key={option.id} value={option.id}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 mt-3">
                          <label className="flex items-center gap-2.5 text-sm cursor-pointer">
                            <input
                              type="checkbox"
                              checked={editForm.percent}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  percent: e.target.checked,
                                  unit: "",
                                })
                              }
                              className="w-4 h-4 accent-primary"
                            />
                            % от суммы
                          </label>
                          <button
                            onClick={() => saveEdit(item.id)}
                            disabled={editLoading}
                            className="btn-primary px-4 py-2 text-xs font-medium disabled:opacity-50"
                          >
                            {editLoading ? "Сохранение..." : "Сохранить"}
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="px-3 py-1.5 text-xs text-muted hover:text-foreground transition-colors"
                          >
                            Отмена
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <tr
                      key={item.id}
                      className="border-b border-border last:border-0 hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-4 py-3 break-words">
                        <p className="font-medium">{item.name}</p>
                        {item.note && (
                          <p className="text-xs text-muted">{item.note}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted whitespace-nowrap">
                        {formatItemPrice(item)}
                      </td>
                      <td className="px-4 py-3">
                        {deleteId === item.id ? (
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs text-red-400">
                              Точно удалить?
                            </span>
                            <button
                              onClick={() => deleteService(item.id)}
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
                              onClick={() =>
                                startEdit(item, category.category)
                              }
                              className="btn-secondary px-3 py-1.5 text-xs"
                            >
                              Изменить
                            </button>
                            <button
                              onClick={() => {
                                setDeleteId(item.id);
                                setEditingId(null);
                              }}
                              className="px-3 py-1.5 text-xs border border-red-400/30 text-red-400 hover:bg-red-400/10 transition-colors"
                            >
                              Удалить
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                )}
                {category.items.length === 0 && (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-4 py-6 text-center text-muted"
                    >
                      В категории пока нет услуг.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  );
}
