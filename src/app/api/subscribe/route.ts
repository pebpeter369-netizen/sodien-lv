import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { subscribers } from "@/lib/schema";
import { eq, and, gte } from "drizzle-orm";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = body.email?.trim().toLowerCase();

    if (!email || !EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { error: "Lūdzu ievadi derīgu e-pasta adresi." },
        { status: 400 }
      );
    }

    const db = getDb();

    // Check for existing subscriber
    const existing = await db
      .select()
      .from(subscribers)
      .where(eq(subscribers.email, email))
      .limit(1);

    if (existing.length > 0) {
      const sub = existing[0];

      if (sub.status === "active") {
        // Rate limit: if subscribed in last 60 seconds, reject
        const sixtySecondsAgo = new Date(Date.now() - 60_000);
        if (sub.subscribedAt && sub.subscribedAt > sixtySecondsAgo) {
          return NextResponse.json(
            { error: "Lūdzu uzgaidi pirms atkārtotas pieteikšanās." },
            { status: 429 }
          );
        }
        return NextResponse.json({ success: true, message: "already_subscribed" });
      }

      // Reactivate unsubscribed user
      await db
        .update(subscribers)
        .set({
          status: "active",
          subscribedAt: new Date(),
          unsubscribedAt: null,
        })
        .where(eq(subscribers.id, sub.id));

      return NextResponse.json({ success: true, message: "reactivated" });
    }

    // New subscriber
    await db.insert(subscribers).values({ email });

    return NextResponse.json({ success: true, message: "subscribed" });
  } catch (error) {
    console.error("Subscribe error:", error);
    return NextResponse.json(
      { error: "Kaut kas nogāja greizi. Lūdzu mēģini vēlreiz." },
      { status: 500 }
    );
  }
}
