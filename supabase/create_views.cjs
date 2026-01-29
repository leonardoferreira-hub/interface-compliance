const { Client } = require('pg');

async function createViews() {
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

    // Criar views no public schema que apontam para compliance
    console.log('Criando views no schema public...\n');

    // View investidores
    console.log('1. Criando view public.investidores...');
    await client.query(`
      DROP VIEW IF EXISTS public.investidores CASCADE;
      CREATE VIEW public.investidores AS 
      SELECT * FROM compliance.investidores;
    `);
    console.log('   ✅ public.investidores criada!');

    // Regras para INSERT/UPDATE/DELETE na view
    console.log('\n2. Criando regras para INSERT/UPDATE/DELETE...');
    
    await client.query(`
      CREATE OR REPLACE RULE investidores_insert AS
      ON INSERT TO public.investidores
      DO INSTEAD INSERT INTO compliance.investidores VALUES (NEW.*);
    `);
    
    await client.query(`
      CREATE OR REPLACE RULE investidores_update AS
      ON UPDATE TO public.investidores
      DO INSTEAD UPDATE compliance.investidores SET 
        cpf_cnpj = NEW.cpf_cnpj,
        nome = NEW.nome,
        email = NEW.email,
        telefone = NEW.telefone,
        tipo = NEW.tipo,
        tipo_investidor = NEW.tipo_investidor,
        status_onboarding = NEW.status_onboarding,
        kyc_json = NEW.kyc_json,
        suitability_json = NEW.suitability_json,
        perfil_risco = NEW.perfil_risco,
        observacoes = NEW.observacoes,
        atualizado_em = NOW()
      WHERE id = OLD.id;
    `);
    
    await client.query(`
      CREATE OR REPLACE RULE investidores_delete AS
      ON DELETE TO public.investidores
      DO INSTEAD DELETE FROM compliance.investidores WHERE id = OLD.id;
    `);
    console.log('   ✅ Regras criadas!');

    // View investidor_emissao
    console.log('\n3. Criando view public.investidor_emissao...');
    await client.query(`
      DROP VIEW IF EXISTS public.investidor_emissao CASCADE;
      CREATE VIEW public.investidor_emissao AS 
      SELECT * FROM compliance.investidor_emissao;
    `);
    
    await client.query(`
      CREATE OR REPLACE RULE investidor_emissao_insert AS
      ON INSERT TO public.investidor_emissao
      DO INSTEAD INSERT INTO compliance.investidor_emissao VALUES (NEW.*);
    `);
    
    await client.query(`
      CREATE OR REPLACE RULE investidor_emissao_update AS
      ON UPDATE TO public.investidor_emissao
      DO INSTEAD UPDATE compliance.investidor_emissao SET
        status = NEW.status,
        atualizado_em = NOW()
      WHERE id = OLD.id;
    `);
    console.log('   ✅ public.investidor_emissao criada!');

    // View investidor_documentos
    console.log('\n4. Criando view public.investidor_documentos...');
    await client.query(`
      DROP VIEW IF EXISTS public.investidor_documentos CASCADE;
      CREATE VIEW public.investidor_documentos AS 
      SELECT * FROM compliance.investidor_documentos;
    `);
    
    await client.query(`
      CREATE OR REPLACE RULE investidor_documentos_insert AS
      ON INSERT TO public.investidor_documentos
      DO INSTEAD INSERT INTO compliance.investidor_documentos VALUES (NEW.*);
    `);
    console.log('   ✅ public.investidor_documentos criada!');

    // View tokens_onboarding
    console.log('\n5. Criando view public.tokens_onboarding...');
    await client.query(`
      DROP VIEW IF EXISTS public.tokens_onboarding CASCADE;
      CREATE VIEW public.tokens_onboarding AS 
      SELECT * FROM compliance.tokens_onboarding;
    `);
    
    await client.query(`
      CREATE OR REPLACE RULE tokens_onboarding_insert AS
      ON INSERT TO public.tokens_onboarding
      DO INSTEAD INSERT INTO compliance.tokens_onboarding VALUES (NEW.*);
    `);
    console.log('   ✅ public.tokens_onboarding criada!');

    // Permissões
    console.log('\n6. Configurando permissões...');
    await client.query(`
      GRANT SELECT, INSERT, UPDATE, DELETE ON public.investidores TO anon, authenticated;
      GRANT SELECT, INSERT, UPDATE, DELETE ON public.investidor_emissao TO anon, authenticated;
      GRANT SELECT, INSERT, UPDATE, DELETE ON public.investidor_documentos TO anon, authenticated;
      GRANT SELECT, INSERT, UPDATE, DELETE ON public.tokens_onboarding TO anon, authenticated;
    `);
    console.log('   ✅ Permissões configuradas!');

    // Verificar
    const result = await client.query(`
      SELECT table_schema, table_name, table_type
      FROM information_schema.tables 
      WHERE table_name IN ('investidores', 'investidor_emissao', 'investidor_documentos', 'tokens_onboarding')
      AND table_schema IN ('public', 'compliance')
      ORDER BY table_schema, table_name
    `);
    
    console.log('\n📋 Tabelas/Views disponíveis:');
    result.rows.forEach(row => console.log(`   ${row.table_schema}.${row.table_name} (${row.table_type})`));

    console.log('\n🎉 Pronto! Agora as queries no schema public vão funcionar.');

  } catch (err) {
    console.error('❌ Erro:', err.message);
  } finally {
    await client.end();
  }
}

createViews();
