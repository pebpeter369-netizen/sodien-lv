import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "../lib/schema";
import holidaysData from "../data/holidays.json";
import path from "path";

const DB_PATH = path.join(process.cwd(), "data", "sodien.db");
const sqlite = new Database(DB_PATH);
const db = drizzle(sqlite, { schema });

async function main() {
  console.log("Seeding holidays...");

  // Clear existing data
  db.delete(schema.holidays).run();

  let count = 0;
  for (const holiday of holidaysData as {
    slug: string;
    name: string;
    dateMonth: number | null;
    dateDay: number | null;
    dateRule: string | null;
    isPublicHoliday: number;
    description: string;
    traditions: string | null;
    yearDates: Record<string, string> | null;
  }[]) {
    db.insert(schema.holidays)
      .values({
        slug: holiday.slug,
        name: holiday.name,
        dateMonth: holiday.dateMonth,
        dateDay: holiday.dateDay,
        dateRule: holiday.dateRule,
        isPublicHoliday: holiday.isPublicHoliday,
        description: holiday.description,
        traditions: holiday.traditions,
        yearDates: holiday.yearDates
          ? JSON.stringify(holiday.yearDates)
          : null,
      })
      .run();
    count++;
  }

  console.log(`Seeded ${count} holidays.`);
  sqlite.close();
}

main().catch(console.error);
