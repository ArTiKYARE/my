// Каталог услуг для карточки заявки: выбор услуг и расчёт цены.
// Базовая цена = число после «от» из прайса, в рублях.
// SERVICE_CATALOG — дефолт; актуальный каталог живёт в data/services.json
// (см. getServiceCatalog в конце файла).

import { promises as fs } from "fs";
import path from "path";

export interface ServiceItem {
  id: string; // slug, уникальный, напр. "landing-constructor"
  name: string; // "Лендинг на конструкторе"
  note?: string; // краткое описание что входит
  price: number; // базовая цена в рублях (из прайса "от X" → X)
  unit?: "час" | "шт" | "мес"; // если за единицу — UI покажет количество
  percent?: boolean; // если true — price это процент от суммы выбранного
}

export interface ServiceCategory {
  category: string;
  items: ServiceItem[];
}

export const SERVICE_CATALOG: ServiceCategory[] = [
  {
    category: "Разработка сайтов",
    items: [
      {
        id: "landing-constructor",
        name: "Лендинг на конструкторе",
        note: "Tilda или аналог, типовые блоки, форма заявки, запуск за 5–7 дней",
        price: 25000,
      },
      {
        id: "landing-custom",
        name: "Лендинг с индивидуальным дизайном",
        note: "Уникальный дизайн-макет, анимации, мобильная версия, формы",
        price: 45000,
      },
      {
        id: "site-vizitka",
        name: "Сайт-визитка",
        note: "3–5 страниц: о компании, услуги, цены, контакты, карта",
        price: 35000,
      },
      {
        id: "corp-site",
        name: "Корпоративный сайт",
        note: "Разделы под структуру компании, новости, формы, админка",
        price: 90000,
      },
      {
        id: "catalog-site",
        name: "Каталог товаров или услуг",
        note: "Категории, карточки, фильтры, формы заказа без онлайн-оплаты",
        price: 120000,
      },
      {
        id: "eshop",
        name: "Интернет-магазин",
        note: "Каталог, корзина, заказ, онлайн-оплата, личный кабинет",
        price: 150000,
      },
      {
        id: "redesign",
        name: "Редизайн сайта",
        note: "Обновление дизайна и структуры без потери контента и позиций",
        price: 40000,
      },
      {
        id: "site-improvements",
        name: "Доработка действующего сайта",
        note: "Правки, новые блоки и функции на текущем сайте",
        price: 1500,
        unit: "час",
      },
      {
        id: "landing-nextjs",
        name: "Лендинг на Next.js/React",
        note: "Быстрый лендинг на современном стеке, SSR, формы, аналитика",
        price: 60000,
      },
      {
        id: "mvp-service",
        name: "MVP веб-сервиса",
        note: "Первая версия продукта: ключевой сценарий, авторизация, базовый UI",
        price: 200000,
      },
      {
        id: "web-portal",
        name: "Личный кабинет/веб-портал",
        note: "Закрытая зона для клиентов: заказы, документы, оплаты",
        price: 180000,
      },
    ],
  },
  {
    category: "Чат-боты и автоматизация",
    items: [
      {
        id: "telegram-bot",
        name: "Telegram-бот",
        note: "Бот под задачу: приём заявок, консультации, уведомления",
        price: 30000,
      },
      {
        id: "chatbot-whatsapp",
        name: "Чат-бот для WhatsApp/TG",
        note: "Сценарии диалогов, интеграция с CRM, переключение на оператора",
        price: 40000,
      },
      {
        id: "sales-funnel",
        name: "Автоворонка продаж",
        note: "Цепочка касаний: бот + рассылки + напоминания менеджеру",
        price: 25000,
      },
      {
        id: "integration-1c",
        name: "Интеграция с 1С",
        note: "Обмен товарами, заказами и остатками между сайтом и 1С",
        price: 30000,
      },
      {
        id: "telephony",
        name: "Подключение телефонии",
        note: "Виртуальный номер, запись звонков, интеграция с сайтом",
        price: 5000,
      },
    ],
  },
  {
    category: "Дизайн и фирменный стиль",
    items: [
      {
        id: "prototype",
        name: "Прототипирование",
        note: "Структура страниц и пользовательские сценарии до дизайна",
        price: 10000,
      },
      {
        id: "design-main",
        name: "Дизайн главной",
        note: "Макет главной страницы, десктопная версия",
        price: 12000,
      },
      {
        id: "design-inner",
        name: "Дизайн внутренней страницы",
        note: "Макет типовой внутренней страницы",
        price: 5000,
        unit: "шт",
      },
      {
        id: "adaptive",
        name: "Адаптивные версии",
        note: "Макеты под планшет и смартфон",
        price: 8000,
      },
      {
        id: "ui-kit",
        name: "UI-кит",
        note: "Кнопки, формы, иконки и состояния в едином стиле",
        price: 20000,
      },
      {
        id: "logo",
        name: "Логотип",
        note: "3 варианта на выбор, исходники в векторе",
        price: 15000,
      },
      {
        id: "brand-style",
        name: "Фирменный стиль",
        note: "Логотип, цвета, шрифты, носители, гайдлайн",
        price: 35000,
      },
      {
        id: "banner",
        name: "Рекламный баннер",
        note: "Статичный баннер для рекламных сетей или соцсетей",
        price: 1500,
        unit: "шт",
      },
      {
        id: "presentation",
        name: "Презентация",
        note: "Дизайн презентации компании или продукта, до 15 слайдов",
        price: 10000,
      },
      {
        id: "polygraphy",
        name: "Полиграфия",
        note: "Визитки, листовки, буклеты — макеты к печати",
        price: 5000,
      },
      {
        id: "motion-design",
        name: "Motion-дизайн",
        note: "Анимированные ролики и заставки для сайта и соцсетей",
        price: 8000,
      },
    ],
  },
  {
    category: "SEO и маркетинг",
    items: [
      {
        id: "seo-audit",
        name: "SEO-аудит",
        note: "Технические ошибки, индексация, список правок с приоритетами",
        price: 8000,
      },
      {
        id: "seo-basic",
        name: "Базовая SEO-настройка",
        note: "Мета-теги, заголовки, robots.txt, sitemap, вебмастера",
        price: 12000,
      },
      {
        id: "seo-promotion",
        name: "SEO-продвижение",
        note: "Семантика, оптимизация страниц, работа над позициями",
        price: 25000,
        unit: "мес",
      },
      {
        id: "direct-setup",
        name: "Настройка Яндекс Директ",
        note: "Кампания под ключ: объявления, ключи, минус-слова, ставки",
        price: 12000,
      },
      {
        id: "context-management",
        name: "Ведение контекстной рекламы",
        note: "Оптимизация ставок и объявлений, ежемесячный отчёт",
        price: 10000,
        unit: "мес",
      },
      {
        id: "target-vk",
        name: "Таргет VK",
        note: "Запуск и ведение таргетированной рекламы ВКонтакте",
        price: 12000,
        unit: "мес",
      },
      {
        id: "smm",
        name: "SMM-ведение",
        note: "Контент-план, посты, оформление сообщества",
        price: 20000,
        unit: "мес",
      },
      {
        id: "web-analytics",
        name: "Веб-аналитика",
        note: "Метрика, цели, события, базовые отчёты",
        price: 5000,
      },
      {
        id: "ads-audit",
        name: "Аудит рекламных кампаний",
        note: "Разбор текущих кампаний, точки слива бюджета, рекомендации",
        price: 7000,
      },
      {
        id: "email-marketing-monthly",
        name: "E-mail-маркетинг",
        note: "Письма, сегменты базы, регулярные рассылки под ключ",
        price: 15000,
        unit: "мес",
      },
      {
        id: "reviews-rating",
        name: "Работа с отзывами и рейтингом",
        note: "Мониторинг и ответы на отзывы на картах и отзовиках",
        price: 8000,
        unit: "мес",
      },
      {
        id: "geo-ads",
        name: "Геореклама",
        note: "Продвижение на Яндекс Картах и 2ГИС: карточки, приоритетное размещение",
        price: 10000,
      },
    ],
  },
  {
    category: "Контент",
    items: [
      {
        id: "landing-text",
        name: "Продающий текст лендинга",
        note: "Структура и текст всех блоков под конверсию",
        price: 8000,
      },
      {
        id: "page-text",
        name: "Текст страницы",
        note: "Текст для типовой страницы сайта",
        price: 3000,
        unit: "шт",
      },
      {
        id: "seo-article",
        name: "SEO-статья",
        note: "Статья под ключевой запрос с разметкой",
        price: 2500,
        unit: "шт",
      },
      {
        id: "product-card",
        name: "Описание карточки товара",
        note: "Уникальное описание с характеристиками",
        price: 150,
        unit: "шт",
      },
      {
        id: "catalog-fill",
        name: "Наполнение каталога",
        note: "Заведение товара: описание, фото, характеристики",
        price: 100,
        unit: "шт",
      },
      {
        id: "image-processing",
        name: "Обработка изображений",
        note: "Подбор, обрезка, сжатие и подготовка изображений для сайта",
        price: 2000,
      },
      {
        id: "photoshoot",
        name: "Фотосессия для сайта",
        note: "Предметная и процессная съёмка, обработка фото",
        price: 15000,
      },
      {
        id: "video",
        name: "Видеоролик",
        note: "Ролик о компании или продукте до 60 секунд",
        price: 30000,
      },
      {
        id: "naming",
        name: "Нейминг",
        note: "Варианты названия с проверкой доменов и занятости",
        price: 10000,
      },
    ],
  },
  {
    category: "Техподдержка",
    items: [
      {
        id: "support-basic",
        name: "Базовый",
        note: "Обновления, бэкапы, мелкие правки до 1 часа в месяц",
        price: 5000,
        unit: "мес",
      },
      {
        id: "support-standard",
        name: "Стандарт",
        note: "Базовый + мониторинг, правки до 3 часов в месяц",
        price: 10000,
        unit: "мес",
      },
      {
        id: "support-extended",
        name: "Расширенный",
        note: "Стандарт + доработки до 8 часов, приоритетная реакция",
        price: 20000,
        unit: "мес",
      },
    ],
  },
  {
    category: "Разовые работы",
    items: [
      {
        id: "site-transfer",
        name: "Перенос сайта",
        note: "Переезд на другой хостинг или домен без потерь",
        price: 5000,
      },
      {
        id: "ssl",
        name: "SSL",
        note: "Установка и настройка SSL-сертификата, переезд на HTTPS",
        price: 2000,
      },
      {
        id: "backup-restore",
        name: "Восстановление из бэкапа",
        note: "Развёртывание сайта из резервной копии",
        price: 3000,
      },
      {
        id: "virus-clean",
        name: "Лечение от вирусов",
        note: "Поиск и удаление вредоносного кода, базовая защита",
        price: 8000,
      },
      {
        id: "speedup",
        name: "Ускорение загрузки",
        note: "Оптимизация скорости: кэш, изображения, код",
        price: 10000,
      },
      {
        id: "layout-fixes",
        name: "Исправление ошибок вёрстки",
        note: "Починка отображения на устройствах и в браузерах",
        price: 1500,
        unit: "час",
      },
    ],
  },
  {
    category: "Дополнительно",
    items: [
      {
        id: "domain-hosting",
        name: "Домен и хостинг",
        note: "Регистрация домена и настройка хостинга на год",
        price: 3000,
      },
      {
        id: "online-payment",
        name: "Онлайн-оплата",
        note: "Подключение эквайринга или платёжного агрегатора",
        price: 8000,
      },
      {
        id: "crm-integration",
        name: "Интеграция с CRM",
        note: "Передача заявок с сайта в CRM (amoCRM, Битрикс24 и др.)",
        price: 10000,
      },
      {
        id: "online-chat",
        name: "Онлайн-чат",
        note: "Установка и настройка виджета чата на сайте",
        price: 4000,
      },
      {
        id: "email-marketing",
        name: "E-mail-рассылки",
        note: "Подключение сервиса рассылок, форма подписки, шаблон письма",
        price: 8000,
      },
      {
        id: "quiz",
        name: "Квиз/калькулятор",
        note: "Интерактивная форма с расчётом и сбором заявок",
        price: 10000,
      },
      {
        id: "multilang",
        name: "Мультиязычная версия",
        note: "Дополнительный язык сайта, процент от суммы выбранных работ",
        price: 30,
        percent: true,
      },
      {
        id: "training",
        name: "Обучение",
        note: "Инструкция и онлайн-сессия по работе с сайтом",
        price: 5000,
      },
    ],
  },
  {
    category: "Пакеты",
    items: [
      {
        id: "pack-start",
        name: "Старт",
        note: "Лендинг на конструкторе + базовая SEO-настройка + аналитика",
        price: 39000,
      },
      {
        id: "pack-business",
        name: "Бизнес",
        note: "Сайт с дизайном + SEO-настройка + настройка Яндекс Директ",
        price: 99000,
      },
      {
        id: "pack-shop",
        name: "Магазин",
        note: "Интернет-магазин + наполнение до 50 товаров + аналитика",
        price: 179000,
      },
    ],
  },
];

