"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Lead, LeadStatus } from "../lib/types";
import { SERVICE_CATALOG } from "../lib/services";

const statusLabels: Record<LeadStatus, string> = {
  new: "Новая",
  "in-progress": "В работе",
  done: "Завершена",
  archived: "В архиве",
};

const filterTabs: { id: LeadStatus | "all"; label: string }[] = [
  { id: "all", label: "Все" },
  { id: "new", label: "Новые" },
  { id: "in-progress", label: "В работе" },
  { id: "done", label: "Сделано" },
  { id: "archived", label: "Архив" },
];

function statusBadgeClass(status: LeadStatus): string {
  switch (status) {
    case "new":
      return "bg-amber-500/10 border-amber-500/20 text-amber-400";
    case "in-progress":
      return "bg-primary/10 border-primary/20 text-brand";
    case "done":
      return "bg-emerald-500/10 border-emerald-500/20 text-emerald-400";
    default:
      return "bg-surface-elevated border-border text-muted";
  }
}

function formatPrice(n: number): string {
  return new Intl.NumberFormat("ru-RU").format(n) + " ₽";
}

/** Живой расчёт по выбранным услугам: разовая сумма и помесячная. */
function calcTotals(
  services: string[] | undefined,
  quantities: Record<string, number> | undefined
): { oneTime: number; monthly: number } {
  const selected = new Set(services ?? []);
  let oneTime = 0;
  let monthly = 0;
  let percentSum = 0;
  for (const category of SERVICE_CATALOG) {
    for (const item of category.items) {
      if (!selected.has(item.id)) continue;
      const qty = quantities?.[item.id] ?? 1;
      if (item.percent) {
        percentSum += item.price;
      } else if (item.unit === "мес") {
        monthly += item.price * qty;
      } else if (item.unit) {
        oneTime += item.price * qty;
      } else {
        oneTime += item.price;
      }
    }
  }
  // Процентные услуги — надбавка к сумме остальных разовых
  return { oneTime: Math.round(oneTime * (1 + percentSum / 100)), monthly };
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

function contactHref(contact: string): string | null {
  if (contact.includes("@")) return `mailto:${contact.trim()}`;
  if (/[+0-9][\d\s()\-]{5,}/.test(contact)) {
    return `tel:${contact.replace(/[^\d+]/g, "")}`;
  }
  return null;
}

export default function AdminLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filter, setFilter] = useState<LeadStatus | "all">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  async function loadLeads() {
    try {
      setLoading(true);
      const response = await fetch("/api/leads");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Ошибка загрузки");
      setLeads(data.leads);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id: string, status: LeadStatus) {
    try {
      const response = await fetch("/api/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Ошибка обновления");

      setLeads((prev) =>
        prev.map((lead) => (lead.id === id ? data.lead : lead))
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Ошибка обновления");
    }
  }

  useEffect(() => {
    loadLeads();
  }, []);

  const filteredLeads = useMemo(() => {
    if (filter === "all") return leads;
    return leads.filter((lead) => lead.status === filter);
  }, [leads, filter]);

  const counts = useMemo(() => {
    const map: Record<LeadStatus | "all", number> = {
      all: leads.length,
      new: 0,
      "in-progress": 0,
      done: 0,
      archived: 0,
    };
    for (const lead of leads) {
      map[lead.status] = (map[lead.status] || 0) + 1;
    }
    return map;
  }, [leads]);

  const selectedLead = leads.find((lead) => lead.id === selectedId) ?? null;

  if (loading) {
    return <p className="text-muted">Загрузка заявок...</p>;
  }

  if (error) {
    return <p className="text-red-400">{error}</p>;
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="panel p-4">
          <p className="text-2xl font-semibold">{counts.all}</p>
          <p className="text-xs text-muted mt-1">Всего</p>
        </div>
        <div className="panel p-4">
          <p className="text-2xl font-semibold text-amber-400">{counts.new}</p>
          <p className="text-xs text-muted mt-1">Новые</p>
        </div>
        <div className="panel p-4">
          <p className="text-2xl font-semibold text-brand">
            {counts["in-progress"]}
          </p>
          <p className="text-xs text-muted mt-1">В работе</p>
        </div>
        <div className="panel p-4">
          <p className="text-2xl font-semibold text-emerald-400">
            {counts.done}
          </p>
          <p className="text-xs text-muted mt-1">Сделано</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-0 border border-border w-fit">
        {filterTabs.map((tab, i) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              i > 0 ? "border-l border-border" : ""
            } ${
              filter === tab.id
                ? "bg-foreground text-background"
                : "text-muted hover:text-foreground"
            }`}
          >
            {tab.label} ({counts[tab.id]})
          </button>
        ))}
      </div>

      {filteredLeads.length === 0 ? (
        <p className="text-muted">В выбранном фильтре заявок нет.</p>
      ) : (
        <div className="space-y-4">
          {filteredLeads.map((lead) => {
            const totals = calcTotals(lead.services, lead.quantities);
            const hasPrice = (lead.services?.length ?? 0) > 0;
            return (
              <button
                key={lead.id}
                onClick={() => setSelectedId(lead.id)}
                className="panel card-hover p-5 w-full text-left cursor-pointer"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <h3 className="font-semibold text-foreground">
                        {lead.name}
                      </h3>
                      <span
                        className={`text-xs px-2 py-1 border ${statusBadgeClass(
                          lead.status
                        )}`}
                      >
                        {statusLabels[lead.status]}
                      </span>
                    </div>
                    <p className="text-sm text-muted mb-1">
                      <span className="text-foreground/70">Контакт:</span>{" "}
                      {lead.contact}
                    </p>
                    {lead.description && (
                      <p className="text-sm text-muted line-clamp-3">
                        {lead.description}
                      </p>
                    )}
                    <p className="text-xs text-muted/60 mt-3">
                      {new Date(lead.createdAt).toLocaleString("ru-RU")}
                    </p>
                  </div>

                  {hasPrice && (
                    <div className="shrink-0 text-right">
                      <p className="text-lg font-semibold">
                        от {formatPrice(totals.oneTime)}
                      </p>
                      {totals.monthly > 0 && (
                        <p className="text-xs text-muted mt-0.5">
                          + {formatPrice(totals.monthly)}/мес
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Lead drawer */}
      {selectedLead && (
        <LeadDrawer
          key={selectedLead.id}
          lead={selectedLead}
          onClose={() => setSelectedId(null)}
          onStatusChange={updateStatus}
          onSaved={(updated) =>
            setLeads((prev) =>
              prev.map((lead) => (lead.id === updated.id ? updated : lead))
            )
          }
        />
      )}
    </div>
  );
}

function LeadDrawer({
  lead,
  onClose,
  onStatusChange,
  onSaved,
}: {
  lead: Lead;
  onClose: () => void;
  onStatusChange: (id: string, status: LeadStatus) => void;
  onSaved: (lead: Lead) => void;
}) {
  const [comment, setComment] = useState(lead.comment ?? "");
  const [services, setServices] = useState<string[]>(lead.services ?? []);
  const [quantities, setQuantities] = useState<Record<string, number>>(
    lead.quantities ?? {}
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const savedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current);
    };
  }, []);

  const totals = calcTotals(services, quantities);
  const href = contactHref(lead.contact);

  function toggleService(id: string) {
    setServices((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  }

  function setQuantity(id: string, value: number) {
    setQuantities((prev) => ({
      ...prev,
      [id]: Math.max(1, Math.floor(value) || 1),
    }));
  }

  async function save() {
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: lead.id,
          comment,
          services,
          quantities,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Ошибка сохранения");
      onSaved(data.lead);
      setSaved(true);
      if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current);
      savedTimeoutRef.current = setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <aside className="absolute inset-y-0 right-0 w-full max-w-xl panel border-l border-border flex flex-col">
        <div className="flex-1 overflow-y-auto" data-lenis-prevent>
          {/* Header */}
          <div className="flex items-start justify-between gap-4 p-6 border-b border-border">
            <div className="min-w-0">
              <h3 className="text-lg font-semibold break-words">{lead.name}</h3>
              <p className="text-xs text-muted mt-1">
                {new Date(lead.createdAt).toLocaleString("ru-RU")}
              </p>
            </div>
            <button
              onClick={onClose}
              aria-label="Закрыть"
              className="p-1.5 text-muted hover:text-foreground transition-colors"
            >
              <svg
                viewBox="0 0 24 24"
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div className="p-6 space-y-8">
            {/* Info */}
            <section>
              <span className="section-label">Информация</span>
              <div className="space-y-3">
                <p className="text-sm">
                  <span className="text-muted">Контакт:</span>{" "}
                  {href ? (
                    <a href={href} className="text-accent hover:underline break-all">
                      {lead.contact}
                    </a>
                  ) : (
                    <span className="break-words">{lead.contact}</span>
                  )}
                </p>
                {lead.description && (
                  <p className="text-sm text-muted whitespace-pre-line break-words">
                    {lead.description}
                  </p>
                )}
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted">Статус:</span>
                  <select
                    value={lead.status}
                    onChange={(e) =>
                      onStatusChange(lead.id, e.target.value as LeadStatus)
                    }
                    className="input-field py-2 text-sm w-44"
                  >
                    {filterTabs
                      .filter(
                        (tab): tab is { id: LeadStatus; label: string } =>
                          tab.id !== "all"
                      )
                      .map((tab) => (
                        <option key={tab.id} value={tab.id}>
                          {statusLabels[tab.id]}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            </section>

            {/* Comment */}
            <section>
              <span className="section-label">Заметка</span>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Внутренний комментарий к заявке"
                rows={3}
                className="input-field resize-none"
              />
            </section>

            {/* Services */}
            <section>
              <span className="section-label">Услуги и расчёт</span>
              <div className="space-y-6">
                {SERVICE_CATALOG.map((category) => (
                  <div key={category.category}>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-2.5">
                      {category.category}
                    </p>
                    <div className="space-y-2.5">
                      {category.items.map((item) => {
                        const checked = services.includes(item.id);
                        const withQuantity =
                          item.unit === "час" || item.unit === "шт";
                        return (
                          <div
                            key={item.id}
                            className="flex items-start justify-between gap-3"
                          >
                            <label className="flex items-start gap-2.5 cursor-pointer min-w-0">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleService(item.id)}
                                className="w-4 h-4 mt-0.5 accent-primary shrink-0"
                              />
                              <span className="min-w-0">
                                <span className="text-sm">{item.name}</span>
                                {item.note && (
                                  <span className="block text-xs text-muted">
                                    {item.note}
                                  </span>
                                )}
                              </span>
                            </label>
                            <span className="flex items-center gap-2 shrink-0">
                              {withQuantity && checked && (
                                <input
                                  type="number"
                                  min={1}
                                  value={quantities[item.id] ?? 1}
                                  onChange={(e) =>
                                    setQuantity(
                                      item.id,
                                      Number(e.target.value)
                                    )
                                  }
                                  className="bg-surface border border-border text-xs px-2 py-1 w-16 text-foreground focus:border-primary transition-colors"
                                />
                              )}
                              <span className="text-sm text-muted whitespace-nowrap">
                                {formatItemPrice(item)}
                              </span>
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>

        {/* Footer with totals */}
        <div className="panel-elevated border-t border-border p-5 space-y-3">
          <div>
            <p className="text-sm">
              <span className="text-muted">Итого разово:</span>{" "}
              <span className="font-semibold">{formatPrice(totals.oneTime)}</span>
            </p>
            {totals.monthly > 0 && (
              <p className="text-sm mt-1">
                <span className="text-muted">Ежемесячно:</span>{" "}
                <span className="font-semibold">
                  {formatPrice(totals.monthly)}/мес
                </span>
              </p>
            )}
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            onClick={save}
            disabled={saving}
            className="btn-primary w-full py-2.5 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Сохранение..." : saved ? "Сохранено" : "Сохранить"}
          </button>
        </div>
      </aside>
    </div>
  );
}
