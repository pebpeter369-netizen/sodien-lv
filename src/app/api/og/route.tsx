import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

const LATVIAN_MONTHS = [
  "janvāris", "februāris", "marts", "aprīlis", "maijs", "jūnijs",
  "jūlijs", "augusts", "septembris", "oktobris", "novembris", "decembris",
];

function getTitleFontSize(title: string): number {
  if (title.length > 80) return 34;
  if (title.length > 60) return 38;
  if (title.length > 40) return 44;
  return 56;
}

function formatLatvianDate(dateStr?: string): string {
  const d = dateStr ? new Date(dateStr) : new Date();
  return `${d.getDate()}. ${LATVIAN_MONTHS[d.getMonth()]}`;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get("title") || "TavaDiena.lv";
  const subtitle = searchParams.get("subtitle") || "Aktuālā informācija Latvijā";
  const topic = searchParams.get("topic");
  const type = searchParams.get("type") || "article";
  const date = searchParams.get("date") || undefined;

  // Decorative corner dots
  const dotStyle = {
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: "rgba(214, 158, 46, 0.15)",
  };

  const cornerDots = (
    <div style={{ display: "flex", position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}>
      {/* Top-left dots */}
      {[0, 1, 2].map((row) =>
        [0, 1, 2].map((col) => (
          <div
            key={`tl-${row}-${col}`}
            style={{
              ...dotStyle,
              position: "absolute",
              top: 30 + row * 16,
              left: 30 + col * 16,
            }}
          />
        ))
      )}
      {/* Bottom-right dots */}
      {[0, 1, 2].map((row) =>
        [0, 1, 2].map((col) => (
          <div
            key={`br-${row}-${col}`}
            style={{
              ...dotStyle,
              position: "absolute",
              bottom: 30 + row * 16,
              right: 30 + col * 16,
            }}
          />
        ))
      )}
    </div>
  );

  // Amber top strip
  const topStrip = (
    <div
      style={{
        display: "flex",
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 4,
        background: "linear-gradient(90deg, #d69e2e, #ecc94b, #d69e2e)",
      }}
    />
  );

  // Branding footer
  const branding = (
    <div
      style={{
        display: "flex",
        position: "absolute",
        bottom: 30,
        color: "rgba(255,255,255,0.5)",
        fontSize: 18,
        letterSpacing: 2,
      }}
    >
      ŠODIEN.LV
    </div>
  );

  if (type === "name-day") {
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
            background: "linear-gradient(135deg, #1a365d 0%, #0f2340 50%, #1a2a4a 100%)",
            position: "relative",
          }}
        >
          {topStrip}
          {cornerDots}
          {/* Radial glow */}
          <div
            style={{
              display: "flex",
              position: "absolute",
              top: "30%",
              left: "50%",
              width: 400,
              height: 400,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(214,158,46,0.08) 0%, transparent 70%)",
              transform: "translateX(-50%)",
            }}
          />
          <div
            style={{
              display: "flex",
              color: "#d69e2e",
              fontSize: 18,
              textTransform: "uppercase" as const,
              letterSpacing: 4,
              marginBottom: 12,
            }}
          >
            Vārda diena
          </div>
          <div
            style={{
              display: "flex",
              color: "white",
              fontSize: getTitleFontSize(title),
              fontWeight: 700,
              textAlign: "center",
              lineHeight: 1.2,
              maxWidth: 900,
            }}
          >
            {title}
          </div>
          <div
            style={{
              display: "flex",
              color: "#ecc94b",
              fontSize: 24,
              marginTop: 16,
            }}
          >
            {subtitle || formatLatvianDate(date)}
          </div>
          {branding}
        </div>
      ),
      { width: 1200, height: 630 }
    );
  }

  if (type === "holiday") {
    const dateDisplay = date ? formatLatvianDate(date) : "";
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
            background: "linear-gradient(135deg, #1a365d 0%, #0f2340 100%)",
            position: "relative",
          }}
        >
          {topStrip}
          {cornerDots}
          {dateDisplay && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                width: 100,
                height: 100,
                border: "2px solid rgba(214,158,46,0.4)",
                borderRadius: 12,
                marginBottom: 24,
              }}
            >
              <div style={{ display: "flex", color: "#ecc94b", fontSize: 36, fontWeight: 700 }}>
                {dateDisplay.split(".")[0]}
              </div>
              <div style={{ display: "flex", color: "rgba(255,255,255,0.6)", fontSize: 14, textTransform: "uppercase" as const }}>
                {LATVIAN_MONTHS[date ? new Date(date).getMonth() : new Date().getMonth()]?.substring(0, 3)}
              </div>
            </div>
          )}
          <div
            style={{
              display: "flex",
              color: "white",
              fontSize: getTitleFontSize(title),
              fontWeight: 700,
              textAlign: "center",
              lineHeight: 1.2,
              maxWidth: 900,
            }}
          >
            {title}
          </div>
          {subtitle && subtitle !== "Aktuālā informācija Latvijā" && (
            <div
              style={{
                display: "flex",
                color: "rgba(255,255,255,0.7)",
                fontSize: 22,
                marginTop: 16,
                textAlign: "center",
              }}
            >
              {subtitle}
            </div>
          )}
          {branding}
        </div>
      ),
      { width: 1200, height: 630 }
    );
  }

  // Default: article type
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
          background: "linear-gradient(135deg, #1a365d 0%, #0f2340 100%)",
          padding: 60,
          position: "relative",
        }}
      >
        {topStrip}
        {cornerDots}
        {topic && (
          <div
            style={{
              display: "flex",
              background: "rgba(214, 158, 46, 0.2)",
              color: "#ecc94b",
              padding: "6px 16px",
              borderRadius: 9999,
              fontSize: 18,
              marginBottom: 20,
              textTransform: "uppercase" as const,
              letterSpacing: 1,
            }}
          >
            {topic}
          </div>
        )}
        <div
          style={{
            display: "flex",
            color: "white",
            fontSize: getTitleFontSize(title),
            fontWeight: 700,
            textAlign: "center",
            lineHeight: 1.2,
            maxWidth: 900,
          }}
        >
          {title}
        </div>
        <div
          style={{
            display: "flex",
            color: "#d69e2e",
            fontSize: 22,
            marginTop: 20,
            textAlign: "center",
          }}
        >
          {subtitle}
        </div>
        {branding}
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
