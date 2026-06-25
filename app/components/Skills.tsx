interface Service {
  title: string;
  description: string;
}

interface SkillsProps {
  skills: string[];
}

const defaultServices: Service[] = [
  {
    title: "Разработка сайтов",
    description:
      "От посадочных страниц до корпоративных порталов и интернет-магазинов. Чистый код, быстрая загрузка, адаптивность.",
  },
  {
    title: "Веб-приложения",
    description:
      "Внутренние сервисы, личные кабинеты, дашборды и CRM с авторизацией, ролями и интеграциями.",
  },
  {
    title: "UI/UX-дизайн",
    description:
      "Продуманные интерфейсы, вайрфреймы и прототипы. Делаем так, чтобы пользователю было понятно с первого клика.",
  },
  {
    title: "Поддержка проектов",
    description:
      "Обновления, доработки, мониторинг и помощь после запуска. Работаем как внешний технический отдел.",
  },
  {
    title: "SEO и performance",
    description:
      "Оптимизация скорости, поисковой видимости и доступности. Улучшаем позиции и конверсию без переделки дизайна.",
  },
  {
    title: "Брендинг и айдентика",
    description:
      "Логотипы, фирменный стиль, презентации и материалы для цифровых продуктов. Минимализм, который запоминается.",
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

              <p className="text-sm font-mono text-brand/80 mb-4">
                {String(index + 1).padStart(2, "0")}
              </p>
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
