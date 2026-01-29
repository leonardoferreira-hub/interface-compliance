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
-- Dropar as funções problemáticas do schema public
DROP FUNCTION IF EXISTS public.atualizar_verificacao(UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.atualizar_investidor(UUID, TEXT, TEXT);
`;

async function run() {
  try {
    await client.connect();
    await client.query(sql);
    console.log('✅ Funções removidas!');
    
    // Forçar reload do schema
    await client.query("NOTIFY pgrst, 'reload schema'");
    console.log('🔄 Schema reload notificado');
    
    await client.end();
  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}
run();
