// Провайдеры сбора компаний: Яндекс Карты (SSR-парсинг) и 2ГИС (Catalog API).
// Порт Python leadgen/providers/yandex_maps.py и twogis.py на fetch.

import { HuntLead, emptyLead, leadKey } from "./types";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36";

// ---------------------------------------------------------------------------
// Яндекс Карты
// ---------------------------------------------------------------------------

const YANDEX_URL = "https://yandex.ru/maps/";

const YANDEX_HEADERS = {
  "User-Agent": BROWSER_UA,
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "ru-RU,ru;q=0.9,en;q=0.5",
};

/**
 * Найти границы JSON-объекта, содержащего позицию pos.
 * Идём назад от pos, считая фигурные скобки, пока не найдём '{',
 * который открывает объект; затем идём вперёд до закрывающей скобки.
 */
function findObjectBounds(html: string, pos: number): [number, number] | null {
  let depth = 0;
  let start = -1;
  let i = pos;
  while (i >= 0) {
    const ch = html[i];
    if (ch === "}") {
      depth += 1;
    } else if (ch === "{") {
      if (depth === 0) {
        start = i;
        break;
      }
      depth -= 1;
    }
    i -= 1;
  }
  if (start < 0) return null;

  depth = 0;
  let inStr = false;
  let esc = false;
  for (let j = start; j < html.length; j++) {
    const ch = html[j];
    if (esc) {
      esc = false;
      continue;
    }
    if (ch === "\\") {
      esc = true;
      continue;
    }
    if (ch === '"') {
      inStr = !inStr;
      continue;
    }
    if (inStr) continue;
    if (ch === "{") {
      depth += 1;
    } else if (ch === "}") {
      depth -= 1;
      if (depth === 0) return [start, j + 1];
    }
  }
  return null;
}

/** Вытащить из HTML все JSON-объекты с полем shortTitle. */
function extractBusinessObjects(html: string): Record<string, unknown>[] {
  const objects: Record<string, unknown>[] = [];
  const seenSpans: [number, number][] = [];
  const marker = '"shortTitle"';
  let idx = 0;
  for (;;) {
    idx = html.indexOf(marker, idx);
    if (idx < 0) break;
    const bounds = findObjectBounds(html, idx);
    if (bounds) {
      const [s, e] = bounds;
      // пропускаем объект, если он целиком внутри уже найденного
      if (!seenSpans.some(([a, b]) => s >= a && e <= b)) {
        try {
          const obj = JSON.parse(html.slice(s, e));
          if (obj && typeof obj === "object" && !Array.isArray(obj) && "shortTitle" in obj) {
            objects.push(obj as Record<string, unknown>);
            seenSpans.push([s, e]);
          }
        } catch {
          // битый JSON — пропускаем
        }
      }
    }
    idx += marker.length;
  }
  return objects;
}

/** Попытаться найти сайт организации в известных полях. */
function websiteFrom(obj: Record<string, unknown>): string {
  const urls = obj["urls"];
  if (Array.isArray(urls)) {
    for (const u of urls) {
      if (u && typeof u === "object" && !Array.isArray(u)) {
        const v = (u as Record<string, unknown>)["value"];
        if (typeof v === "string" && v) return v;
      }
      if (typeof u === "string" && u.startsWith("http")) return u;
    }
  }
  for (const key of ["url", "website", "site"]) {
    const v = obj[key];
    if (typeof v === "string" && v.startsWith("http") && !v.includes("yandex")) return v;
  }
  // иногда сайт лежит в businessLinks
  const links = obj["businessLinks"];
  if (Array.isArray(links)) {
    for (const link of links) {
      if (link && typeof link === "object" && !Array.isArray(link)) {
        const l = link as Record<string, unknown>;
        const href = (typeof l["href"] === "string" && l["href"]) ||
          (typeof l["url"] === "string" && l["url"]) || "";
        if (href.startsWith("http") && !href.includes("yandex")) return href;
      }
    }
  }
  return "";
}

