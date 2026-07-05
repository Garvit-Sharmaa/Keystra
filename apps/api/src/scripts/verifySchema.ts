/**
 * verifySchema.ts — Verify chapter_progress table schema post-migration.
 */
import { pool } from '../config/database';

async function verify(): Promise<void> {
  const { rows: cols } = await pool.query<{
    column_name: string; data_type: string; is_nullable: string;
  }>(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'chapter_progress'
    ORDER BY ordinal_position
  `);

  console.log('\n=== chapter_progress columns ===');
  if (cols.length === 0) {
    console.error('❌ Table not found — migration may not have run');
    process.exitCode = 1;
  } else {
    cols.forEach((c) =>
      console.log(` ${c.column_name.padEnd(22)} ${c.data_type.padEnd(22)} nullable:${c.is_nullable}`),
    );
  }

  const { rows: pk } = await pool.query<{ column_name: string }>(`
    SELECT kcu.column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
    WHERE tc.table_name = 'chapter_progress'
      AND tc.constraint_type = 'PRIMARY KEY'
    ORDER BY kcu.ordinal_position
  `);
  console.log('\n=== Primary Key columns ===');
  pk.forEach((r) => console.log(' ' + r.column_name));

  const { rows: idx } = await pool.query<{ indexname: string }>(`
    SELECT indexname FROM pg_indexes WHERE tablename = 'chapter_progress'
  `);
  console.log('\n=== Indexes ===');
  idx.forEach((r) => console.log(' ' + r.indexname));

  // Test idempotent insert + upsert using a real user from the DB
  console.log('\n=== Idempotency smoke test ===');
  const { rows: users } = await pool.query<{ id: string }>(
    `SELECT id FROM users ORDER BY created_at ASC LIMIT 1`,
  );

  if (users.length === 0) {
    console.log(' No users in DB yet — skipping FK-constrained smoke test.');
    console.log(' (This is normal on a fresh database — the FK constraint is correct.)');
  } else {
    const testUserId = users[0].id;
    const testChapterId = '__smoke-test-1.0__';
    try {
      await pool.query(`
        INSERT INTO chapter_progress
          (user_id, chapter_id, difficulty, wpm_achieved, accuracy_achieved)
        VALUES ($1, $2, 'easy', 35, 96)
        ON CONFLICT (user_id, chapter_id) DO UPDATE
          SET difficulty        = EXCLUDED.difficulty,
              wpm_achieved      = EXCLUDED.wpm_achieved,
              accuracy_achieved = EXCLUDED.accuracy_achieved,
              completed_at      = NOW()
      `, [testUserId, testChapterId]);
      console.log(' INSERT (first run)    ✅');

      await pool.query(`
        INSERT INTO chapter_progress
          (user_id, chapter_id, difficulty, wpm_achieved, accuracy_achieved)
        VALUES ($1, $2, 'professional', 72, 98)
        ON CONFLICT (user_id, chapter_id) DO UPDATE
          SET difficulty        = EXCLUDED.difficulty,
              wpm_achieved      = EXCLUDED.wpm_achieved,
              accuracy_achieved = EXCLUDED.accuracy_achieved,
              completed_at      = NOW()
      `, [testUserId, testChapterId]);
      console.log(' UPSERT (second run)   ✅');

      const { rows: check } = await pool.query<{
        chapter_id: string; difficulty: string; wpm_achieved: number;
      }>(
        `SELECT chapter_id, difficulty, wpm_achieved FROM chapter_progress
          WHERE user_id = $1 AND chapter_id = $2`,
        [testUserId, testChapterId],
      );
      console.log(` Row after upsert:     difficulty=${check[0]?.difficulty}  wpm=${check[0]?.wpm_achieved}`);
      if (check[0]?.difficulty !== 'professional' || check[0]?.wpm_achieved !== 72) {
        console.error(' ❌ Upsert did not update correctly');
        process.exitCode = 1;
      }

      // Clean up test row
      await pool.query(
        `DELETE FROM chapter_progress WHERE user_id = $1 AND chapter_id = $2`,
        [testUserId, testChapterId],
      );
      console.log(' Cleanup               ✅');
    } catch (err: any) {
      console.error(' Smoke test failed:', err.message);
      process.exitCode = 1;
    }
  }

  console.log('\n✅ Schema verification complete');
  await pool.end();
}

verify().catch((err) => {
  console.error('❌ Verification error:', err.message);
  process.exit(1);
});
