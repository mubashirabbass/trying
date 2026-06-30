import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://neondb_owner:npg_5ueXkUdMx1Aj@ep-morning-mud-an6hqm9i.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require',
});

async function main() {
  try {
    await client.connect();
    console.log("Connected to database successfully!");

    // Clear existing reviews to have a clean slate if needed
    console.log("Clearing any existing lecture feedback ratings...");
    await client.query(`
      UPDATE "lesson_completions" 
      SET "feedback_rating" = NULL, "feedback_comment" = NULL;
    `);

    // Fetch student IDs
    const studentRes = await client.query(`SELECT id, name FROM "users" WHERE role = 'student' LIMIT 10;`);
    const students = studentRes.rows;
    console.log("Found students:", students.map(s => s.name));

    // Fetch lessons with their courses
    const lessonRes = await client.query(`
      SELECT l.id as lesson_id, l.title as lesson_title, c.id as course_id, c.title as course_title
      FROM "lessons" l
      JOIN "courses" c ON l.course_id = c.id
      LIMIT 15;
    `);
    const lessons = lessonRes.rows;
    console.log(`Found ${lessons.length} lessons`);

    if (students.length === 0 || lessons.length === 0) {
      console.log("Cannot seed: no students or lessons found.");
      await client.end();
      return;
    }

    const reviewsToSeed = [
      {
        studentIndex: 0, // rizwan
        lessonIndex: 0,
        rating: 5,
        comment: "Excellent explanation of e-commerce concepts! Very practical and easy to follow."
      },
      {
        studentIndex: 1, // saeed ahmad
        lessonIndex: 1,
        rating: 4,
        comment: "Very detailed explanation of React states and hooks. Would love a few more exercises."
      },
      {
        studentIndex: 2, // Jane Student
        lessonIndex: 2,
        rating: 5,
        comment: "MS Office tools covered brilliantly. This will save me hours at work!"
      },
      {
        studentIndex: 3, // Muntazir Abbas Haider
        lessonIndex: 3,
        rating: 3,
        comment: "Good intro to AI & Python, but went a bit fast on the machine learning setup."
      },
      {
        studentIndex: 4, // farman sabir
        lessonIndex: 4,
        rating: 5,
        comment: "Loved the digital marketing strategies. Extremely actionable!"
      },
      {
        studentIndex: 0, // rizwan
        lessonIndex: 6,
        rating: 4,
        comment: "The advanced tips on Shopify stores were incredibly useful. Thanks!"
      },
      {
        studentIndex: 1, // saeed ahmad
        lessonIndex: 7,
        rating: 5,
        comment: "Best lecture on Node.js middleware. Everything clicked!"
      },
      {
        studentIndex: 2, // Jane Student
        lessonIndex: 8,
        rating: 4,
        comment: "Excel Pivot Tables walkthrough was clean and simple."
      }
    ];

    console.log("Seeding reviews...");
    for (const r of reviewsToSeed) {
      const student = students[r.studentIndex % students.length];
      const lesson = lessons[r.lessonIndex % lessons.length];
      
      if (!student || !lesson) continue;

      // Check if completion record exists
      const existRes = await client.query(`
        SELECT id FROM "lesson_completions" 
        WHERE "lesson_id" = $1 AND "user_id" = $2;
      `, [lesson.lesson_id, student.id]);

      if (existRes.rows.length > 0) {
        // Update
        await client.query(`
          UPDATE "lesson_completions"
          SET "is_completed" = true,
              "watched_percent" = 100,
              "completed_at" = NOW() - INTERVAL '${Math.floor(Math.random() * 10)} days',
              "feedback_rating" = $1,
              "feedback_comment" = $2
          WHERE id = $3;
        `, [r.rating, r.comment, existRes.rows[0].id]);
      } else {
        // Insert
        await client.query(`
          INSERT INTO "lesson_completions" ("lesson_id", "user_id", "watched_percent", "is_completed", "completed_at", "feedback_rating", "feedback_comment", "updated_at")
          VALUES ($1, $2, 100, true, NOW() - INTERVAL '${Math.floor(Math.random() * 10)} days', $3, $4, NOW());
        `, [lesson.lesson_id, student.id, r.rating, r.comment]);
      }
    }

    console.log("Seeding completed successfully!");
    
    // Verify
    const verifyRes = await client.query(`
      SELECT count(*) FROM "lesson_completions" WHERE "feedback_rating" IS NOT NULL;
    `);
    console.log("Verified total rated completions in DB:", verifyRes.rows[0].count);

    await client.end();
  } catch (err) {
    console.error("Seeding error:", err);
  }
}

main();
