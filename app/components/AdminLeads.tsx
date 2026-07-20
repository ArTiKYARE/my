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
  return phoneHref(contact);
}

function phoneHref(contact: string): string | null {
  if (contact.includes("@")) return null;
  if (/[+0-9][\d\s()\-]{5,}/.test(contact)) {
    return `tel:${contact.replace(/[^\d+]/g, "")}`;
  }
  return null;
}

function leadStatusTextClass(status: LeadStatus): string {
  switch (status) {
    case "new":
      return "text-amber-400";
    case "in-progress":
      return "text-brand";
    case "done":
      return "text-emerald-400";
    default:
      return "text-muted";
  }
}

const sortOptions = [
  { id: "newest", label: "Сначала новые" },
  { id: "oldest", label: "Сначала старые" },
  { id: "sum-desc", label: "По сумме ↓" },
  { id: "sum-asc", label: "По сумме ↑" },
] as const;

type SortMode = (typeof sortOptions)[number]["id"];

export default function AdminLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filter, setFilter] = useState<LeadStatus | "all">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortMode>("newest");

  // Create lead modal
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newContact, setNewContact] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");

  function openCreate() {
    setNewName("");
    setNewContact("");
    setNewDescription("");
    setCreateError("");
    setCreateOpen(true);
  }

  async function createLead() {
    if (!newName.trim() || !newContact.trim()) {
      setCreateError("Заполните имя и контакт.");
      return;
    }
    setCreateLoading(true);
    setCreateError("");
    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          contact: newContact.trim(),
          ...(newDescription.trim()
            ? { description: newDescription.trim() }
            : {}),
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Не удалось создать заявку");
      }
      setLeads((prev) => [data.lead, ...prev]);
      setCreateOpen(false);
    } catch (err) {
      setCreateError(
        err instanceof Error ? err.message : "Не удалось создать заявку"
      );
    } finally {
      setCreateLoading(false);
    }
  }

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
    const query = search.trim().toLowerCase();
    return leads.filter((lead) => {
      if (filter !== "all" && lead.status !== filter) return false;
      if (!query) return true;
      return [lead.name, lead.contact, lead.description, lead.comment ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [leads, filter, search]);

  const totalsMap = useMemo(
    () =>
      new Map(
        leads.map((lead) => [
          lead.id,
          calcTotals(lead.services, lead.quantities),
        ])
      ),
    [leads]
  );

  const sortedLeads = useMemo(() => {
    const arr = [...filteredLeads];
    const sum = (lead: Lead) => totalsMap.get(lead.id)?.oneTime ?? 0;
    const hasServices = (lead: Lead) => (lead.services?.length ?? 0) > 0;
    switch (sort) {
      case "oldest":
        arr.sort(
          (a, b) => +new Date(a.createdAt) - +new Date(b.createdAt)
        );
        break;
      case "sum-desc":
        // Заявки без услуг — в конец
        arr.sort(
          (a, b) =>
            Number(hasServices(b)) - Number(hasServices(a)) ||
            sum(b) - sum(a)
        );
        break;
      case "sum-asc":
        arr.sort(
          (a, b) =>
            Number(hasServices(b)) - Number(hasServices(a)) ||
            sum(a) - sum(b)
        );
        break;
      default:
        arr.sort(
          (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)
        );
    }
    return arr;
  }, [filteredLeads, sort, totalsMap]);

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

      {/* Search + sort */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <svg
            viewBox="0 0 24 24"
            className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по имени, контакту, описанию"
            className="input-field pl-9 py-2 text-sm"
          />
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortMode)}
          className="bg-surface border border-border text-xs px-2 py-1.5 cursor-pointer transition-colors focus:border-primary text-muted"
        >
          {sortOptions.map((option) => (
            <option key={option.id} value={option.id} className="text-foreground">
              {option.label}
            </option>
          ))}
        </select>
        <button
          onClick={openCreate}
          className="btn-primary px-4 py-2 text-sm font-medium ml-auto"
        >
          Новая заявка
        </button>
      </div>

      {sortedLeads.length === 0 ? (
        leads.length === 0 ? (
          <div className="panel p-10 text-center">
            <p className="text-muted">
              Заявок пока нет — новые появятся здесь после отправки формы на
              сайте.
            </p>
          </div>
        ) : (
          <p className="text-muted">Ничего не найдено.</p>
        )
      ) : (
        <div className="space-y-3">
          {sortedLeads.map((lead) => {
            const totals = totalsMap.get(lead.id) ?? {
              oneTime: 0,
              monthly: 0,
            };
            const hasPrice = (lead.services?.length ?? 0) > 0;
            return (
              <button
                key={lead.id}
                onClick={() => setSelectedId(lead.id)}
                className="panel card-hover p-4 w-full text-left cursor-pointer"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-3 mb-1.5">
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
                      <p className="text-sm text-muted line-clamp-2">
                        {lead.description}
                      </p>
                    )}
                    <p className="text-xs text-muted/60 mt-2">
                      {new Date(lead.createdAt).toLocaleString("ru-RU")}
                    </p>
                  </div>

                  <div className="shrink-0 flex md:flex-col items-center md:items-end gap-2">
                    {hasPrice && (
                      <div className="text-right">
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
                    <select
                      value={lead.status}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => {
                        e.stopPropagation();
                        updateStatus(lead.id, e.target.value as LeadStatus);
                      }}
                      className={`bg-surface border border-border text-xs px-2 py-1.5 cursor-pointer transition-colors focus:border-primary ${leadStatusTextClass(
                        lead.status
                      )}`}
                    >
                      {filterTabs
                        .filter(
                          (tab): tab is { id: LeadStatus; label: string } =>
                            tab.id !== "all"
                        )
                        .map((tab) => (
                          <option
                            key={tab.id}
                            value={tab.id}
                            className="text-foreground"
                          >
                            {statusLabels[tab.id]}
                          </option>
                        ))}
                    </select>
                  </div>
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
          onDeleted={(id) => {
            setLeads((prev) => prev.filter((lead) => lead.id !== id));
            setSelectedId(null);
          }}
        />
      )}

      {/* Create lead modal */}
      {createOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          onClick={() => setCreateOpen(false)}
        >
          <div
            className="panel max-w-md w-full p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <h3 className="text-lg font-semibold">Новая заявка</h3>
              <button
                onClick={() => setCreateOpen(false)}
                aria-label="Закрыть"
                className="p-1 text-muted hover:text-foreground transition-colors"
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

            <div>
              <label className="block text-sm font-medium mb-1.5">Имя *</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Контакт *
              </label>
              <input
                type="text"
                value={newContact}
                onChange={(e) => setNewContact(e.target.value)}
                placeholder="Телефон или email"
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Описание
              </label>
              <textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                rows={4}
                className="input-field resize-none"
              />
            </div>

            {createError && (
              <p className="text-sm text-red-400">{createError}</p>
            )}

            <button
              onClick={createLead}
              disabled={createLoading}
              className="btn-primary w-full py-2.5 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createLoading ? "Создание..." : "Создать"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function LeadDrawer({
  lead,
  onClose,
  onStatusChange,
  onSaved,
  onDeleted,
}: {
  lead: Lead;
  onClose: () => void;
  onStatusChange: (id: string, status: LeadStatus) => void;
  onSaved: (lead: Lead) => void;
  onDeleted: (id: string) => void;
}) {
  const [comment, setComment] = useState(lead.comment ?? "");
  const [services, setServices] = useState<string[]>(lead.services ?? []);
  const [quantities, setQuantities] = useState<Record<string, number>>(
    lead.quantities ?? {}
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const savedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Contract modal
  const [contractOpen, setContractOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerContact, setCustomerContact] = useState("");
  const [executorName, setExecutorName] = useState("");
  const [executorContact, setExecutorContact] = useState("");
  const [contractLoading, setContractLoading] = useState(false);
  const [contractError, setContractError] = useState("");

  useEffect(() => {
    return () => {
      if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current);
    };
  }, []);

  // Close on Escape
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const totals = calcTotals(services, quantities);
  const href = contactHref(lead.contact);
  const phone = phoneHref(lead.contact);
  const hasSavedServices = (lead.services?.length ?? 0) > 0;

  // Есть ли несохранённые изменения (заметка/услуги/количества)
  const dirty = useMemo(() => {
    if (comment !== (lead.comment ?? "")) return true;
    const savedServices = new Set(lead.services ?? []);
    if (
      services.length !== savedServices.size ||
      services.some((id) => !savedServices.has(id))
    ) {
      return true;
    }
    const savedQuantities = lead.quantities ?? {};
    const keys = new Set([
      ...Object.keys(quantities),
      ...Object.keys(savedQuantities),
    ]);
    for (const key of keys) {
      if ((quantities[key] ?? 1) !== (savedQuantities[key] ?? 1)) return true;
    }
    return false;
  }, [comment, services, quantities, lead]);

  function openContract() {
    let executor = { name: "", contact: "" };
    try {
      const raw = localStorage.getItem("leadhunter_sender");
      if (raw) {
        const parsed = JSON.parse(raw);
        executor = {
          name: parsed.name ?? "",
          contact: parsed.contact ?? "",
        };
      }
    } catch {
      // ignore broken storage
    }
    setCustomerName(lead.name);
    setCustomerContact(lead.contact);
    setExecutorName(executor.name);
    setExecutorContact(executor.contact);
    setContractError("");
    setContractOpen(true);
  }

  async function generateContract() {
    if (!customerName.trim() || !customerContact.trim()) {
      setContractError("Заполните обязательные поля заказчика.");
      return;
    }
    setContractLoading(true);
    setContractError("");
    try {
      const response = await fetch(`/api/leads/${lead.id}/contract`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: customerName.trim(),
          customerContact: customerContact.trim(),
          ...(executorName.trim()
            ? { executorName: executorName.trim() }
            : {}),
          ...(executorContact.trim()
            ? { executorContact: executorContact.trim() }
            : {}),
        }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || "Не удалось сформировать договор");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Dogovor-${lead.id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      setContractOpen(false);
    } catch (err) {
      setContractError(
        err instanceof Error ? err.message : "Не удалось сформировать договор"
      );
    } finally {
      setContractLoading(false);
    }
  }

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

  async function deleteLead() {
    setDeleting(true);
    setError("");
    try {
      const response = await fetch("/api/leads", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: lead.id }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Ошибка удаления");
      onDeleted(lead.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка удаления");
      setConfirmDelete(false);
      setDeleting(false);
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
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-sm">
                    <span className="text-muted">Контакт:</span>{" "}
                    {href ? (
                      <a
                        href={href}
                        className="text-accent hover:underline break-all"
                      >
                        {lead.contact}
                      </a>
                    ) : (
                      <span className="break-words">{lead.contact}</span>
                    )}
                  </p>
                  {phone && (
                    <a
                      href={phone}
                      className="btn-secondary px-3 py-1.5 text-xs"
                    >
                      Позвонить
                    </a>
                  )}
                </div>
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

            {/* Documents */}
            <section>
              <span className="section-label">Документы</span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() =>
                    window.open(`/api/leads/${lead.id}/proposal`, "_blank")
                  }
                  disabled={!hasSavedServices}
                  className="btn-secondary px-4 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Скачать КП (PDF)
                </button>
                <button
                  onClick={openContract}
                  className="btn-primary px-4 py-2 text-sm"
                >
                  Договор (PDF)
                </button>
              </div>
              {!hasSavedServices ? (
                <p className="text-xs text-muted mt-2">
                  Сначала выберите услуги
                </p>
              ) : dirty ? (
                <p className="text-xs text-amber-400 mt-2">
                  Сохраните изменения, чтобы они попали в документ
                </p>
              ) : null}
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
          <div className="flex items-center gap-3">
            {confirmDelete ? (
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-red-400">Точно удалить?</span>
                <button
                  onClick={deleteLead}
                  disabled={deleting}
                  className="px-3 py-1.5 text-xs border border-red-400/30 text-red-400 hover:bg-red-400/10 transition-colors disabled:opacity-50"
                >
                  {deleting ? "..." : "Да"}
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="px-3 py-1.5 text-xs text-muted hover:text-foreground transition-colors"
                >
                  Отмена
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="px-3 py-1.5 text-xs border border-red-400/30 text-red-400 hover:bg-red-400/10 transition-colors shrink-0"
              >
                Удалить
              </button>
            )}
            <button
              onClick={save}
              disabled={saving}
              className="btn-primary flex-1 py-2.5 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Сохранение..." : saved ? "Сохранено" : "Сохранить"}
            </button>
          </div>
        </div>
      </aside>

      {/* Contract modal */}
      {contractOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4"
          onClick={() => setContractOpen(false)}
        >
          <div
            className="panel max-w-md w-full p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <h3 className="text-lg font-semibold">Договор (PDF)</h3>
              <button
                onClick={() => setContractOpen(false)}
                aria-label="Закрыть"
                className="p-1 text-muted hover:text-foreground transition-colors"
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

            <div>
              <label className="block text-sm font-medium mb-1.5">
                Заказчик (компания/ФИО) *
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Контакт заказчика *
              </label>
              <input
                type="text"
                value={customerContact}
                onChange={(e) => setCustomerContact(e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Исполнитель
              </label>
              <input
                type="text"
                value={executorName}
                onChange={(e) => setExecutorName(e.target.value)}
                placeholder="По умолчанию из профиля"
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Контакт исполнителя
              </label>
              <input
                type="text"
                value={executorContact}
                onChange={(e) => setExecutorContact(e.target.value)}
                placeholder="По умолчанию из профиля"
                className="input-field"
              />
            </div>

            {contractError && (
              <p className="text-sm text-red-400">{contractError}</p>
            )}

            <button
              onClick={generateContract}
              disabled={contractLoading}
              className="btn-primary w-full py-2.5 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {contractLoading ? "Формирование..." : "Сформировать"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
