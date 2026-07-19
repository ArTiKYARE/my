// Оркестрация задач поиска лидов: in-memory хранилище + фоновой запуск.
// Порт части Python server.py (_run_job): сбор → дедупликация → анализ → статистика.
// Хранилище живёт на globalThis — route handlers могут бандлиться отдельно,
// и обычный module-level Map рисковал бы оказаться разными экземплярами.

import { randomUUID } from "crypto";
import { analyzeLead } from "./analyzer";
import { searchTwoGis, searchYandex, TWOGIS_KEY_ERROR } from "./providers";
import { HuntLead, JobStats, JobStatus, leadKey, SearchParams } from "./types";

const JOB_TTL_MS = 2 * 60 * 60 * 1000; // автоочистка задач старше 2 часов
const LOG_CAP = 500;

interface JobRecord {
  id: string;
  params: SearchParams;
  status: JobStatus["status"];
  phase: string;
  done: number;
  total: number;
  log: string[];
  error: string | null;
  leads: HuntLead[];
  createdAt: number;
}

const g = globalThis as typeof globalThis & {
  __leadHuntJobs?: Map<string, JobRecord>;
};
g.__leadHuntJobs ??= new Map<string, JobRecord>();
const JOBS = g.__leadHuntJobs;

function say(job: JobRecord, msg: string): void {
  job.log.push(msg);
  if (job.log.length > LOG_CAP) {
    job.log.splice(0, job.log.length - LOG_CAP);
  }
}

function computeStats(leads: HuntLead[]): JobStats {
  return {
    total: leads.length,
    hot: leads.filter((l) => l.score >= 85).length,
    warm: leads.filter((l) => l.score >= 55 && l.score < 85).length,
    no_site: leads.filter((l) => l.site_status === "нет сайта" || l.site_status === "").length,
  };
}

function toStatus(job: JobRecord): JobStatus {
  return {
    id: job.id,
    status: job.status,
    phase: job.phase,
    done: job.done,
    total: job.total,
    log: job.log,
    error: job.error,
    stats: computeStats(job.leads),
  };
}

async function runJob(job: JobRecord): Promise<void> {
  const params = job.params;
  job.status = "running";

  // --- провайдеры ---
  const providers: { name: "yandex" | "2gis"; search: (q: string) => Promise<HuntLead[]> }[] = [];
  if (params.source === "yandex" || params.source === "both") {
    providers.push({
      name: "yandex",
      search: (q) => searchYandex(q, params.city, params.limit),
    });
  }
  if (params.source === "2gis" || params.source === "both") {
    const apiKey = params.api_key || process.env.TWOGIS_API_KEY || "";
    if (!apiKey) {
      job.status = "error";
      job.error = TWOGIS_KEY_ERROR;
      return;
    }
    providers.push({
      name: "2gis",
      search: (q) => searchTwoGis(q, params.city, params.limit, apiKey),
    });
  }

  // --- этап 1: сбор ---
  job.phase = "сбор компаний";
  job.total = providers.length * params.queries.length;
  job.done = 0;
  const found = new Map<string, HuntLead>();
  for (const provider of providers) {
    for (const q of params.queries) {
      say(job, `[${provider.name}] поиск: ${q} (${params.city})`);
      let items: HuntLead[];
      try {
        items = await provider.search(q);
      } catch (e) {
        say(job, `⚠ ошибка запроса «${q}»: ${e instanceof Error ? e.message : String(e)}`);
        job.done += 1;
        continue;
      }
      let added = 0;
      for (const lead of items) {
        const key = leadKey(lead);
        if (!found.has(key)) {
          found.set(key, lead);
          added += 1;
        }
      }
      say(job, `✓ «${q}»: найдено ${items.length}, новых ${added}`);
      job.leads = [...found.values()];
      job.done += 1;
    }
  }

  if (job.leads.length === 0) {
    job.status = "error";
    job.error = "Ничего не найдено. Попробуйте другой город или нишу.";
    return;
  }

  // --- этап 2: анализ сайтов ---
  if (params.analyze) {
    job.phase = "анализ сайтов";
    job.total = job.leads.length;
    job.done = 0;
    for (const lead of job.leads) {
      try {
        await analyzeLead(lead, params.find_email);
      } catch (e) {
        say(job, `⚠ анализ ${lead.name}: ${e instanceof Error ? e.message : String(e)}`);
      }
      job.done += 1;
      say(job, `  ${lead.name.slice(0, 44)} → ${lead.score} (${lead.site_status})`);
    }
  } else {
    for (const lead of job.leads) {
      lead.site_status = "не проверялся";
      lead.score = lead.website ? 50 : 100;
      lead.notes = "Сайт не проверялся";
    }
  }

  job.phase = "готово";
  job.status = "done";
  say(job, `★ Готово: ${job.leads.length} компаний`);
}

/** Создать задачу и запустить её в фоне (fire-and-forget). Возвращает id. */
export function createJob(params: SearchParams): string {
  // ленивая очистка задач старше 2 часов
  const now = Date.now();
  for (const [id, job] of JOBS) {
    if (now - job.createdAt > JOB_TTL_MS) {
      JOBS.delete(id);
    }
  }

  const job: JobRecord = {
    id: randomUUID(),
    params,
    status: "pending",
    phase: "подготовка",
    done: 0,
    total: 0,
    log: [],
    error: null,
    leads: [],
    createdAt: now,
  };
  JOBS.set(job.id, job);

  runJob(job).catch((e) => {
    job.status = "error";
    job.error = e instanceof Error ? (e.stack ?? e.message) : String(e);
  });

  return job.id;
}

/** Статус задачи (JobStatus) или null, если id неизвестен. */
export function getJob(id: string): JobStatus | null {
  const job = JOBS.get(id);
  return job ? toStatus(job) : null;
}

/** Лиды задачи, отсортированные по убыванию score, или null. */
export function getJobLeads(id: string): HuntLead[] | null {
  const job = JOBS.get(id);
  if (!job) return null;
  return [...job.leads].sort((a, b) => b.score - a.score);
}

/** Внутренний статус задачи — для проверок в route handlers (например, done для экспорта). */
export function getJobRawStatus(id: string): JobRecord["status"] | null {
  return JOBS.get(id)?.status ?? null;
}
