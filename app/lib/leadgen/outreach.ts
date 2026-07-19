// Генератор персональных outreach-писем для лидов.
// Тексты — живое письмо от первого лица, как пишет фрилансер конкретному
// владельцу бизнеса: конкретика в первом абзаце, одна боль, один мягкий CTA.
// Два варианта текста на сценарий — выбор детерминирован хешем названия
// компании, чтобы разным лидам уходили разные формулировки.

import { HuntLead, SenderProfile } from "./types";

export interface GeneratedMessage {
  subject: string;
  body: string;
  scenario: "no_site" | "aggregator" | "unreachable" | "weak_site" | "ok_site";
}

type LeadLike = Partial<HuntLead> & Record<string, unknown>;

type Template = (lead: LeadLike, sender: SenderProfile) => [string, string];

function signature(sender: SenderProfile): string {
  const lines: string[] = [];
  if (sender.name) lines.push(sender.name);
  if (sender.contact) lines.push(sender.contact);
  if (sender.portfolio) lines.push(`Портфолио: ${sender.portfolio}`);
  return lines.join("\n");
}

/** Детерминированный выбор варианта текста по названию компании. */
function pickVariant(name: string, count: number): number {
  let hash = 5381;
  const s = (name || "").toLowerCase();
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) + hash + s.charCodeAt(i)) >>> 0;
  }
  return hash % count;
}

function host(url: string): string {
  try {
    return new URL(url).hostname || url;
  } catch {
    return url;
  }
}

/** «у вас уже рейтинг 4.8 и 120 отзывов, но » — если есть данные с карт. */
function proofPrefix(lead: LeadLike): string {
  const parts: string[] = [];
  if (lead.rating) parts.push(`рейтинг ${lead.rating}`);
  if (lead.reviews) parts.push(`${lead.reviews} отзывов`);
  if (parts.length) return `у вас уже ${parts.join(" и ")}, но `;
  return "";
}

/** «у карточки рейтинг 4.8 и 120 отзывов, » — вставка в середину фразы. */
function proofComma(lead: LeadLike): string {
  const parts: string[] = [];
  if (lead.rating) parts.push(`рейтинг ${lead.rating}`);
  if (lead.reviews) parts.push(`${lead.reviews} отзывов`);
  if (parts.length) return `у карточки ${parts.join(" и ")}, `;
  return "";
}

function uspLine(sender: SenderProfile, fallback: string): string {
  return sender.usp || fallback;
}

// ---------------------------------------------------------------------------
// no_site — сайта нет вообще
// ---------------------------------------------------------------------------

const NO_SITE: Template[] = [
  (lead, sender) => {
    const name = lead.name || "ваша компания";
    const city = lead.city || "ваш город";
    const category = lead.category || "услуги";
    const subject = `по поводу сайта для «${name}»`;
    const body = `Здравствуйте!

Пишу по поводу «${name}» — ${category}, ${city}. Наткнулся на вашу карточку на картах: ${proofPrefix(lead)}сайта в ней нет.
А человек, который ищет «${category}» рядом, обычно сначала заходит на сайт — посмотреть цены и фото перед звонком. Сейчас он этого сделать не может и уходит к тому, у кого сайт есть.
${uspLine(sender, "Я делаю простые сайты для локального бизнеса: одна страница с услугами, ценами, кнопкой звонка и формой заявки, запуск примерно за неделю.")}

Могу скинуть пару примеров, как это выглядит в вашей нише — интересно?

${signature(sender)}`;
    return [subject, body];
  },
  (lead, sender) => {
    const name = lead.name || "ваша компания";
    const city = lead.city || "ваш город";
    const category = lead.category || "услуги";
    const subject = `«${name}» — вопрос про сайт`;
    const body = `Здравствуйте!

Смотрел карточку «${name}» (${category}, ${city}) на картах — ${proofPrefix(lead)}ссылки на сайт там нет.
Получается, репутация уже есть, а посмотреть услуги и цены перед звонком клиенту негде.
${uspLine(sender, "Я сам делаю сайты для небольших компаний. Обычно это одна аккуратная страница: услуги, цены, карта, форма заявки — за 5–7 дней.")}

Если тема хоть немного на примете — пришлю примеры под вашу нишу, посмотрите на досуге?

${signature(sender)}`;
    return [subject, body];
  },
];

// ---------------------------------------------------------------------------
// aggregator — вместо сайта страница на агрегаторе или соцсеть
// ---------------------------------------------------------------------------

