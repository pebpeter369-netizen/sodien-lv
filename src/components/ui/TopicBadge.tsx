import { TOPIC_LABELS, type ArticleTopic } from "@/types";

const TOPIC_COLORS: Record<ArticleTopic, string> = {
  politics: "bg-red-100 text-red-800",
  economy: "bg-green-100 text-green-800",
  sports: "bg-blue-100 text-blue-800",
  culture: "bg-purple-100 text-purple-800",
  technology: "bg-cyan-100 text-cyan-800",
  society: "bg-orange-100 text-orange-800",
  eu: "bg-indigo-100 text-indigo-800",
  environment: "bg-emerald-100 text-emerald-800",
};

interface TopicBadgeProps {
  topic: ArticleTopic;
  className?: string;
  variant?: "default" | "light";
}

export function TopicBadge({ topic, className = "", variant = "default" }: TopicBadgeProps) {
  const colors =
    variant === "light"
      ? "bg-white/20 text-white backdrop-blur-sm"
      : TOPIC_COLORS[topic];

  return (
    <span
      className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${colors} ${className}`}
    >
      {TOPIC_LABELS[topic]}
    </span>
  );
}
