const { Client } = require('pg');

async function reloadSchema() {
  const client = new Client({
    host: 'db.gthtvpujwukbfgokghne.supabase.co',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: 'BThhbtySBLX43Zc2',
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Conectado!\n');

    // Notificar PostgREST para recarregar o schema
    console.log('Recarregando schema cache do PostgREST...');
    await client.query("NOTIFY pgrst, 'reload schema'");
    console.log('✅ Schema cache recarregado!\n');

    // Verificar se as views estão visíveis
    console.log('Verificando views no public schema...');
    const result = await client.query(`
      SELECT table_name, table_type
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('investidores', 'investidor_emissao', 'investidor_documentos', 'tokens_onboarding')
    `);
    
    console.log('Views encontradas:');
    result.rows.forEach(row => console.log(`  - ${row.table_name} (${row.table_type})`));

    if (result.rows.length === 0) {
      console.log('\n⚠️ Nenhuma view encontrada! Criando novamente...\n');
      
      // Recriar views
      await client.query(`
        CREATE OR REPLACE VIEW public.investidores AS 
        SELECT * FROM compliance.investidores;
        
        CREATE OR REPLACE VIEW public.investidor_emissao AS 
        SELECT * FROM compliance.investidor_emissao;
        
        CREATE OR REPLACE VIEW public.investidor_documentos AS 
        SELECT * FROM compliance.investidor_documentos;
        
        CREATE OR REPLACE VIEW public.tokens_onboarding AS 
        SELECT * FROM compliance.tokens_onboarding;
      `);
      
      // Permissões
      await client.query(`
        GRANT SELECT, INSERT, UPDATE, DELETE ON public.investidores TO anon, authenticated;
        GRANT SELECT, INSERT, UPDATE, DELETE ON public.investidor_emissao TO anon, authenticated;
        GRANT SELECT, INSERT, UPDATE, DELETE ON public.investidor_documentos TO anon, authenticated;
        GRANT SELECT, INSERT, UPDATE, DELETE ON public.tokens_onboarding TO anon, authenticated;
      `);
      
      console.log('✅ Views recriadas!');
      
      // Notificar novamente
      await client.query("NOTIFY pgrst, 'reload schema'");
      console.log('✅ Schema cache recarregado novamente!');
    }

    console.log('\n🎉 Pronto! Testa o link de novo.');

  } catch (err) {
    console.error('❌ Erro:', err.message);
  } finally {
    await client.end();
  }
}

reloadSchema();
