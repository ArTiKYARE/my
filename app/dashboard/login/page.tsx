interface AdminLoginPageProps {
  searchParams: Promise<{ error?: string }>;
}

const errorMessages: Record<string, string> = {
  invalid: "Неверный логин или пароль",
  totp: "Неверный код двухфакторной аутентификации",
  blocked:
    "Слишком много попыток входа. Попробуйте позже.",
};

export default async function AdminLoginPage({
  searchParams,
}: AdminLoginPageProps) {
  const { error } = await searchParams;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md panel p-8 md:p-10">
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-semibold mb-2 text-foreground">
            Kos-Ko
          </h1>
          <p className="text-muted text-sm">Вход в админ-панель</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
            {errorMessages[error] || "Ошибка входа"}
          </div>
        )}

        <form action="/api/login" method="POST" className="space-y-5">
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-foreground mb-2"
            >
              Логин
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required
              autoFocus
              className="input-field"
              placeholder="admin"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-foreground mb-2"
            >
              Пароль
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="input-field"
              placeholder="••••••••"
            />
          </div>
          <div>
            <label
              htmlFor="totp"
              className="block text-sm font-medium text-foreground mb-2"
            >
              Код 2FA
              <span className="text-muted font-normal ml-1">(если настроен)</span>
            </label>
            <input
              id="totp"
              name="totp"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              className="input-field"
              placeholder="000000"
            />
          </div>
          <button
            type="submit"
            className="w-full btn-primary py-3 text-sm font-medium"
          >
            Войти
          </button>
        </form>

        <div className="mt-6 text-center">
          <a
            href="/"
            className="text-sm text-muted hover:text-foreground transition-colors"
          >
            ← Вернуться на сайт
          </a>
        </div>
      </div>
    </div>
  );
}
