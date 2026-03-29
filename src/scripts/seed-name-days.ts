import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "../lib/schema";
import nameDaysData from "../data/name-days.json";
import path from "path";

const DB_PATH = path.join(process.cwd(), "data", "sodien.db");
const sqlite = new Database(DB_PATH);
const db = drizzle(sqlite, { schema });

async function main() {
  console.log("Seeding name days...");

  // Clear existing data
  db.delete(schema.nameDays).run();

  let count = 0;
  for (const entry of nameDaysData as {
    month: number;
    day: number;
    names: string[];
  }[]) {
    db.insert(schema.nameDays)
      .values({
        dateMonth: entry.month,
        dateDay: entry.day,
        names: JSON.stringify(entry.names),
      })
      .run();
    count++;
  }

  console.log(`Seeded ${count} name day entries.`);

  // Count unique names
  const allNames = new Set(
    (nameDaysData as { names: string[] }[]).flatMap((e) => e.names)
  );
  console.log(`Total unique names: ${allNames.size}`);

  sqlite.close();
}

main().catch(console.error);
