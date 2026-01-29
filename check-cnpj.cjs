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
    
    // Verificar operação
    console.log('=== Operação EM-20260127-0011 ===');
    const op = await client.query(`
      SELECT id, numero_emissao, nome_operacao, empresa_cnpj 
      FROM estruturacao.operacoes 
      WHERE numero_emissao = 'EM-20260127-0011'
    `);
    console.log(op.rows);
    
    // Verificar CNPJs na estruturação
    console.log('\n=== CNPJs na Estruturação ===');
    const cnpjs = await client.query(`
      SELECT * FROM estruturacao.compliance_checks
      WHERE operacao_id IN (
        SELECT id FROM estruturacao.operacoes 
        WHERE numero_emissao = 'EM-20260127-0011'
      )
    `);
    console.log(cnpjs.rows);
    
    // Verificar no Compliance
    console.log('\n=== Verificações no Compliance ===');
    const verif = await client.query(`
      SELECT * FROM compliance.verificacoes_pendentes
      WHERE numero_emissao = 'EM-20260127-0011'
    `);
    console.log(verif.rows);
    
    await client.end();
  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}
check();
