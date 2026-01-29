const { Client } = require('pg');

async function runMigration() {
  const client = new Client({
    host: 'db.gthtvpujwukbfgokghne.supabase.co',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: 'BThhbtySBLX43Zc2',
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Conectando ao Supabase...');
    await client.connect();
    console.log('Conectado!');

    // 1. Criar schema
    console.log('\n1. Criando schema compliance...');
    await client.query('CREATE SCHEMA IF NOT EXISTS compliance;');
    console.log('   Schema criado!');

    // 2. Criar tabela investidores
    console.log('\n2. Criando tabela investidores...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS compliance.investidores (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        cpf_cnpj VARCHAR(14) UNIQUE NOT NULL,
        tipo VARCHAR(20) NOT NULL,
        nome VARCHAR(255),
        email VARCHAR(255),
        telefone VARCHAR(20),
        dados_cadastrais JSONB,
        suitability JSONB,
        status_onboarding VARCHAR(20) DEFAULT 'pendente',
        token_origem VARCHAR(255),
        criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('   Tabela investidores criada!');

    // 3. Criar tabela investidor_emissao
    console.log('\n3. Criando tabela investidor_emissao...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS compliance.investidor_emissao (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        emissao_id UUID,
        investidor_id UUID REFERENCES compliance.investidores(id),
        cpf_cnpj VARCHAR(14) NOT NULL,
        tipo VARCHAR(20),
        status VARCHAR(30) DEFAULT 'aguardando_compliance',
        token_onboarding VARCHAR(255),
        criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('   Tabela investidor_emissao criada!');

    // 4. Criar tabela investidor_documentos
    console.log('\n4. Criando tabela investidor_documentos...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS compliance.investidor_documentos (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        investidor_id UUID REFERENCES compliance.investidores(id),
        tipo_documento VARCHAR(50),
        arquivo_path VARCHAR(500),
        status VARCHAR(20) DEFAULT 'pendente',
        observacao TEXT,
        criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('   Tabela investidor_documentos criada!');

    // 5. Criar tabela tokens_onboarding
    console.log('\n5. Criando tabela tokens_onboarding...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS compliance.tokens_onboarding (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        token VARCHAR(255) UNIQUE NOT NULL,
        emissao_id UUID,
        investidor_id UUID REFERENCES compliance.investidores(id),
        usado BOOLEAN DEFAULT FALSE,
        criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        expira_em TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days')
      );
    `);
    console.log('   Tabela tokens_onboarding criada!');

    // 6. Criar índices
    console.log('\n6. Criando índices...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_investidores_cpf_cnpj ON compliance.investidores(cpf_cnpj);
      CREATE INDEX IF NOT EXISTS idx_investidores_status ON compliance.investidores(status_onboarding);
      CREATE INDEX IF NOT EXISTS idx_investidor_emissao_emissao ON compliance.investidor_emissao(emissao_id);
      CREATE INDEX IF NOT EXISTS idx_investidor_emissao_cpf ON compliance.investidor_emissao(cpf_cnpj);
      CREATE INDEX IF NOT EXISTS idx_tokens_onboarding_token ON compliance.tokens_onboarding(token);
    `);
    console.log('   Índices criados!');

    // 7. RLS e políticas
    console.log('\n7. Configurando RLS e políticas...');
    await client.query(`
      ALTER TABLE compliance.investidores ENABLE ROW LEVEL SECURITY;
      ALTER TABLE compliance.investidor_emissao ENABLE ROW LEVEL SECURITY;
      ALTER TABLE compliance.investidor_documentos ENABLE ROW LEVEL SECURITY;
      ALTER TABLE compliance.tokens_onboarding ENABLE ROW LEVEL SECURITY;
    `);
    
    // Políticas permissivas
    const tables = ['investidores', 'investidor_emissao', 'investidor_documentos', 'tokens_onboarding'];
    for (const table of tables) {
      await client.query(`DROP POLICY IF EXISTS "Allow all ${table}" ON compliance.${table};`);
      await client.query(`CREATE POLICY "Allow all ${table}" ON compliance.${table} FOR ALL USING (true) WITH CHECK (true);`);
    }
    console.log('   RLS e políticas configurados!');

    // 8. Permissões
    console.log('\n8. Configurando permissões...');
    await client.query(`
      GRANT USAGE ON SCHEMA compliance TO anon, authenticated;
      GRANT ALL ON ALL TABLES IN SCHEMA compliance TO anon, authenticated;
      GRANT ALL ON ALL SEQUENCES IN SCHEMA compliance TO anon, authenticated;
    `);
    console.log('   Permissões configuradas!');

    // Verificar tabelas criadas
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'compliance'
      ORDER BY table_name
    `);
    
    console.log('\n✅ Tabelas criadas no schema compliance:');
    result.rows.forEach(row => console.log('   -', row.table_name));

    console.log('\n🎉 Migration completa!');

  } catch (err) {
    console.error('❌ Erro:', err.message);
  } finally {
    await client.end();
  }
}

runMigration();
