-- ============================================================================
-- MIGRATION: 002_optimize_get_investidores_emissao.sql
-- DATA: 2026-01-29
-- DESCRIÇÃO: Otimiza a função get_investidores_emissao criando uma Materialized
--            View para cachear resultados e melhorar performance
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. CRIAR MATERIALIZED VIEW PARA CACHE DE INVESTIDORES POR EMISSÃO
-- ----------------------------------------------------------------------------

-- Dropar view existente se necessário (para recriar com novas colunas)
DROP MATERIALIZED VIEW IF EXISTS compliance.mv_investidores_emissao CASCADE;

-- Criar materialized view com dados agregados de investidores por emissão
CREATE MATERIALIZED VIEW compliance.mv_investidores_emissao AS
SELECT 
    e.id AS emissao_id,
    e.numero_emissao,
    e.nome AS emissao_nome,
    e.status AS emissao_status,
    COUNT(i.id) AS total_investidores,
    COUNT(CASE WHEN i.status = 'Ativo' THEN 1 END) AS investidores_ativos,
    COUNT(CASE WHEN i.status = 'Pendente' THEN 1 END) AS investidores_pendentes,
    COUNT(CASE WHEN i.status = 'Cancelado' THEN 1 END) AS investidores_cancelados,
    COALESCE(SUM(CASE WHEN i.status = 'Ativo' THEN i.valor_investido ELSE 0 END), 0) AS total_valor_investido,
    COALESCE(SUM(CASE WHEN i.status = 'Ativo' THEN i.valor_cotas ELSE 0 END), 0) AS total_cotas,
    MAX(i.atualizado_em) AS ultima_atualizacao_investidor,
    jsonb_agg(
        jsonb_build_object(
            'id', i.id,
            'nome', i.nome,
            'cpf_cnpj', i.cpf_cnpj,
            'status', i.status,
            'valor_investido', i.valor_investido,
            'valor_cotas', i.valor_cotas,
            'percentual', i.percentual,
            'atualizado_em', i.atualizado_em
        ) ORDER BY i.valor_investido DESC
    ) FILTER (WHERE i.id IS NOT NULL) AS investidores_json
FROM public.emissoes e
LEFT JOIN public.investidores i ON i.emissao_id = e.id
GROUP BY e.id, e.numero_emissao, e.nome, e.status;

-- Comentário na view
COMMENT ON MATERIALIZED VIEW compliance.mv_investidores_emissao IS 
'Cache materializado de investidores por emissão. Atualizar via refresh_mv_investidores_emissao()';

-- ----------------------------------------------------------------------------
-- 2. CRIAR ÍNDICES NA MATERIALIZED VIEW
-- ----------------------------------------------------------------------------

-- Índice único para concurrent refresh
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_investidores_emissao_emissao_id 
ON compliance.mv_investidores_emissao(emissao_id);

-- Índice para busca por número de emissão
CREATE INDEX IF NOT EXISTS idx_mv_investidores_emissao_numero 
ON compliance.mv_investidores_emissao(numero_emissao);

-- Índice para filtros por status
CREATE INDEX IF NOT EXISTS idx_mv_investidores_emissao_status 
ON compliance.mv_investidores_emissao(emissao_status);

-- Índice para ordenação por total investido
CREATE INDEX IF NOT EXISTS idx_mv_investidores_emissao_total_valor 
ON compliance.mv_investidores_emissao(total_valor_investido DESC);

-- ----------------------------------------------------------------------------
-- 3. CRIAR FUNÇÃO OTIMIZADA get_investidores_emissao
-- ----------------------------------------------------------------------------

-- Dropar função existente
DROP FUNCTION IF EXISTS public.get_investidores_emissao(UUID);

-- Criar função otimizada que usa a materialized view
CREATE OR REPLACE FUNCTION public.get_investidores_emissao(p_emissao_id UUID)
RETURNS TABLE (
    emissao_id UUID,
    numero_emissao VARCHAR,
    emissao_nome VARCHAR,
    emissao_status VARCHAR,
    total_investidores BIGINT,
    investidores_ativos BIGINT,
    investidores_pendentes BIGINT,
    investidores_cancelados BIGINT,
    total_valor_investido NUMERIC,
    total_cotas NUMERIC,
    ultima_atualizacao_investidor TIMESTAMP WITH TIME ZONE,
    investidores_json JSONB
) 
LANGUAGE plpgsql
STABLE  -- Indica que não modifica dados, permite otimização
SECURITY DEFINER
AS $$
BEGIN
    -- Usa a materialized view para resposta rápida
    RETURN QUERY
    SELECT 
        m.emissao_id,
        m.numero_emissao,
        m.emissao_nome,
        m.emissao_status,
        m.total_investidores,
        m.investidores_ativos,
        m.investidores_pendentes,
        m.investidores_cancelados,
        m.total_valor_investido,
        m.total_cotas,
        m.ultima_atualizacao_investidor,
        m.investidores_json
    FROM compliance.mv_investidores_emissao m
    WHERE m.emissao_id = p_emissao_id;
    
    -- Se não encontrou na MV, busca direto (fallback)
    IF NOT FOUND THEN
        RETURN QUERY
        SELECT 
            e.id,
            e.numero_emissao,
            e.nome,
            e.status,
            COUNT(i.id)::BIGINT,
            COUNT(CASE WHEN i.status = 'Ativo' THEN 1 END)::BIGINT,
            COUNT(CASE WHEN i.status = 'Pendente' THEN 1 END)::BIGINT,
            COUNT(CASE WHEN i.status = 'Cancelado' THEN 1 END)::BIGINT,
            COALESCE(SUM(CASE WHEN i.status = 'Ativo' THEN i.valor_investido ELSE 0 END), 0),
            COALESCE(SUM(CASE WHEN i.status = 'Ativo' THEN i.valor_cotas ELSE 0 END), 0),
            MAX(i.atualizado_em),
            jsonb_agg(
                jsonb_build_object(
                    'id', i.id,
                    'nome', i.nome,
                    'cpf_cnpj', i.cpf_cnpj,
                    'status', i.status,
                    'valor_investido', i.valor_investido,
                    'valor_cotas', i.valor_cotas,
                    'percentual', i.percentual,
                    'atualizado_em', i.atualizado_em
                ) ORDER BY i.valor_investido DESC
            ) FILTER (WHERE i.id IS NOT NULL)
        FROM public.emissoes e
        LEFT JOIN public.investidores i ON i.emissao_id = e.id
        WHERE e.id = p_emissao_id
        GROUP BY e.id, e.numero_emissao, e.nome, e.status;
    END IF;
