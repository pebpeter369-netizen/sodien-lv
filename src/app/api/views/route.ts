import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { articles } from "@/lib/schema";
import { eq, sql } from "drizzle-orm";

const BOT_UA = /bot|crawl|spider|slurp|bingpreview/i;

export async function POST(request: NextRequest) {
  try {
    const userAgent = request.headers.get("user-agent") || "";
    if (!BOT_UA.test(userAgent)) {
      const body = await request.json();
      const slug = typeof body?.slug === "string" ? body.slug.trim() : "";
      if (slug) {
        const db = getDb();
        await db
          .update(articles)
          .set({ views: sql`coalesce(${articles.views}, 0) + 1` })
          .where(eq(articles.slug, slug));
      }
    }
  } catch (error) {
    console.error("View count error:", error);
  }
  return new Response(null, { status: 204 });
}
