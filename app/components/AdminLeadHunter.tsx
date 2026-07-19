"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { leadKey } from "../lib/leadgen/types";

interface HuntLead {
  name: string;
  category: string;
  city: string;
  address: string;
  phone: string;
  phones: string;
  email: string;
  website: string;
  site_status: string;
  site_cms: string;
  score: number;
  notes: string;
  rating: number | null;
  reviews: number | null;
  source: string;
  source_url: string;
}

interface SenderProfile {
  name: string;
  portfolio: string;
  contact: string;
  usp: string;
}

interface HuntJob {
  id: string;
  status: "pending" | "running" | "done" | "error";
  phase: string;
  done: number;
  total: number;
  log: string[];
  error: string | null;
  stats: { total: number; hot: number; warm: number; no_site: number };
}

interface BatchMessage {
  name: string;
  email: string;
  phone: string;
  website: string;
  subject: string;
  body: string;
  scenario: string;
}

interface MessageDialog {
  lead: HuntLead;
  loading: boolean;
  subject: string;
  body: string;
  scenario: string;
  copied: boolean;
  error: string;
}

type LeadFilter = "all" | "hot" | "warm" | "nosite" | "fav";

const SENDER_STORAGE_KEY = "leadhunter_sender";

const quickNiches = [
  "салон красоты",
  "стоматология",
  "автосервис",
  "кофейня",
  "юрист",
  "фитнес",
];

const statusLabels: Record<HuntJob["status"], string> = {
  pending: "В очереди",
  running: "Выполняется",
  done: "Готово",
  error: "Ошибка",
};

const filterTabs: { id: LeadFilter; label: string }[] = [
  { id: "all", label: "Все" },
  { id: "hot", label: "Горячие" },
  { id: "warm", label: "Тёплые" },
  { id: "nosite", label: "Без сайта" },
];

// Колонки CSV — те же, что в серверном экспорте
// (app/api/leadsearch/jobs/[id]/export/route.ts)
const CSV_COLUMNS: [keyof HuntLead, string][] = [
  ["name", "Название"],
  ["category", "Рубрика"],
  ["city", "Город"],
  ["address", "Адрес"],
  ["phone", "Телефон"],
  ["email", "Email"],
  ["website", "Сайт"],
  ["site_status", "Статус сайта"],
  ["site_cms", "CMS/конструктор"],
  ["score", "Оценка лида"],
  ["notes", "Примечания"],
  ["rating", "Рейтинг"],
  ["reviews", "Отзывов"],
  ["source", "Источник"],
  ["source_url", "Ссылка на карточку"],
];

