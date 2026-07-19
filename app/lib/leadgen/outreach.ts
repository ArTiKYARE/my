// Генератор персональных outreach-писем для лидов.
// Порт Python leadgen/outreach.py — шаблоны перенесены дословно.

import { HuntLead, SenderProfile } from "./types";

export interface GeneratedMessage {
  subject: string;
  body: string;
  scenario: "no_site" | "aggregator" | "unreachable" | "weak_site" | "ok_site";
}

type LeadLike = Partial<HuntLead> & Record<string, unknown>;

function signature(sender: SenderProfile): string {
  const lines = ["—"];
  if (sender.name) lines.push(sender.name);
  if (sender.portfolio) lines.push(sender.portfolio);
  if (sender.contact) lines.push(sender.contact);
  return lines.length > 1 ? lines.join("\n") : "";
}

function host(url: string): string {
  try {
    return new URL(url).hostname || url;
  } catch {
    return url;
  }
}

/** Фраза про рейтинг/отзывы — если есть данные с карт. */
function socialProof(lead: LeadLike): string {
  const parts: string[] = [];
  if (lead.rating) parts.push(`рейтинг ${lead.rating}`);
  if (lead.reviews) parts.push(`${lead.reviews} отзывов`);
  if (parts.length) return `у вас уже ${parts.join(" и ")}, но `;
  return "";
}

function defaultUsp(category: string): string {
  const niche = category || "локального бизнеса";
  return (
    `Мы делаем сайты для ниши «${niche}»: лендинг за 5–7 дней ` +
    "с кнопкой звонка, картой и формой заявки."
  );
}

function noSite(lead: LeadLike, sender: SenderProfile): [string, string] {
  const name = lead.name || "ваша компания";
  const city = lead.city || "вашем городе";
  const category = lead.category || "услуги";
  const subject = `${name} — клиенты ищут вас онлайн`;
  const body = `Здравствуйте!

Нашёл карточку «${name}» на картах (${city}): ${socialProof(lead)}сайта нет.
При этом клиенты, которые ищут «${category}» рядом с вами, выбирают тех,
у кого можно посмотреть услуги и цены онлайн перед визитом.

${sender.usp || defaultUsp(category)}

Готов показать 2–3 варианта под ваш бюджет. Ответьте на это письмо —
пришлю примеры работ.

${signature(sender)}

P.S. Можно начать с простого лендинга — проверите спрос без больших вложений.`;
  return [subject, body];
}

function aggregator(lead: LeadLike, sender: SenderProfile): [string, string] {
  const name = lead.name || "ваша компания";
  const category = lead.category || "услуги";
  const hostName = host(lead.website || "");
  const subject = `${name}: вместо сайта — чужая страница`;
  const body = `Здравствуйте!

Посмотрел карточку «${name}»: ${socialProof(lead)}вместо сайта указана
автоматическая страница ${hostName}. Она не продаёт: нет ваших цен, фото
работ и нормальной формы заявки, а часть клиентов уходит к конкурентам
с того же агрегатора.

${sender.usp || defaultUsp(category)}

Сделаем свой сайт, а страницу на агрегаторе оставим как дополнительный
канал. Показать примеры для «${category}»?

${signature(sender)}

P.S. Свой сайт окупается, когда с него приходит хотя бы 1–2 заявки
в месяц — обычно это первые недели после запуска.`;
  return [subject, body];
}

function unreachable(lead: LeadLike, sender: SenderProfile): [string, string] {
  const name = lead.name || "ваша компания";
  const hostName = host(lead.website || "сайт");
  const subject = `Сайт ${hostName} не открывается`;
  const body = `Здравствуйте!

Хотел посмотреть сайт «${name}» — ${hostName}, но он не открывается.
Каждый день простоя — это клиенты, которые нажали на ссылку с карт
и ушли к конкурентам.

Два варианта: помочь быстро поднять текущий сайт или собрать новый
с нуля под ваши задачи. ${sender.usp}

Ответьте — разберёмся, что выгоднее в вашем случае.

${signature(sender)}

P.S. Если сайт «временно упал», всё равно стоит проверить хостинг
и срок домена — терять карточку с отзывами обидно.`;
  return [subject, body];
}

