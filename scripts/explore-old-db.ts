import postgres from 'postgres';

const OLD_DB_URL = 'postgresql://postgres.ndzypstmjawxouxazkkv:Sc@topia81898056@aws-1-eu-north-1.pooler.supabase.com:6543/postgres';

async function main() {
  console.log('Connecting to old database...');
  const sql = postgres(OLD_DB_URL);

  try {
    // Get all tables
    const tables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;

    console.log('\n=== Tables in old database ===');
    for (const t of tables) {
      console.log('-', t.table_name);
    }

    // For each table, get its columns
    for (const t of tables) {
      const columns = await sql`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = ${t.table_name}
        ORDER BY ordinal_position
      `;

      console.log(`\n=== ${t.table_name} columns ===`);
      for (const col of columns) {
        console.log(`  - ${col.column_name}: ${col.data_type}${col.is_nullable === 'NO' ? ' NOT NULL' : ''}`);
      }

      // Get row count
      const countResult = await sql.unsafe(`SELECT COUNT(*) as count FROM "${t.table_name}"`);
      console.log(`  Rows: ${countResult[0].count}`);
    }

  } finally {
    await sql.end();
  }
}

main().catch(console.error);
