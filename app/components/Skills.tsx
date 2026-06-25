interface SkillsProps {
  skills: string[];
}

export default function Skills({ skills }: SkillsProps) {
  return (
    <section id="services" className="section bg-surface border-b border-border">
      <div className="container-main">
        <div className="mb-12">
          <p className="section-label">Услуги</p>
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">
            Чем мы занимаемся
          </h2>
        </div>

        {skills.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-border border border-border">
            {skills.map((skill, index) => (
              <div
                key={index}
                className="group bg-background p-6 md:p-8 card-hover"
              >
                <span className="text-base md:text-lg font-medium text-foreground group-hover:text-brand transition-colors">
                  {skill}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted">
            Услуги ещё не добавлены. Их можно указать в админ-панели.
          </p>
        )}
      </div>
    </section>
  );
}
