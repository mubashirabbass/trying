import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://neondb_owner:npg_5ueXkUdMx1Aj@ep-morning-mud-an6hqm9i.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require',
});

async function main() {
  try {
    await client.connect();
    console.log("Connected to database!");

    console.log("\n--- Checking all lesson completions ---");
    const allRes = await client.query(`
      SELECT count(*) FROM "lesson_completions";
    `);
    console.log("Total lesson completions:", allRes.rows[0].count);

    console.log("\n--- Checking lesson completions with rating ---");
    const ratedRes = await client.query(`
      SELECT count(*) FROM "lesson_completions" WHERE "feedback_rating" IS NOT NULL;
    `);
    console.log("Total rated completions:", ratedRes.rows[0].count);

    if (parseInt(ratedRes.rows[0].count) > 0) {
      const sample = await client.query(`
        SELECT lc.id, lc.lesson_id, lc.user_id, lc.feedback_rating, lc.feedback_comment, lc.completed_at,
               u.name as student_name, l.title as lesson_title, c.title as course_title, c.teacher_id
        FROM "lesson_completions" lc
        LEFT JOIN "lessons" l ON lc.lesson_id = l.id
        LEFT JOIN "courses" c ON l.course_id = c.id
        LEFT JOIN "users" u ON lc.user_id = u.id
        WHERE lc.feedback_rating IS NOT NULL
        LIMIT 5;
      `);
      console.log("Sample reviews:", JSON.stringify(sample.rows, null, 2));
    } else {
      console.log("No reviews exist in database yet.");
      
      console.log("\n--- Sample users ---");
      const users = await client.query(`SELECT id, name, role FROM "users" LIMIT 10;`);
      console.log(users.rows);

      console.log("\n--- Sample lessons ---");
      const lessons = await client.query(`SELECT id, title, course_id FROM "lessons" LIMIT 5;`);
      console.log(lessons.rows);
    }

    await client.end();
  } catch (err) {
    console.error(err);
  }
}

main();
