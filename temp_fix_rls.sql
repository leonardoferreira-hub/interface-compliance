-- Fix RLS for investidores
ALTER TABLE compliance.investidores DISABLE ROW LEVEL SECURITY;
GRANT ALL ON compliance.investidores TO anon, authenticated;
GRANT ALL ON compliance.emissao_investidores TO anon, authenticated;
GRANT USAGE ON SCHEMA compliance TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA compliance TO anon, authenticated;
