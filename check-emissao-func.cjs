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
    
    // Verificar função gerar_numero_emissao
    const func = await client.query(`
      SELECT proname, prosrc 
      FROM pg_proc 
      WHERE proname = 'gerar_numero_emissao'
    `);
    
    if (func.rows.length === 0) {
      console.log('❌ Função gerar_numero_emissao NÃO existe');
    } else {
      console.log('✅ Função existe:');
      console.log(func.rows[0].prosrc);
    }
    
    // Verificar sequência
    const seq = await client.query(`
      SELECT sequencename FROM pg_sequences WHERE sequencename = 'emissao_numero_seq'
    `);
    console.log('\nSequência:', seq.rows.length > 0 ? 'Existe' : 'NÃO existe');
    
    // Tentar executar a função
    try {
      const result = await client.query(`SELECT gerar_numero_emissao()`);
      console.log('\n✅ Função executou com sucesso:', result.rows[0].gerar_numero_emissao);
    } catch (e) {
      console.log('\n❌ Erro ao executar função:', e.message);
    }
    
    await client.end();
  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}
check();
