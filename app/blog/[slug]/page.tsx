import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPostBySlug } from "../../lib/data";
import { formatDate } from "../../lib/utils";
import Markdown from "../../components/Markdown";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return {
      title: "Не найдено — Kos-Ko",
    };
  }

  return {
    title: `${post.title} — Kos-Ko`,
    description: post.excerpt,
    openGraph: post.cover
      ? {
          title: post.title,
          description: post.excerpt,
          images: [{ url: post.cover }],
        }
      : undefined,
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

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

      <article className="py-16 md:py-24">
        <div className="container-main px-4 md:px-6">
          <div className="max-w-3xl mx-auto">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors mb-8"
            >
              ← Назад к блогу
            </Link>

            <header className="mb-10">
              <div className="flex flex-wrap gap-2 mb-4">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 text-xs bg-surface-elevated text-muted border border-border"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <time className="text-sm text-muted uppercase tracking-wider">
                {formatDate(post.publishedAt)}
              </time>
              <h1 className="text-3xl md:text-5xl font-semibold leading-tight mt-3 mb-6">
                {post.title}
              </h1>
              <p className="text-lg text-muted">{post.excerpt}</p>
            </header>

            {post.cover && (
              <div className="relative aspect-video overflow-hidden border border-border mb-12 bg-surface-elevated">
                <Image
                  src={post.cover}
                  alt={post.title}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            )}

            <div className="text-lg text-muted leading-relaxed">
              <Markdown content={post.content} />
            </div>
          </div>
        </div>
      </article>
    </main>
  );
}
