"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { EmailThread } from "../lib/types";

const templates: Record<string, { subject: string; body: string }> = {
  intro: {
    subject: "Предложение по разработке сайта",
    body: `Здравствуйте, {{name}}!

Меня зовут Денис, я представляю веб-студию Kos-Ko. Мы специализируемся на создании современных сайтов и веб-приложений для бизнеса.

Хотел бы предложить обсудить, как можно улучшить ваше присутствие в интернете и увеличить количество заявок.

Буду рад созвониться в удобное для вас время.`,
  },
  proposal: {
    subject: "Коммерческое предложение",
    body: `Здравствуйте, {{name}}!

Благодарим за интерес к Kos-Ko. Подготовили для вас примерное решение и сроки.

Давайте созвонимся, чтобы обсудить детали и ответить на ваши вопросы.`,
  },
  reminder: {
    subject: "Напоминание",
    body: `Здравствуйте, {{name}}!

Хотел уточнить, получили ли вы моё предыдущее письмо?

Буду рад вашей обратной связи.`,
  },
  thanks: {
    subject: "Спасибо за доверие",
    body: `Здравствуйте, {{name}}!

Спасибо, что выбрали Kos-Ko. Мы уже начали работу над вашим проектом и скоро свяжемся с промежуточными результатами.

Если возникнут вопросы — пишите в ответ на это письмо.`,
  },
};

