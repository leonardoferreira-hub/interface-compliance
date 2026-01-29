const { Client } = require('pg');

const client = new Client({
  host: 'db.gthtvpujwukbfgokghne.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'BThhbtySBLX43Zc2',
  ssl: { rejectUnauthorized: false }
});

async function check() {
  try {
    await client.connect();
    
    // Verificar os triggers de sync
    const triggers = await client.query(`
      SELECT tgname, pg_get_triggerdef(t.oid) as definition
      FROM pg_trigger t
      JOIN pg_proc p ON p.oid = t.tgfoid
      WHERE tgname IN ('trigger_sync_emissao_to_estruturacao', 'trigger_sync_emissao_to_operacao')
    `);
    
    console.log('Triggers problemáticos:');
    triggers.rows.forEach(t => {
      console.log(`\n=== ${t.tgname} ===`);
      console.log(t.definition);
    });
    
    await client.end();
  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}
check();
