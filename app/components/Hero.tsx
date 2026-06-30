import Link from "next/link";
import HeroBackground from "./HeroBackground";

export default function Hero() {
  return (
    <section className="relative min-h-[90vh] flex items-center bg-background border-b border-border overflow-hidden">
      <HeroBackground />

      <div className="container-main relative z-10 px-4 md:px-6 pt-16">
        <div className="max-w-3xl">
          <p className="section-label animate-fade-in-up">Веб-студия</p>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-semibold tracking-tight mb-6 text-gradient animate-fade-in-up-delay-1">
            Kos-Ko
          </h1>

          <p className="text-xl md:text-2xl text-muted leading-relaxed mb-10 max-w-2xl animate-fade-in-up-delay-2">
            Разрабатываем сайты и веб-приложения, которые решают задачи бизнеса.
            Без лишнего. Только результат.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 animate-fade-in-up-delay-2">
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

      {/* Scroll indicator */}
      <Link
        href="#about"
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 text-muted hover:text-foreground transition-colors scroll-indicator"
        aria-label="Прокрутить вниз"
      >
        <span className="text-xs uppercase tracking-widest">Листайте вниз</span>
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </Link>
    </section>
  );
}
