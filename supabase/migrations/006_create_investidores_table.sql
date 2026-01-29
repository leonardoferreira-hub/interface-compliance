-- Migration: 006_create_investidores_table.sql
-- Descrição: Cria a tabela de investidores (PF/PJ/Institucional) para o módulo de compliance
-- Autor: Sistema Interface Compliance
-- Data: 2025-01-20

-- ============================================
-- TABELA: compliance.investidores
-- ============================================
-- Armazena dados de investidores de diferentes tipos:
-- - PF (Pessoa Física)
-- - PJ (Pessoa Jurídica)
-- - Institucional
-- ============================================

CREATE TABLE IF NOT EXISTS compliance.investidores (
    -- Identificação
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Tipo do investidor
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('PF', 'PJ', 'INSTITUCIONAL')),
    
    -- ============================================
    -- DADOS PESSOA FÍSICA (JSON)
    -- ============================================
    -- Estrutura esperada:
    -- {
    --   "nome_completo": "string",
    --   "cpf": "string (11 dígitos)",
    --   "rg": "string",
    --   "orgao_expedidor": "string",
    --   "data_nascimento": "YYYY-MM-DD",
    --   "nacionalidade": "string",
    --   "estado_civil": "string",
    --   "profissao": "string",
    --   "renda_mensal": "number",
    --   "patrimonio": "number",
    --   "email": "string",
    --   "telefone": "string",
    --   "celular": "string",
    --   "endereco": {
    --     "cep": "string",
    --     "logradouro": "string",
    --     "numero": "string",
    --     "complemento": "string",
    --     "bairro": "string",
    --     "cidade": "string",
    --     "estado": "string"
    --   }
    -- }
    -- ============================================
    dados_pf JSONB DEFAULT NULL,
    
    -- ============================================
    -- DADOS PESSOA JURÍDICA (JSON)
    -- ============================================
    -- Estrutura esperada:
    -- {
    --   "razao_social": "string",
    --   "nome_fantasia": "string",
    --   "cnpj": "string (14 dígitos)",
    --   "inscricao_estadual": "string",
    --   "inscricao_municipal": "string",
    --   "data_constituicao": "YYYY-MM-DD",
    --   "natureza_juridica": "string",
    --   "cnae_principal": "string",
    --   "cnaes_secundarios": ["string"],
    --   "capital_social": "number",
    --   "faturamento_anual": "number",
    --   "email": "string",
    --   "telefone": "string",
    --   "endereco": {
    --     "cep": "string",
    --     "logradouro": "string",
    --     "numero": "string",
    --     "complemento": "string",
    --     "bairro": "string",
    --     "cidade": "string",
    --     "estado": "string"
    --   },
    --   "socios": [
    --     {
    --       "nome": "string",
    --       "cpf": "string",
    --       "cargo": "string",
    --       "percentual_participacao": "number"
    --     }
    --   ],
    --   "representantes_legais": [
    --     {
    --       "nome": "string",
    --       "cpf": "string",
    --       "cargo": "string",
    --       "email": "string",
    --       "telefone": "string"
    --     }
    --   ]
    -- }
    -- ============================================
    dados_pj JSONB DEFAULT NULL,
    
    -- ============================================
    -- DADOS INSTITUCIONAL (JSON)
    -- ============================================
    -- Estrutura esperada:
    -- {
    --   "razao_social": "string",
    --   "nome_fantasia": "string",
    --   "cnpj": "string (14 dígitos)",
    --   "tipo_instituicao": "string (fundo, seguradora, banco, etc.)",
    --   "categoria_cvm": "string",
    --   "registro_cvm": "string",
    --   "data_constituicao": "YYYY-MM-DD",
    --   "patrimonio_liquido": "number",
    --   "ativos_sob_gestao": "number",
    --   "email": "string",
    --   "telefone": "string",
    --   "endereco": {
    --     "cep": "string",
    --     "logradouro": "string",
    --     "numero": "string",
    --     "complemento": "string",
    --     "bairro": "string",
    --     "cidade": "string",
    --     "estado": "string"
    --   },
    --   "administrador": {
    --     "razao_social": "string",
    --     "cnpj": "string",
    --     "nome_responsavel": "string",
    --     "email_responsavel": "string",
    --     "telefone_responsavel": "string"
    --   },
    --   "gestor": {
    --     "razao_social": "string",
    --     "cnpj": "string",
    --     "nome_responsavel": "string",
    --     "email_responsavel": "string"
    --   },
    --   "custodiante": {
    --     "razao_social": "string",
    --     "cnpj": "string"
    --   },
    --   "auditor": {
    --     "razao_social": "string",
    --     "cnpj": "string"
    --   }
    -- }
    -- ============================================
    dados_institucional JSONB DEFAULT NULL,
    
    -- ============================================
    -- SUITABILITY (JSON)
    -- ============================================
    -- Estrutura esperada:
    -- {
    --   "perfil": "string (conservador, moderado, arrojado, sofisticado)",
    --   "score": "number (0-100)",
    --   "horizonte_tempo": "string (curto, medio, longo)",
    --   "tolerancia_risco": "string (baixa, media, alta)",
    --   "objetivo_investimento": "string",
    --   "experiencia_mercado": "string",
    --   "conhecimento_financeiro": "string",
    --   "respostas_questionario": [
    --     {
    --       "pergunta_id": "string",
    --       "resposta": "string",
    --       "peso": "number"
    --     }
    --   ],
    --   "data_avaliacao": "YYYY-MM-DD",
    --   "validade": "YYYY-MM-DD",
    --   "avaliador": "string"
    -- }
    -- ============================================
    suitability JSONB DEFAULT NULL,
    
    -- ============================================
    -- DOCUMENTOS (JSON)
    -- ============================================
    -- Estrutura esperada:
    -- {
    --   "documentos_pf": [
    --     {
    --       "tipo": "string (rg, cpf, comprovante_residencia, holerite, etc.)",
    --       "nome_arquivo": "string",
    --       "url": "string",
    --       "tamanho": "number (bytes)",
    --       "mime_type": "string",
    --       "data_upload": "YYYY-MM-DDTHH:mm:ss",
    --       "status": "string (pendente, aprovado, rejeitado)",
    --       "observacao": "string"
    --     }
    --   ],
    --   "documentos_pj": [
    --     {
    --       "tipo": "string (contrato_social, cartao_cnpj, balanco, etc.)",
    --       "nome_arquivo": "string",
    --       "url": "string",
    --       "tamanho": "number (bytes)",
    --       "mime_type": "string",
    --       "data_upload": "YYYY-MM-DDTHH:mm:ss",
    --       "status": "string (pendente, aprovado, rejeitado)",
    --       "observacao": "string"
    --     }
    --   ],
    --   "documentos_institucional": [
    --     {
    --       "tipo": "string (regulamento_fundo, lâmina, etc.)",
    --       "nome_arquivo": "string",
    --       "url": "string",
    --       "tamanho": "number (bytes)",
    --       "mime_type": "string",
    --       "data_upload": "YYYY-MM-DDTHH:mm:ss",
    --       "status": "string (pendente, aprovado, rejeitado)",
    --       "observacao": "string"
    --     }
    --   ],
    --   "assinaturas": [
    --     {
    --       "tipo": "string (termo_adesao, contrato, etc.)",
    --       "nome_arquivo": "string",
    --       "url": "string",
    --       "data_assinatura": "YYYY-MM-DDTHH:mm:ss",
    --       "assinante": "string",
    --       "ip_assinatura": "string"
    --     }
    --   ]
    -- }
    -- ============================================
    documentos JSONB DEFAULT '{
        "documentos_pf": [],
        "documentos_pj": [],
        "documentos_institucional": [],
        "assinaturas": []
    }'::jsonb,
    
    -- ============================================
    -- STATUS E CONTROLE
    -- ============================================
    -- Status do cadastro do investidor:
    -- - PENDENTE: Cadastro iniciado, aguardando documentos
    -- - EM_ANALISE: Documentos enviados, em análise
    -- - APROVADO: Cadastro aprovado
    -- - REPROVADO: Cadastro reprovado
    -- - CANCELADO: Cadastro cancelado
    -- - BLOQUEADO: Cadastro bloqueado temporariamente
    -- ============================================
    status VARCHAR(20) NOT NULL DEFAULT 'PENDENTE' 
        CHECK (status IN ('PENDENTE', 'EM_ANALISE', 'APROVADO', 'REPROVADO', 'CANCELADO', 'BLOQUEADO')),
    
    -- ID do analista responsável pela aprovação
    analista_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Data da análise/aprovação
    data_analise TIMESTAMPTZ,
    
    -- Motivo da reprovação (quando aplicável)
    motivo_reprovacao TEXT,
    
    -- ============================================
    -- TIMESTAMPS
    -- ============================================
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- COMENTÁRIOS DA TABELA E COLUNAS
-- ============================================
COMMENT ON TABLE compliance.investidores IS 'Tabela de investidores (PF, PJ e Institucional) do módulo de compliance';
COMMENT ON COLUMN compliance.investidores.id IS 'UUID único do investidor';
COMMENT ON COLUMN compliance.investidores.tipo IS 'Tipo do investidor: PF (Pessoa Física), PJ (Pessoa Jurídica) ou INSTITUCIONAL';
COMMENT ON COLUMN compliance.investidores.dados_pf IS 'Dados do investidor pessoa física em formato JSON';
COMMENT ON COLUMN compliance.investidores.dados_pj IS 'Dados do investidor pessoa jurídica em formato JSON';
COMMENT ON COLUMN compliance.investidores.dados_institucional IS 'Dados do investidor institucional em formato JSON';
COMMENT ON COLUMN compliance.investidores.suitability IS 'Dados de suitability/perfil do investidor em formato JSON';
COMMENT ON COLUMN compliance.investidores.documentos IS 'Lista de documentos enviados pelo investidor em formato JSON';
COMMENT ON COLUMN compliance.investidores.status IS 'Status atual do cadastro do investidor';
COMMENT ON COLUMN compliance.investidores.analista_id IS 'ID do usuário analista responsável pela aprovação';
COMMENT ON COLUMN compliance.investidores.data_analise IS 'Data/hora da análise/aprovação do cadastro';
COMMENT ON COLUMN compliance.investidores.motivo_reprovacao IS 'Motivo da reprovação (quando status = REPROVADO)';

