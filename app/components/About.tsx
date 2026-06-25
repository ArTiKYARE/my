import Link from "next/link";
import { Profile } from "../lib/types";

interface AboutProps {
  profile: Profile;
}

const stats = [
  { value: "5+", label: "лет опыта" },
  { value: "20+", label: "проектов" },
  { value: "6", label: "услуг" },
];

export default function About({ profile }: AboutProps) {
  return (
    <section id="about" className="section bg-background border-b border-border">
      <div className="container-main">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">
          <div>
            <p className="section-label">О компании</p>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-6">
              Создаём цифровые продукты для бизнеса
            </h2>
            <div className="flex flex-wrap gap-6 mb-8">
              {stats.map((stat) => (
                <div key={stat.label}>
                  <p className="text-2xl font-semibold text-brand">{stat.value}</p>
                  <p className="text-sm text-muted">{stat.label}</p>
                </div>
              ))}
            </div>
            <Link
              href="/about"
              className="inline-flex items-center gap-2 text-sm font-medium text-foreground hover:text-brand transition-colors"
            >
              Подробнее о студии
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>

          <div className="text-lg text-muted leading-relaxed space-y-6">
            {profile.bio.split("\n").map((paragraph, i) =>
              paragraph.trim() ? (
                <p key={i}>{paragraph.trim()}</p>
              ) : null
            )}
            {!profile.bio && (
              <p>
                Здесь будет описание компании. Расскажите о вашем опыте,
                подходе к работе и ценностях.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
