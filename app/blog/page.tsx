import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getPosts } from "../lib/data";
import { formatDate } from "../lib/utils";

export const metadata: Metadata = {
  title: "Блог — Kos-Ko",
  description: "Полезные материалы о разработке сайтов, веб-приложениях, дизайне и продвижении от студии Kos-Ko.",
};

export const dynamic = "force-dynamic";

export default async function BlogPage() {
  const posts = await getPosts();

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 border-b border-border backdrop-blur-sm">
        <div className="container-main flex h-16 items-center justify-between px-4 md:px-6">
          <Link href="/" className="text-lg font-semibold text-foreground">
            Kos-Ko
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm">
            <Link href="/about" className="text-muted hover:text-foreground transition-colors">
              О студии
            </Link>
            <Link href="/#services" className="text-muted hover:text-foreground transition-colors">
              Услуги
            </Link>
            <Link href="/#cases" className="text-muted hover:text-foreground transition-colors">
              Кейсы
            </Link>
            <Link href="/blog" className="text-foreground">
              Блог
            </Link>
            <Link href="/#contacts" className="text-muted hover:text-foreground transition-colors">
              Контакты
            </Link>
          </nav>
        </div>
      </header>

      <section className="section-hero">
        <div className="container-main px-4 md:px-6">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-sm uppercase tracking-widest text-muted mb-4">Блог</p>
            <h1 className="text-4xl md:text-5xl font-semibold leading-tight mb-6">
              Полезные материалы
            </h1>
            <p className="text-lg text-muted">
              Идеи, инструменты и опыт веб-разработки и дизайна.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="container-main px-4 md:px-6">
          {posts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post) => (
                <article
                  key={post.id}
                  className="group panel card-hover overflow-hidden"
                >
                  <Link href={`/blog/${post.slug}`} className="block">
                    <div className="relative aspect-video overflow-hidden border-b border-border bg-surface-elevated">
                      {post.cover ? (
                        <Image
                          src={post.cover}
                          alt={post.title}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted text-sm">
                          Без обложки
                        </div>
                      )}
                    </div>
                    <div className="p-6">
                      <div className="flex flex-wrap gap-2 mb-3">
                        {post.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-1 text-xs bg-surface-elevated text-muted border border-border"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      <time className="text-xs text-muted uppercase tracking-wider">
                        {formatDate(post.publishedAt)}
                      </time>
                      <h2 className="text-xl font-semibold mt-2 mb-3 group-hover:text-foreground/80 transition-colors">
                        {post.title}
                      </h2>
                      <p className="text-sm text-muted line-clamp-3">
                        {post.excerpt}
                      </p>
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-muted">Публикации пока не добавлены.</p>
              <Link
                href="/"
                className="inline-flex mt-6 px-6 py-3 text-sm font-medium btn-secondary"
              >
                Вернуться на главную
              </Link>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