function formatDate(date: string) {
  return new Date(date).toLocaleString("ru-RU", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminMail() {
  const [threads, setThreads] = useState<EmailThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [selectedThread, setSelectedThread] = useState<EmailThread | null>(null);
  const [state, setState] = useState<{ error?: string; success?: string }>({});
  const [templateKey, setTemplateKey] = useState("");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastReplyCountRef = useRef(0);
  const audioUnlockedRef = useRef(false);

  const repliedCount = threads.filter((t) => t.status === "replied").length;

  useEffect(() => {
    audioRef.current = new Audio("/sounds/notification.mp3");
    const unlock = () => {
      audioUnlockedRef.current = true;
      if (audioRef.current) {
        audioRef.current.play().catch(() => {});
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      window.removeEventListener("click", unlock);
      window.removeEventListener("keydown", unlock);
    };
    window.addEventListener("click", unlock);
    window.addEventListener("keydown", unlock);
    return () => {
      window.removeEventListener("click", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  async function loadThreads() {
    try {
      const res = await fetch("/api/emails");
      const data = await res.json();
      if (data.threads) {
        setThreads(data.threads);
      }
    } catch {
      setState({ error: "Не удалось загрузить переписки" });
    } finally {
      setLoading(false);
    }
  }

  async function checkReplies(manual = false) {
    if (checking && !manual) return;
    setChecking(true);
    try {
      const res = await fetch("/api/emails/check");
      const data = await res.json();
      if (data.success && data.newReplies > 0) {
        await loadThreads();
        if (audioRef.current && audioUnlockedRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current.play().catch(() => {});
        }
        if (manual) {
          setState({ success: `Новых ответов: ${data.newReplies}` });
        }
      }
    } catch {
      if (manual) setState({ error: "Ошибка проверки почты" });
    } finally {
      setChecking(false);
    }
  }

  useEffect(() => {
    loadThreads();
    const interval = setInterval(() => checkReplies(false), 30000);
    return () => clearInterval(interval);
  }, []);

  // Play sound when replied threads count increases
  useEffect(() => {
    if (lastReplyCountRef.current > 0 && repliedCount > lastReplyCountRef.current) {
      if (audioRef.current && audioUnlockedRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      }
    }
    lastReplyCountRef.current = repliedCount;
  }, [repliedCount]);

  function applyTemplate(key: string) {
    setTemplateKey(key);
    const tpl = templates[key];
    if (!tpl) return;
    const nameInput = document.getElementById("mail-toName") as HTMLInputElement;
    const name = nameInput?.value.trim() || "";
    const subject = tpl.subject;
    const body = tpl.body.replace(/\{\{name\}\}/g, name || "клиент");
    const subjectEl = document.getElementById("mail-subject") as HTMLInputElement;
    const bodyEl = document.getElementById("mail-body") as HTMLTextAreaElement;
    if (subjectEl) subjectEl.value = subject;
    if (bodyEl) bodyEl.value = body;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSending(true);
    setState({});

    const formData = new FormData(e.currentTarget);
    const payload = {
      to: String(formData.get("to") || "").trim(),
      toName: String(formData.get("toName") || "").trim(),
      subject: String(formData.get("subject") || "").trim(),
      body: String(formData.get("body") || "").trim(),
      threadId: String(formData.get("threadId") || "").trim() || undefined,
    };

    try {
      const res = await fetch("/api/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setState({ error: data.error || "Ошибка отправки" });
      } else {
        setState({ success: "Письмо отправлено" });
        e.currentTarget.reset();
        setTemplateKey("");
        await loadThreads();
      }
    } catch {
      setState({ error: "Не удалось отправить письмо" });
    } finally {
      setSending(false);
    }
  }

  async function closeThread(id: string) {
    try {
      const res = await fetch("/api/emails/close", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) await loadThreads();
    } catch {
      // ignore
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">Рассылка клиентам</h2>
          <p className="text-sm text-muted">
            Отправляйте профессиональные письма и получайте ответы прямо в админке
          </p>
        </div>
        <button
          onClick={() => checkReplies(true)}
          disabled={checking}
          className="px-4 py-2 text-sm font-medium bg-surface-elevated border border-border hover:bg-white/5 transition-colors disabled:opacity-50"
        >
          {checking ? "Проверка..." : "Проверить почту"}
        </button>
      </div>

      {state.error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {state.error}
        </div>
      )}
      {state.success && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
          {state.success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Compose form */}
        <section className="panel p-6 md:p-8">
          <h3 className="text-xl font-semibold mb-6">Новое письмо</h3>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Шаблон
              </label>
              <select
                value={templateKey}
                onChange={(e) => applyTemplate(e.target.value)}
                className="input-field"
              >
                <option value="">— выберите шаблон —</option>
                <option value="intro">Первое знакомство</option>
                <option value="proposal">Коммерческое предложение</option>
                <option value="reminder">Напоминание</option>
                <option value="thanks">Благодарность</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Email получателя
                </label>
                <input
                  name="to"
                  type="email"
                  required
                  className="input-field"
                  placeholder="client@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Имя получателя
                </label>
                <input
                  id="mail-toName"
                  name="toName"
                  type="text"
                  className="input-field"
                  placeholder="Иван"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Тема
              </label>
              <input
                id="mail-subject"
                name="subject"
                type="text"
                required
                className="input-field"
                placeholder="Тема письма"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Текст письма
              </label>
              <textarea
                id="mail-body"
                name="body"
                rows={10}
                required
                className="input-field resize-none"
                placeholder="Текст письма..."
              />
            </div>

            <input type="hidden" name="threadId" id="mail-threadId" />

            <button
              type="submit"
              disabled={sending}
              className="btn-primary px-8 py-3 text-sm font-medium disabled:opacity-50"
            >
              {sending ? "Отправка..." : "Отправить письмо"}
            </button>
          </form>
        </section>

        {/* Threads list */}
        <section className="panel p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold">
              Переписки
              {repliedCount > 0 && (
                <span className="ml-3 inline-flex items-center justify-center px-2.5 py-0.5 text-xs font-medium bg-primary text-white rounded-full">
                  {repliedCount}
                </span>
              )}
            </h3>
          </div>

          {loading ? (
            <p className="text-muted">Загрузка...</p>
          ) : threads.length === 0 ? (
            <p className="text-muted">Пока нет переписок.</p>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
              {threads.map((thread) => (
                <div
                  key={thread.id}
                  onClick={() => setSelectedThread(thread)}
                  className={`p-4 border cursor-pointer transition-colors ${
                    thread.status === "replied"
                      ? "border-primary/40 bg-primary/5"
                      : "border-border bg-surface-elevated hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-medium truncate">
                        {thread.toName ? `${thread.toName} · ` : ""}
                        {thread.to}
                      </p>
                      <p className="text-sm text-muted truncate">
                        {thread.subject}
                      </p>
                    </div>
                    <span
                      className={`flex-shrink-0 text-xs px-2 py-1 border ${
                        thread.status === "replied"
                          ? "border-primary text-primary"
                          : thread.status === "closed"
                          ? "border-muted text-muted"
                          : "border-emerald-500/40 text-emerald-400"
                      }`}
                    >
                      {thread.status === "replied"
                        ? "Ответ"
                        : thread.status === "closed"
                        ? "Закрыто"
                        : "Отправлено"}
                    </span>
                  </div>
                  <p className="text-xs text-muted mt-2">
                    {formatDate(thread.updatedAt)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Thread detail modal */}
      {selectedThread && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
          onClick={() => setSelectedThread(null)}
        >
          <div
            className="relative w-full max-w-2xl panel p-6 md:p-8 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedThread(null)}
              className="absolute top-4 right-4 p-2 text-muted hover:text-foreground transition-colors"
              aria-label="Закрыть"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h3 className="text-xl font-semibold mb-1">{selectedThread.subject}</h3>
            <p className="text-sm text-muted mb-6">
              {selectedThread.toName ? `${selectedThread.toName} · ` : ""}
              {selectedThread.to}
            </p>

            <div className="space-y-4">
              {selectedThread.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-4 border ${
                    msg.from === "me"
                      ? "border-border bg-surface-elevated ml-8"
                      : "border-primary/30 bg-primary/5 mr-8"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-muted uppercase">
                      {msg.from === "me" ? "Вы" : "Клиент"}
                    </span>
                    <span className="text-xs text-muted">{formatDate(msg.createdAt)}</span>
                  </div>
                  <div className="text-sm text-foreground whitespace-pre-wrap">
                    {msg.body}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-border flex gap-3">
              <button
                onClick={() => {
                  const nameInput = document.getElementById("mail-toName") as HTMLInputElement;
                  const toInput = document.querySelector('input[name="to"]') as HTMLInputElement;
                  const subjectInput = document.getElementById("mail-subject") as HTMLInputElement;
                  const bodyInput = document.getElementById("mail-body") as HTMLTextAreaElement;
                  const threadIdInput = document.getElementById("mail-threadId") as HTMLInputElement;
                  if (toInput) toInput.value = selectedThread.to;
                  if (nameInput) nameInput.value = selectedThread.toName || "";
                  if (subjectInput) subjectInput.value = `Re: ${selectedThread.subject}`;
                  if (bodyInput) bodyInput.value = "";
                  if (threadIdInput) threadIdInput.value = selectedThread.id;
                  setSelectedThread(null);
                  setTemplateKey("");
                }}
                className="btn-primary px-6 py-2.5 text-sm font-medium"
              >
                Ответить
              </button>
              {selectedThread.status !== "closed" && (
                <button
                  onClick={() => {
                    closeThread(selectedThread.id);
                    setSelectedThread(null);
                  }}
                  className="px-6 py-2.5 text-sm font-medium border border-border hover:bg-white/5 transition-colors"
                >
                  Закрыть диалог
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
