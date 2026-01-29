-- ============================================================================
-- MIGRATION: 001_create_compliance_indexes.sql
-- DATA: 2026-01-29
-- DESCRIÇÃO: Cria índices faltantes nas tabelas do compliance para melhorar
--            performance de queries frequentes
-- ============================================================================

-- ----------------------------------------------------------------------------
-- ÍNDICES PARA TABELA public.emissoes
-- ----------------------------------------------------------------------------

-- Índice para buscas por status (muito utilizado em dashboards e filtros)
CREATE INDEX IF NOT EXISTS idx_emissoes_status 
ON public.emissoes(status);

-- Índice para buscas por número de emissão (busca única frequente)
CREATE INDEX IF NOT EXISTS idx_emissoes_numero_emissao 
ON public.emissoes(numero_emissao);

-- Índice composto para queries de listagem com ordenação por data
CREATE INDEX IF NOT EXISTS idx_emissoes_status_criado_em 
ON public.emissoes(status, criado_em DESC);

-- Índice para buscas por operador/criador
CREATE INDEX IF NOT EXISTS idx_emissoes_criado_por 
ON public.emissoes(criado_por);

-- ----------------------------------------------------------------------------
-- ÍNDICES PARA TABELA estruturacao.operacoes
-- ----------------------------------------------------------------------------

-- Índice para join com emissoes (chave estrangeira lógica)
CREATE INDEX IF NOT EXISTS idx_operacoes_id_emissao_comercial 
ON estruturacao.operacoes(id_emissao_comercial);

-- Índice para buscas por status da operação
CREATE INDEX IF NOT EXISTS idx_operacoes_status 
ON estruturacao.operacoes(status);

-- Índice para buscas por número de emissão
CREATE INDEX IF NOT EXISTS idx_operacoes_numero_emissao 
ON estruturacao.operacoes(numero_emissao);

-- Índice composto para queries de listagem com ordenação
CREATE INDEX IF NOT EXISTS idx_operacoes_status_atualizado_em 
ON estruturacao.operacoes(status, atualizado_em DESC);

-- Índice para buscas por analista responsável
CREATE INDEX IF NOT EXISTS idx_operacoes_analista_gestao_id 
ON estruturacao.operacoes(analista_gestao_id);

-- ----------------------------------------------------------------------------
-- ÍNDICES PARA TABELA estruturacao.pendencias
-- ----------------------------------------------------------------------------

-- Índice para join com operações
CREATE INDEX IF NOT EXISTS idx_pendencias_operacao_id 
ON estruturacao.pendencias(operacao_id);

-- Índice para buscas por status de pendência
CREATE INDEX IF NOT EXISTS idx_pendencias_status 
ON estruturacao.pendencias(status);

-- Índice para buscas por responsável
CREATE INDEX IF NOT EXISTS idx_pendencias_responsavel_id 
ON estruturacao.pendencias(responsavel_id);

-- Índice composto para listar pendências pendentes ordenadas por prioridade/data
CREATE INDEX IF NOT EXISTS idx_pendencias_status_prioridade_criado_em 
ON estruturacao.pendencias(status, prioridade, criado_em DESC) 
WHERE status = 'Pendente';

-- ----------------------------------------------------------------------------
-- ÍNDICES PARA TABELA estruturacao.analistas_gestao
-- ----------------------------------------------------------------------------

-- Índice para buscas por usuário do Supabase Auth
CREATE INDEX IF NOT EXISTS idx_analistas_gestao_user_id 
ON estruturacao.analistas_gestao(user_id);

-- Índice para buscas por status ativo
CREATE INDEX IF NOT EXISTS idx_analistas_gestao_ativo 
ON estruturacao.analistas_gestao(ativo) 
WHERE ativo = true;

-- ----------------------------------------------------------------------------
-- ÍNDICES PARA TABELAS DE RELACIONAMENTO (se existirem)
-- ----------------------------------------------------------------------------

-- Índice para tabela de investidores (se existir)
CREATE INDEX IF NOT EXISTS idx_investidores_emissao_id 
ON public.investidores(emissao_id);

CREATE INDEX IF NOT EXISTS idx_investidores_cpf_cnpj 
ON public.investidores(cpf_cnpj);

-- Índice para tabela de documentos (se existir)
CREATE INDEX IF NOT EXISTS idx_documentos_emissao_id 
ON public.documentos(emissao_id);

CREATE INDEX IF NOT EXISTS idx_documentos_tipo_status 
ON public.documentos(tipo, status);

-- ----------------------------------------------------------------------------
-- ÍNDICES FULL-TEXT (para buscas textuais)
-- ----------------------------------------------------------------------------

-- Índice GIN para busca full-text em nomes de operações
CREATE INDEX IF NOT EXISTS idx_operacoes_nome_operacao_gin 
ON estruturacao.operacoes USING gin(to_tsvector('portuguese', nome_operacao));

-- Índice GIN para busca full-text em nomes de emissões
CREATE INDEX IF NOT EXISTS idx_emissoes_nome_gin 
ON public.emissoes USING gin(to_tsvector('portuguese', nome));

-- ----------------------------------------------------------------------------
-- COMENTÁRIOS DOCUMENTANDO OS ÍNDICES
-- ----------------------------------------------------------------------------

COMMENT ON INDEX idx_emissoes_status IS 'Otimiza filtros por status em dashboards';
COMMENT ON INDEX idx_emissoes_numero_emissao IS 'Otimiza buscas por emissão específica';
COMMENT ON INDEX idx_emissoes_status_criado_em IS 'Otimiza listagens paginadas com ordenação';
COMMENT ON INDEX idx_operacoes_id_emissao_comercial IS 'Otimiza joins entre operacoes e emissoes';
COMMENT ON INDEX idx_operacoes_status_atualizado_em IS 'Otimiza queries de acompanhamento de status';
COMMENT ON INDEX idx_pendencias_status_prioridade_criado_em IS 'Otimiza listagem de pendências pendentes ordenadas';

-- ----------------------------------------------------------------------------
-- VERIFICAÇÃO: Listar índices criados
-- ----------------------------------------------------------------------------
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname IN ('public', 'estruturacao')
AND indexname LIKE 'idx_%'
ORDER BY schemaname, tablename, indexname;
