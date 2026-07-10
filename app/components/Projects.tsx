import { Project } from "../lib/types";
import ProjectCard from "./ProjectCard";

interface ProjectsProps {
  projects: Project[];
}

export default function Projects({ projects }: ProjectsProps) {
  return (
    <section id="cases" className="relative section overflow-hidden border-b border-border bg-background">
      {/* Background glows */}
      <div className="absolute top-0 left-1/4 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-primary/[0.04] blur-[120px]" />
      <div className="absolute bottom-0 right-1/4 h-[400px] w-[400px] translate-x-1/2 rounded-full bg-white/[0.02] blur-[100px]" />

      <div className="container-main relative">
        <div className="mb-14 max-w-3xl">
          <p className="section-label">Кейсы</p>
          <h2 className="text-3xl md:text-5xl font-semibold tracking-tight mb-5">
            Наши проекты
          </h2>
          <p className="text-muted text-lg leading-relaxed">
            Примеры работ, которые мы реализовали для клиентов. Каждый проект —
            это решение конкретной бизнес-задачи.
          </p>
        </div>

        {projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md">
            <p className="text-muted text-lg mb-2">Кейсы пока не добавлены</p>
            <p className="text-sm text-muted/70">
              Добавьте первый проект через админ-панель
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
