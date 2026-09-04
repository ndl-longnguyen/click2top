import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  const connectionString =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.SUPABASE_DB_URL;

  if (!connectionString) {
    console.log('ℹ️ [Migrate] No DATABASE_URL or POSTGRES_URL detected. Skipping build-time migration.');
    return;
  }

  console.log('🚀 [Migrate] Database connection string detected. Starting Supabase migration on Vercel...');

  const sqlPath = path.resolve(__dirname, '../supabase/full_schema.sql');
  if (!fs.existsSync(sqlPath)) {
    console.error('❌ [Migrate Error] Migration file not found at:', sqlPath);
    return;
  }

  const sqlContent = fs.readFileSync(sqlPath, 'utf8');

  // Supabase PostgreSQL pooler or direct connection requires SSL
  const client = new pg.Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    await client.connect();
    console.log('🔌 [Migrate] Connected to Supabase PostgreSQL successfully.');

    await client.query(sqlContent);
    console.log('✅ [Migrate] Supabase database schema and migrations applied successfully!');
  } catch (err) {
    console.error('❌ [Migrate Error] Failed to apply schema on Supabase:', err.message);
    process.exit(1);
  } finally {
    await client.end().catch(() => {});
  }
}

runMigration().catch((err) => {
  console.error('Unexpected migration fatal error:', err);
  process.exit(1);
});
