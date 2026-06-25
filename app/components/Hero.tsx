import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative min-h-[90vh] flex items-center bg-background border-b border-border">
      <div className="container-main relative z-10 px-4 md:px-6 pt-16">
        <div className="max-w-3xl">
          <p className="section-label">Веб-студия</p>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-semibold tracking-tight mb-6">
            Kos-Ko
          </h1>

          <p className="text-xl md:text-2xl text-muted leading-relaxed mb-10 max-w-2xl">
            Разрабатываем сайты и веб-приложения, которые решают задачи бизнеса.
            Без лишнего. Только результат.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="#cases"
              className="btn-primary px-8 py-3.5 text-sm font-medium text-center"
            >
              Смотреть кейсы
            </Link>
            <Link
              href="#contacts"
              className="btn-secondary px-8 py-3.5 text-sm font-medium text-center"
            >
              Обсудить проект
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
