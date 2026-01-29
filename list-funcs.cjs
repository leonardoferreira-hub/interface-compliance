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
    
    // Listar todas as funções
    const funcs = await client.query(`
      SELECT proname, prosrc 
      FROM pg_proc 
      WHERE proname LIKE '%atualizar%' OR proname LIKE '%verificacao%'
      ORDER BY proname
    `);
    console.log('Funções encontradas:');
    funcs.rows.forEach(f => {
      console.log(`\n=== ${f.proname} ===`);
      console.log(f.prosrc?.substring(0, 500));
    });
    
    await client.end();
  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}
check();
