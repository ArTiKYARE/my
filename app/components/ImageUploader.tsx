"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";

interface ImageUploaderProps {
  name: string;
  label: string;
  defaultValue?: string;
  previewClassName?: string;
  aspectRatio?: string;
}

export default function ImageUploader({
  name,
  label,
  defaultValue = "",
  previewClassName = "h-40",
  aspectRatio = "aspect-video",
}: ImageUploaderProps) {
  const [url, setUrl] = useState(defaultValue);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setUrl(defaultValue);
  }, [defaultValue]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Ошибка загрузки");
      }

      setUrl(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось загрузить файл");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-foreground">{label}</label>
      <input type="hidden" name={name} value={url} />

      {url && (
        <div
          className={`relative ${aspectRatio} ${previewClassName} overflow-hidden border border-border`}
        >
          <Image
            src={url}
            alt={label}
            fill
            className="object-cover"
          />
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className="px-4 py-2 text-sm font-medium border border-border hover:bg-white/5 disabled:opacity-50 transition-colors"
        >
          {isUploading ? "Загрузка..." : url ? "Изменить" : "Загрузить"}
        </button>
        {url && (
          <button
            type="button"
            onClick={() => setUrl("")}
            className="text-sm text-red-400 hover:text-red-300 transition-colors"
          >
            Удалить
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