-- ============================================
-- INDEXES
-- ============================================

-- Index para busca por CPF (investidor PF)
CREATE INDEX IF NOT EXISTS idx_investidores_cpf 
ON compliance.investidores((dados_pf->>'cpf')) 
WHERE tipo = 'PF';

-- Index para busca por CNPJ (investidor PJ)
CREATE INDEX IF NOT EXISTS idx_investidores_cnpj_pj 
ON compliance.investidores((dados_pj->>'cnpj')) 
WHERE tipo = 'PJ';

-- Index para busca por CNPJ (investidor Institucional)
CREATE INDEX IF NOT EXISTS idx_investidores_cnpj_inst 
ON compliance.investidores((dados_institucional->>'cnpj')) 
WHERE tipo = 'INSTITUCIONAL';

-- Index para busca por status (filtragem comum)
CREATE INDEX IF NOT EXISTS idx_investidores_status 
ON compliance.investidores(status);

-- Index para busca por tipo
CREATE INDEX IF NOT EXISTS idx_investidores_tipo 
ON compliance.investidores(tipo);

-- Index para busca por analista
CREATE INDEX IF NOT EXISTS idx_investidores_analista 
ON compliance.investidores(analista_id) 
WHERE analista_id IS NOT NULL;

-- Index para busca por data de criação
CREATE INDEX IF NOT EXISTS idx_investidores_created_at 
ON compliance.investidores(created_at DESC);

