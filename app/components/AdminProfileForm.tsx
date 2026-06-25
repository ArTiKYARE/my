"use client";

import { useActionState } from "react";
import { saveProfile } from "../lib/data";
import { Profile } from "../lib/types";
import ImageUploader from "./ImageUploader";

interface AdminProfileFormProps {
  profile: Profile;
}

export default function AdminProfileForm({ profile }: AdminProfileFormProps) {
  const [state, action, pending] = useActionState(
    async (_prevState: unknown, formData: FormData) => saveProfile(formData),
    undefined
  );

  return (
    <form action={action} className="space-y-6">
      {state?.error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {state.error}
        </div>
      )}
      {state?.success && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
          Профиль успешно сохранён
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Название компании
          </label>
          <input
            name="name"
            type="text"
            defaultValue={profile.name}
            required
            className="input-field"
            placeholder="Название компании"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Роль / Слоган
          </label>
          <input
            name="role"
            type="text"
            defaultValue={profile.role}
            className="input-field"
            placeholder="Например, Веб-студия"
          />
        </div>
      </div>

      <div>
        <ImageUploader
          name="photo"
          label="Логотип / Изображение компании"
          defaultValue={profile.photo}
          previewClassName="h-48"
          aspectRatio="aspect-square"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Описание компании
        </label>
        <textarea
          name="bio"
          rows={5}
          defaultValue={profile.bio}
          className="input-field resize-none"
          placeholder="Расскажите о компании"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Услуги / Навыки (через запятую)
        </label>
        <input
          name="skills"
          type="text"
          defaultValue={profile.skills.join(", ")}
          className="input-field"
          placeholder="Разработка сайтов, Дизайн, Поддержка"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Email
          </label>
          <input
            name="contacts.email"
            type="email"
            defaultValue={profile.contacts.email || ""}
            className="input-field"
            placeholder="hello@example.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Telegram
          </label>
          <input
            name="contacts.telegram"
            type="url"
            defaultValue={profile.contacts.telegram || ""}
            className="input-field"
            placeholder="https://t.me/username"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            GitHub
          </label>
          <input
            name="contacts.github"
            type="url"
            defaultValue={profile.contacts.github || ""}
            className="input-field"
            placeholder="https://github.com/username"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            LinkedIn
          </label>
          <input
            name="contacts.linkedin"
            type="url"
            defaultValue={profile.contacts.linkedin || ""}
            className="input-field"
            placeholder="https://linkedin.com/in/username"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-foreground mb-2">
            Сайт компании
          </label>
          <input
            name="contacts.website"
            type="url"
            defaultValue={profile.contacts.website || ""}
            className="input-field"
            placeholder="https://example.com"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="btn-primary px-8 py-3 text-sm font-medium disabled:opacity-50"
      >
        {pending ? "Сохранение..." : "Сохранить профиль"}
      </button>
    </form>
  );
}
