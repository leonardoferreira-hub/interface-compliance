-- Migration: 007_create_emissao_investidores.sql
-- Descrição: Cria a tabela de relacionamento entre emissões e investidores
-- Autor: Sistema Interface Compliance
-- Data: 2025-01-20

-- ============================================
-- TABELA: compliance.emissao_investidores
-- ============================================
-- Tabela de relacionamento N:N entre emissões e investidores.
-- Cada investidor pode participar de múltiplas emissões, e cada
-- emissão pode ter múltiplos investidores.
-- 
-- Funcionalidades:
-- - Geração de token único para cadastro do investidor na emissão
-- - Link personalizado de cadastro
-- - Controle de status do cadastro por emissão
-- ============================================

CREATE TABLE IF NOT EXISTS compliance.emissao_investidores (
    -- Identificação
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- ============================================
    -- CHAVES ESTRANGEIRAS
    -- ============================================
    -- ID da emissão (referência para compliance.emissoes)
    emissao_id UUID NOT NULL,
    
    -- ID do investidor (referência para compliance.investidores)
    -- Pode ser NULL inicialmente (quando o link é gerado mas o investidor ainda não cadastrou)
    investidor_id UUID,
    
    -- ============================================
    -- TOKEN E LINK DE CADASTRO
    -- ============================================
    -- Token único para acesso ao formulário de cadastro
    -- Gerado automaticamente pela função gerar_link_cadastro()
    token_cadastro VARCHAR(64) NOT NULL UNIQUE,
    
    -- ============================================
    -- STATUS DO CADASTRO
    -- ============================================
    -- Status do cadastro do investidor nesta emissão específica:
    -- - LINK_GERADO: Link foi gerado, aguardando acesso do investidor
    -- - EMAIL_ENVIADO: Email com link foi enviado ao investidor
    -- - EMAIL_ERRO: Falha ao enviar email
    -- - ACESSADO: Investidor acessou o link
    -- - INICIADO: Investidor iniciou o preenchimento do formulário
    -- - DADOS_PREENCHIDOS: Investidor preencheu os dados básicos
    -- - DOCUMENTOS_ENVIADOS: Documentos foram enviados
    -- - EM_ANALISE: Cadastro em análise pela equipe
    -- - APROVADO: Cadastro aprovado para esta emissão
    -- - REPROVADO: Cadastro reprovado
    -- - EXPIRADO: Link expirou (tempo limite excedido)
    -- - CANCELADO: Cadastro cancelado
    -- ============================================
    status_cadastro VARCHAR(30) NOT NULL DEFAULT 'LINK_GERADO'
        CHECK (status_cadastro IN (
            'LINK_GERADO',
            'EMAIL_ENVIADO', 
            'EMAIL_ERRO',
            'ACESSADO',
            'INICIADO',
            'DADOS_PREENCHIDOS',
            'DOCUMENTOS_ENVIADOS',
            'EM_ANALISE',
            'APROVADO',
            'REPROVADO',
            'EXPIRADO',
            'CANCELADO'
        )),
    
    -- Link completo de cadastro (gerado automaticamente)
    -- Exemplo: https://app.compliance.com/cadastro/emissao/abc123?token=xyz789
    link_cadastro TEXT,
    
    -- ============================================
    -- CONTROLE DE ENVIO DE EMAIL
    -- ============================================
    -- Data/hora do último envio de email
    data_ultimo_email TIMESTAMPTZ,
    
    -- Contador de tentativas de envio de email
    tentativas_email INTEGER DEFAULT 0,
    
    -- ID da mensagem/email no sistema de envio (para rastreamento)
    message_id VARCHAR(255),
    
    -- ============================================
    -- CONTROLE DE ACESSO
    -- ============================================
    -- Data/hora do primeiro acesso ao link
    data_primeiro_acesso TIMESTAMPTZ,
    
    -- Data/hora do último acesso ao link
    data_ultimo_acesso TIMESTAMPTZ,
    
    -- IP do último acesso (para segurança/auditoria)
    ip_ultimo_acesso INET,
    
    -- ============================================
    -- DADOS DE PRE-CADASTRO (opcional)
    -- ============================================
    -- Dados conhecidos do investidor antes do cadastro completo
    -- Usado quando o gestor já tem informações básicas
    pre_cadastro JSONB DEFAULT NULL,
    
    -- Estrutura esperada para pre_cadastro:
    -- {
    --   "nome": "string",
    --   "email": "string",
    --   "telefone": "string",
    --   "cpf": "string (opcional)",
    --   "cnpj": "string (opcional)",
    --   "tipo_investidor": "PF|PJ|INSTITUCIONAL",
    --   "valor_previsto": "number",
    --   "observacoes": "string",
    --   "indicado_por": "string"
    -- }
    
    -- ============================================
    -- VALOR INVESTIDO (após aprovação)
    -- ============================================
    -- Valor efetivamente investido na emissão (preenchido após aprovação)
    valor_investido DECIMAL(18, 2),
    
    -- Data da aprovação do investimento
    data_aprovacao_investimento TIMESTAMPTZ,
    
    -- ============================================
    -- METADADOS
    -- ============================================
    -- ID do usuário que gerou o link/cadastrou o investidor
    criado_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Observações internas
    observacoes TEXT,
    
    -- ============================================
    -- TIMESTAMPS
    -- ============================================
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- ============================================
    -- CONSTRAINTS
    -- ============================================
    -- Constraint para garantir que emissao_id existe na tabela de emissões
    -- Nota: Descomente se a tabela compliance.emissoes existir
    -- CONSTRAINT fk_emissao_investidores_emissao
    --     FOREIGN KEY (emissao_id) 
    --     REFERENCES compliance.emissoes(id) 
    --     ON DELETE CASCADE,
    
    -- Constraint para garantir que investidor_id existe na tabela de investidores (quando não for NULL)
    CONSTRAINT fk_emissao_investidores_investidor
        FOREIGN KEY (investidor_id) 
        REFERENCES compliance.investidores(id) 
        ON DELETE SET NULL,
    
    -- Constraint única para evitar duplicidade de investidor na mesma emissão
    CONSTRAINT uq_emissao_investidor 
        UNIQUE (emissao_id, investidor_id)
        DEFERRABLE INITIALLY DEFERRED
);

