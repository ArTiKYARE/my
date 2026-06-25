"use client";

import { useActionState } from "react";
import { saveProject, deleteProject } from "../lib/data";
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
  const [state, action, pending] = useActionState(
    async (_prevState: unknown, formData: FormData) => {
      const result = await saveProject(formData);
      if (result.success && onSaved) {
        onSaved();
      }
      return result;
    },
    undefined
  );

  const [deleteState, deleteAction, deletePending] = useActionState(
    async (_prevState: unknown, formData: FormData) => {
      const result = await deleteProject(formData);
      if (result.success && onSaved) {
        onSaved();
      }
      return result;
    },
    undefined
  );

  const isEditing = !!project;

  return (
    <div className="space-y-6">
      <form action={action} className="space-y-6">
        <input type="hidden" name="id" defaultValue={project?.id} />

        {(state?.error || deleteState?.error) && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {state?.error || deleteState?.error}
          </div>
        )}
        {state?.success && (
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
        <form action={deleteAction} className="flex">
          <input type="hidden" name="id" value={project.id} />
          <button
            type="submit"
            disabled={deletePending}
            className="px-8 py-3 text-sm font-medium bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors disabled:opacity-50"
          >
            {deletePending ? "Удаление..." : "Удалить проект"}
          </button>
        </form>
      )}
    </div>
  );
}
