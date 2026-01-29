const { Client } = require('pg');

const client = new Client({
  host: 'db.gthtvpujwukbfgokghne.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'BThhbtySBLX43Zc2',
  ssl: { rejectUnauthorized: false }
});

const sql = `
-- Verificar estrutura atual da tabela investidores
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'compliance' AND table_name = 'investidores'
ORDER BY ordinal_position;
`;

async function run() {
  try {
    await client.connect();
    const result = await client.query(sql);
    console.log('Colunas da tabela investidores:');
    result.rows.forEach(r => console.log(`  ${r.column_name}: ${r.data_type}`));
    await client.end();
  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}
run();
