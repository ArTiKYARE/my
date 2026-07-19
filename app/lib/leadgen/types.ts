// Типы для модуля поиска лидов (порт Python leadgen/models.py).
// Назван HuntLead, чтобы не конфликтовать с существующим Lead из app/lib/types.ts.

export type LeadSource = "yandex" | "2gis";
export type SearchSource = "yandex" | "2gis" | "both";

export interface HuntLead {
  name: string; // название компании
  category: string; // рубрика (автосервис, стоматология...)
  city: string; // город (из запроса)
  address: string; // полный адрес
  phone: string; // первый телефон
  phones: string; // все телефоны, через "; "
  email: string; // найденный email (если повезло)
  website: string; // сайт из карточки (может быть пустым)
  site_status: string; // нет сайта / конструктор / недоступен / ок ...
  site_cms: string; // обнаруженная CMS/конструктор
  score: number; // оценка «горячести» лида 0..100
  notes: string; // пояснение к оценке
  rating: number | null; // рейтинг на картах
  reviews: number | null; // число отзывов
  source: LeadSource; // yandex / 2gis
  source_url: string; // ссылка на карточку
}

export interface SearchParams {
  city: string;
  queries: string[];
  source: SearchSource;
  limit: number;
  analyze: boolean;
  find_email: boolean;
  api_key?: string;
}

export interface JobStats {
  total: number;
  hot: number;
  warm: number;
  no_site: number;
}

export interface JobStatus {
  id: string;
  status: "pending" | "running" | "done" | "error";
  phase: string;
  done: number;
  total: number;
  log: string[];
  error: string | null;
  stats: JobStats;
}

export interface SenderProfile {
  name: string; // имя / название студии
  portfolio: string; // ссылка на портфолио
  contact: string; // telegram / телефон
  usp: string; // своё УТП (если пусто — дефолтное)
}

/** Ключ дедупликации: название + адрес в нижнем регистре (как Lead.key() в Python). */
export function leadKey(lead: Pick<HuntLead, "name" | "address">): string {
  return `${lead.name.trim().toLowerCase()}|${lead.address.trim().toLowerCase()}`;
}

export function emptyLead(source: LeadSource, city: string): HuntLead {
  return {
    name: "",
    category: "",
    city,
    address: "",
    phone: "",
    phones: "",
    email: "",
    website: "",
    site_status: "",
    site_cms: "",
    score: 0,
    notes: "",
    rating: null,
    reviews: null,
    source,
    source_url: "",
  };
}
