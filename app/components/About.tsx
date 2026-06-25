import { Profile } from "../lib/types";

interface AboutProps {
  profile: Profile;
}

export default function About({ profile }: AboutProps) {
  return (
    <section id="about" className="section bg-background border-b border-border">
      <div className="container-main">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">
          <div>
            <p className="section-label">О компании</p>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">
              Создаём цифровые продукты для бизнеса
            </h2>
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
