import Image from "next/image";
import { Project } from "../lib/types";

interface ProjectCardProps {
  project: Project;
}

export default function ProjectCard({ project }: ProjectCardProps) {
  return (
    <article className="group flex flex-col overflow-hidden panel card-hover">
      {/* Banner */}
      <div className="relative h-52 w-full overflow-hidden border-b border-border">
        <Image
          src={project.banner}
          alt={project.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
        />
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-6">
        <h3 className="text-xl font-semibold mb-2 group-hover:text-brand transition-colors">
          {project.title}
        </h3>
        <p className="text-muted text-sm leading-relaxed mb-5 flex-1">
          {project.description}
        </p>

        {/* Tags */}
        {project.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-5">
            {project.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 text-xs font-medium bg-surface-elevated text-muted border border-border"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Links */}
        <div className="flex gap-3">
          {project.link && (
            <a
              href={project.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary/10 text-brand hover:bg-primary/20 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Сайт
            </a>
          )}
          {project.github && (
            <a
              href={project.github}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-surface-elevated text-foreground hover:bg-white/5 transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              GitHub
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