function weakSite(lead: LeadLike, sender: SenderProfile): [string, string] {
  const name = lead.name || "ваша компания";
  const category = lead.category || "услуги";
  const hostName = host(lead.website || "ваш сайт");
  const cms = lead.site_cms || "";
  const problems = lead.notes || "есть точки роста";
  const isTaplink = (cms + (lead.website || "")).toLowerCase().includes("taplink");
  const subject = `${name} — сайт теряет клиентов с телефона`;
  let pain: string;
  if (isTaplink) {
    pain =
      `вместо сайта — мини-лендинг ${cms || "Taplink"}: он не ранжируется ` +
      "в поиске и выглядит одинаково у всех";
  } else if (cms && problems.toLowerCase().includes(cms.toLowerCase())) {
    pain = problems; // notes уже содержат упоминание конструктора
  } else if (cms) {
    pain = `сайт на ${cms}: ${problems}`;
  } else {
    pain = `у сайта ${problems}`;
  }
  const body = `Здравствуйте!

Открыл ${hostName} со смартфона: ${pain}.
Больше половины клиентов ниши «${category}» приходит с телефона —
и уходит, если страница неудобная.

${sender.usp || "Мы делаем редизайн с фокусом на заявки: мобильная версия, быстрая загрузка, понятный прайс и форма записи."}

Могу бесплатно записать 10-минутный видео-аудит вашего сайта —
покажу, что улучшить за неделю. Прислать?

${signature(sender)}

P.S. Аудит ни к чему не обязывает — заберёте список правок
даже если сделаете всё своими силами.`;
  return [subject, body];
}

function okSite(lead: LeadLike, sender: SenderProfile): [string, string] {
  const name = lead.name || "ваша компания";
  const category = lead.category || "услуги";
  const subject = `${name}: сайт + заявки «под ключ»`;
  const body = `Здравствуйте!

«${name}» выглядит достойно онлайн — сайт работает. Пишу, потому что
для ниши «${category}» мы закрываем следующий шаг: не «сайт-визитка»,
а поток заявок — SEO по услугам, лендинги под акции, онлайн-запись.

${sender.usp}

Если с сайта приходит меньше 5–10 заявок в месяц — есть что обсудить.
Готов показать цифры по похожему проекту, 15 минут по телефону.

${signature(sender)}

P.S. Если всё уже отлично с заявками — просто ответьте «всё ок»,
больше не побеспокою.`;
  return [subject, body];
}

/** Сгенерировать письмо для лида. */
export function generateMessage(lead: LeadLike, sender: SenderProfile): GeneratedMessage {
  const status = lead.site_status || "";
  const score = Number(lead.score) || 0;

  let scenario: GeneratedMessage["scenario"];
  let fn: (lead: LeadLike, sender: SenderProfile) => [string, string];

  if (status === "нет сайта" || (!lead.website && score >= 85)) {
    scenario = "no_site";
    fn = noSite;
  } else if (status === "страница на агрегаторе" || status === "только соцсеть") {
    scenario = "aggregator";
    fn = aggregator;
  } else if (status === "недоступен") {
    scenario = "unreachable";
    fn = unreachable;
  } else if (status === "конструктор" || status === "есть проблемы" || score >= 50) {
    scenario = "weak_site";
    fn = weakSite;
  } else {
    scenario = "ok_site";
    fn = okSite;
  }

  const [subject, rawBody] = fn(lead, sender);
  // лишние пустые строки (если подпись пустая) убираем
  let body = rawBody;
  while (body.includes("\n\n\n")) {
    body = body.replace("\n\n\n", "\n\n");
  }
  return { subject: subject.trim(), body: body.trim(), scenario };
}
