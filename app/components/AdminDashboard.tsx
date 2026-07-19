"use client";

import { ReactElement, useState } from "react";
import Image from "next/image";

import { Project, Profile, Post } from "../lib/types";
import AdminProfileForm from "./AdminProfileForm";
import AdminProjectForm from "./AdminProjectForm";
import AdminPostForm from "./AdminPostForm";
import AdminLeads from "./AdminLeads";
import AdminMail from "./AdminMail";
import AdminLeadHunter from "./AdminLeadHunter";

type Tab = "leads" | "hunt" | "projects" | "posts" | "mail" | "profile";

interface AdminDashboardProps {
  profile: Profile;
  projects: Project[];
  posts: Post[];
}

interface NavItem {
  id: Tab;
  label: string;
  icon: ReactElement;
}

const strokeProps = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

const navItems: NavItem[] = [
  {
    id: "leads",
    label: "Заявки",
    icon: (
      <svg viewBox="0 0 24 24" className="w-4 h-4" {...strokeProps}>
        <path d="M22 12h-6l-2 3h-4l-2-3H2" />
        <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
      </svg>
    ),
  },
  {
    id: "hunt",
    label: "Поиск лидов",
    icon: (
      <svg viewBox="0 0 24 24" className="w-4 h-4" {...strokeProps}>
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="4" />
        <line x1="12" y1="3" x2="12" y2="7" />
        <line x1="12" y1="17" x2="12" y2="21" />
        <line x1="3" y1="12" x2="7" y2="12" />
        <line x1="17" y1="12" x2="21" y2="12" />
      </svg>
    ),
  },
  {
    id: "projects",
    label: "Проекты",
    icon: (
      <svg viewBox="0 0 24 24" className="w-4 h-4" {...strokeProps}>
        <rect x="2" y="7" width="20" height="14" rx="2" />
        <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
      </svg>
    ),
  },
  {
    id: "posts",
    label: "Блог",
    icon: (
      <svg viewBox="0 0 24 24" className="w-4 h-4" {...strokeProps}>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
  },
  {
    id: "mail",
    label: "Рассылка",
    icon: (
      <svg viewBox="0 0 24 24" className="w-4 h-4" {...strokeProps}>
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
      </svg>
    ),
  },
  {
    id: "profile",
    label: "Профиль",
    icon: (
      <svg viewBox="0 0 24 24" className="w-4 h-4" {...strokeProps}>
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
];

function SectionHeader({ label, title }: { label: string; title: string }) {
  return (
    <div className="mb-8">
      <span className="section-label">{label}</span>
      <h2 className="text-2xl font-semibold text-foreground">{title}</h2>
    </div>
  );
}

export default function AdminDashboard({
  profile,
  projects: initialProjects,
  posts: initialPosts,
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>("leads");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [projects] = useState(initialProjects);
  const [posts] = useState(initialPosts);

  function handleProjectSaved() {
    setEditingProject(null);
    window.location.reload();
  }

  function handlePostSaved() {
    setEditingPost(null);
    window.location.reload();
  }

  function selectTab(tab: Tab) {
    setActiveTab(tab);
    setEditingProject(null);
    setEditingPost(null);
    setMobileOpen(false);
  }

  const sidebarContent = (
    <>
      {/* Brand */}
      <div className="px-5 pt-6 pb-5 border-b border-border">
        <h1 className="text-lg font-semibold text-foreground">Kos-Ko</h1>
        <p className="text-xs text-muted mt-0.5">Админ-панель</p>
      </div>

      {/* Nav */}
      <nav
        data-lenis-prevent
        className="flex-1 px-3 py-4 space-y-1 overflow-y-auto"
      >
        {navItems.map((item) => {
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => selectTab(item.id)}
              className={`relative w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-surface-elevated text-foreground"
                  : "text-muted hover:text-foreground hover:bg-white/5"
              }`}
            >
              {active && (
                <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary" />
              )}
              {item.icon}
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Bottom actions */}
      <div className="mt-auto px-3 py-4 border-t border-border space-y-2">
        <a
          href="/"
          target="_blank"
          className="btn-secondary flex items-center justify-center px-4 py-2 text-sm w-full"
        >
          Открыть сайт
        </a>
        <form action="/api/logout" method="POST">
          <button
            type="submit"
            className="w-full px-4 py-2 text-sm bg-surface-elevated text-foreground border border-border hover:bg-white/5 transition-colors"
          >
            Выйти
          </button>
        </form>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:flex-col fixed inset-y-0 left-0 w-64 bg-surface border-r border-border z-40">
        {sidebarContent}
      </aside>

      {/* Mobile top bar */}
      <header className="md:hidden sticky top-0 z-30 bg-background/95 border-b border-border backdrop-blur-sm">
        <div className="flex h-16 items-center justify-between px-4">
          <div>
            <h1 className="text-base font-semibold text-foreground">Kos-Ko</h1>
            <p className="text-xs text-muted leading-tight">Админ-панель</p>
          </div>
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Открыть меню"
            className="p-2 text-foreground border border-border bg-surface hover:bg-white/5 transition-colors"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" {...strokeProps}>
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden">
          <div
            className="fixed inset-0 z-40 bg-black/60"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-surface border-r border-border flex flex-col">
            <div className="absolute top-4 right-4">
              <button
                onClick={() => setMobileOpen(false)}
                aria-label="Закрыть меню"
                className="p-1.5 text-muted hover:text-foreground transition-colors"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5" {...strokeProps}>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Content */}
      <main className="md:ml-64 p-6 md:p-10">
        <div
          className={activeTab === "hunt" ? "max-w-[1600px]" : "max-w-6xl"}
        >
          {activeTab === "leads" && (
            <section>
              <SectionHeader label="Управление" title="Заявки с сайта" />
              <AdminLeads />
            </section>
          )}

          {activeTab === "hunt" && (
            <section>
              <SectionHeader label="Поиск клиентов" title="Поиск лидов" />
              <AdminLeadHunter />
            </section>
          )}

          {activeTab === "mail" && <AdminMail />}

          {activeTab === "profile" && (
            <section>
              <SectionHeader label="Настройки" title="Профиль" />
              <div className="panel p-6 md:p-8">
                <h2 className="text-2xl font-semibold mb-6">
                  Редактирование профиля
                </h2>
                <AdminProfileForm profile={profile} />
              </div>
            </section>
          )}

          {activeTab === "projects" && (
            <div className="space-y-8">
              <SectionHeader label="Портфолио" title="Проекты" />
              {/* Project Form */}
              <section className="panel p-6 md:p-8">
                <h2 className="text-2xl font-semibold mb-6">
                  {editingProject ? "Редактирование проекта" : "Новый проект"}
                </h2>
                <AdminProjectForm
                  project={editingProject || undefined}
                  onCancel={
                    editingProject ? () => setEditingProject(null) : undefined
                  }
                  onSaved={handleProjectSaved}
                />
              </section>

              {/* Projects List */}
              <section>
                <h2 className="text-2xl font-semibold mb-6">Все проекты</h2>
                {projects.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {projects.map((project) => (
                      <div
                        key={project.id}
                        className="flex gap-4 p-4 panel card-hover"
                      >
                        <div className="relative w-16 h-16 overflow-hidden flex-shrink-0 border border-border bg-surface-elevated">
                          <Image
                            src={project.logo}
                            alt={project.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold truncate">
                            {project.title}
                          </h3>
                          <p className="text-sm text-muted line-clamp-2">
                            {project.description}
                          </p>
                        </div>
                        <button
                          onClick={() => setEditingProject(project)}
                          className="self-center px-4 py-2 text-sm font-medium bg-surface-elevated border border-border hover:bg-white/5 transition-colors"
                        >
                          Редактировать
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted">Проекты ещё не добавлены.</p>
                )}
              </section>
            </div>
          )}

          {activeTab === "posts" && (
            <div className="space-y-8">
              <SectionHeader label="Контент" title="Блог" />
              {/* Post Form */}
              <section className="panel p-6 md:p-8">
                <h2 className="text-2xl font-semibold mb-6">
                  {editingPost ? "Редактирование публикации" : "Новая публикация"}
                </h2>
                <AdminPostForm
                  post={editingPost || undefined}
                  onCancel={
                    editingPost ? () => setEditingPost(null) : undefined
                  }
                  onSaved={handlePostSaved}
                />
              </section>

              {/* Posts List */}
              <section>
                <h2 className="text-2xl font-semibold mb-6">Все публикации</h2>
                {posts.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {posts.map((post) => (
                      <div
                        key={post.id}
                        className="flex gap-4 p-4 panel card-hover"
                      >
                        <div className="relative w-16 h-16 overflow-hidden flex-shrink-0 border border-border bg-surface-elevated">
                          {post.cover ? (
                            <Image
                              src={post.cover}
                              alt={post.title}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs text-muted">
                              —
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold truncate">{post.title}</h3>
                          <p className="text-sm text-muted line-clamp-2">
                            {post.excerpt}
                          </p>
                        </div>
                        <button
                          onClick={() => setEditingPost(post)}
                          className="self-center px-4 py-2 text-sm font-medium bg-surface-elevated border border-border hover:bg-white/5 transition-colors"
                        >
                          Редактировать
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted">Публикации ещё не добавлены.</p>
                )}
              </section>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
