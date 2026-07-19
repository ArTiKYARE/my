// Анализатор сайтов и оценка «горячести» лида.
// Порт Python leadgen/analyzer.py (без BeautifulSoup — разбор HTML регулярными
// выражениями: title, meta viewport, ссылки и mailto).

import { HuntLead } from "./types";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const TIMEOUT_MS = 8000;
const FETCH_DELAY_MS = 600;

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
    "(KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  "Accept-Language": "ru-RU,ru;q=0.9",
};

// Домены, которые не считаем «своим сайтом»
const SOCIAL_DOMAINS = [
  "vk.com", "vk.me", "ok.ru", "t.me", "telegram", "wa.me", "whatsapp",
  "instagram.com", "facebook.com", "youtube.com", "rutube.ru",
  "avito.ru", "youla.ru", "2gis.ru", "yandex.ru", "yandex.com",
  "maps.google", "goo.gl", "dzen.ru",
];

// Автогенерённые страницы-заглушки на агрегаторах (2gis.biz и подобные)
const AGGREGATOR_DOMAINS = [
  "2gis.biz", "zoon.ru", "yell.ru", "yp.ru", "blizko.ru", "firmika.ru",
  "spravker.ru", "cataloxy.ru",
  // сервисы онлайн-записи — у бизнеса нет своего сайта
  "yclients.com", "clients.site", "dikidi.ru", "dikidi.net", "booksy.com",
];

// Трекинг-параметры, которые вычищаем из URL сайта
const TRACKING_PARAMS = new Set([
  "yclid", "ymclid", "gclid", "utm_source", "utm_medium",
  "utm_campaign", "utm_content", "utm_term", "from",
]);

// Сигнатуры конструкторов и CMS: (метка, фрагменты HTML/заголовков)
const CONSTRUCTORS: [string, string[]][] = [
  ["Taplink/мини-лендинг", ["taplink.ru", "taplink.ws"]],
  ["Tilda", ["tilda.cc", "tildacdn", "tilda.ws", "static.tildacdn"]],
  ["Wix", ["wix.com", "wixstatic", "_wix_", "x-wix"]],
  ["uCoz", ["ucoz.", "ucode.com", ".ufo."]],
  ["uKit", ["ukit.com", "ukit.me"]],
  ["Craftum", ["craftum.com"]],
  ["Nethouse", ["nethouse.ru", "nethouse.ua"]],
  ["Setup.ru", ["setup.ru", "sellfiles.ru"]],
  ["InSales", ["insales.ru", "insales-cdn"]],
  ["WordPress", ["wp-content", "wp-includes", 'name="generator" content="wordpress']],
  ["1C-Bitrix", ["bitrix", "/bitrix/"]],
  ["Joomla", ["joomla", "/media/jui/"]],
  ["OpenCart", ["catalog/view/theme", "opencart"]],
  ["Tiu/Prom", ["prom.ua", "tiu.ru", "static.prom.st"]],
  ["LPgenerator", ["lpgenerator.ru"]],
];

const CONTACT_PATHS = [
  "/contacts", "/kontakty", "/contact", "/about", "/o-nas", "/contact-us",
];

const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const EMAIL_FULL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
// явно служебные/мусорные адреса не собираем
const EMAIL_BAD = [
  "example.", "sentry", "wixpress", "@2x", "png", "jpg", "webp",
  "godaddy", "myemail@", "email@email", "test@test", "mail@mail",
];

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return "";
  }
}

function isSocial(url: string): boolean {
  const host = hostOf(url);
  return SOCIAL_DOMAINS.some((d) => host.includes(d));
}

function isAggregator(url: string): boolean {
  const host = hostOf(url);
  return AGGREGATOR_DOMAINS.some((d) => host.includes(d));
}

/** Привести URL к чистому виду: схема + домен + путь без трекинга. */
function normalize(url: string): string {
  url = url.trim();
  if (!url) return "";
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = "https://" + url;
  }
  try {
    const parsed = new URL(url);
    for (const key of [...parsed.searchParams.keys()]) {
      if (TRACKING_PARAMS.has(key.toLowerCase())) {
        parsed.searchParams.delete(key);
      }
    }
    return parsed.toString();
  } catch {
    return url;
  }
}

/** GET с возвратом (статус, итоговый URL, текст). Бросает ошибку fetch. */
async function fetchPage(
  url: string
): Promise<{ status: number; finalUrl: string; html: string }> {
  const resp = await fetch(url, {
    headers: HEADERS,
    redirect: "follow",
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const text = await resp.text();
  return { status: resp.status, finalUrl: resp.url, html: text.slice(0, 300_000) };
}

/** Похоже ли это на ошибку TLS/сертификата (для повторной попытки по http). */
function isSslError(err: unknown): boolean {
  const code =
    err && typeof err === "object"
      ? String((err as { cause?: { code?: unknown } }).cause?.code ?? "")
      : "";
  const msg = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();
  return (
    /^(UNABLE_TO|DEPTH_ZERO|SELF_SIGNED|CERT_|ERR_TLS|SSL|EPROTO)/i.test(code) ||
    msg.includes("certificate") ||
    msg.includes("ssl") ||
    msg.includes("tls")
  );
}

function detectCms(html: string): string {
  const low = html.toLowerCase();
  for (const [label, markers] of CONSTRUCTORS) {
    if (markers.some((m) => low.includes(m.toLowerCase()))) return label;
  }
  return "";
}

interface Anchor {
  href: string;
  text: string;
}

/** Вытащить все <a href> с текстом (грубый аналог soup.find_all("a")). */
function extractAnchors(html: string): Anchor[] {
  const out: Anchor[] = [];
  const re = /<a\b[^>]*>[\s\S]*?<\/a>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const tag = m[0].slice(0, m[0].indexOf(">") + 1);
    const hrefMatch = /href\s*=\s*["']([^"']*)["']/i.exec(tag);
    if (!hrefMatch) continue;
    const text = m[0].replace(/<[^>]+>/g, " ").trim();
    out.push({ href: hrefMatch[1], text });
  }
  return out;
}

function extractTitle(html: string): string {
  const m = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html);
  if (!m) return "";
  return m[1].replace(/<[^>]+>/g, "").trim();
}

