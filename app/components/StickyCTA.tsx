"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function StickyCTA() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function handleScroll() {
      // Показываем после прокрутки ниже Hero (примерно 80% высоты viewport)
      setVisible(window.scrollY > window.innerHeight * 0.8);
    }

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!visible) return null;

  return (
    <>
      {/* Мобильная плашка снизу */}
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-background/95 border-t border-border backdrop-blur-md px-4 py-3">
        <Link
          href="/#contacts"
          className="btn-primary block w-full py-3 text-sm font-medium text-center"
        >
          Обсудить проект
        </Link>
      </div>

      {/* Десктопная плавающая кнопка */}
      <div className="fixed bottom-6 right-6 z-40 hidden md:block">
        <Link
          href="/#contacts"
          className="btn-primary px-6 py-3 text-sm font-medium shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-shadow"
        >
          Обсудить проект
        </Link>
      </div>
    </>
  );
}
