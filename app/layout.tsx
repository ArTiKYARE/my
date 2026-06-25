import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import JsonLd from "./components/JsonLd";
import YandexMetrika from "./components/YandexMetrika";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const title = "Kos-Ko — Разработка сайтов и веб-приложений";
const description =
  "Kos-Ko — веб-студия, которая проектирует и разрабатывает современные сайты, лендинги и веб-приложения для бизнеса.";

export const metadata: Metadata = {
  metadataBase: new URL("https://kos-ko.ru"),
  title,
  description,
  keywords: [
    "веб-студия",
    "разработка сайтов",
    "веб-приложения",
    "дизайн",
    "лендинг",
    "корпоративный сайт",
    "Kos-Ko",
  ],
  authors: [{ name: "Kos-Ko" }],
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
  },
  openGraph: {
    title,
    description,
    url: "/",
    siteName: "Kos-Ko",
    locale: "ru_RU",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Kos-Ko — веб-студия",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ru"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <JsonLd />
        {children}
        <YandexMetrika />
      </body>
    </html>
  );
}
