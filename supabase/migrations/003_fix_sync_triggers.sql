-- ============================================================================
-- MIGRATION: 003_fix_sync_triggers.sql
-- DATA: 2026-01-29
-- DESCRIÇÃO: Revisa e otimiza todas as triggers de sync entre emissoes,
--            estruturação e compliance para evitar duplicações e loops
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. LIMPAR TRIGGERS EXISTENTES PROBLEMÁTICAS
-- ----------------------------------------------------------------------------

-- Remover triggers antigas que podem causar duplicações
DROP TRIGGER IF EXISTS trg_sync_emissao_to_operacao ON public.emissoes;
DROP TRIGGER IF EXISTS trg_sync_operacao_to_emissao ON estruturacao.operacoes;
DROP TRIGGER IF EXISTS trg_sync_pendencias_status ON estruturacao.pendencias;
DROP TRIGGER IF EXISTS trg_prevent_sync_loop ON public.emissoes;
DROP TRIGGER IF EXISTS trg_prevent_sync_loop ON estruturacao.operacoes;

-- ----------------------------------------------------------------------------
-- 2. CRIAR TABELA DE CONTROLE DE SYNC (PARA PREVENIR LOOPS)
-- ----------------------------------------------------------------------------

-- Tabela para rastrear operações de sync em andamento
CREATE TABLE IF NOT EXISTS compliance.sync_control (
    id SERIAL PRIMARY KEY,
    tabela_origem VARCHAR(100) NOT NULL,
    tabela_destino VARCHAR(100) NOT NULL,
    registro_id UUID NOT NULL,
    session_id TEXT NOT NULL DEFAULT pg_backend_pid()::text,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT now(),
    expira_em TIMESTAMP WITH TIME ZONE DEFAULT now() + interval '5 seconds',
    UNIQUE(tabela_origem, tabela_destino, registro_id, session_id)
);

-- Índice para limpeza de registros expirados
CREATE INDEX IF NOT EXISTS idx_sync_control_expira_em 
ON compliance.sync_control(expira_em);

-- Comentário
COMMENT ON TABLE compliance.sync_control IS 
'Controle de sincronização para evitar loops entre triggers bidirecionais';

-- ----------------------------------------------------------------------------
-- 3. FUNÇÕES AUXILIARES PARA CONTROLE DE SYNC
-- ----------------------------------------------------------------------------

-- Função para verificar se sync está em andamento
CREATE OR REPLACE FUNCTION compliance.is_sync_in_progress(
    p_tabela_origem VARCHAR,
    p_tabela_destino VARCHAR,
    p_registro_id UUID
) RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    -- Limpar registros expirados
    DELETE FROM compliance.sync_control WHERE expira_em < now();
    
    -- Verificar se existe sync em andamento
    SELECT COUNT(*) INTO v_count
    FROM compliance.sync_control
    WHERE tabela_origem = p_tabela_origem
      AND tabela_destino = p_tabela_destino
      AND registro_id = p_registro_id;
    
    RETURN v_count > 0;
END;
$$;