function hasViewport(html: string): boolean {
  return /<meta[^>]+name\s*=\s*["']viewport["']/i.test(html);
}

function urlJoin(base: string, href: string): string {
  try {
    return new URL(href, base).toString();
  } catch {
    return "";
  }
}

/** Ищем email на главной и страницах контактов. */
async function findEmailOnSite(baseUrl: string, html: string): Promise<string> {
  const anchors = extractAnchors(html);

  const candidates: string[] = [baseUrl];
  for (const path of CONTACT_PATHS) {
    candidates.push(urlJoin(baseUrl, path));
  }
  // ссылки со словом "контакт"
  for (const a of anchors) {
    if (a.text.toLowerCase().includes("контакт") || a.href.toLowerCase().includes("contact")) {
      const joined = urlJoin(baseUrl, a.href);
      if (joined) candidates.push(joined);
    }
  }
  const mailtos = anchors
    .filter((a) => a.href.startsWith("mailto:"))
    .map((a) => a.href);

  for (const m of mailtos.slice(0, 3)) {
    const addr = m.replace("mailto:", "").split("?")[0];
    if (EMAIL_FULL_RE.test(addr)) return addr;
  }

  for (const url of candidates.slice(0, 6)) {
    if (!url) continue;
    let pageHtml: string;
    if (url === baseUrl) {
      pageHtml = html;
    } else {
      try {
        pageHtml = (await fetchPage(url)).html;
      } catch {
        continue;
      }
    }
    EMAIL_RE.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = EMAIL_RE.exec(pageHtml))) {
      const addr = m[0];
      if (EMAIL_BAD.some((b) => addr.toLowerCase().includes(b))) continue;
      return addr;
    }
    await sleep(FETCH_DELAY_MS);
  }
  return "";
}

/**
 * Проанализировать сайт лида: заполнить site_status, site_cms, score, notes,
 * email (если findEmail). Мутирует переданный объект, как analyzer.analyze() в Python.
 */
export async function analyzeLead(lead: HuntLead, findEmail: boolean): Promise<void> {
  const url = normalize(lead.website);
  if (url) {
    lead.website = url; // сохраняем очищенный от трекинга URL
  }

  if (!url) {
    lead.site_status = "нет сайта";
    lead.score = 100;
    lead.notes = "На картах сайт не указан — горячий лид";
    return;
  }

  if (isSocial(url)) {
    lead.site_status = "только соцсеть";
    lead.score = 85;
    lead.notes = `Вместо сайта указана соцсеть/мессенджер: ${hostOf(url)}`;
    return;
  }

  if (isAggregator(url)) {
    lead.site_status = "страница на агрегаторе";
    lead.score = 85;
    lead.notes = `Вместо сайта — автогенерированная страница: ${hostOf(url)}`;
    return;
  }

  let status: number;
  let finalUrl: string;
  let html: string;
  try {
    ({ status, finalUrl, html } = await fetchPage(url));
  } catch (e) {
    if (isSslError(e) && url.startsWith("https://")) {
      try {
        ({ status, finalUrl, html } = await fetchPage(url.replace("https://", "http://")));
      } catch (e2) {
        lead.site_status = "недоступен";
        lead.score = 90;
        lead.notes = `Сайт не открывается: ${e2 instanceof Error ? e2.name : "Error"}`;
        return;
      }
    } else {
      lead.site_status = "недоступен";
      lead.score = 90;
      lead.notes = `Сайт не открывается: ${e instanceof Error ? e.name : "Error"}`;
      return;
    }
  }

  if (status >= 500) {
    lead.site_status = "недоступен";
    lead.score = 90;
    lead.notes = `HTTP ${status}`;
    return;
  }

  const cms = detectCms(html);
  lead.site_cms = cms;

  const hasHttps = finalUrl.startsWith("https://");
  const viewport = hasViewport(html);
  const title = extractTitle(html);

  const problems: string[] = [];
  let score = 30;

  if (cms) {
    if (cms.includes("Taplink")) {
      score = 75;
      problems.push("вместо сайта — Taplink");
    } else if (["Tilda", "Wix", "uCoz", "uKit", "Craftum", "Nethouse", "Setup.ru"].includes(cms)) {
      score = 55;
      problems.push(`сайт на конструкторе ${cms}`);
    } else {
      score = 40;
      problems.push(`CMS: ${cms}`);
    }
  }
  if (!hasHttps) {
    score += 15;
    problems.push("нет HTTPS");
  }
  if (!viewport) {
    score += 15;
    problems.push("нет мобильной адаптации (viewport)");
  }
  if (!title) {
    score += 5;
    problems.push("пустой <title>");
  }

  score = Math.min(score, 95);
  lead.score = score;
  lead.site_status =
    cms && cms.includes("Taplink")
      ? "конструктор"
      : score < 50
        ? "ок"
        : "есть проблемы";
  lead.notes = problems.length ? problems.join("; ") : "Сайт выглядит нормально — слабый лид";

  if (findEmail && !lead.email) {
    lead.email = await findEmailOnSite(finalUrl, html);
  }

  await sleep(FETCH_DELAY_MS);
}
