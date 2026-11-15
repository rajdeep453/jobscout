import fs from "fs";
import { parse } from "csv-parse";
import { pool } from "../src/lib/db";

async function main() {
  const file = process.argv[2];
  const limit = Number(process.argv[3] ?? 1500);
  if (!file) {
    console.error('Usage: npm run ingest -- "<csv path>" <limit>');
    process.exit(1);
  }

  const existing = await pool.query("select count(*) from jobs");
  if (Number(existing.rows[0].count) > 0) {
    console.error("jobs table already has rows. Run 'truncate jobs;' in Supabase first.");
    process.exit(1);
  }

  const parser = fs.createReadStream(file).pipe(
    parse({ columns: true, skip_empty_lines: true, relax_quotes: true, relax_column_count: true })
  );

  let n = 0;
  for await (const r of parser as AsyncIterable<Record<string, string>>) {
    const title = r.title;
    const description = r.description;
    if (!title || !description || description.length < 100) continue;

    await pool.query(
      `insert into jobs (title, company, location, description, source_url)
       values ($1, $2, $3, $4, $5)`,
      [
        title,
        r.job_domain || r.company_id || null,
        r.job_location || null,
        description.slice(0, 4000),
        null,
      ]
    );
    n++;
    if (n % 100 === 0) console.log(`inserted ${n}`);
    if (n >= limit) {
      parser.destroy();
      break;
    }
  }
  console.log(`Done. Inserted ${n} jobs.`);
  await pool.end();
}

main();
