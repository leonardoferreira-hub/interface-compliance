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
    
    // Verificar função
    const func = await client.query(`
      SELECT prosrc FROM pg_proc WHERE proname = 'analisar_verificacao'
    `);
    console.log('Função analisar_verificacao:');
    console.log(func.rows[0]?.prosrc || 'Não encontrada');
    
    await client.end();
  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}
check();