-- Index GIN para busca em campos JSONB
CREATE INDEX IF NOT EXISTS idx_investidores_dados_pf_gin 
ON compliance.investidores USING GIN(dados_pf) 
WHERE tipo = 'PF';

CREATE INDEX IF NOT EXISTS idx_investidores_dados_pj_gin 
ON compliance.investidores USING GIN(dados_pj) 
WHERE tipo = 'PJ';

CREATE INDEX IF NOT EXISTS idx_investidores_dados_inst_gin 
ON compliance.investidores USING GIN(dados_institucional) 
WHERE tipo = 'INSTITUCIONAL';

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
-- Habilita RLS para controle de acesso
ALTER TABLE compliance.investidores ENABLE ROW LEVEL SECURITY;

-- Política: Analistas podem ver todos os investidores
CREATE POLICY "Analistas podem visualizar todos investidores"
ON compliance.investidores
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM auth.users
        WHERE auth.users.id = auth.uid()
        AND auth.users.raw_user_meta_data->>'role' IN ('admin', 'analista', 'compliance')
    )
);

-- Política: Analistas podem atualizar investidores
CREATE POLICY "Analistas podem atualizar investidores"
ON compliance.investidores
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM auth.users
        WHERE auth.users.id = auth.uid()
        AND auth.users.raw_user_meta_data->>'role' IN ('admin', 'analista', 'compliance')
    )
);

-- Política: Usuários podem ver apenas seus próprios dados (via vínculo futuro)
-- Esta política será ativada quando houver vínculo entre usuário e investidor
-- CREATE POLICY "Usuários veem próprio investidor"
-- ON compliance.investidores
-- FOR SELECT
-- TO authenticated
-- USING (id = (SELECT investidor_id FROM compliance.usuario_investidor WHERE usuario_id = auth.uid()));

-- ============================================
-- TRIGGERS
-- ============================================
-- Trigger para atualizar updated_at (função definida em migration separada)
-- CREATE TRIGGER trg_investidores_updated_at
--     BEFORE UPDATE ON compliance.investidores
--     FOR EACH ROW
--     EXECUTE FUNCTION compliance.update_updated_at_column();

-- ============================================
-- FIM DA MIGRATION
-- ============================================
