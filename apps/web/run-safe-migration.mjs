import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const { Client } = pg;

// Load database credentials from .env.db
config({ path: path.join(__dirname, 'supabase/.env.db') });

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres.zvkoulhziksfxnxkkrmb:VTcvnFMev9GONXTv@aws-1-eu-west-1.pooler.supabase.com:5432/postgres';

const client = new Client({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function runMigration() {
  try {
    console.log('Connecting to Supabase via pooler...');
    await client.connect();
    console.log('Connected!');

    const migrationFile = path.join(__dirname, 'supabase/migrations/005_safe_extend.sql');
    console.log(`\nRunning: 005_safe_extend.sql`);
    const sql = fs.readFileSync(migrationFile, 'utf8');

    try {
      const result = await client.query(sql);
      console.log('✓ Migration completed successfully!');
      if (result && result.rows) {
        console.log('Result:', result.rows);
      }
    } catch (err) {
      console.error('✗ Error:', err.message);
    }

    console.log('\nDone!');
  } catch (err) {
    console.error('Connection error:', err.message);
  } finally {
    await client.end();
  }
}

runMigration();
