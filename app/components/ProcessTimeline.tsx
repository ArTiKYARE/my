const steps = [
  {
    number: "01",
    title: "Бриф",
    description: "Обсуждаем задачу, целевую аудиторию, конкурентов и ожидаемый результат.",
  },
  {
    number: "02",
    title: "Прототип",
    description: "Создаём структуру страниц и схемы интерфейсов, чтобы согласовать логику до дизайна.",
  },
  {
    number: "03",
    title: "Дизайн",
    description: "Разрабатываем визуальную концепцию, макеты и адаптивы под все устройства.",
  },
  {
    number: "04",
    title: "Разработка",
    description: "Верстаем, программируем frontend и backend, подключаем интеграции и CMS.",
  },
  {
    number: "05",
    title: "Запуск и поддержка",
    description: "Тестируем, выкладываем на хостинг, настраиваем аналитику и помогаем развивать проект.",
  },
];

export default function ProcessTimeline() {
  return (
    <div className="mt-12">
      <h3 className="text-xl font-semibold mb-8">Как мы работаем</h3>
      <div className="relative">
        <div className="absolute left-4 md:left-6 top-0 bottom-0 w-px bg-border" />
        <div className="space-y-8">
          {steps.map((step) => (
            <div key={step.number} className="relative pl-14 md:pl-20">
              <div className="absolute left-0 md:left-2 top-0 flex items-center justify-center w-8 h-8 md:w-10 md:h-10 bg-surface border border-border text-xs md:text-sm font-mono text-brand">
                {step.number}
              </div>
              <h4 className="text-lg font-semibold mb-1">{step.title}</h4>
              <p className="text-muted text-sm leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
