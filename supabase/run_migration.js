const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  const client = new Client({
    host: 'db.gthtvpujwukbfgokghne.supabase.co',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: 'BThhbtySBLX43Zc2',
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Conectando ao Supabase...');
    await client.connect();
    console.log('Conectado!');

    const sqlFile = path.join(__dirname, 'create_compliance_schema.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');

    console.log('Executando migration...');
    await client.query(sql);
    console.log('Migration executada com sucesso!');

    // Verificar tabelas criadas
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'compliance'
      ORDER BY table_name
    `);
    
    console.log('\nTabelas criadas no schema compliance:');
    result.rows.forEach(row => console.log('  -', row.table_name));

  } catch (err) {
    console.error('Erro:', err.message);
  } finally {
    await client.end();
  }
}

runMigration();
