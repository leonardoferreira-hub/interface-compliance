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
    
    // Verificar definição da constraint
    const constraint = await client.query(`
      SELECT pg_get_constraintdef(oid, true) as def
      FROM pg_constraint 
      WHERE conname = 'operacoes_status_check'
    `);
    
    console.log('Constraint operacoes_status_check:');
    console.log(constraint.rows[0]?.def);
    
    // Verificar quais status são válidos olhando dados existentes
    const status = await client.query(`
      SELECT DISTINCT status FROM estruturacao.operacoes LIMIT 10
    `);
    console.log('\nStatus existentes:');
    status.rows.forEach(s => console.log('  -', s.status));
    
    await client.end();
  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}
check();
