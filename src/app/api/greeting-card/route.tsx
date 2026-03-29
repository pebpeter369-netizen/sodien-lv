import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

const THEMES = {
  classic: {
    bg: "linear-gradient(135deg, #1a365d 0%, #0f2340 100%)",
    accent: "#d69e2e",
    text: "#ffffff",
    subtext: "rgba(255,255,255,0.7)",
  },
  warm: {
    bg: "linear-gradient(135deg, #7c2d12 0%, #b45309 100%)",
    accent: "#fbbf24",
    text: "#ffffff",
    subtext: "rgba(255,255,255,0.8)",
  },
  spring: {
    bg: "linear-gradient(135deg, #065f46 0%, #059669 100%)",
    accent: "#6ee7b7",
    text: "#ffffff",
    subtext: "rgba(255,255,255,0.8)",
  },
  elegant: {
    bg: "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)",
    accent: "#c4b5fd",
    text: "#ffffff",
    subtext: "rgba(255,255,255,0.7)",
  },
  sunset: {
    bg: "linear-gradient(135deg, #831843 0%, #be123c 50%, #f97316 100%)",
    accent: "#fde68a",
    text: "#ffffff",
    subtext: "rgba(255,255,255,0.8)",
  },
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name") || "Draugs";
  const message = searchParams.get("message") || `Daudz laimes vārda dienā, ${name}!`;
  const theme = (searchParams.get("theme") || "classic") as keyof typeof THEMES;
  const from = searchParams.get("from") || "";

  const colors = THEMES[theme] || THEMES.classic;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          background: colors.bg,
          padding: 60,
          position: "relative",
        }}
      >
        {/* Decorative top border */}
        <div
          style={{
            display: "flex",
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 6,
            background: colors.accent,
          }}
        />

        {/* Decorative corner dots */}
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              display: "flex",
              position: "absolute",
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: `${colors.accent}30`,
              top: i < 2 ? 30 : undefined,
              bottom: i >= 2 ? 30 : undefined,
              left: i % 2 === 0 ? 30 : undefined,
              right: i % 2 === 1 ? 30 : undefined,
            }}
          />
        ))}

        {/* "Vārda diena" label */}
        <div
          style={{
            display: "flex",
            color: colors.accent,
            fontSize: 20,
            textTransform: "uppercase" as const,
            letterSpacing: 6,
            marginBottom: 16,
          }}
        >
          Vārda diena
        </div>

        {/* Name */}
        <div
          style={{
            display: "flex",
            color: colors.text,
            fontSize: name.length > 10 ? 64 : 80,
            fontWeight: 700,
            marginBottom: 24,
          }}
        >
          {name}
        </div>

        {/* Message */}
        <div
          style={{
            display: "flex",
            color: colors.subtext,
            fontSize: message.length > 100 ? 22 : 28,
            textAlign: "center",
            lineHeight: 1.5,
            maxWidth: 900,
          }}
        >
          {message}
        </div>

        {/* From */}
        {from && (
          <div
            style={{
              display: "flex",
              color: colors.accent,
              fontSize: 20,
              marginTop: 32,
              fontStyle: "italic",
            }}
          >
            — {from}
          </div>
        )}

        {/* Branding */}
        <div
          style={{
            display: "flex",
            position: "absolute",
            bottom: 24,
            color: `${colors.text}40`,
            fontSize: 14,
            letterSpacing: 2,
          }}
        >
          TAVADIENA.LV
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
