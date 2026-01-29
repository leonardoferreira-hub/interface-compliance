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
    
    // Verificar colunas da tabela cnpjs_verificados
    const cols = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'compliance' AND table_name = 'cnpjs_verificados'
      ORDER BY ordinal_position
    `);
    
    console.log('Colunas de compliance.cnpjs_verificados:');
    cols.rows.forEach(c => console.log(`  - ${c.column_name}: ${c.data_type}`));
    
    // Criar view no schema public se não existir
    await client.query(`
      CREATE OR REPLACE VIEW public.cnpjs_verificados AS
      SELECT * FROM compliance.cnpjs_verificados
    `);
    
    console.log('\n✅ View public.cnpjs_verificados criada/atualizada');
    
    await client.end();
  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}
check();
