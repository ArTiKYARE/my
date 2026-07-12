"use client";

import { useState } from "react";
import Image from "next/image";

import { Project, Profile, Post } from "../lib/types";
import AdminProfileForm from "./AdminProfileForm";
import AdminProjectForm from "./AdminProjectForm";
import AdminPostForm from "./AdminPostForm";
import AdminLeads from "./AdminLeads";
import AdminMail from "./AdminMail";

type Tab = "leads" | "projects" | "posts" | "mail" | "profile";

interface AdminDashboardProps {
  profile: Profile;
  projects: Project[];
  posts: Post[];
}

export default function AdminDashboard({
  profile,
  projects: initialProjects,
  posts: initialPosts,
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>("leads");
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 border-b border-border backdrop-blur-sm">
        <div className="container-main flex h-16 items-center justify-between px-4 md:px-6">
          <h1 className="text-lg font-semibold text-foreground">Kos-Ko — Админ-панель</h1>
          <div className="flex items-center gap-4">
            <a
              href="/"
              target="_blank"
              className="hidden sm:inline-flex px-4 py-2 text-sm btn-secondary"
            >
              Открыть сайт
            </a>
            <form action="/api/logout" method="POST">
              <button
                type="submit"
                className="px-4 py-2 text-sm bg-surface-elevated text-foreground border border-border hover:bg-white/5 transition-colors"
              >
                Выйти
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="container-main py-8 px-4 md:px-6">
        {/* Tabs */}
        <div className="flex flex-wrap gap-0 mb-8 border border-border w-fit">
          <button
            onClick={() => {
              setActiveTab("leads");
              setEditingProject(null);
              setEditingPost(null);
            }}
            className={`px-5 py-2.5 text-sm font-medium transition-colors ${
              activeTab === "leads"
                ? "bg-foreground text-background"
                : "text-muted hover:text-foreground"
            }`}
          >
            Заявки
          </button>
          <button
            onClick={() => {
              setActiveTab("projects");
              setEditingProject(null);
              setEditingPost(null);
            }}
            className={`px-5 py-2.5 text-sm font-medium transition-colors border-l border-border ${
              activeTab === "projects"
                ? "bg-foreground text-background"
                : "text-muted hover:text-foreground"
            }`}
          >
            Проекты
          </button>
          <button
            onClick={() => {
              setActiveTab("posts");
              setEditingProject(null);
              setEditingPost(null);
            }}
            className={`px-5 py-2.5 text-sm font-medium transition-colors border-l border-border ${
              activeTab === "posts"
                ? "bg-foreground text-background"
                : "text-muted hover:text-foreground"
            }`}
          >
            Блог
          </button>
          <button
            onClick={() => {
              setActiveTab("mail");
              setEditingProject(null);
              setEditingPost(null);
            }}
            className={`px-5 py-2.5 text-sm font-medium transition-colors border-l border-border ${
              activeTab === "mail"
                ? "bg-foreground text-background"
                : "text-muted hover:text-foreground"
            }`}
          >
            Рассылка
          </button>
          <button
            onClick={() => {
              setActiveTab("profile");
              setEditingProject(null);
              setEditingPost(null);
            }}
            className={`px-5 py-2.5 text-sm font-medium transition-colors border-l border-border ${
              activeTab === "profile"
                ? "bg-foreground text-background"
                : "text-muted hover:text-foreground"
            }`}
          >
            Профиль
          </button>
        </div>

        {activeTab === "leads" && (
          <section>
            <h2 className="text-2xl font-semibold mb-6">Заявки с сайта</h2>
            <AdminLeads />
          </section>
        )}

        {activeTab === "mail" && <AdminMail />}

        {activeTab === "profile" && (
          <section className="panel p-6 md:p-8">
            <h2 className="text-2xl font-semibold mb-6">Редактирование профиля</h2>
            <AdminProfileForm profile={profile} />
          </section>
        )}

        {activeTab === "projects" && (
          <div className="space-y-8">
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
                        <h3 className="font-semibold truncate">{project.title}</h3>
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
      </main>
    </div>
  );
}
