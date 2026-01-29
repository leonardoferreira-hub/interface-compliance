const { Client } = require('pg');

async function checkSchemas() {
  const client = new Client({
    host: 'db.gthtvpujwukbfgokghne.supabase.co',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: 'BThhbtySBLX43Zc2',
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();

    // Verificar tabelas investidores em todos os schemas
    const result = await client.query(`
      SELECT table_schema, table_name 
      FROM information_schema.tables 
      WHERE table_name LIKE '%investidor%'
      ORDER BY table_schema, table_name
    `);
    
    console.log('Tabelas com "investidor" no nome:');
    result.rows.forEach(row => console.log(`  ${row.table_schema}.${row.table_name}`));

  } catch (err) {
    console.error('Erro:', err.message);
  } finally {
    await client.end();
  }
}

checkSchemas();
