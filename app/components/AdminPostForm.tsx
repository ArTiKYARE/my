"use client";

import { FormEvent, useState } from "react";
import { Post } from "../lib/types";
import ImageUploader from "./ImageUploader";

interface AdminPostFormProps {
  post?: Post;
  onCancel?: () => void;
  onSaved?: () => void;
}

export default function AdminPostForm({
  post,
  onCancel,
  onSaved,
}: AdminPostFormProps) {
  const [state, setState] = useState<{ error?: string; success?: boolean }>({});
  const [pending, setPending] = useState(false);
  const isEditing = !!post;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setState({});

    try {
      const formData = new FormData(e.currentTarget);
      const response = await fetch("/api/posts", {
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
      setState({ error: "Не удалось сохранить публикацию" });
    } finally {
      setPending(false);
    }
  }

  async function handleDelete() {
    if (!post) return;
    setPending(true);
    setState({});

    try {
      const formData = new FormData();
      formData.append("id", post.id);
      const response = await fetch("/api/posts/delete", {
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
      setState({ error: "Не удалось удалить публикацию" });
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <input type="hidden" name="id" defaultValue={post?.id} />

        {state.error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {state.error}
          </div>
        )}
        {state.success && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
            Публикация успешно сохранена
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Заголовок
            </label>
            <input
              name="title"
              type="text"
              defaultValue={post?.title}
              required
              className="input-field"
              placeholder="Заголовок публикации"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              URL-slug
            </label>
            <input
              name="slug"
              type="text"
              defaultValue={post?.slug}
              required
              className="input-field"
              placeholder="nazvanie-stati"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Анонс
          </label>
          <textarea
            name="excerpt"
            rows={3}
            defaultValue={post?.excerpt}
            required
            className="input-field resize-none"
            placeholder="Краткое описание для списка"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Содержание
          </label>
          <textarea
            name="content"
            rows={10}
            defaultValue={post?.content}
            required
            className="input-field resize-none"
            placeholder="Текст статьи"
          />
        </div>

        <ImageUploader
          name="cover"
          label="Обложка (опционально)"
          defaultValue={post?.cover}
          previewClassName="h-40"
          aspectRatio="aspect-video"
        />

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Теги (через запятую)
          </label>
          <input
            name="tags"
            type="text"
            defaultValue={post?.tags.join(", ")}
            className="input-field"
            placeholder="Next.js, SEO, Дизайн"
          />
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
              ? "Обновить публикацию"
              : "Добавить публикацию"}
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
            {pending ? "Удаление..." : "Удалить публикацию"}
          </button>
        </div>
      )}
    </div>
  );
}
