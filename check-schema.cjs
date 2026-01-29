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
-- Verificar estrutura da tabela
SELECT column_name FROM information_schema.columns WHERE table_name = 'operacoes' AND table_schema = 'estruturacao';
`;

async function check() {
  try {
    await client.connect();
    const result = await client.query(sql);
    console.log('Colunas em estruturacao.operacoes:');
    result.rows.forEach(r => console.log(' -', r.column_name));
    await client.end();
  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}
check();
