import Header from "../components/Header";
import Footer from "../components/Footer";
import { getProfile } from "../lib/data";

export const metadata = {
  title: "О студии — Kos-Ko",
  description:
    "Kos-Ko — команда разработчиков и дизайнеров. Узнайте больше о нашей истории, команде и подходе к работе.",
};

const stats = [
  { value: "5+", label: "лет в веб-разработке" },
  { value: "20+", label: "реализованных проектов" },
  { value: "6", label: "направлений услуг" },
  { value: "100%", label: "внимания к деталям" },
];

const team = [
  { name: "Константин К.", role: "Основатель, разработчик" },
  { name: "Софья Т.", role: "UI/UX-дизайнер" },
  { name: "Сергей М.", role: "Frontend-разработчик" },
  { name: "Александер Ш.", role: "Project-менеджер" },
];

function Avatar({ name }: { name: string }) {
  const initial = name.charAt(0).toUpperCase();
  return (
    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 border border-border flex items-center justify-center text-2xl font-semibold text-foreground">
      {initial}
    </div>
  );
}

export default async function AboutPage() {
  const profile = await getProfile();

  return (
    <>
      <Header />

      <main className="flex-1 pt-[4.5rem]">
        {/* Hero */}
        <section className="section bg-background border-b border-border">
          <div className="container-main">
            <p className="section-label">О студии</p>
            <h1 className="text-3xl md:text-5xl font-semibold tracking-tight mb-6 max-w-3xl">
              Создаём цифровые продукты, которые работают на бизнес
            </h1>
            <p className="text-lg text-muted leading-relaxed max-w-2xl">
              Kos-Ko — это команда разработчиков и дизайнеров, которая превращает идеи
              в работающие сайты и веб-приложения. Мы верим, что хороший цифровой
              продукт должен быть понятным, быстрым и измеримо полезным.
            </p>
          </div>
        </section>

        {/* Stats */}
        <section className="section bg-surface border-b border-border">
          <div className="container-main">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {stats.map((stat) => (
                <div key={stat.label} className="panel p-6 md:p-8 text-center">
                  <p className="text-3xl md:text-4xl font-semibold text-brand mb-2">
                    {stat.value}
                  </p>
                  <p className="text-sm text-muted">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* UTP + History */}
        <section className="section bg-background border-b border-border">
          <div className="container-main">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
              <div>
                <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-4">
                  Почему Kos-Ko?
                </h2>
                <ul className="space-y-4 text-muted leading-relaxed">
                  <li className="flex gap-3">
                    <span className="text-brand">—</span>
                    <span>
                      <strong className="text-foreground">Полный цикл.</strong> От идеи,
                      прототипа и дизайна до разработки, тестирования и запуска — всё в
                      одной команде.
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-brand">—</span>
                    <span>
                      <strong className="text-foreground">Минимализм без потери сути.</strong>{" "}
                      Мы убираем лишнее, но оставляем всё, что влияет на конверсию и опыт
                      пользователя.
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-brand">—</span>
                    <span>
                      <strong className="text-foreground">Прозрачность.</strong> Регулярные
                      демо, понятные сроки и фиксированные этапы — вы всегда знаете, что
                      происходит с проектом.
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-brand">—</span>
                    <span>
                      <strong className="text-foreground">Поддержка после запуска.</strong>{" "}
                      Не бросаем проект после релиза: дорабатываем, обновляем и помогаем
                      расти.
                    </span>
                  </li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-4">
                  История студии
                </h2>
                <div className="space-y-6 text-muted leading-relaxed">
                  <p>
                    Студия началась как небольшая команда фрилансеров, объединённых общей
                    идеей: делать для бизнеса сайты, которые действительно решают задачи.
                    Со временем проекты становились сложнее, а команда — сильнее.
                  </p>
                  <p>
                    Сегодня Kos-Ko работает с лендингами, корпоративными сайтами,
                    интернет-магазинами и веб-сервисами. За плечами — десятки запущенных
                    проектов для клиентов из разных сфер: от ИТ-стартапов до
                    строительных компаний.
                  </p>
                  <p>
                    Мы не гонимся за трендами ради трендов. Наша цель — создавать
                    надёжные, понятные и красивые цифровые продукты.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Team */}
        <section className="section bg-surface border-b border-border">
          <div className="container-main">
            <div className="mb-12">
              <p className="section-label">Команда</p>
              <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">
                Люди, которые делают Kos-Ko
              </h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {team.map((member) => (
                <div key={member.name} className="panel p-6 text-center card-hover">
                  <div className="flex justify-center mb-4">
                    <Avatar name={member.name} />
                  </div>
                  <h3 className="font-semibold text-foreground">{member.name}</h3>
                  <p className="text-sm text-muted mt-1">{member.role}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer name={profile.name} />
    </>
  );
}
