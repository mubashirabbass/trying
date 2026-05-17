import { db, successStoriesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

async function main() {
  const stories = await db.select().from(successStoriesTable).where(eq(successStoriesTable.id, 7));
  console.log("STORY 7 IN DB:", stories[0]);
}

main().catch(console.error);
