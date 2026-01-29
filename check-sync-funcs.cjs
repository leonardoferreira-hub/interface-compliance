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
    
    // Ver a função sync_emissao_to_estruturacao_and_compliance
    const func = await client.query(`
      SELECT prosrc FROM pg_proc WHERE proname = 'sync_emissao_to_estruturacao_and_compliance'
    `);
    
    if (func.rows.length > 0) {
      console.log('=== sync_emissao_to_estruturacao_and_compliance ===');
      console.log(func.rows[0].prosrc);
    }
    
    // Ver a função sync_emissao_to_operacao
    const func2 = await client.query(`
      SELECT prosrc FROM pg_proc WHERE proname = 'sync_emissao_to_operacao'
    `);
    
    if (func2.rows.length > 0) {
      console.log('\n=== sync_emissao_to_operacao ===');
      console.log(func2.rows[0].prosrc);
    }
    
    await client.end();
  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}
check();