/** Все id дефолтного каталога. Для валидации используйте getServiceIds(). */
export const SERVICE_IDS: ReadonlySet<string> = new Set(
  SERVICE_CATALOG.flatMap((c) => c.items.map((i) => i.id))
);

// ---------------------------------------------------------------------------
// Динамическое хранилище каталога: data/services.json.
// При первом обращении файл сидится дефолтным SERVICE_CATALOG.
// ---------------------------------------------------------------------------

const DATA_DIR = path.join(process.cwd(), "data");
const SERVICES_FILE = path.join(DATA_DIR, "services.json");

async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

async function writeCatalog(catalog: ServiceCategory[]): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(SERVICES_FILE, JSON.stringify(catalog, null, 2), "utf-8");
}

/** Каталог услуг: из data/services.json, при отсутствии файла — сид дефолта. */
export async function getServiceCatalog(): Promise<ServiceCategory[]> {
  try {
    const content = await fs.readFile(SERVICES_FILE, "utf-8");
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed)) return parsed as ServiceCategory[];
  } catch {
    // файла ещё нет — сидим дефолт
  }
  await writeCatalog(SERVICE_CATALOG);
  return SERVICE_CATALOG;
}

/** Актуальный набор id услуг — для валидации на API. */
export async function getServiceIds(): Promise<Set<string>> {
  const catalog = await getServiceCatalog();
  return new Set(catalog.flatMap((c) => c.items.map((i) => i.id)));
}

