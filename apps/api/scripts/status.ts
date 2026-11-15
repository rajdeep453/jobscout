import { pool } from "../src/lib/db";

(async () => {
  const t = await pool.query("select to_regclass('public.jobs') as t");
  if (!t.rows[0].t) {
    console.log("NO jobs table: run db/schema.sql in Supabase");
    return pool.end();
  }
  const c = await pool.query(
    "select count(*) total, count(embedding) embedded, count(role_category) categorized from jobs"
  );
  const i = await pool.query("select indexname from pg_indexes where tablename='jobs'");
  console.log(c.rows[0]);
  console.log("indexes:", i.rows.map((r) => r.indexname));
  await pool.end();
})();
