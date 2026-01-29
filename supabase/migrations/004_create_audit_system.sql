-- ============================================================================
-- MIGRATION: 004_create_audit_system.sql
-- DATA: 2026-01-29
-- DESCRIÇÃO: Cria sistema completo de auditoria para logar mudanças de status
--            importantes em emissões, operações e pendências
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. CRIAR SCHEMA DE AUDITORIA (SE NÃO EXISTIR)
-- ----------------------------------------------------------------------------

CREATE SCHEMA IF NOT EXISTS audit;
COMMENT ON SCHEMA audit IS 'Schema para tabelas e funções de auditoria do sistema';

-- ----------------------------------------------------------------------------
-- 2. CRIAR TABELA PRINCIPAL DE LOG DE AUDITORIA
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS audit.log_mudancas_status (
    id BIGSERIAL PRIMARY KEY,
    -- Identificação do registro
    tabela VARCHAR(100) NOT NULL,
    registro_id UUID NOT NULL,
    registro_uuid UUID, -- Para compatibilidade com UUIDs secundários
    
    -- Dados da mudança
    acao VARCHAR(20) NOT NULL CHECK (acao IN ('INSERT', 'UPDATE', 'DELETE', 'STATUS_CHANGE')),
    campo_alterado VARCHAR(100),
    valor_anterior TEXT,
    valor_novo TEXT,
    
    -- Contexto da mudança
    status_anterior VARCHAR(50),
    status_novo VARCHAR(50),
    motivo TEXT,
    
    -- Metadados
    usuario_id UUID,
    usuario_email TEXT,
    ip_address INET,
    session_id TEXT,
    user_agent TEXT,
    
    -- Timestamp
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Comentários
COMMENT ON TABLE audit.log_mudancas_status IS 
'Log de todas as mudanças de status importantes do sistema de compliance';

-- ----------------------------------------------------------------------------
-- 3. CRIAR ÍNDICES PARA CONSULTAS EFICIENTES
-- ----------------------------------------------------------------------------

-- Índice para busca por tabela e registro
CREATE INDEX IF NOT EXISTS idx_audit_log_tabela_registro 
ON audit.log_mudancas_status(tabela, registro_id);

-- Índice para busca por timestamp
CREATE INDEX IF NOT EXISTS idx_audit_log_criado_em 
ON audit.log_mudancas_status(criado_em DESC);

-- Índice para busca por usuário
CREATE INDEX IF NOT EXISTS idx_audit_log_usuario_id 
ON audit.log_mudancas_status(usuario_id);

-- Índice para busca por tipo de ação
CREATE INDEX IF NOT EXISTS idx_audit_log_acao 
ON audit.log_mudancas_status(acao);

-- Índice para busca por status
CREATE INDEX IF NOT EXISTS idx_audit_log_status_novo 
ON audit.log_mudancas_status(status_novo);

-- Índice composto para relatórios de auditoria
CREATE INDEX IF NOT EXISTS idx_audit_log_relatorio 
ON audit.log_mudancas_status(tabela, criado_em DESC, acao);

-- Índice para limpeza de registros antigos
CREATE INDEX IF NOT EXISTS idx_audit_log_criado_em_cleanup 
ON audit.log_mudancas_status(criado_em);

-- ----------------------------------------------------------------------------
-- 4. FUNÇÃO GENÉRICA DE REGISTRO DE AUDITORIA
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION audit.registrar_mudanca(
    p_tabela VARCHAR,
    p_registro_id UUID,
    p_acao VARCHAR,
    p_campo_alterado VARCHAR DEFAULT NULL,
    p_valor_anterior TEXT DEFAULT NULL,
    p_valor_novo TEXT DEFAULT NULL,
    p_status_anterior VARCHAR DEFAULT NULL,
    p_status_novo VARCHAR DEFAULT NULL,
    p_motivo TEXT DEFAULT NULL
) RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_log_id BIGINT;
    v_usuario_id UUID;
    v_usuario_email TEXT;
BEGIN
    -- Buscar informações do usuário atual
    v_usuario_id := auth.uid();
    v_usuario_email := auth.email();
    
    INSERT INTO audit.log_mudancas_status (
        tabela,
        registro_id,
        acao,
        campo_alterado,
        valor_anterior,
        valor_novo,
        status_anterior,
        status_novo,
        motivo,
        usuario_id,
        usuario_email,
        session_id
    ) VALUES (
        p_tabela,
        p_registro_id,
        p_acao,
        p_campo_alterado,
        p_valor_anterior,
        p_valor_novo,
        p_status_anterior,
        p_status_novo,
        p_motivo,
        v_usuario_id,
        v_usuario_email,
        pg_backend_pid()::text
    )
    RETURNING id INTO v_log_id;
    
    RETURN v_log_id;
END;
$$;

COMMENT ON FUNCTION audit.registrar_mudanca IS 
'Função genérica para registrar mudanças no log de auditoria';

-- ----------------------------------------------------------------------------
-- 5. TRIGGER FUNCTION GENÉRICA PARA AUDITORIA
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION audit.trigger_audit_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_registro_id UUID;
    v_status_anterior VARCHAR;
    v_status_novo VARCHAR;
    v_campo RECORD;
    v_tem_mudanca BOOLEAN := false;
BEGIN
    -- Determinar ID do registro
    IF TG_OP = 'DELETE' THEN
        v_registro_id := OLD.id;
        v_status_anterior := OLD.status;
    ELSE
        v_registro_id := NEW.id;
        v_status_novo := NEW.status;
        IF TG_OP = 'UPDATE' THEN
            v_status_anterior := OLD.status;
        END IF;
    END IF;
    
    -- Registrar operação DELETE
    IF TG_OP = 'DELETE' THEN
        PERFORM audit.registrar_mudanca(
            TG_TABLE_NAME,
            v_registro_id,
            'DELETE',
            NULL,
            row_to_json(OLD)::text,
            NULL,
            v_status_anterior,
            NULL,
            'Registro excluído'
        );
        RETURN OLD;
    END IF;
    
    -- Registrar operação INSERT
    IF TG_OP = 'INSERT' THEN
        PERFORM audit.registrar_mudanca(
            TG_TABLE_NAME,
            v_registro_id,
            'INSERT',
            NULL,
            NULL,
            row_to_json(NEW)::text,
            NULL,
            v_status_novo,
            'Registro criado'
        );
        RETURN NEW;
    END IF;
    
    -- Registrar operação UPDATE - verificar mudanças em campos específicos
    IF TG_OP = 'UPDATE' THEN
        -- Verificar mudança de status
        IF OLD.status IS DISTINCT FROM NEW.status THEN
            PERFORM audit.registrar_mudanca(
                TG_TABLE_NAME,
                v_registro_id,
                'STATUS_CHANGE',
                'status',
                OLD.status,
                NEW.status,
                OLD.status,
                NEW.status,
                'Mudança de status'
            );
            v_tem_mudanca := true;
        END IF;
        
        -- Registrar outras mudanças importantes dependendo da tabela
        CASE TG_TABLE_NAME
            WHEN 'emissoes' THEN
                IF OLD.nome IS DISTINCT FROM NEW.nome THEN
                    PERFORM audit.registrar_mudanca(
                        TG_TABLE_NAME, v_registro_id, 'UPDATE', 'nome', OLD.nome, NEW.nome, NULL, NULL, 'Nome alterado'
                    );
                END IF;
                IF OLD.valor_total IS DISTINCT FROM NEW.valor_total THEN
                    PERFORM audit.registrar_mudanca(
                        TG_TABLE_NAME, v_registro_id, 'UPDATE', 'valor_total', 
                        OLD.valor_total::text, NEW.valor_total::text, NULL, NULL, 'Valor total alterado'
                    );
                END IF;
                
            WHEN 'operacoes' THEN
                IF OLD.nome_operacao IS DISTINCT FROM NEW.nome_operacao THEN
                    PERFORM audit.registrar_mudanca(
                        TG_TABLE_NAME, v_registro_id, 'UPDATE', 'nome_operacao', 
                        OLD.nome_operacao, NEW.nome_operacao, NULL, NULL, 'Nome da operação alterado'
                    );
                END IF;
                IF OLD.analista_gestao_id IS DISTINCT FROM NEW.analista_gestao_id THEN
                    PERFORM audit.registrar_mudanca(
                        TG_TABLE_NAME, v_registro_id, 'UPDATE', 'analista_gestao_id', 
                        OLD.analista_gestao_id::text, NEW.analista_gestao_id::text, NULL, NULL, 'Analista alterado'
                    );
                END IF;
                
            WHEN 'pendencias' THEN
                IF OLD.status IS DISTINCT FROM NEW.status THEN
                    PERFORM audit.registrar_mudanca(
                        TG_TABLE_NAME, v_registro_id, 'STATUS_CHANGE', 'status', 
                        OLD.status, NEW.status, OLD.status, NEW.status, 'Status da pendência alterado'
                    );
                END IF;
                IF OLD.responsavel_id IS DISTINCT FROM NEW.responsavel_id THEN
                    PERFORM audit.registrar_mudanca(
                        TG_TABLE_NAME, v_registro_id, 'UPDATE', 'responsavel_id', 
                        OLD.responsavel_id::text, NEW.responsavel_id::text, NULL, NULL, 'Responsável alterado'
                    );
                END IF;
                IF OLD.prioridade IS DISTINCT FROM NEW.prioridade THEN
                    PERFORM audit.registrar_mudanca(
                        TG_TABLE_NAME, v_registro_id, 'UPDATE', 'prioridade', 
                        OLD.prioridade, NEW.prioridade, NULL, NULL, 'Prioridade alterada'
                    );
                END IF;
                
            WHEN 'investidores' THEN
                IF OLD.status IS DISTINCT FROM NEW.status THEN
                    PERFORM audit.registrar_mudanca(
                        TG_TABLE_NAME, v_registro_id, 'STATUS_CHANGE', 'status', 
                        OLD.status, NEW.status, OLD.status, NEW.status, 'Status do investidor alterado'
                    );
                END IF;
                IF OLD.valor_investido IS DISTINCT FROM NEW.valor_investido THEN
                    PERFORM audit.registrar_mudanca(
                        TG_TABLE_NAME, v_registro_id, 'UPDATE', 'valor_investido', 
                        OLD.valor_investido::text, NEW.valor_investido::text, NULL, NULL, 'Valor investido alterado'
                    );
                END IF;
        END CASE;
    END IF;
    
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION audit.trigger_audit_changes() IS 
'Trigger genérica para capturar mudanças e registrar em auditoria';

-- ----------------------------------------------------------------------------
-- 6. CRIAR TRIGGERS DE AUDITORIA NAS TABELAS
-- ----------------------------------------------------------------------------

-- Auditoria para emissoes
DROP TRIGGER IF EXISTS trg_audit_emissoes ON public.emissoes;
CREATE TRIGGER trg_audit_emissoes
    AFTER INSERT OR UPDATE OR DELETE ON public.emissoes
    FOR EACH ROW
    EXECUTE FUNCTION audit.trigger_audit_changes();

-- Auditoria para operacoes
DROP TRIGGER IF EXISTS trg_audit_operacoes ON estruturacao.operacoes;
CREATE TRIGGER trg_audit_operacoes
    AFTER INSERT OR UPDATE OR DELETE ON estruturacao.operacoes
    FOR EACH ROW
    EXECUTE FUNCTION audit.trigger_audit_changes();

-- Auditoria para pendencias
DROP TRIGGER IF EXISTS trg_audit_pendencias ON estruturacao.pendencias;
CREATE TRIGGER trg_audit_pendencias
    AFTER INSERT OR UPDATE OR DELETE ON estruturacao.pendencias
    FOR EACH ROW
    EXECUTE FUNCTION audit.trigger_audit_changes();

-- Auditoria para investidores
DROP TRIGGER IF EXISTS trg_audit_investidores ON public.investidores;
CREATE TRIGGER trg_audit_investidores
    AFTER INSERT OR UPDATE OR DELETE ON public.investidores
    FOR EACH ROW
    EXECUTE FUNCTION audit.trigger_audit_changes();

-- ----------------------------------------------------------------------------
-- 7. FUNÇÕES DE CONSULTA DE AUDITORIA
-- ----------------------------------------------------------------------------

-- Função para consultar histórico de um registro
CREATE OR REPLACE FUNCTION audit.get_historico_registro(
    p_tabela VARCHAR,
    p_registro_id UUID,
    p_limite INTEGER DEFAULT 100
)
RETURNS TABLE (
    log_id BIGINT,
    acao VARCHAR,
    campo_alterado VARCHAR,
    valor_anterior TEXT,
    valor_novo TEXT,
    status_anterior VARCHAR,
    status_novo VARCHAR,
    motivo TEXT,
    usuario_email TEXT,
    criado_em TIMESTAMP WITH TIME ZONE
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT 
        id,
        acao,
        campo_alterado,
        valor_anterior,
        valor_novo,
        status_anterior,
        status_novo,
        motivo,
        usuario_email,
        criado_em
    FROM audit.log_mudancas_status
    WHERE tabela = p_tabela
      AND registro_id = p_registro_id
    ORDER BY criado_em DESC
    LIMIT p_limite;
$$;

-- Função para consultar mudanças por período
CREATE OR REPLACE FUNCTION audit.get_mudancas_periodo(
    p_data_inicio TIMESTAMP WITH TIME ZONE,
    p_data_fim TIMESTAMP WITH TIME ZONE,
    p_tabela VARCHAR DEFAULT NULL
)
RETURNS TABLE (
    log_id BIGINT,
    tabela VARCHAR,
    registro_id UUID,
    acao VARCHAR,
    campo_alterado VARCHAR,
    status_anterior VARCHAR,
    status_novo VARCHAR,
    usuario_email TEXT,
    criado_em TIMESTAMP WITH TIME ZONE
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT 
        id,
        tabela,
        registro_id,
        acao,
        campo_alterado,
        status_anterior,
        status_novo,
        usuario_email,
        criado_em
    FROM audit.log_mudancas_status
    WHERE criado_em BETWEEN p_data_inicio AND p_data_fim
      AND (p_tabela IS NULL OR tabela = p_tabela)
    ORDER BY criado_em DESC;
$$;

-- Função para estatísticas de mudanças
CREATE OR REPLACE FUNCTION audit.get_estatisticas_mudancas(
    p_dias INTEGER DEFAULT 30
)
RETURNS TABLE (
    tabela VARCHAR,
    total_mudancas BIGINT,
    inserts BIGINT,
    updates BIGINT,
    deletes BIGINT,
    status_changes BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT 
        tabela,
        COUNT(*) as total_mudancas,
        COUNT(*) FILTER (WHERE acao = 'INSERT') as inserts,
        COUNT(*) FILTER (WHERE acao = 'UPDATE') as updates,
        COUNT(*) FILTER (WHERE acao = 'DELETE') as deletes,
        COUNT(*) FILTER (WHERE acao = 'STATUS_CHANGE') as status_changes
    FROM audit.log_mudancas_status
    WHERE criado_em >= now() - (p_dias || ' days')::interval
    GROUP BY tabela
    ORDER BY total_mudancas DESC;
$$;

-- ----------------------------------------------------------------------------
-- 8. FUNÇÃO DE LIMPEZA DE LOGS ANTIGOS
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION audit.limpar_logs_antigos(
    p_dias_retencao INTEGER DEFAULT 365
)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_removidos BIGINT;
BEGIN
    DELETE FROM audit.log_mudancas_status
    WHERE criado_em < now() - (p_dias_retencao || ' days')::interval;
    
    GET DIAGNOSTICS v_removidos = ROW_COUNT;
    
    -- Registrar a limpeza
    PERFORM audit.registrar_mudanca(
        'audit.log_mudancas_status',
        gen_random_uuid(),
        'DELETE',
        NULL,
        NULL,
        v_removidos || ' registros removidos',
        NULL,
        NULL,
        'Limpeza automática de logs com mais de ' || p_dias_retencao || ' dias'
    );
    
    RETURN v_removidos;
END;
$$;

COMMENT ON FUNCTION audit.limpar_logs_antigos IS 
'Remove logs de auditoria antigos. Padrão: manter 365 dias.';

-- ----------------------------------------------------------------------------
-- 9. CONCEDER PERMISSÕES
-- ----------------------------------------------------------------------------

GRANT SELECT, INSERT ON audit.log_mudancas_status TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE audit.log_mudancas_status_id_seq TO authenticated;
GRANT EXECUTE ON FUNCTION audit.registrar_mudanca TO authenticated;
GRANT EXECUTE ON FUNCTION audit.get_historico_registro TO authenticated;
GRANT EXECUTE ON FUNCTION audit.get_mudancas_periodo TO authenticated;
GRANT EXECUTE ON FUNCTION audit.get_estatisticas_mudancas TO authenticated;

-- ----------------------------------------------------------------------------
-- 10. VIEW RESUMIDA PARA DASHBOARD
-- ----------------------------------------------------------------------------

CREATE OR REPLACE VIEW audit.vw_ultimas_mudancas AS
SELECT 
    l.id,
    l.tabela,
    l.registro_id,
    l.acao,
    l.campo_alterado,
    l.status_anterior,
    l.status_novo,
    l.usuario_email,
    l.criado_em,
    CASE 
        WHEN l.acao = 'INSERT' THEN '🟢 Criado'
        WHEN l.acao = 'UPDATE' THEN '🟡 Alterado'
        WHEN l.acao = 'DELETE' THEN '🔴 Excluído'
        WHEN l.acao = 'STATUS_CHANGE' THEN '🔵 Status'
    END as acao_label
FROM audit.log_mudancas_status l
WHERE l.criado_em >= now() - interval '7 days'
ORDER BY l.criado_em DESC;

COMMENT ON VIEW audit.vw_ultimas_mudancas IS 
'View para dashboard mostrando últimas mudanças dos últimos 7 dias';

GRANT SELECT ON audit.vw_ultimas_mudancas TO authenticated;
