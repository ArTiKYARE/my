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
    description: "От лендингов до корпоративных порталов на современном стеке.",
  },
  {
    title: "Веб-приложения",
    description: "Интерфейсы с авторизацией, дашбордами и интеграциями.",
  },
  {
    title: "UI/UX-дизайн",
    description: "Продуманные интерфейсы, которые удобны для пользователя.",
  },
  {
    title: "Поддержка проектов",
    description: "Обновления, доработки и мониторинг после запуска.",
  },
];

export default function Skills({ skills }: SkillsProps) {
  const services = skills.length > 0
    ? skills.map((skill, i) => ({
        title: skill,
        description: defaultServices[i]?.description || "",
      }))
    : defaultServices;

  return (
    <section id="services" className="section bg-surface border-b border-border">
      <div className="container-main">
        <div className="mb-12">
          <p className="section-label">Услуги</p>
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-4">
            Чем мы занимаемся
          </h2>
          <p className="text-muted max-w-2xl">
            Полный цикл разработки: от обсуждения задачи до запуска и поддержки.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border border border-border">
          {services.map((service, index) => (
            <div
              key={index}
              className="group bg-background p-8 md:p-10 card-hover"
            >
              <p className="text-sm text-brand font-medium mb-3">
                {String(index + 1).padStart(2, "0")}
              </p>
              <h3 className="text-xl font-semibold mb-3 group-hover:text-brand transition-colors">
                {service.title}
              </h3>
              {service.description && (
                <p className="text-muted leading-relaxed">
                  {service.description}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