function objectToLead(obj: Record<string, unknown>, city: string): HuntLead | null {
  const name = (typeof obj["shortTitle"] === "string" && obj["shortTitle"]) ||
    (typeof obj["name"] === "string" && obj["name"]) || "";
  const address = (typeof obj["fullAddress"] === "string" && obj["fullAddress"]) ||
    (typeof obj["address"] === "string" && obj["address"]) || "";
  if (!name) return null;

  const phones: string[] = [];
  const rawPhones = obj["phones"];
  if (Array.isArray(rawPhones)) {
    for (const p of rawPhones) {
      if (p && typeof p === "object" && !Array.isArray(p)) {
        const num = (p as Record<string, unknown>)["number"];
        if (num) phones.push(String(num));
      } else if (typeof p === "string") {
        phones.push(p);
      }
    }
  }

  let rating: number | null = null;
  let reviews: number | null = null;
  const rd = obj["ratingData"];
  if (rd && typeof rd === "object" && !Array.isArray(rd)) {
    const r = rd as Record<string, unknown>;
    if (typeof r["ratingValue"] === "number") rating = r["ratingValue"];
    const rc = r["reviewCount"] ?? r["ratingCount"];
    if (typeof rc === "number") reviews = rc;
  }

  const categories: string[] = [];
  const rawCats = obj["categories"];
  if (Array.isArray(rawCats)) {
    for (const c of rawCats) {
      if (c && typeof c === "object" && !Array.isArray(c)) {
        const n = (c as Record<string, unknown>)["name"];
        if (n) categories.push(String(n));
      }
    }
  }

  const oid = obj["id"] ?? obj["oid"] ?? "";
  const source_url = oid ? `https://yandex.ru/maps/org/${oid}` : "";

  const lead = emptyLead("yandex", city);
  lead.name = String(name);
  lead.category = categories.slice(0, 2).join(", ");
  lead.address = String(address);
  lead.phone = phones[0] ?? "";
  lead.phones = phones.join("; ");
  lead.website = websiteFrom(obj);
  lead.rating = rating;
  lead.reviews = reviews;
  lead.source_url = source_url;
  return lead;
}

async function fetchYandexHtml(query: string, city: string): Promise<string> {
  const text = `${query} ${city}`.trim();
  const url = `${YANDEX_URL}?text=${encodeURIComponent(text)}`;
  const resp = await fetch(url, {
    headers: YANDEX_HEADERS,
    redirect: "follow",
    signal: AbortSignal.timeout(30000),
  });
  if (!resp.ok) {
    throw new Error(`Яндекс вернул HTTP ${resp.status}`);
  }
  const html = await resp.text();
  if (resp.url.includes("captcha") || html.slice(0, 2000).includes("showcaptcha")) {
    throw new Error(
      "Яндекс показал капчу. Попробуйте позже, смените IP " +
        "или используйте источник 2gis с API-ключом."
    );
  }
  return html;
}

export async function searchYandex(
  query: string,
  city: string,
  limit = 50,
  delayMs = 2000
): Promise<HuntLead[]> {
  const html = await fetchYandexHtml(query, city);
  const leads: HuntLead[] = [];
  const seen = new Set<string>();
  for (const obj of extractBusinessObjects(html)) {
    const lead = objectToLead(obj, city);
    if (!lead) continue;
    const key = leadKey(lead);
    if (seen.has(key)) continue;
    seen.add(key);
    leads.push(lead);
    if (leads.length >= limit) break;
  }
  await sleep(delayMs);
  return leads;
}

// ---------------------------------------------------------------------------
// 2ГИС (Catalog API)
// ---------------------------------------------------------------------------

const TWOGIS_API = "https://catalog.api.2gis.com/3.0/items";

// Поля, которые просим у API: контакты (телефоны, сайты, email), адрес, рубрики
const TWOGIS_FIELDS = [
  "items.contact_groups",
  "items.address",
  "items.rubrics",
  "items.rating",
  "items.reviews",
].join(",");

export const TWOGIS_KEY_ERROR =
  "Для 2ГИС нужен API-ключ. Получите бесплатно на https://dev.2gis.ru " +
  "и передайте в поле api_key или переменную окружения TWOGIS_API_KEY.";

type TwoGisItem = Record<string, unknown>;

