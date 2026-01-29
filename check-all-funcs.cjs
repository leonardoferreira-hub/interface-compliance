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
-- Listar TODAS as funções com nomes similares em todos os schemas
SELECT 
    n.nspname as schema,
    p.proname,
    pg_get_function_arguments(p.oid) as args,
    pg_get_functiondef(p.oid) as definition
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE p.proname LIKE '%atualizar%verificacao%'
   OR p.proname LIKE '%verificacao%'
   OR p.proname LIKE '%atualizar%'
ORDER BY n.nspname, p.proname;
`;

async function run() {
  try {
    await client.connect();
    const result = await client.query(sql);
    console.log(`Encontradas ${result.rows.length} funções:`);
    result.rows.forEach(r => {
      console.log(`\n=== ${r.schema}.${r.proname}(${r.args}) ===`);
      if (r.definition.includes('to_jsonb(*)')) {
        console.log('⚠️  CONTEM to_jsonb(*) - PROBLEMA!');
      } else {
        console.log('✅ OK - sem to_jsonb(*)');
      }
    });
    
    // Forçar reload do schema
    await client.query("NOTIFY pgrst, 'reload schema'");
    console.log('\n🔄 Schema reload notificado');
    
    await client.end();
  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}
run();