const AGGREGATOR: Template[] = [
  (lead, sender) => {
    const name = lead.name || "ваша компания";
    const city = lead.city || "ваш город";
    const category = lead.category || "услуги";
    const hostName = host(lead.website || "");
    const subject = `по поводу страницы «${name}» на ${hostName}`;
    const body = `Здравствуйте!

Зашёл посмотреть «${name}» (${category}, ${city}): ${proofPrefix(lead)}вместо сайта в карточке указана страница на ${hostName}.
Такие страницы собираются автоматически — без ваших цен, фото работ и нормальной формы заявки. А рядом на той же площадке сидят конкуренты, и часть клиентов уходит к ним.
${uspLine(sender, `Я делаю сайты для ниши «${category}»: своя страница с ценами и формой, которую вы контролируете. Агрегатор при этом остаётся просто дополнительным каналом.`)}

Показать пару примеров для вашей ниши?

${signature(sender)}`;
    return [subject, body];
  },
  (lead, sender) => {
    const name = lead.name || "ваша компания";
    const city = lead.city || "ваш город";
    const category = lead.category || "услуги";
    const hostName = host(lead.website || "");
    const subject = `вопрос про сайт «${name}»`;
    const body = `Здравствуйте!

Нашёл «${name}» (${category}, ${city}) через карты — ${proofPrefix(lead)}ссылка ведёт на автоматическую страницу ${hostName}, а не на ваш сайт.
Понимаю, как так вышло — агрегаторы создают эти страницы сами. Но продают они слабо: ни цен, ни фото, ни заявки, и клиент в один клик переключается на соседа по выдаче.
${uspLine(sender, "Свой простой сайт это решает: одна страница с услугами, ценами и формой заявки, и вы больше не зависите от чужой площадки.")}

Скинуть пример, как это выглядит для «${category}»?

${signature(sender)}`;
    return [subject, body];
  },
];

// ---------------------------------------------------------------------------
// unreachable — сайт не открывается
// ---------------------------------------------------------------------------

const UNREACHABLE: Template[] = [
  (lead, sender) => {
    const name = lead.name || "ваша компания";
    const city = lead.city || "ваш город";
    const category = lead.category || "услуги";
    const hostName = host(lead.website || "сайт");
    const subject = `${hostName} не открывается`;
    const body = `Здравствуйте!

Хотел зайти на сайт «${name}» (${category}, ${city}) — ${hostName}, но он сейчас не открывается.
Каждый, кто кликает ссылку из карточки на картах, попадает в никуда и уходит дальше. Если это длится не первый день, заявки теряются прямо сейчас.
${uspLine(sender, "Я занимаюсь сайтами: могу помочь быстро поднять текущий (чаще всего дело в хостинге или домене) или собрать новый с нуля.")}

Подсказать, куда смотреть в первую очередь? Напишите пару слов — сориентирую.

${signature(sender)}`;
    return [subject, body];
  },
  (lead, sender) => {
    const name = lead.name || "ваша компания";
    const city = lead.city || "ваш город";
    const category = lead.category || "услуги";
    const hostName = host(lead.website || "сайт");
    const subject = `у «${name}» сайт не работает?`;
    const body = `Здравствуйте!

Смотрел «${name}» (${category}, ${city}) на картах — перешёл по ссылке на ${hostName}, а сайт не открывается.
Может, вы уже в курсе, а может, это случилось только что. Пока он лежит, клиенты с карт уходят к конкурентам — ссылка в карточке-то осталась.
${uspLine(sender, "Я могу помочь: сначала посмотреть, что случилось (домен, хостинг, сертификат), а дальше — починить или быстро собрать новый.")}

Хотите, гляну, в чём там дело, и напишу, что нашёл?

${signature(sender)}`;
    return [subject, body];
  },
];

// ---------------------------------------------------------------------------
// weak_site — сайт есть, но с проблемами (конструктор, нет мобильной версии)
// ---------------------------------------------------------------------------

function weakPain(lead: LeadLike): string {
  const cms = lead.site_cms || "";
  const problems = lead.notes || "есть точки роста";
  const isTaplink = (cms + (lead.website || "")).toLowerCase().includes("taplink");
  if (isTaplink) {
    return (
      `вместо полноценного сайта — мини-лендинг ${cms || "Taplink"}: он не ранжируется ` +
      "в поиске и выглядит одинаково у всех"
    );
  }
  if (cms && problems.toLowerCase().includes(cms.toLowerCase())) {
    return problems; // notes уже содержат упоминание конструктора
  }
  if (cms) {
    return `сайт на ${cms}: ${problems}`;
  }
  return problems;
}

