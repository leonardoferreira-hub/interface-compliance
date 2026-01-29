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
    
    // Verificar se a view existe
    const view = await client.query(`
      SELECT * FROM pg_views WHERE viewname = 'v_compliance_verificacoes'
    `);
    
    if (view.rows.length === 0) {
      console.log('❌ View v_compliance_verificacoes NÃO existe');
      
      // Criar a view
      await client.query(`
        CREATE OR REPLACE VIEW compliance.v_compliance_verificacoes AS
        SELECT 
          id,
          operacao_id,
          numero_emissao,
          nome_operacao,
          cnpj,
          tipo_entidade,
          nome_entidade,
          status,
          observacoes,
          solicitado_por,
          data_solicitacao,
          analisado_por,
          data_analise,
          criado_em,
          atualizado_em
        FROM compliance.verificacoes_pendentes
      `);
      
      // Criar view no schema public
      await client.query(`
        CREATE OR REPLACE VIEW public.v_compliance_verificacoes AS
        SELECT * FROM compliance.v_compliance_verificacoes
      `);
      
      console.log('✅ View criada!');
    } else {
      console.log('✅ View v_compliance_verificacoes existe');
    }
    
    // Verificar tabela cnpjs_verificados
    const table = await client.query(`
      SELECT * FROM information_schema.tables 
      WHERE table_schema = 'compliance' AND table_name = 'cnpjs_verificados'
    `);
    
    if (table.rows.length === 0) {
      console.log('❌ Tabela cnpjs_verificados NÃO existe');
    } else {
      console.log('✅ Tabela cnpjs_verificados existe');
    }
    
    await client.end();
  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}
check();
