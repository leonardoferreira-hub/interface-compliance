const { Client } = require('pg');

async function fixIndexes() {
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

    // Verificar estrutura das tabelas
    console.log('\n📋 Verificando estrutura das tabelas...');
    
    const tables = ['investidores', 'investidor_emissao', 'investidor_documentos', 'tokens_onboarding'];
    
    for (const table of tables) {
      const result = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'compliance' AND table_name = $1
        ORDER BY ordinal_position
      `, [table]);
      
      console.log(`\n${table}:`);
      result.rows.forEach(row => console.log(`   - ${row.column_name}: ${row.data_type}`));
    }

    // Criar índices um por um
    console.log('\n📊 Criando índices...');
    
    const indexes = [
      { name: 'idx_investidores_cpf_cnpj', table: 'investidores', column: 'cpf_cnpj' },
      { name: 'idx_investidores_status', table: 'investidores', column: 'status_onboarding' },
      { name: 'idx_investidor_emissao_emissao', table: 'investidor_emissao', column: 'emissao_id' },
      { name: 'idx_investidor_emissao_cpf', table: 'investidor_emissao', column: 'cpf_cnpj' },
      { name: 'idx_tokens_onboarding_token', table: 'tokens_onboarding', column: 'token' },
    ];

    for (const idx of indexes) {
      try {
        await client.query(`CREATE INDEX IF NOT EXISTS ${idx.name} ON compliance.${idx.table}(${idx.column})`);
        console.log(`   ✅ ${idx.name}`);
      } catch (err) {
        console.log(`   ❌ ${idx.name}: ${err.message}`);
      }
    }

    // RLS e políticas
    console.log('\n🔒 Configurando RLS...');
    for (const table of tables) {
      try {
        await client.query(`ALTER TABLE compliance.${table} ENABLE ROW LEVEL SECURITY`);
        await client.query(`DROP POLICY IF EXISTS "Allow all" ON compliance.${table}`);
        await client.query(`CREATE POLICY "Allow all" ON compliance.${table} FOR ALL USING (true) WITH CHECK (true)`);
        console.log(`   ✅ ${table}`);
      } catch (err) {
        console.log(`   ❌ ${table}: ${err.message}`);
      }
    }

    // Permissões
    console.log('\n🔑 Configurando permissões...');
    await client.query('GRANT USAGE ON SCHEMA compliance TO anon, authenticated');
    await client.query('GRANT ALL ON ALL TABLES IN SCHEMA compliance TO anon, authenticated');
    await client.query('GRANT ALL ON ALL SEQUENCES IN SCHEMA compliance TO anon, authenticated');
    console.log('   ✅ Permissões configuradas!');

    console.log('\n🎉 Configuração completa!');

  } catch (err) {
    console.error('❌ Erro:', err.message);
  } finally {
    await client.end();
  }
}

fixIndexes();
