import pg from 'pg';
import fs from 'fs';
import path from 'path';
import dns from 'dns';
import { fileURLToPath } from 'url';

// Force IPv4 DNS resolution
dns.setDefaultResultOrder('ipv4first');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const { Client } = pg;

const client = new Client({
  host: '2a05:d018:135e:161c:934d:88b:a08a:689b',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'VTcvnFMev9GONXTv',
  ssl: {
    rejectUnauthorized: false,
    servername: 'db.zvkoulhziksfxnxkkrmb.supabase.co'
  }
});

async function runMigration() {
  try {
    console.log('Connecting to Supabase...');
    await client.connect();
    console.log('Connected!');

    const migrationFile = path.join(__dirname, 'supabase/migrations/004_extend_existing.sql');
    console.log(`\nRunning: 004_extend_existing.sql`);
    const sql = fs.readFileSync(migrationFile, 'utf8');

    try {
      await client.query(sql);
      console.log('✓ Migration completed successfully!');
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
