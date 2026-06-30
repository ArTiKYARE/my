import Link from "next/link";

interface FooterProps {
  name: string;
}

const navLinks = [
  { label: "О студии", href: "/about" },
  { label: "Услуги", href: "/#services" },
  { label: "Кейсы", href: "/#cases" },
  { label: "Блог", href: "/blog" },
  { label: "Контакты", href: "/#contacts" },
];

const legalLinks = [
  { label: "Политика конфиденциальности", href: "/privacy" },
];

export default function Footer({ name }: FooterProps) {
  return (
    <footer className="py-10 bg-background border-t border-border">
      <div className="container-main px-4 md:px-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8 mb-8">
          <div>
            <Link href="/" className="text-lg font-semibold tracking-tight text-foreground">
              {name}
            </Link>
            <p className="mt-2 text-sm text-muted max-w-xs">
              Веб-студия полного цикла: от прототипа и дизайна до разработки и поддержки.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-3">
                Навигация
              </p>
              <ul className="space-y-2">
                {navLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-3">
                Юридическая информация
              </p>
              <ul className="space-y-2">
                {legalLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-border flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <p className="text-sm text-muted">
            © {new Date().getFullYear()} {name}. Все права защищены.
          </p>
          <p className="text-sm text-muted">
            ИП Ковалёв Денис Анатольевич
          </p>
        </div>
      </div>
    </footer>
  );
}
