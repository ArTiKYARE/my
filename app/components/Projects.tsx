import { Project } from "../lib/types";
import ProjectCard from "./ProjectCard";

interface ProjectsProps {
  projects: Project[];
}

export default function Projects({ projects }: ProjectsProps) {
  return (
    <section id="cases" className="section bg-background border-b border-border">
      <div className="container-main">
        <div className="mb-12">
          <p className="section-label">Кейсы</p>
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-4">
            Наши проекты
          </h2>
          <p className="text-muted max-w-2xl">
            Примеры работ, которые мы реализовали для клиентов. Каждый проект —
            это решение конкретной бизнес-задачи.
          </p>
        </div>

        {projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 panel">
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
