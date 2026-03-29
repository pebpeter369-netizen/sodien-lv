interface AdSlotProps {
  position:
    | "header-leaderboard"
    | "sidebar-rectangle"
    | "in-article"
    | "footer-leaderboard";
}

const DIMENSIONS: Record<string, { desktop: string; mobile: string }> = {
  "header-leaderboard": { desktop: "728px × 90px", mobile: "320px × 50px" },
  "sidebar-rectangle": { desktop: "300px × 250px", mobile: "300px × 250px" },
  "in-article": { desktop: "Responsīvs", mobile: "Responsīvs" },
  "footer-leaderboard": { desktop: "728px × 90px", mobile: "320px × 50px" },
};

export function AdSlot({ position }: AdSlotProps) {
  const dims = DIMENSIONS[position];

  return (
    <div className="flex items-center justify-center my-4">
      <div
        className="border-2 border-dashed border-border rounded-lg flex items-center justify-center text-text-muted text-xs bg-bg-secondary"
        style={{
          minHeight:
            position === "sidebar-rectangle"
              ? "250px"
              : position === "in-article"
                ? "100px"
                : "90px",
          width: "100%",
          maxWidth:
            position === "sidebar-rectangle"
              ? "300px"
              : position === "in-article"
                ? "100%"
                : "728px",
        }}
      >
        <span className="opacity-50">Reklāma — {dims.desktop}</span>
      </div>
    </div>
  );
}
