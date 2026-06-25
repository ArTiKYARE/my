import Link from "next/link";

export const metadata = {
  title: "Политика конфиденциальности — Kos-Ko",
  description: "Политика обработки персональных данных сайта Kos-Ko.",
};

export default function PrivacyPage() {
  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 border-b border-border backdrop-blur-md">
        <div className="container-main flex h-[4.5rem] items-center justify-between px-4 md:px-6">
          <Link href="/" className="text-lg font-semibold tracking-tight text-foreground">
            Kos-Ko
          </Link>
          <Link href="/" className="text-sm text-muted hover:text-foreground transition-colors">
            ← На главную
          </Link>
        </div>
      </header>

      <main className="flex-1 pt-32 pb-20">
        <div className="container-main max-w-3xl px-4 md:px-6">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mb-6">
            Политика конфиденциальности
          </h1>

          <div className="space-y-6 text-muted leading-relaxed">
            <p>
              Настоящая Политика конфиденциальности персональных данных действует в
              отношении всей информации, которую веб-студия Kos-Ko может получить о
              пользователе во время использования сайта.
            </p>

            <h2 className="text-xl font-semibold text-foreground">1. Обрабатываемые данные</h2>
            <p>
              При отправке формы обратной связи мы можем получить: имя, адрес электронной
              почты или номер телефона, а также описание проекта. Эти данные используются
              исключительно для связи с вами и подготовки коммерческого предложения.
            </p>

            <h2 className="text-xl font-semibold text-foreground">2. Цели обработки</h2>
            <p>
              Персональные данные обрабатываются для консультации по проекту, подготовки
              предложения и дальнейшей коммуникации в рамках оказания услуг.
            </p>

            <h2 className="text-xl font-semibold text-foreground">3. Хранение и защита</h2>
            <p>
              Данные хранятся на защищённом сервере, доступ к которому ограничен. Мы не
              передаём персональные данные третьим лицам без согласия пользователя, за
              исключением случаев, предусмотренных законодательством РФ.
            </p>

            <h2 className="text-xl font-semibold text-foreground">4. Контакты</h2>
            <p>
              По вопросам, связанным с обработкой персональных данных, вы можете связаться с
              нами по email: hello@kos-ko.ru.
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