function csvCell(value: unknown): string {
  const s = value === null || value === undefined ? "" : String(value);
  if (/[;"\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function downloadLeadsCsv(list: HuntLead[], filename: string) {
  const header = CSV_COLUMNS.map(([, label]) => csvCell(label)).join(";");
  const rows = list.map((lead) =>
    CSV_COLUMNS.map(([key]) => csvCell(lead[key])).join(";")
  );
  // BOM, чтобы Excel корректно открывал кириллицу
  const csv = "\uFEFF" + [header, ...rows].join("\r\n") + "\r\n";
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="w-4 h-4"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function isHot(lead: HuntLead) {
  return lead.score >= 85;
}

function isWarm(lead: HuntLead) {
  return lead.score >= 55 && lead.score < 85;
}

function websiteHost(url: string): string {
  try {
    const href = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    return new URL(href).host;
  } catch {
    return url;
  }
}

function websiteHref(url: string): string {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

function logLineClass(line: string): string {
  if (line.startsWith("⚠")) return "text-amber-400";
  if (line.startsWith("★")) return "text-accent";
  if (line.startsWith("✓")) return "text-emerald-400";
  return "text-muted";
}

export default function AdminLeadHunter() {
  // Search form
  const [city, setCity] = useState("");
  const [niches, setNiches] = useState("");
  const [source, setSource] = useState<"yandex" | "2gis" | "both">("yandex");
  const [apiKey, setApiKey] = useState("");
  const [limit, setLimit] = useState(20);
  const [analyze, setAnalyze] = useState(true);
  const [findEmail, setFindEmail] = useState(true);

  // Sender
  const [sender, setSender] = useState<SenderProfile>({
    name: "",
    portfolio: "",
    contact: "",
    usp: "",
  });

  // Job state
  const [job, setJob] = useState<HuntJob | null>(null);
  const [leads, setLeads] = useState<HuntLead[]>([]);
  const [filter, setFilter] = useState<LeadFilter>("all");
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");
  const [batchLoading, setBatchLoading] = useState(false);
  const [dialog, setDialog] = useState<MessageDialog | null>(null);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const logRef = useRef<HTMLDivElement | null>(null);
  const logStickToBottomRef = useRef(true);

  const running =
    starting || job?.status === "pending" || job?.status === "running";

  // Favorites
  const [favorites, setFavorites] = useState<HuntLead[]>([]);
  const favoriteKeys = useMemo(
    () => new Set(favorites.map((lead) => leadKey(lead))),
    [favorites]
  );

  // Load sender profile from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SENDER_STORAGE_KEY);
      if (raw) setSender({ name: "", portfolio: "", contact: "", usp: "", ...JSON.parse(raw) });
    } catch {
      // ignore broken storage
    }
  }, []);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  // Auto-scroll log to bottom — only if the user hasn't scrolled up
  useEffect(() => {
    const el = logRef.current;
    if (el && logStickToBottomRef.current) {
      el.scrollTop = el.scrollHeight;
    }
  }, [job?.log]);

  function handleLogScroll() {
    const el = logRef.current;
    if (!el) return;
    logStickToBottomRef.current =
      el.scrollHeight - el.scrollTop - el.clientHeight < 40;
  }

  // Load favorites on mount
  useEffect(() => {
    fetch("/api/leadsearch/favorites")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.leads) setFavorites(data.leads);
      })
      .catch(() => {
        // избранное недоступно — работаем без него
      });
  }, []);

  async function toggleFavorite(lead: HuntLead) {
    const key = leadKey(lead);
    const isFav = favoriteKeys.has(key);
    const prev = favorites;
    // Оптимистичное обновление
    setFavorites(
      isFav
        ? favorites.filter((item) => leadKey(item) !== key)
        : [lead, ...favorites]
    );
    try {
      const response = await fetch("/api/leadsearch/favorites", {
        method: isFav ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isFav ? { key } : { lead }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Не удалось обновить избранное");
      }
      if (data.leads) setFavorites(data.leads);
    } catch (err) {
      setFavorites(prev);
      setError(
        err instanceof Error ? err.message : "Не удалось обновить избранное"
      );
    }
  }

  function updateSender(field: keyof SenderProfile, value: string) {
    setSender((prev) => {
      const next = { ...prev, [field]: value };
      try {
        localStorage.setItem(SENDER_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore storage errors
      }
      return next;
    });
  }

  function addNiche(niche: string) {
    setNiches((prev) => {
      const trimmed = prev.trim();
      if (!trimmed) return niche;
      if (trimmed.endsWith(",")) return `${trimmed} ${niche}`;
      return `${trimmed}, ${niche}`;
    });
  }

  function stopPolling() {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }

  async function fetchJobState(jobId: string) {
    try {
      const [jobRes, leadsRes] = await Promise.all([
        fetch(`/api/leadsearch/jobs/${jobId}`),
        fetch(`/api/leadsearch/jobs/${jobId}/leads`),
      ]);
      if (jobRes.ok) {
        const jobData: HuntJob = await jobRes.json();
        setJob(jobData);
        if (jobData.status === "done" || jobData.status === "error") {
          stopPolling();
        }
      }
      if (leadsRes.ok) {
        const leadsData = await leadsRes.json();
        setLeads(leadsData.leads || []);
      }
    } catch {
      // transient network errors during polling are ignored
    }
  }

  async function startSearch(e: FormEvent) {
    e.preventDefault();
    setError("");

    const queries = niches
      .split(",")
      .map((q) => q.trim())
      .filter(Boolean);

    if (!city.trim()) {
      setError("Укажите город.");
      return;
    }
    if (queries.length === 0) {
      setError("Укажите хотя бы одну нишу.");
      return;
    }

    setStarting(true);
    stopPolling();
    setLeads([]);
    setJob(null);
    setFilter("all");
    logStickToBottomRef.current = true;

    try {
      const response = await fetch("/api/leadsearch/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          city: city.trim(),
          queries,
          source,
          limit,
          analyze,
          find_email: findEmail,
          ...(source !== "yandex" && apiKey.trim()
            ? { api_key: apiKey.trim() }
            : {}),
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Не удалось запустить поиск");
      }

      const jobId: string = data.job_id;
      await fetchJobState(jobId);
      pollRef.current = setInterval(() => fetchJobState(jobId), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось запустить поиск");
    } finally {
      setStarting(false);
    }
  }

  const displayedLeads =
    filter === "fav"
      ? favorites
      : leads.filter((lead) => {
          if (filter === "hot") return isHot(lead);
          if (filter === "warm") return isWarm(lead);
          if (filter === "nosite") return !lead.website;
          return true;
        });

  const stats = {
    total: leads.length,
    hot: leads.filter(isHot).length,
    warm: leads.filter(isWarm).length,
    noSite: leads.filter((l) => !l.website).length,
  };

  async function openMessage(lead: HuntLead) {
    setDialog({
      lead,
      loading: true,
      subject: "",
      body: "",
      scenario: "",
      copied: false,
      error: "",
    });
    try {
      const response = await fetch("/api/leadsearch/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lead, sender }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Не удалось сгенерировать письмо");
      }
      setDialog((prev) =>
        prev
          ? {
              ...prev,
              loading: false,
              subject: data.subject,
              body: data.body,
              scenario: data.scenario,
            }
          : prev
      );
    } catch (err) {
      setDialog((prev) =>
        prev
          ? {
              ...prev,
              loading: false,
              error:
                err instanceof Error
                  ? err.message
                  : "Не удалось сгенерировать письмо",
            }
          : prev
      );
    }
  }

  async function copyMessage() {
    if (!dialog) return;
    try {
      await navigator.clipboard.writeText(
        `Тема: ${dialog.subject}\n\n${dialog.body}`
      );
      setDialog((prev) => (prev ? { ...prev, copied: true } : prev));
      setTimeout(() => {
        setDialog((prev) => (prev ? { ...prev, copied: false } : prev));
      }, 1500);
    } catch {
      setDialog((prev) =>
        prev ? { ...prev, error: "Не удалось скопировать текст" } : prev
      );
    }
  }

  async function downloadBatch() {
    if (displayedLeads.length === 0) return;
    setError("");
    setBatchLoading(true);
    try {
      const response = await fetch("/api/leadsearch/messages/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leads: displayedLeads, sender }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Не удалось сгенерировать письма");
      }
      const messages: BatchMessage[] = data.messages || [];
      const text = messages
        .map(
          (m) =>
            `=== ${m.name} (${m.email || m.phone}) ===\nТема: ${m.subject}\n\n${m.body}`
        )
        .join("\n\n\n");
      const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "pisma.txt";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Не удалось сгенерировать письма"
      );
    } finally {
      setBatchLoading(false);
    }
  }

  const progress =
    job && job.total > 0 ? Math.round((job.done / job.total) * 100) : 0;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-6">
      {/* LEFT column */}
      <div className="space-y-6">
        {/* Search form */}
        <form onSubmit={startSearch} className="panel p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Город</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Город, например: Москва"
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">
              Ниши (через запятую)
            </label>
            <textarea
              value={niches}
              onChange={(e) => setNiches(e.target.value)}
              placeholder="салон красоты, стоматология, кофейня"
              rows={3}
              className="input-field resize-none"
            />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {quickNiches.map((niche) => (
                <button
                  key={niche}
                  type="button"
                  onClick={() => addNiche(niche)}
                  className="px-2.5 py-1 text-xs text-muted border border-border hover:text-foreground hover:border-white/20 transition-colors"
                >
                  {niche}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Источник</label>
            <select
              value={source}
              onChange={(e) =>
                setSource(e.target.value as "yandex" | "2gis" | "both")
              }
              className="input-field"
            >
              <option value="yandex">Яндекс Карты</option>
              <option value="2gis">2GIS</option>
              <option value="both">Оба источника</option>
            </select>
          </div>

          {source !== "yandex" && (
            <div>
              <label className="block text-sm font-medium mb-1.5">
                API-ключ 2GIS
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Ключ API 2GIS"
                className="input-field"
              />
            </div>
          )}

          <div>
            <label className="flex items-center justify-between text-sm font-medium mb-1.5">
              <span>Лимит результатов</span>
              <span className="text-muted font-normal">{limit}</span>
            </label>
            <input
              type="range"
              min={5}
              max={50}
              step={5}
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="w-full accent-primary"
            />
          </div>

          <div className="space-y-2.5">
            <label className="flex items-center gap-2.5 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={analyze}
                onChange={(e) => setAnalyze(e.target.checked)}
                className="w-4 h-4 accent-primary"
              />
              Анализировать сайты
            </label>
            <label className="flex items-center gap-2.5 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={findEmail}
                onChange={(e) => setFindEmail(e.target.checked)}
                className="w-4 h-4 accent-primary"
              />
              Искать email
            </label>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={running}
            className="btn-primary w-full py-2.5 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {running ? "Поиск..." : "Начать поиск"}
          </button>
        </form>

        {/* Sender card */}
        <details className="panel">
          <summary className="px-5 py-4 text-sm font-medium cursor-pointer select-none hover:bg-white/5 transition-colors">
            Данные отправителя
          </summary>
          <div className="px-5 pb-5 pt-1 space-y-4 border-t border-border">
            <div className="pt-3">
              <label className="block text-sm font-medium mb-1.5">
                Ваше имя
              </label>
              <input
                type="text"
                value={sender.name}
                onChange={(e) => updateSender("name", e.target.value)}
                placeholder="Денис"
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Ссылка на портфолио
              </label>
              <input
                type="text"
                value={sender.portfolio}
                onChange={(e) => updateSender("portfolio", e.target.value)}
                placeholder="https://kos-ko.ru"
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Контакт (телеграм/телефон)
              </label>
              <input
                type="text"
                value={sender.contact}
                onChange={(e) => updateSender("contact", e.target.value)}
                placeholder="@username или +7 ..."
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Ваше УТП
              </label>
              <textarea
                value={sender.usp}
                onChange={(e) => updateSender("usp", e.target.value)}
                placeholder="Чем вы отличаетесь от конкурентов"
                rows={3}
                className="input-field resize-none"
              />
            </div>
          </div>
        </details>
      </div>

      {/* RIGHT column */}
      <div className="space-y-6 min-w-0">
        {/* Job progress */}
        {job && (
          <div className="panel p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm">
                <span className="text-muted">Статус:</span>{" "}
                <span className="font-medium">
                  {statusLabels[job.status]}
                </span>
                {job.phase && (
                  <span className="text-muted"> — {job.phase}</span>
                )}
              </p>
              <p className="text-sm text-muted">
                {job.done} / {job.total}
              </p>
            </div>
            <div className="h-1.5 bg-surface-elevated w-full">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            {job.status === "error" && job.error && (
              <p className="text-sm text-red-400">{job.error}</p>
            )}
            {job.log.length > 0 && (
              <div
                ref={logRef}
                onScroll={handleLogScroll}
                data-lenis-prevent
                className="panel-elevated h-40 overflow-y-auto p-3 font-mono text-xs space-y-1"
              >
                {job.log.map((line, i) => (
                  <p key={i} className={logLineClass(line)}>
                    {line}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {!job && leads.length === 0 && (
          <div className="panel p-10 text-center">
            <p className="text-muted">
              Найдите компании без сайта или с устаревшим сайтом — укажите
              город и ниши, затем запустите поиск.
            </p>
          </div>
        )}

        {/* Stats */}
        {leads.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="panel p-4">
              <p className="text-2xl font-semibold">{stats.total}</p>
              <p className="text-xs text-muted mt-1">Всего</p>
            </div>
            <div className="panel p-4">
              <p className="text-2xl font-semibold text-red-400">{stats.hot}</p>
              <p className="text-xs text-muted mt-1">Горячие</p>
            </div>
            <div className="panel p-4">
              <p className="text-2xl font-semibold text-amber-400">
                {stats.warm}
              </p>
              <p className="text-xs text-muted mt-1">Тёплые</p>
            </div>
            <div className="panel p-4">
              <p className="text-2xl font-semibold">{stats.noSite}</p>
              <p className="text-xs text-muted mt-1">Без сайта</p>
            </div>
          </div>
        )}

        {/* Results */}
        {(leads.length > 0 || favorites.length > 0) && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
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
                    {tab.label}
                  </button>
                ))}
                <button
                  onClick={() => setFilter("fav")}
                  className={`px-4 py-2 text-sm font-medium transition-colors border-l border-border ${
                    filter === "fav"
                      ? "bg-foreground text-background"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  ★ Избранное ({favorites.length})
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {filter === "fav" ? (
                  <button
                    onClick={() =>
                      downloadLeadsCsv(displayedLeads, "izbrannoe.csv")
                    }
                    disabled={displayedLeads.length === 0}
                    className="btn-secondary px-4 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Скачать CSV
                  </button>
                ) : (
                  job && (
                    <a
                      href={`/api/leadsearch/jobs/${job.id}/export?fmt=csv`}
                      className="btn-secondary px-4 py-2 text-sm"
                    >
                      Скачать CSV
                    </a>
                  )
                )}
                <button
                  onClick={downloadBatch}
                  disabled={batchLoading || displayedLeads.length === 0}
                  className="btn-secondary px-4 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {batchLoading
                    ? "Генерация..."
                    : `Письма для всех (${displayedLeads.length})`}
                </button>
              </div>
            </div>

            <div className="panel overflow-x-auto" data-lenis-prevent>
              <table className="w-full table-auto text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted text-xs uppercase tracking-wider">
                    <th className="px-4 py-3 font-medium min-w-[180px]">
                      Компания
                    </th>
                    <th className="px-4 py-3 font-medium min-w-[120px]">
                      Телефон
                    </th>
                    <th className="px-4 py-3 font-medium min-w-[140px]">
                      Сайт
                    </th>
                    <th className="px-4 py-3 font-medium min-w-[80px]">
                      Оценка
                    </th>
                    <th className="px-4 py-3 font-medium min-w-[200px]">
                      Заметки
                    </th>
                    <th className="px-4 py-3 font-medium" />
                  </tr>
                </thead>
                <tbody>
                  {displayedLeads.map((lead, i) => {
                    const isFav = favoriteKeys.has(leadKey(lead));
                    return (
                      <tr
                        key={`${lead.name}-${i}`}
                        className="border-b border-border last:border-0 hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="px-4 py-3 break-words">
                          <p className="font-medium break-words">{lead.name}</p>
                          <p className="text-xs text-muted">{lead.category}</p>
                          {lead.email && (
                            <p className="text-xs text-accent break-all">
                              {lead.email}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 break-words">
                          {lead.phone ? (
                            <>
                              <p>{lead.phone}</p>
                              {lead.phones && lead.phones !== lead.phone && (
                                <p className="text-xs text-muted break-words">
                                  {lead.phones}
                                </p>
                              )}
                            </>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {lead.website ? (
                            <span className="inline-flex flex-wrap items-center gap-2">
                              <a
                                href={websiteHref(lead.website)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-accent hover:underline break-all"
                              >
                                {websiteHost(lead.website)}
                              </a>
                              {lead.site_cms && (
                                <span className="text-xs text-muted border border-border px-1.5 py-0.5">
                                  {lead.site_cms}
                                </span>
                              )}
                            </span>
                          ) : (
                            <span className="text-xs text-muted border border-border px-1.5 py-0.5">
                              нет сайта
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block px-2 py-0.5 text-xs font-medium border ${
                              isHot(lead)
                                ? "text-red-400 border-red-400/30 bg-red-400/10"
                                : isWarm(lead)
                                  ? "text-amber-400 border-amber-400/30 bg-amber-400/10"
                                  : "text-muted border-border bg-surface-elevated"
                            }`}
                          >
                            {lead.score}
                          </span>
                          <div className="h-1 bg-surface-elevated w-16 mt-1.5">
                            <div
                              className={`h-full ${
                                isHot(lead)
                                  ? "bg-red-400"
                                  : isWarm(lead)
                                    ? "bg-amber-400"
                                    : "bg-muted"
                              }`}
                              style={{
                                width: `${Math.min(100, Math.max(0, lead.score))}%`,
                              }}
                            />
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted break-words whitespace-normal">
                          {lead.notes || "—"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => toggleFavorite(lead)}
                              aria-label={
                                isFav
                                  ? "Убрать из избранного"
                                  : "В избранное"
                              }
                              title={
                                isFav
                                  ? "Убрать из избранного"
                                  : "В избранное"
                              }
                              className={`p-1.5 transition-colors ${
                                isFav
                                  ? "text-amber-400"
                                  : "text-muted hover:text-amber-400"
                              }`}
                            >
                              <StarIcon filled={isFav} />
                            </button>
                            <button
                              onClick={() => openMessage(lead)}
                              className="btn-secondary px-3 py-1.5 text-xs"
                            >
                              Письмо
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {displayedLeads.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-8 text-center text-muted"
                      >
                        {filter === "fav"
                          ? "В избранном пока пусто."
                          : "Нет лидов в этой категории."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* Message dialog */}
      {dialog && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setDialog(null)}
        >
          <div
            className="panel max-w-lg w-full p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h3 className="text-lg font-semibold truncate">
                  {dialog.lead.name}
                </h3>
                {dialog.scenario && (
                  <p className="text-xs text-muted mt-0.5">
                    Сценарий: {dialog.scenario}
                  </p>
                )}
              </div>
              <button
                onClick={() => setDialog(null)}
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

            {dialog.loading ? (
              <p className="text-sm text-muted py-8 text-center">
                Генерация письма...
              </p>
            ) : dialog.error ? (
              <p className="text-sm text-red-400">{dialog.error}</p>
            ) : (
              <>
                <div>
                  <p className="text-xs text-muted mb-1">Тема</p>
                  <p className="text-sm font-medium">{dialog.subject}</p>
                </div>
                <textarea
                  readOnly
                  value={dialog.body}
                  className="input-field h-64 font-mono text-sm resize-none"
                />
              </>
            )}

            <div className="flex flex-wrap gap-2 justify-end">
              <button
                onClick={copyMessage}
                disabled={dialog.loading || !!dialog.error}
                className="btn-secondary px-4 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {dialog.copied ? "Скопировано" : "Копировать"}
              </button>
              {dialog.lead.email && (
                <a
                  href={`mailto:${dialog.lead.email}?subject=${encodeURIComponent(
                    dialog.subject
                  )}&body=${encodeURIComponent(dialog.body)}`}
                  className={`btn-secondary px-4 py-2 text-sm ${
                    dialog.loading || dialog.error
                      ? "opacity-50 pointer-events-none"
                      : ""
                  }`}
                >
                  Написать
                </a>
              )}
              <button
                onClick={() => setDialog(null)}
                className="btn-primary px-4 py-2 text-sm"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
