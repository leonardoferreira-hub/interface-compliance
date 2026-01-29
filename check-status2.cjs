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
    
    // Verificar tipo da coluna status
    const col = await client.query(`
      SELECT data_type, udt_name
      FROM information_schema.columns 
      WHERE table_schema = 'estruturacao' 
      AND table_name = 'operacoes' 
      AND column_name = 'status'
    `);
    
    console.log('Coluna status:');
    console.log(col.rows[0]);
    
    // Verificar valores válidos do enum
    if (col.rows[0]?.udt_name) {
      const enums = await client.query(`
        SELECT enumlabel 
        FROM pg_enum 
        WHERE enumtypid = '${col.rows[0].udt_name}'::regtype
      `);
      console.log('\nValores permitidos:');
      enums.rows.forEach(e => console.log('  -', e.enumlabel));
    }
    
    await client.end();
  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}
check();
