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
-- Verificar se a função existe e qual seu código
SELECT 
    p.proname,
    pg_get_functiondef(p.oid) as definition
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'compliance' 
AND p.proname = 'atualizar_verificacao';
`;

async function run() {
  try {
    await client.connect();
    const result = await client.query(sql);
    console.log('Função atualizar_verificacao:');
    console.log(result.rows[0]?.definition || 'NÃO ENCONTRADA');
    await client.end();
  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}
run();
