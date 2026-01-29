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
-- Verificar definição da view
SELECT definition FROM pg_views WHERE viewname = 'v_compliance_verificacoes';
`;

async function run() {
  try {
    await client.connect();
    const result = await client.query(sql);
    console.log('View v_compliance_verificacoes:');
    console.log(result.rows[0]?.definition || 'Não encontrada');
    await client.end();
  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}
run();