-- ============================================
-- COMENTÁRIOS DA TABELA E COLUNAS
-- ============================================
COMMENT ON TABLE compliance.emissao_investidores IS 'Tabela de relacionamento N:N entre emissões e investidores, com controle de token/link de cadastro';
COMMENT ON COLUMN compliance.emissao_investidores.id IS 'UUID único do registro de relacionamento';
COMMENT ON COLUMN compliance.emissao_investidores.emissao_id IS 'ID da emissão (referência para compliance.emissoes)';
COMMENT ON COLUMN compliance.emissao_investidores.investidor_id IS 'ID do investidor (NULL até que o investidor complete o cadastro)';
COMMENT ON COLUMN compliance.emissao_investidores.token_cadastro IS 'Token único de acesso ao formulário de cadastro';
COMMENT ON COLUMN compliance.emissao_investidores.status_cadastro IS 'Status atual do cadastro do investidor nesta emissão';
COMMENT ON COLUMN compliance.emissao_investidores.link_cadastro IS 'Link completo de acesso ao formulário de cadastro';
COMMENT ON COLUMN compliance.emissao_investidores.data_ultimo_email IS 'Data/hora do último envio de email ao investidor';
COMMENT ON COLUMN compliance.emissao_investidores.tentativas_email IS 'Número de tentativas de envio de email';
COMMENT ON COLUMN compliance.emissao_investidores.data_primeiro_acesso IS 'Data/hora do primeiro acesso ao link de cadastro';
COMMENT ON COLUMN compliance.emissao_investidores.data_ultimo_acesso IS 'Data/hora do último acesso ao link de cadastro';
COMMENT ON COLUMN compliance.emissao_investidores.pre_cadastro IS 'Dados pré-cadastrados do investidor (se houver)';
COMMENT ON COLUMN compliance.emissao_investidores.valor_investido IS 'Valor efetivamente investido na emissão';
COMMENT ON COLUMN compliance.emissao_investidores.data_aprovacao_investimento IS 'Data de aprovação do investimento';
COMMENT ON COLUMN compliance.emissao_investidores.criado_por IS 'ID do usuário que criou o vínculo';

