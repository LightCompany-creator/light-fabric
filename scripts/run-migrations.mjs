// Прогоняет SQL-миграции из supabase/migrations/ напрямую через DATABASE_URL.
// Запуск: node --env-file=.env.local scripts/run-migrations.mjs [0009] [0010] ...
// Без аргументов — прогоняет все ещё не накатанные.

import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import pg from "pg";

const { Client } = pg;

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error("Нужен DATABASE_URL в .env.local");
  process.exit(1);
}

const MIGRATIONS_DIR = "supabase/migrations";

async function ensureMigrationsTable(client) {
  await client.query(`
    create table if not exists _migrations (
      name text primary key,
      applied_at timestamptz not null default now()
    )
  `);
}

async function listApplied(client) {
  const { rows } = await client.query("select name from _migrations");
  return new Set(rows.map((r) => r.name));
}

async function listFiles() {
  const all = await readdir(MIGRATIONS_DIR);
  return all.filter((f) => f.endsWith(".sql")).sort();
}

async function applyOne(client, file) {
  const sql = await readFile(path.join(MIGRATIONS_DIR, file), "utf8");
  console.log(`  → applying ${file}...`);
  await client.query("begin");
  try {
    await client.query(sql);
    await client.query("insert into _migrations (name) values ($1)", [file]);
    await client.query("commit");
    console.log(`    ✓ ok`);
  } catch (e) {
    await client.query("rollback");
    throw new Error(`Migration ${file} failed: ${e.message}`);
  }
}

async function main() {
  const requested = process.argv.slice(2);
  // Парсим URL вручную, чтобы корректно обрабатывать спецсимволы в пароле.
  const u = new URL(dbUrl);
  const client = new Client({
    host: u.hostname,
    port: Number(u.port || 5432),
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    database: u.pathname.replace(/^\//, "") || "postgres",
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  try {
    await ensureMigrationsTable(client);
    const applied = await listApplied(client);
    const files = await listFiles();
    const toApply = files.filter((f) => {
      if (applied.has(f)) return false;
      if (requested.length > 0) {
        return requested.some((r) => f.includes(r));
      }
      return true;
    });

    if (toApply.length === 0) {
      console.log("Нет миграций к применению.");
      return;
    }

    console.log(`К применению: ${toApply.length} миграц(ия/ий)`);
    for (const f of toApply) {
      await applyOne(client, f);
    }
    console.log("\nГотово.");
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error("✗", e.message);
  process.exit(1);
});
