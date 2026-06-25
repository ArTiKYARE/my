interface Service {
  title: string;
  description: string;
  icon: React.ReactNode;
}

interface SkillsProps {
  skills: string[];
}

const icons = {
  monitor: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  ),
  app: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18M9 21V9" />
    </svg>
  ),
  design: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path d="M12 19l7-7 3 3-7 7h-3v-3z" />
      <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
      <path d="M2 2l7.586 7.586" />
      <circle cx="11" cy="11" r="2" />
    </svg>
  ),
  support: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  ),
  seo: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path d="M3 3v18h18" />
      <path d="M18 17V9M13 17V5M8 17v-3" />
    </svg>
  ),
  brand: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
    </svg>
  ),
};

const defaultServices: Service[] = [
  {
    title: "Разработка сайтов",
    description:
      "От посадочных страниц до корпоративных порталов и интернет-магазинов. Чистый код, быстрая загрузка, адаптивность.",
    icon: icons.monitor,
  },
  {
    title: "Веб-приложения",
    description:
      "Внутренние сервисы, личные кабинеты, дашборды и CRM с авторизацией, ролями и интеграциями.",
    icon: icons.app,
  },
  {
    title: "UI/UX-дизайн",
    description:
      "Продуманные интерфейсы, вайрфреймы и прототипы. Делаем так, чтобы пользователю было понятно с первого клика.",
    icon: icons.design,
  },
  {
    title: "Поддержка проектов",
    description:
      "Обновления, доработки, мониторинг и помощь после запуска. Работаем как внешний технический отдел.",
    icon: icons.support,
  },
  {
    title: "SEO и performance",
    description:
      "Оптимизация скорости, поисковой видимости и доступности. Улучшаем позиции и конверсию без переделки дизайна.",
    icon: icons.seo,
  },
  {
    title: "Брендинг и айдентика",
    description:
      "Логотипы, фирменный стиль, презентации и материалы для цифровых продуктов. Минимализм, который запоминается.",
    icon: icons.brand,
  },
];

export default function Skills({ skills }: SkillsProps) {
  const services = defaultServices.map((service, index) => ({
    ...service,
    title: skills[index]?.trim() || service.title,
  }));

  return (
    <section
      id="services"
      className="section bg-surface border-b border-border relative overflow-hidden"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/[0.03] rounded-full blur-3xl pointer-events-none" />

      <div className="container-main relative">
        <div className="mb-14">
          <p className="section-label">Услуги</p>
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-4">
            Чем мы занимаемся
          </h2>
          <p className="text-muted max-w-2xl">
            Полный цикл разработки: от обсуждения задачи и прототипа до запуска,
            продвижения и долгосрочной поддержки.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, index) => (
            <div
              key={index}
              className="group relative panel p-8 card-hover overflow-hidden"
            >
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className="flex items-start justify-between mb-6">
                <p className="text-sm font-mono text-brand/80">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <div className="text-muted/60 group-hover:text-brand/80 transition-colors">
                  {service.icon}
                </div>
              </div>

              <h3 className="text-xl font-semibold mb-3 group-hover:text-brand transition-colors">
                {service.title}
              </h3>
              <p className="text-muted leading-relaxed">
                {service.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
