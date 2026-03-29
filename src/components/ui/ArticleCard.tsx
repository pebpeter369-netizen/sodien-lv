import Link from "next/link";
import Image from "next/image";
import { TopicBadge } from "./TopicBadge";
import { timeAgo } from "@/lib/dates";
import type { ArticleTopic } from "@/types";

// Topic fallback gradients when no image
const TOPIC_GRADIENTS: Record<string, string> = {
  politics: "from-blue-900 to-blue-700",
  economy: "from-emerald-900 to-emerald-700",
  sports: "from-orange-800 to-orange-600",
  culture: "from-purple-900 to-purple-700",
  technology: "from-cyan-900 to-cyan-700",
  society: "from-rose-900 to-rose-700",
  eu: "from-indigo-900 to-indigo-700",
  environment: "from-green-900 to-green-700",
};

interface ArticleCardProps {
  slug: string;
  title: string;
  excerpt: string;
  topic: ArticleTopic;
  publishedAt: Date | null;
  readingTime?: string;
  sourceCount?: number;
  thumbnailUrl?: string | null;
}

export function ArticleCard({
  slug,
  title,
  excerpt,
  topic,
  publishedAt,
  readingTime,
  sourceCount,
  thumbnailUrl,
}: ArticleCardProps) {
  const gradient = TOPIC_GRADIENTS[topic] || "from-gray-900 to-gray-700";

  return (
    <article className="group border border-border rounded-lg overflow-hidden hover:shadow-md transition-shadow bg-white">
      <Link href={`/aktualitates/${slug}`} className="block">
        {/* Image / Gradient fallback */}
        <div className="relative aspect-[16/9] overflow-hidden">
          {thumbnailUrl ? (
            <Image
              src={thumbnailUrl}
              alt={title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div
              className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}
            >
              <TopicBadge topic={topic} variant="light" />
            </div>
          )}
        </div>

        <div className="p-4">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <TopicBadge topic={topic} />
            {publishedAt && (
              <span className="text-xs text-text-muted">
                {timeAgo(publishedAt)}
              </span>
            )}
            {readingTime && (
              <span className="text-xs text-text-muted">· {readingTime}</span>
            )}
            {sourceCount !== undefined && sourceCount > 0 && (
              <span className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">
                {sourceCount} avoti
              </span>
            )}
          </div>
          <h3
            className="font-heading text-lg font-semibold text-text group-hover:text-primary transition-colors mb-2 line-clamp-2"
            style={{ viewTransitionName: `article-title-${slug}` }}
          >
            {title}
          </h3>
          <p className="text-sm text-text-secondary line-clamp-2">{excerpt}</p>
        </div>
      </Link>
    </article>
  );
}
