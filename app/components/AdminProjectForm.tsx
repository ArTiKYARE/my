"use client";

import { FormEvent, useState } from "react";
import { Project } from "../lib/types";
import ImageUploader from "./ImageUploader";

interface AdminProjectFormProps {
  project?: Project;
  onCancel?: () => void;
  onSaved?: () => void;
}

export default function AdminProjectForm({
  project,
  onCancel,
  onSaved,
}: AdminProjectFormProps) {
  const [state, setState] = useState<{ error?: string; success?: boolean }>({});
  const [pending, setPending] = useState(false);
  const isEditing = !!project;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setState({});

    try {
      const formData = new FormData(e.currentTarget);
      const response = await fetch("/api/projects", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        setState({ error: result.error || "Ошибка сохранения" });
      } else {
        setState({ success: true });
        if (onSaved) {
          onSaved();
        } else {
          window.location.reload();
        }
      }
    } catch {
      setState({ error: "Не удалось сохранить проект" });
    } finally {
      setPending(false);
    }
  }

  async function handleDelete() {
    if (!project) return;
    setPending(true);
    setState({});

    try {
      const formData = new FormData();
      formData.append("id", project.id);
      const response = await fetch("/api/projects/delete", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        setState({ error: result.error || "Ошибка удаления" });
      } else {
        if (onSaved) {
          onSaved();
        } else {
          window.location.reload();
        }
      }
    } catch {
      setState({ error: "Не удалось удалить проект" });
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <input type="hidden" name="id" defaultValue={project?.id} />

        {state.error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {state.error}
          </div>
        )}
        {state.success && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
            Проект успешно сохранён
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Название проекта
          </label>
          <input
            name="title"
            type="text"
            defaultValue={project?.title}
            required
            className="input-field"
            placeholder="Название проекта"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Краткое описание
          </label>
          <textarea
            name="description"
            rows={3}
            defaultValue={project?.description}
            required
            className="input-field resize-none"
            placeholder="Описание проекта"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ImageUploader
            name="logo"
            label="Логотип проекта"
            defaultValue={project?.logo}
            previewClassName="h-40"
            aspectRatio="aspect-square"
          />
          <ImageUploader
            name="banner"
            label="Баннер проекта"
            defaultValue={project?.banner}
            previewClassName="h-40"
            aspectRatio="aspect-video"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Теги (через запятую)
          </label>
          <input
            name="tags"
            type="text"
            defaultValue={project?.tags.join(", ")}
            className="input-field"
            placeholder="React, TypeScript, Node.js"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Ссылка на проект
            </label>
            <input
              name="link"
              type="url"
              defaultValue={project?.link}
              className="input-field"
              placeholder="https://example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Ссылка на GitHub
            </label>
            <input
              name="github"
              type="url"
              defaultValue={project?.github}
              className="input-field"
              placeholder="https://github.com/username/repo"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 pt-2">
          <button
            type="submit"
            disabled={pending}
            className="btn-primary px-8 py-3 text-sm font-medium disabled:opacity-50"
          >
            {pending
              ? "Сохранение..."
              : isEditing
              ? "Обновить проект"
              : "Добавить проект"}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-8 py-3 text-sm font-medium btn-secondary"
            >
              Отмена
            </button>
          )}
        </div>
      </form>

      {isEditing && (
        <div className="flex">
          <button
            onClick={handleDelete}
            disabled={pending}
            className="px-8 py-3 text-sm font-medium bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors disabled:opacity-50"
          >
            {pending ? "Удаление..." : "Удалить проект"}
          </button>
        </div>
      )}
    </div>
  );
}