const WEAK_SITE: Template[] = [
  (lead, sender) => {
    const name = lead.name || "ваша компания";
    const city = lead.city || "ваш город";
    const category = lead.category || "услуги";
    const hostName = host(lead.website || "ваш сайт");
    const subject = `по поводу сайта «${name}»`;
    const body = `Здравствуйте!

Зашёл на ${hostName} с телефона — смотрел «${name}», ${category}, ${city}. Сразу бросилось в глаза: ${weakPain(lead)}.
С телефона сейчас приходит больше половины клиентов в нише «${category}» — и если страницей неудобно пользоваться, они уходят, не позвонив.
${uspLine(sender, "Я делаю редизайн и новые сайты с упором на заявки: мобильная версия, быстрая загрузка, понятный прайс.")}

Могу записать короткий скринкаст, что именно стоит поправить у вас — прислать?

${signature(sender)}`;
    return [subject, body];
  },
  (lead, sender) => {
    const name = lead.name || "ваша компания";
    const city = lead.city || "ваш город";
    const category = lead.category || "услуги";
    const hostName = host(lead.website || "ваш сайт");
    const subject = `вопрос про ${hostName}`;
    const body = `Здравствуйте!

Смотрел сайт «${name}» (${category}, ${city}) со смартфона — ${hostName}. Видно, что сайт живой, но есть момент: ${weakPain(lead)}.
Из-за таких вещей люди закрывают страницу и звонят следующему в списке — особенно те, кто зашёл с телефона.
${uspLine(sender, "Я как раз занимаюсь сайтами для локального бизнеса и могу прямо на вашем примере показать, что поправить в первую очередь.")}

Интересно, если скину пару скринов с пометками?

${signature(sender)}`;
    return [subject, body];
  },
];

// ---------------------------------------------------------------------------
// ok_site — сайт нормальный, предлагаем следующий шаг
// ---------------------------------------------------------------------------

const OK_SITE: Template[] = [
  (lead, sender) => {
    const name = lead.name || "ваша компания";
    const city = lead.city || "ваш город";
    const category = lead.category || "услуги";
    const subject = `по поводу заявок с сайта «${name}»`;
    const body = `Здравствуйте!

Посмотрел «${name}» (${category}, ${city}) — ${proofComma(lead)}сайт на месте и выглядит достойно, видно, что онлайном вы занимаетесь.
Поэтому пишу коротко и по делу: следующий шаг для таких компаний — не «сделать сайт», а получать с него больше заявок: поисковое продвижение по услугам, отдельные страницы под конкретные запросы, онлайн-запись.
${uspLine(sender, "Я этим и занимаюсь. Если с сайта приходит меньше заявок, чем хотелось бы, — есть о чём поговорить.")}

Удобно будет, если я пришлю пару цифр по похожему проекту?

${signature(sender)}`;
    return [subject, body];
  },
  (lead, sender) => {
    const name = lead.name || "ваша компания";
    const city = lead.city || "ваш город";
    const category = lead.category || "услуги";
    const subject = `вопрос про сайт «${name}»`;
    const body = `Здравствуйте!

Зашёл на сайт «${name}» (${category}, ${city}) — выглядит достойно, вопросов к самому сайту нет.
Пишу по другому поводу: я помогаю компаниям в нише «${category}» получать с сайта больше заявок — продвижение по услугам, отдельные страницы под конкретные запросы, онлайн-запись.
Обычно разговор начинается с простой проверки: сколько заявок приходит сейчас и где проседает воронка.
${uspLine(sender, "Если тема откликается — расскажу, что сделали для похожей компании и что из этого вышло.")}

Интересно?

${signature(sender)}`;
    return [subject, body];
  },
];

/** Сгенерировать письмо для лида. */
export function generateMessage(lead: LeadLike, sender: SenderProfile): GeneratedMessage {
  const status = lead.site_status || "";
  const score = Number(lead.score) || 0;

  let scenario: GeneratedMessage["scenario"];
  let templates: Template[];

  if (status === "нет сайта" || (!lead.website && score >= 85)) {
    scenario = "no_site";
    templates = NO_SITE;
  } else if (status === "страница на агрегаторе" || status === "только соцсеть") {
    scenario = "aggregator";
    templates = AGGREGATOR;
  } else if (status === "недоступен") {
    scenario = "unreachable";
    templates = UNREACHABLE;
  } else if (status === "конструктор" || status === "есть проблемы" || score >= 50) {
    scenario = "weak_site";
    templates = WEAK_SITE;
  } else {
    scenario = "ok_site";
    templates = OK_SITE;
  }

  const variant = pickVariant(lead.name || "", templates.length);
  const [subject, rawBody] = templates[variant](lead, sender);
  // лишние пустые строки (если подпись пустая) убираем
  let body = rawBody;
  while (body.includes("\n\n\n")) {
    body = body.replace("\n\n\n", "\n\n");
  }
  return { subject: subject.trim(), body: body.trim(), scenario };
}