END;
$$;

-- Comentário na função
COMMENT ON FUNCTION public.get_investidores_emissao(UUID) IS 
'Retorna dados agregados de investidores por emissão. Usa materialized view para performance.';

-- ----------------------------------------------------------------------------
-- 4. CRIAR FUNÇÃO PARA REFRESH DA MATERIALIZED VIEW
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION compliance.refresh_mv_investidores_emissao()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Refresh concurrent para não bloquear leituras
    REFRESH MATERIALIZED VIEW CONCURRENTLY compliance.mv_investidores_emissao;
END;
$$;

COMMENT ON FUNCTION compliance.refresh_mv_investidores_emissao() IS 
'Atualiza a materialized view de investidores. Deve ser chamada após alterações em investidores.';

-- ----------------------------------------------------------------------------
-- 5. CRIAR TRIGGER PARA REFRESH AUTOMÁTICO (OPCIONAL - DESCOMENTAR SE NECESSÁRIO)
-- ----------------------------------------------------------------------------

-- Função que dispara refresh após mudanças na tabela investidores
CREATE OR REPLACE FUNCTION compliance.trigger_refresh_mv_investidores()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Usar pg_background ou similar para refresh assíncrono
    -- Ou simplesmente marcar para refresh posterior
    PERFORM compliance.refresh_mv_investidores_emissao();
    RETURN NULL;
END;
$$;

-- Trigger de refresh (descomentar se quiser atualização em tempo real)
-- DROP TRIGGER IF EXISTS trg_refresh_mv_investidores ON public.investidores;
-- CREATE TRIGGER trg_refresh_mv_investidores
--     AFTER INSERT OR UPDATE OR DELETE ON public.investidores
--     FOR EACH STATEMENT
--     EXECUTE FUNCTION compliance.trigger_refresh_mv_investidores();

-- ----------------------------------------------------------------------------
-- 6. CRIAR FUNÇÃO ALTERNATIVA PARA LISTAGEM (SEM MATERIALIZED VIEW)
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_investidores_emissao_raw(p_emissao_id UUID)
RETURNS TABLE (
    investidor_id UUID,
    nome VARCHAR,
    cpf_cnpj VARCHAR,
    status VARCHAR,
    valor_investido NUMERIC,
    valor_cotas NUMERIC,
    percentual NUMERIC,
    criado_em TIMESTAMP WITH TIME ZONE,
    atualizado_em TIMESTAMP WITH TIME ZONE
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT 
        i.id,
        i.nome,
        i.cpf_cnpj,
        i.status,
        i.valor_investido,
        i.valor_cotas,
        i.percentual,
        i.criado_em,
        i.atualizado_em
    FROM public.investidores i
    WHERE i.emissao_id = p_emissao_id
    ORDER BY i.valor_investido DESC;
$$;

COMMENT ON FUNCTION public.get_investidores_emissao_raw(UUID) IS 
'Retorna lista raw de investidores sem agregação. Mais rápido para listas simples.';

-- ----------------------------------------------------------------------------
-- 7. CONCEDER PERMISSÕES
-- ----------------------------------------------------------------------------

GRANT SELECT ON compliance.mv_investidores_emissao TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_investidores_emissao(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_investidores_emissao_raw(UUID) TO authenticated;

-- ----------------------------------------------------------------------------
-- 8. POPULAR MATERIALIZED VIEW INICIALMENTE
-- ----------------------------------------------------------------------------

SELECT compliance.refresh_mv_investidores_emissao();

-- ----------------------------------------------------------------------------
-- VERIFICAÇÃO: Testar função otimizada
-- ----------------------------------------------------------------------------
-- EXPLAIN ANALYZE SELECT * FROM public.get_investidores_emissao(
--     (SELECT id FROM public.emissoes LIMIT 1)
-- );
