const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://gthtvpujwukbfgokghne.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0aHR2cHVqd3VrYmZnb2tnaG5lIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzcwNTgyNiwiZXhwIjoyMDgzMjgxODI2fQ.kJmT5XJwKqbnGgkpHLqpxcKv9ivE6s-x_Ov1CEoH1xk'
);

async function fixRLS() {
  const sql = `
    -- Permitir INSERT anônimo na tabela investidores (compliance schema)
    ALTER TABLE compliance.investidores ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Allow anonymous insert" ON compliance.investidores;
    CREATE POLICY "Allow anonymous insert" ON compliance.investidores
      FOR INSERT TO anon, authenticated
      WITH CHECK (true);

    DROP POLICY IF EXISTS "Allow anonymous select" ON compliance.investidores;
    CREATE POLICY "Allow anonymous select" ON compliance.investidores
      FOR SELECT TO anon, authenticated
      USING (true);

    DROP POLICY IF EXISTS "Allow anonymous update" ON compliance.investidores;
    CREATE POLICY "Allow anonymous update" ON compliance.investidores
      FOR UPDATE TO anon, authenticated
      USING (true) WITH CHECK (true);

    -- Também para emissao_investidores
    DROP POLICY IF EXISTS "Allow anonymous all" ON compliance.emissao_investidores;
    CREATE POLICY "Allow anonymous all" ON compliance.emissao_investidores
      FOR ALL TO anon, authenticated
      USING (true) WITH CHECK (true);

    -- Grant permissions
    GRANT ALL ON compliance.investidores TO anon, authenticated;
    GRANT ALL ON compliance.emissao_investidores TO anon, authenticated;
    GRANT USAGE ON SCHEMA compliance TO anon, authenticated;
  `;

  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
  
  if (error) {
    console.log('Erro no RPC, tentando via query direta...');
    
    // Tentar queries individuais
    const queries = sql.split(';').filter(q => q.trim());
    for (const query of queries) {
      if (query.trim()) {
        const { error: e } = await supabase.from('_exec').select('*').limit(0);
        // Can't exec raw SQL via client, need different approach
      }
    }
    
    console.log('Erro:', error.message);
    console.log('Use o SQL Editor no Supabase Dashboard para executar o SQL manualmente.');
    console.log('SQL a executar:');
    console.log(sql);
  } else {
    console.log('RLS configurado com sucesso!');
  }
}

fixRLS();
