"use client";

import { useState } from "react";
import { Contacts } from "../lib/types";

interface ContactProps {
  contacts: Contacts;
}

const contactConfig = [
  {
    key: "email",
    label: "Email",
    href: (value: string) => `mailto:${value}`,
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      />
    ),
  },
  {
    key: "telegram",
    label: "Telegram",
    href: (value: string) => value,
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
      />
    ),
  },
  {
    key: "github",
    label: "GitHub",
    href: (value: string) => value,
    icon: (
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    ),
  },
  {
    key: "linkedin",
    label: "LinkedIn",
    href: (value: string) => value,
    icon: (
      <>
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
        <rect x="2" y="9" width="4" height="12" />
        <circle cx="4" cy="4" r="2" />
      </>
    ),
  },
  {
    key: "website",
    label: "Сайт",
    href: (value: string) => value,
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
      />
    ),
  },
];

export default function Contact({ contacts }: ContactProps) {
  const [state, setState] = useState<{
    pending: boolean;
    success?: boolean;
    error?: string;
  }>({ pending: false });

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState({ pending: true });

    try {
      const formData = new FormData(e.currentTarget);
      const response = await fetch("/api/contact", {
        method: "POST",
        body: formData,
      });
      const result = await response.json();

      if (!response.ok || result.error) {
        setState({ pending: false, error: result.error || "Ошибка отправки" });
      } else {
        setState({ pending: false, success: true });
        e.currentTarget.reset();
      }
    } catch {
      setState({ pending: false, error: "Не удалось отправить заявку" });
    }
  }

  const availableContacts = contactConfig.filter(
    (item) => contacts[item.key as keyof Contacts]
  );

  return (
    <section id="contacts" className="section bg-surface border-b border-border">
      <div className="container-main">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
          <div>
            <p className="section-label">Контакты</p>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-4">
              Обсудить проект
            </h2>
            <p className="text-muted max-w-lg mb-8">
              Расскажите о задаче — мы свяжемся с вами и предложим решение.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                    Имя
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    maxLength={100}
                    placeholder="Как к вам обращаться"
                    className="input-field"
                  />
                </div>
                <div>
                  <label htmlFor="contact" className="block text-sm font-medium text-foreground mb-2">
                    Email или телефон
                  </label>
                  <input
                    id="contact"
                    name="contact"
                    type="text"
                    required
                    maxLength={100}
                    placeholder="hello@example.com"
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-foreground mb-2">
                  Описание проекта
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  maxLength={2000}
                  placeholder="Кратко опишите идею, сроки и бюджет"
                  className="input-field resize-none"
                />
              </div>

              {state.success && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
                  Спасибо! Заявка отправлена — мы скоро свяжемся.
                </div>
              )}
              {state.error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {state.error}
                </div>
              )}

              <button
                type="submit"
                disabled={state.pending}
                className="btn-primary px-8 py-3.5 text-sm font-medium disabled:opacity-50"
              >
                {state.pending ? "Отправка..." : "Отправить"}
              </button>
            </form>
          </div>

          {availableContacts.length > 0 ? (
            <div className="space-y-4 lg:pt-12">
              {availableContacts.map((item) => {
                const value = contacts[item.key as keyof Contacts] as string;
                return (
                  <a
                    key={item.key}
                    href={item.href(value)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-4 p-5 panel card-hover"
                  >
                    <div className="flex items-center justify-center w-12 h-12 bg-surface-elevated text-foreground border border-border">
                      <svg
                        className="w-5 h-5"
                        fill={item.key === "github" || item.key === "linkedin" ? "currentColor" : "none"}
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        {item.icon}
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-muted">{item.label}</p>
                      <p className="font-medium text-foreground truncate max-w-[220px]">
                        {value.replace(/^https?:\/\/(t\.me\/)?/, "")}
                      </p>
                    </div>
                  </a>
                );
              })}
            </div>
          ) : (
            <div className="panel p-8 lg:pt-12">
              <p className="text-muted">
                Контакты ещё не добавлены. Укажите их в админ-панели.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