-- ============================================
-- INDEXES
-- ============================================

-- Index para busca por emissão_id (uso mais frequente)
CREATE INDEX IF NOT EXISTS idx_emissao_investidores_emissao 
ON compliance.emissao_investidores(emissao_id);

-- Index para busca por token (uso crítico na validação do link)
CREATE INDEX IF NOT EXISTS idx_emissao_investidores_token 
ON compliance.emissao_investidores(token_cadastro);

-- Index para busca por investidor_id
CREATE INDEX IF NOT EXISTS idx_emissao_investidores_investidor 
ON compliance.emissao_investidores(investidor_id) 
WHERE investidor_id IS NOT NULL;

-- Index para busca por status de cadastro
CREATE INDEX IF NOT EXISTS idx_emissao_investidores_status 
ON compliance.emissao_investidores(status_cadastro);

-- Index composto para busca de emissão + status (relatórios comuns)
CREATE INDEX IF NOT EXISTS idx_emissao_investidores_emissao_status 
ON compliance.emissao_investidores(emissao_id, status_cadastro);

-- Index para busca de tokens ativos (não expirados/cancelados)
CREATE INDEX IF NOT EXISTS idx_emissao_investidores_token_ativo 
ON compliance.emissao_investidores(token_cadastro) 
WHERE status_cadastro NOT IN ('EXPIRADO', 'CANCELADO', 'APROVADO', 'REPROVADO');

-- Index para busca por data de criação
CREATE INDEX IF NOT EXISTS idx_emissao_investidores_created 
ON compliance.emissao_investidores(created_at DESC);

-- Index para busca por quem criou
CREATE INDEX IF NOT EXISTS idx_emissao_investidores_criador 
ON compliance.emissao_investidores(criado_por);

-- Index GIN para busca em pre_cadastro JSONB
CREATE INDEX IF NOT EXISTS idx_emissao_investidores_pre_cadastro 
ON compliance.emissao_investidores USING GIN(pre_cadastro) 
WHERE pre_cadastro IS NOT NULL;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE compliance.emissao_investidores ENABLE ROW LEVEL SECURITY;

-- Política: Analistas podem ver todos os registros
CREATE POLICY "Analistas podem visualizar todos os vínculos"
ON compliance.emissao_investidores
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM auth.users
        WHERE auth.users.id = auth.uid()
        AND auth.users.raw_user_meta_data->>'role' IN ('admin', 'analista', 'compliance', 'gestor')
    )
);

-- Política: Analistas podem criar novos vínculos
CREATE POLICY "Analistas podem criar vínculos"
ON compliance.emissao_investidores
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM auth.users
        WHERE auth.users.id = auth.uid()
        AND auth.users.raw_user_meta_data->>'role' IN ('admin', 'analista', 'compliance', 'gestor')
    )
);

-- Política: Analistas podem atualizar vínculos
CREATE POLICY "Analistas podem atualizar vínculos"
ON compliance.emissao_investidores
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM auth.users
        WHERE auth.users.id = auth.uid()
        AND auth.users.raw_user_meta_data->>'role' IN ('admin', 'analista', 'compliance', 'gestor')
    )
);

-- Política: Serviço pode validar token (para acesso público via link)
CREATE POLICY "Serviço pode validar token"
ON compliance.emissao_investidores
FOR SELECT
TO service_role
USING (true);

-- ============================================
-- TRIGGER PARA ATUALIZAR updated_at
-- ============================================
-- Criado na migration 008_create_functions.sql

-- ============================================
-- FIM DA MIGRATION
-- ============================================
