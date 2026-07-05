import Link from "next/link";

interface NameLinkListProps {
  names: string[];
  className?: string;
}

/**
 * Renders a list of name-day names as rounded chips linking to each name page.
 * Server component — mirrors the co-celebrant chips on the single-name page.
 */
export function NameLinkList({ names, className }: NameLinkListProps) {
  return (
    <div className={`flex flex-wrap gap-2${className ? ` ${className}` : ""}`}>
      {names.map((name) => (
        <Link
          key={name}
          href={`/varda-dienas/${name.toLowerCase()}`}
          className="px-3 py-1.5 bg-bg-secondary rounded-full text-sm font-medium text-primary hover:bg-bg-tertiary transition-colors"
        >
          {name}
        </Link>
      ))}
    </div>
  );
}
