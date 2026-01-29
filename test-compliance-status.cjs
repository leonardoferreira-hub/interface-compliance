const { Client } = require('pg');

const client = new Client({
  host: 'db.gthtvpujwukbfgokghne.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'BThhbtySBLX43Zc2',
  ssl: { rejectUnauthorized: false }
});

async function test() {
  try {
    await client.connect();
    
    // Testar função
    const result = await client.query(`
      SELECT get_status_compliance_emissao('c42121ae-4a7d-47d7-a157-01731749324f'::uuid)
    `);
    
    console.log('Resultado:', result.rows[0].get_status_compliance_emissao);
    await client.end();
  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}
test();
