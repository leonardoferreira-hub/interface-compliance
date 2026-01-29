-- =============================================
-- Schema de Compliance para Investidores
-- =============================================

-- Criar schema de compliance
CREATE SCHEMA IF NOT EXISTS compliance;

-- =============================================
-- Tabela: investidores
-- =============================================
CREATE TABLE IF NOT EXISTS compliance.investidores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cpf_cnpj VARCHAR(14) UNIQUE NOT NULL,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('pessoa_fisica', 'pessoa_juridica', 'institucional')),
  nome VARCHAR(255),
  email VARCHAR(255),
  telefone VARCHAR(20),
  dados_cadastrais JSONB,
  suitability JSONB,
  status_onboarding VARCHAR(20) DEFAULT 'pendente' CHECK (status_onboarding IN ('pendente', 'em_andamento', 'em_analise', 'completo', 'rejeitado')),
  token_origem VARCHAR(255),
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- Tabela: investidor_emissao (vínculo)
-- =============================================
CREATE TABLE IF NOT EXISTS compliance.investidor_emissao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  emissao_id UUID,
  investidor_id UUID REFERENCES compliance.investidores(id),
  cpf_cnpj VARCHAR(14) NOT NULL,
  tipo VARCHAR(20),
  status VARCHAR(30) DEFAULT 'aguardando_compliance' CHECK (status IN ('aguardando_compliance', 'em_analise', 'compliance_ok', 'rejeitado')),
  token_onboarding VARCHAR(255),
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- Tabela: investidor_documentos
-- =============================================
CREATE TABLE IF NOT EXISTS compliance.investidor_documentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investidor_id UUID REFERENCES compliance.investidores(id),
  tipo_documento VARCHAR(50),
  arquivo_path VARCHAR(500),
  status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'rejeitado')),
  observacao TEXT,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- Tabela: tokens_onboarding
-- =============================================
CREATE TABLE IF NOT EXISTS compliance.tokens_onboarding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token VARCHAR(255) UNIQUE NOT NULL,
  emissao_id UUID,
  investidor_id UUID REFERENCES compliance.investidores(id),
  usado BOOLEAN DEFAULT FALSE,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expira_em TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days')
);

-- =============================================
-- Índices
-- =============================================
CREATE INDEX IF NOT EXISTS idx_investidores_cpf_cnpj ON compliance.investidores(cpf_cnpj);
CREATE INDEX IF NOT EXISTS idx_investidores_status ON compliance.investidores(status_onboarding);
CREATE INDEX IF NOT EXISTS idx_investidor_emissao_emissao ON compliance.investidor_emissao(emissao_id);
CREATE INDEX IF NOT EXISTS idx_investidor_emissao_cpf ON compliance.investidor_emissao(cpf_cnpj);
CREATE INDEX IF NOT EXISTS idx_tokens_onboarding_token ON compliance.tokens_onboarding(token);

-- =============================================
-- RLS (Row Level Security)
-- =============================================
ALTER TABLE compliance.investidores ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance.investidor_emissao ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance.investidor_documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance.tokens_onboarding ENABLE ROW LEVEL SECURITY;

-- Políticas permissivas (ajustar para produção)
DROP POLICY IF EXISTS "Allow all investidores" ON compliance.investidores;
CREATE POLICY "Allow all investidores" ON compliance.investidores FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all investidor_emissao" ON compliance.investidor_emissao;
CREATE POLICY "Allow all investidor_emissao" ON compliance.investidor_emissao FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all investidor_documentos" ON compliance.investidor_documentos;
CREATE POLICY "Allow all investidor_documentos" ON compliance.investidor_documentos FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all tokens_onboarding" ON compliance.tokens_onboarding;
CREATE POLICY "Allow all tokens_onboarding" ON compliance.tokens_onboarding FOR ALL USING (true) WITH CHECK (true);

-- =============================================
-- Trigger para atualizar atualizado_em
-- =============================================
CREATE OR REPLACE FUNCTION compliance.update_atualizado_em()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_investidores_atualizado ON compliance.investidores;
CREATE TRIGGER trigger_investidores_atualizado
  BEFORE UPDATE ON compliance.investidores
  FOR EACH ROW
  EXECUTE FUNCTION compliance.update_atualizado_em();

-- =============================================
-- Expor tabelas via API (PostgREST)
-- =============================================
GRANT USAGE ON SCHEMA compliance TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA compliance TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA compliance TO anon, authenticated;

-- Adicionar schema ao search_path do PostgREST
-- (isso precisa ser feito nas configurações do projeto Supabase)
