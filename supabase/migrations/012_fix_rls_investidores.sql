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
ALTER TABLE compliance.emissao_investidores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anonymous all" ON compliance.emissao_investidores;
CREATE POLICY "Allow anonymous all" ON compliance.emissao_investidores
  FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

-- Grant permissions
GRANT ALL ON compliance.investidores TO anon, authenticated;
GRANT ALL ON compliance.emissao_investidores TO anon, authenticated;
GRANT USAGE ON SCHEMA compliance TO anon, authenticated;
