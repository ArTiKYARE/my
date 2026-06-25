"use client";

import Link from "next/link";
import { useState } from "react";

const navItems = [
  { label: "О компании", href: "#about" },
  { label: "Услуги", href: "#services" },
  { label: "Кейсы", href: "#cases" },
  { label: "Контакты", href: "#contacts" },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 border-b border-border backdrop-blur-sm">
      <div className="container-main flex h-16 items-center justify-between px-4 md:px-6">
        <Link
          href="/"
          className="text-lg font-semibold tracking-tight text-foreground"
        >
          Kos-Ko
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-muted hover:text-foreground transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 hover:bg-white/5 transition-colors"
          aria-label="Меню"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {mobileOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-background border-t border-border">
          <nav className="container-main flex flex-col py-4 px-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="py-3 text-muted hover:text-foreground transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
