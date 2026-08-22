// Разовый дамп всех таблиц public-схемы в JSON — для архивной копии базы
// перед перестройкой интеграции с 1С по схеме Арсена.
import pg from "pg";
import { writeFileSync, mkdirSync } from "node:fs";

const { Client } = pg;
const u = new URL(process.env.DATABASE_URL);
const client = new Client({
  host: u.hostname,
  port: Number(u.port || 5432),
  user: decodeURIComponent(u.username),
  password: decodeURIComponent(u.password),
  database: u.pathname.replace(/^\//, "") || "postgres",
  ssl: { rejectUnauthorized: false },
});

const outDir = process.argv[2] || "./db-dump";
mkdirSync(outDir, { recursive: true });

async function main() {
  await client.connect();

  const { rows: tables } = await client.query(`
    select table_name from information_schema.tables
    where table_schema = 'public' and table_type = 'BASE TABLE'
    order by table_name
  `);

  const summary = [];
  for (const { table_name } of tables) {
    const { rows } = await client.query(`select * from "${table_name}"`);
    writeFileSync(
      `${outDir}/${table_name}.json`,
      JSON.stringify(rows, null, 2),
      "utf8",
    );
    summary.push(`${table_name}: ${rows.length} строк`);
    console.log(`  ✓ ${table_name} — ${rows.length} строк`);
  }

  writeFileSync(`${outDir}/_summary.txt`, summary.join("\n"), "utf8");
  console.log(`\nГотово: ${tables.length} таблиц в ${outDir}`);
  await client.end();
}

main().catch((e) => {
  console.error("FATAL:", e.message);
  process.exit(1);
});