const TRANSLIT: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "zh",
  з: "z", и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o",
  п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "c",
  ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
};

/** Slug из названия услуги; при коллизии — суффикс -2, -3, ... */
function makeSlug(name: string, existing: Set<string>): string {
  const base =
    name
      .toLowerCase()
      .split("")
      .map((ch) => TRANSLIT[ch] ?? ch)
      .join("")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "service";
  let slug = base;
  let n = 2;
  while (existing.has(slug)) {
    slug = `${base}-${n}`;
    n += 1;
  }
  return slug;
}

export type ServiceItemInput = Omit<ServiceItem, "id">;

/** Добавить услугу в категорию (категория создаётся, если её нет). */
export async function addServiceItem(
  category: string,
  item: ServiceItemInput
): Promise<ServiceCategory[]> {
  const catalog = await getServiceCatalog();
  const existing = new Set(catalog.flatMap((c) => c.items.map((i) => i.id)));
  const newItem: ServiceItem = { ...item, id: makeSlug(item.name, existing) };

  let group = catalog.find((c) => c.category === category);
  if (!group) {
    group = { category, items: [] };
    catalog.push(group);
  }
  group.items.push(newItem);

  await writeCatalog(catalog);
  return catalog;
}

/** Обновить услугу; patch.category перемещает её в другую категорию. */
export async function updateServiceItem(
  id: string,
  patch: Partial<ServiceItemInput> & { category?: string }
): Promise<ServiceCategory[] | null> {
  const catalog = await getServiceCatalog();
  const group = catalog.find((c) => c.items.some((i) => i.id === id));
  if (!group) return null;

  const index = group.items.findIndex((i) => i.id === id);
  const { category: newCategory, ...fields } = patch;
  group.items[index] = { ...group.items[index], ...fields, id };
  const item = group.items[index];

  if (newCategory && newCategory !== group.category) {
    group.items.splice(index, 1);
    let target = catalog.find((c) => c.category === newCategory);
    if (!target) {
      target = { category: newCategory, items: [] };
      catalog.push(target);
    }
    target.items.push(item);
  }

  // пустые категории убираем
  const cleaned = catalog.filter((c) => c.items.length > 0);
  await writeCatalog(cleaned);
  return cleaned;
}

/** Удалить услугу. null — услуга не найдена. */
export async function deleteServiceItem(id: string): Promise<ServiceCategory[] | null> {
  const catalog = await getServiceCatalog();
  const group = catalog.find((c) => c.items.some((i) => i.id === id));
  if (!group) return null;

  group.items = group.items.filter((i) => i.id !== id);
  const cleaned = catalog.filter((c) => c.items.length > 0);
  await writeCatalog(cleaned);
  return cleaned;
}