-- Função para marcar início de sync
CREATE OR REPLACE FUNCTION compliance.start_sync(
    p_tabela_origem VARCHAR,
    p_tabela_destino VARCHAR,
    p_registro_id UUID
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO compliance.sync_control (tabela_origem, tabela_destino, registro_id)
    VALUES (p_tabela_origem, p_tabela_destino, p_registro_id)
    ON CONFLICT (tabela_origem, tabela_destino, registro_id, session_id) 
    DO UPDATE SET expira_em = now() + interval '5 seconds';
END;
$$;

-- Função para marcar fim de sync
CREATE OR REPLACE FUNCTION compliance.end_sync(
    p_tabela_origem VARCHAR,
    p_tabela_destino VARCHAR,
    p_registro_id UUID
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM compliance.sync_control
    WHERE tabela_origem = p_tabela_origem
      AND tabela_destino = p_tabela_destino
      AND registro_id = p_registro_id;
END;
$$;

-- ----------------------------------------------------------------------------
-- 4. FUNÇÃO DE SYNC OTIMIZADA: EMISSAO -> OPERAÇÃO
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION compliance.sync_emissao_to_operacao()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_operacao_id UUID;
BEGIN
    -- Verificar se já existe sync em andamento no sentido oposto
    IF compliance.is_sync_in_progress('operacoes', 'emissoes', NEW.id) THEN
        RETURN NEW; -- Evitar loop
    END IF;
    
    -- Marcar início do sync
    PERFORM compliance.start_sync('emissoes', 'operacoes', NEW.id);
    
    BEGIN
        -- Buscar ou criar operação vinculada
        SELECT id INTO v_operacao_id
        FROM estruturacao.operacoes
        WHERE id_emissao_comercial = NEW.id;
        
        IF v_operacao_id IS NOT NULL THEN
            -- Atualizar operação existente
            UPDATE estruturacao.operacoes SET
                numero_emissao = NEW.numero_emissao,
                nome_operacao = NEW.nome,
                status = CASE 
                    WHEN NEW.status = 'Em estruturação' THEN 'Em estruturação'
                    WHEN NEW.status = 'Em andamento' THEN 'Em andamento'
                    WHEN NEW.status = 'Concluída' THEN 'Liquidada'
                    WHEN NEW.status = 'Cancelada' THEN 'Cancelada'
                    ELSE NEW.status
                END,
                atualizado_em = now()
            WHERE id = v_operacao_id;
        ELSE
            -- Criar nova operação
            INSERT INTO estruturacao.operacoes (
                id_emissao_comercial,
                numero_emissao,
                nome_operacao,
                status,
                criado_em,
                atualizado_em
            ) VALUES (
                NEW.id,
                NEW.numero_emissao,
                NEW.nome,
                CASE 
                    WHEN NEW.status = 'Em estruturação' THEN 'Em estruturação'
                    WHEN NEW.status = 'Em andamento' THEN 'Em andamento'
                    WHEN NEW.status = 'Concluída' THEN 'Liquidada'
                    WHEN NEW.status = 'Cancelada' THEN 'Cancelada'
                    ELSE NEW.status
                END,
                now(),
                now()
            );
        END IF;
        
        -- Finalizar sync
        PERFORM compliance.end_sync('emissoes', 'operacoes', NEW.id);
        
    EXCEPTION WHEN OTHERS THEN
        -- Em caso de erro, garantir que o sync seja finalizado
        PERFORM compliance.end_sync('emissoes', 'operacoes', NEW.id);
        RAISE;
    END;
    
    RETURN NEW;
END;
$$;

-- ----------------------------------------------------------------------------
-- 5. FUNÇÃO DE SYNC OTIMIZADA: OPERAÇÃO -> EMISSAO
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION compliance.sync_operacao_to_emissao()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Verificar se já existe sync em andamento no sentido oposto
    IF compliance.is_sync_in_progress('emissoes', 'operacoes', NEW.id_emissao_comercial) THEN
        RETURN NEW; -- Evitar loop
    END IF;
    
    -- Verificar se tem emissão vinculada
    IF NEW.id_emissao_comercial IS NULL THEN
        RETURN NEW;
    END IF;
    
    -- Marcar início do sync
    PERFORM compliance.start_sync('operacoes', 'emissoes', NEW.id_emissao_comercial);
    
    BEGIN
        -- Atualizar emissão
        UPDATE public.emissoes SET
            nome = NEW.nome_operacao,
            status = CASE 
                WHEN NEW.status = 'Em estruturação' THEN 'Em estruturação'
                WHEN NEW.status = 'Em andamento' THEN 'Em andamento'
                WHEN NEW.status = 'Liquidada' THEN 'Concluída'
                WHEN NEW.status = 'Cancelada' THEN 'Cancelada'
                ELSE NEW.status
            END,
            atualizado_em = now()
        WHERE id = NEW.id_emissao_comercial;
        
        -- Finalizar sync
        PERFORM compliance.end_sync('operacoes', 'emissoes', NEW.id_emissao_comercial);
        
    EXCEPTION WHEN OTHERS THEN
        PERFORM compliance.end_sync('operacoes', 'emissoes', NEW.id_emissao_comercial);
        RAISE;
    END;
    
    RETURN NEW;
END;
$$;

-- ----------------------------------------------------------------------------
-- 6. FUNÇÃO DE SYNC: PENDENCIAS -> STATUS OPERAÇÃO
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION compliance.sync_pendencias_to_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_total_pendencias INTEGER;
    v_pendencias_criticas INTEGER;
    v_novo_status VARCHAR;
BEGIN
    -- Contar pendências da operação
    SELECT 
        COUNT(*),
        COUNT(CASE WHEN prioridade = 'Crítica' AND status = 'Pendente' THEN 1 END)
    INTO v_total_pendencias, v_pendencias_criticas
    FROM estruturacao.pendencias
    WHERE operacao_id = COALESCE(NEW.operacao_id, OLD.operacao_id)
      AND status = 'Pendente';
    
    -- Definir novo status baseado nas pendências
    IF v_pendencias_criticas > 0 THEN
        v_novo_status := 'Bloqueada';
    ELSIF v_total_pendencias > 0 THEN
        v_novo_status := 'Em estruturação';
    ELSE
        -- Verificar se operação estava bloqueada para desbloquear
        SELECT status INTO v_novo_status
        FROM estruturacao.operacoes
        WHERE id = COALESCE(NEW.operacao_id, OLD.operacao_id);
        
        IF v_novo_status = 'Bloqueada' THEN
            v_novo_status := 'Em estruturação';
        ELSE
            RETURN COALESCE(NEW, OLD); -- Não mudar status
        END IF;
    END IF;
    
    -- Atualizar status da operação
    UPDATE estruturacao.operacoes SET
        status = v_novo_status,
        atualizado_em = now()
    WHERE id = COALESCE(NEW.operacao_id, OLD.operacao_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- ----------------------------------------------------------------------------
-- 7. CRIAR TRIGGERS OTIMIZADAS
-- ----------------------------------------------------------------------------

-- Trigger sync emissao -> operacao
CREATE TRIGGER trg_sync_emissao_to_operacao
    AFTER INSERT OR UPDATE ON public.emissoes
    FOR EACH ROW
    EXECUTE FUNCTION compliance.sync_emissao_to_operacao();

-- Trigger sync operacao -> emissao
CREATE TRIGGER trg_sync_operacao_to_emissao
    AFTER UPDATE ON estruturacao.operacoes
    FOR EACH ROW
    WHEN (OLD.nome_operacao IS DISTINCT FROM NEW.nome_operacao 
          OR OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION compliance.sync_operacao_to_emissao();

-- Trigger sync pendencias -> status
CREATE TRIGGER trg_sync_pendencias_status
    AFTER INSERT OR UPDATE OR DELETE ON estruturacao.pendencias
    FOR EACH ROW
    EXECUTE FUNCTION compliance.sync_pendencias_to_status();

-- ----------------------------------------------------------------------------
-- 8. FUNÇÃO DE SYNC MANUAL (PARA CORREÇÃO DE INCONSISTÊNCIAS)
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION compliance.force_sync_emissao_operacao(p_emissao_id UUID)
RETURNS TABLE (
    emissao_id UUID,
    operacao_id UUID,
    acao VARCHAR,
    status VARCHAR
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_operacao_id UUID;
    v_emissao RECORD;
    v_acao VARCHAR;
BEGIN
    -- Buscar dados da emissão
    SELECT * INTO v_emissao FROM public.emissoes WHERE id = p_emissao_id;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT p_emissao_id, NULL::UUID, 'ERRO'::VARCHAR, 'Emissão não encontrada'::VARCHAR;
        RETURN;
    END IF;
    
    -- Buscar operação existente
    SELECT id INTO v_operacao_id
    FROM estruturacao.operacoes
    WHERE id_emissao_comercial = p_emissao_id;
    
    IF v_operacao_id IS NOT NULL THEN
        -- Atualizar operação
        UPDATE estruturacao.operacoes SET
            numero_emissao = v_emissao.numero_emissao,
            nome_operacao = v_emissao.nome,
            status = CASE 
                WHEN v_emissao.status = 'Em estruturação' THEN 'Em estruturação'
                WHEN v_emissao.status = 'Em andamento' THEN 'Em andamento'
                WHEN v_emissao.status = 'Concluída' THEN 'Liquidada'
                WHEN v_emissao.status = 'Cancelada' THEN 'Cancelada'
                ELSE v_emissao.status
            END,
            atualizado_em = now()
        WHERE id = v_operacao_id;
        v_acao := 'ATUALIZADO';
    ELSE
        -- Criar nova operação
        INSERT INTO estruturacao.operacoes (
            id_emissao_comercial,
            numero_emissao,
            nome_operacao,
            status,
            criado_em,
            atualizado_em
        ) VALUES (
            p_emissao_id,
            v_emissao.numero_emissao,
            v_emissao.nome,
            CASE 
                WHEN v_emissao.status = 'Em estruturação' THEN 'Em estruturação'
                WHEN v_emissao.status = 'Em andamento' THEN 'Em andamento'
                WHEN v_emissao.status = 'Concluída' THEN 'Liquidada'
                WHEN v_emissao.status = 'Cancelada' THEN 'Cancelada'
                ELSE v_emissao.status
            END,
            now(),
            now()
        )
        RETURNING id INTO v_operacao_id;
        v_acao := 'CRIADO';
    END IF;
    
    RETURN QUERY SELECT p_emissao_id, v_operacao_id, v_acao, 'OK'::VARCHAR;
END;
$$;

COMMENT ON FUNCTION compliance.force_sync_emissao_operacao(UUID) IS 
'Força sincronização manual entre emissão e operação. Útil para correção de inconsistências.';

-- ----------------------------------------------------------------------------
-- 9. CONCEDER PERMISSÕES
-- ----------------------------------------------------------------------------

GRANT SELECT, INSERT, DELETE ON compliance.sync_control TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE compliance.sync_control_id_seq TO authenticated;
GRANT EXECUTE ON FUNCTION compliance.force_sync_emissao_operacao(UUID) TO authenticated;

-- ----------------------------------------------------------------------------
-- 10. LIMPEZA DE REGISTROS ANTIGOS (JOB AGENDADO - OPCIONAL)
-- ----------------------------------------------------------------------------

-- Função para limpar registros antigos de sync
CREATE OR REPLACE FUNCTION compliance.cleanup_sync_control()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM compliance.sync_control WHERE expira_em < now();
END;
$$;

-- Comentar para executar periodicamente via cron/pg_cron
-- SELECT cron.schedule('cleanup-sync-control', '*/5 * * * *', 'SELECT compliance.cleanup_sync_control()');
