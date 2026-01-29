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
    
    // Verificar constraint de status
    const constraint = await client.query(`
      SELECT pg_get_constraintdef(oid) as def
      FROM pg_constraint 
      WHERE conname = 'operacoes_status_check'
    `);
    
    console.log('Constraint operacoes_status_check:');
    console.log(constraint.rows[0]?.def);
    
    // Verificar quais status são permitidos
    const enums = await client.query(`
      SELECT enumlabel 
      FROM pg_enum 
      WHERE enumtypid = 'estruturacao.status_operacao'::regtype
    `);
    console.log('\nStatus permitidos em estruturacao.operacoes:');
    enums.rows.forEach(e => console.log('  -', e.enumlabel));
    
    await client.end();
  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}
check();