async function getTwoGisPage(
  query: string,
  city: string,
  page: number,
  pageSize: number,
  apiKey: string
): Promise<Record<string, unknown>> {
  const params = new URLSearchParams({
    q: `${query} ${city}`.trim(),
    key: apiKey,
    fields: TWOGIS_FIELDS,
    page: String(page),
    page_size: String(pageSize),
    type: "branch",
  });
  const resp = await fetch(`${TWOGIS_API}?${params.toString()}`, {
    signal: AbortSignal.timeout(30000),
  });
  const data = (await resp.json()) as Record<string, unknown>;
  const meta = (data["meta"] ?? {}) as Record<string, unknown>;
  if (meta["code"] !== 200) {
    const err = (meta["error"] ?? {}) as Record<string, unknown>;
    throw new Error(`2GIS API error ${meta["code"]}: ${err["message"] ?? ""}`);
  }
  return (data["result"] ?? {}) as Record<string, unknown>;
}

/** Вернуть (телефоны, сайт, email) из contact_groups. */
function twoGisContacts(item: TwoGisItem): { phones: string[]; website: string; email: string } {
  const phones: string[] = [];
  let website = "";
  let email = "";
  const groups = item["contact_groups"];
  if (!Array.isArray(groups)) return { phones, website, email };
  for (const group of groups) {
    const contacts = (group as Record<string, unknown>)["contacts"];
    if (!Array.isArray(contacts)) continue;
    for (const c of contacts) {
      const contact = c as Record<string, unknown>;
      const ctype = contact["type"];
      const value = (typeof contact["value"] === "string" ? contact["value"] : "").trim();
      if (!value) continue;
      if (ctype === "phone") {
        const text = (typeof contact["text"] === "string" && contact["text"]) || value;
        phones.push(text);
      } else if (ctype === "website" && !website) {
        website = value.startsWith("http") ? value : `https://${value}`;
      } else if (ctype === "email" && !email) {
        email = value;
      }
    }
  }
  return { phones, website, email };
}

export async function searchTwoGis(
  query: string,
  city: string,
  limit = 50,
  apiKey = "",
  delayMs = 1000
): Promise<HuntLead[]> {
  if (!apiKey) {
    throw new Error(TWOGIS_KEY_ERROR);
  }
  const leads: HuntLead[] = [];
  let page = 1;
  const pageSize = Math.min(10, limit); // API отдаёт максимум 10 на страницу
  while (leads.length < limit) {
    const result = await getTwoGisPage(query, city, page, pageSize, apiKey);
    const items = result["items"];
    if (!Array.isArray(items) || items.length === 0) break;
    for (const rawItem of items) {
      const item = rawItem as TwoGisItem;
      const itype = item["type"];
      if (itype !== "branch" && itype !== undefined && itype !== null) continue;
      const { phones, website, email } = twoGisContacts(item);
      const rubrics: string[] = [];
      if (Array.isArray(item["rubrics"])) {
        for (const r of item["rubrics"]) {
          const n = (r as Record<string, unknown>)["name"];
          if (typeof n === "string") rubrics.push(n);
        }
      }
      const rating = typeof item["rating"] === "number" ? (item["rating"] as number) : null;
      let reviews: number | null = null;
      const rev = item["reviews"];
      if (rev && typeof rev === "object" && !Array.isArray(rev)) {
        const rv = rev as Record<string, unknown>;
        const count = rv["count"] ?? rv["general_review_count"];
        if (typeof count === "number") reviews = count;
      }
      const address = (typeof item["address_name"] === "string" ? item["address_name"] : "").trim();
      const firmId = item["id"] ?? "";

      const lead = emptyLead("2gis", city);
      lead.name = typeof item["name"] === "string" ? item["name"] : "";
      lead.category = rubrics.slice(0, 2).join(", ");
      lead.address = address;
      lead.phone = phones[0] ?? "";
      lead.phones = phones.join("; ");
      lead.website = website;
      lead.email = email;
      lead.rating = rating;
      lead.reviews = reviews;
      lead.source_url = firmId ? `https://2gis.ru/firm/${firmId}` : "";
      leads.push(lead);
      if (leads.length >= limit) break;
    }
    const total = typeof result["total"] === "number" ? (result["total"] as number) : 0;
    if (page * pageSize >= total) break;
    page += 1;
    await sleep(delayMs);
  }
  return leads;
}
