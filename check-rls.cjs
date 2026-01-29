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
    
    // Verificar RLS na tabela emissoes
    const rls = await client.query(`
      SELECT relrowsecurity, relforcerowsecurity 
      FROM pg_class 
      WHERE relname = 'emissoes'
    `);
    console.log('RLS ativo:', rls.rows[0]?.relrowsecurity);
    
    // Verificar políticas RLS
    const policies = await client.query(`
      SELECT polname, polcmd, polpermissive 
      FROM pg_policy 
      WHERE polrelid = 'emissoes'::regclass
    `);
    console.log('\nPolíticas RLS:', policies.rows);
    
    // Verificar estrutura da tabela
    const cols = await client.query(`
      SELECT column_name, is_nullable, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'emissoes' 
      ORDER BY ordinal_position
    `);
    console.log('\nColunas da tabela emissoes:');
    cols.rows.forEach(c => {
      console.log(`  ${c.column_name}: ${c.data_type} ${c.is_nullable === 'NO' ? '(NOT NULL)' : ''}`);
    });
    
    await client.end();
  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}
check();
