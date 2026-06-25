"use client";

import { useEffect, useMemo, useState } from "react";
import { Lead, LeadStatus } from "../lib/types";

const statusLabels: Record<LeadStatus | "all", string> = {
  all: "Все",
  new: "Новая",
  "in-progress": "В работе",
  done: "Завершена",
  archived: "В архиве",
};

const statusOptions: (LeadStatus | "all")[] = [
  "all",
  "new",
  "in-progress",
  "done",
  "archived",
];

export default function AdminLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filter, setFilter] = useState<LeadStatus | "all">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  if (loading) {
    return <p className="text-muted">Загрузка заявок...</p>;
  }

  if (error) {
    return <p className="text-red-400">{error}</p>;
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {statusOptions.map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 text-sm font-medium border transition-colors ${
              filter === status
                ? "bg-foreground text-background border-foreground"
                : "bg-surface text-muted border-border hover:text-foreground"
            }`}
          >
            {statusLabels[status]}
            <span
              className={`ml-2 text-xs px-1.5 py-0.5 ${
                filter === status
                  ? "bg-background/20 text-background"
                  : "bg-surface-elevated text-muted"
              }`}
            >
              {counts[status]}
            </span>
          </button>
        ))}
      </div>

      {filteredLeads.length === 0 ? (
        <p className="text-muted">В выбранном фильтре заявок нет.</p>
      ) : (
        <div className="space-y-4">
          {filteredLeads.map((lead) => (
            <div key={lead.id} className="panel p-5">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <h3 className="font-semibold text-foreground">{lead.name}</h3>
                    <span
                      className={`text-xs px-2 py-1 border ${
                        lead.status === "new"
                          ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                          : lead.status === "in-progress"
                          ? "bg-primary/10 border-primary/20 text-brand"
                          : lead.status === "done"
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                          : "bg-surface-elevated border-border text-muted"
                      }`}
                    >
                      {statusLabels[lead.status]}
                    </span>
                  </div>
                  <p className="text-sm text-muted mb-1">
                    <span className="text-foreground/70">Контакт:</span> {lead.contact}
                  </p>
                  {lead.description && (
                    <p className="text-sm text-muted line-clamp-3">{lead.description}</p>
                  )}
                  <p className="text-xs text-muted/60 mt-3">
                    {new Date(lead.createdAt).toLocaleString("ru-RU")}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={lead.status}
                    onChange={(e) => updateStatus(lead.id, e.target.value as LeadStatus)}
                    className="input-field py-2 text-sm w-40"
                  >
                    {statusOptions
                      .filter((s): s is LeadStatus => s !== "all")
                      .map((status) => (
                        <option key={status} value={status}>
                          {statusLabels[status]}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
