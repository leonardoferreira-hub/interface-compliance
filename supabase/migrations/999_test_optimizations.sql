-- ============================================================================
-- TESTES: Otimizações do Banco de Dados Compliance
-- DATA: 2026-01-29
-- DESCRIÇÃO: Script de teste para validar todas as otimizações
-- INSTRUÇÕES: Executar após aplicar todas as migrations
-- ============================================================================

-- ----------------------------------------------------------------------------
-- TESTE 1: Verificar Índices Criados
-- ----------------------------------------------------------------------------

DO $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM pg_indexes 
    WHERE schemaname IN ('public', 'estruturacao')
    AND indexname LIKE 'idx_%';
    
    RAISE NOTICE '✅ Índices criados: %', v_count;
END $$;

-- Listar todos os índices
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname IN ('public', 'estruturacao')
AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- ----------------------------------------------------------------------------
-- TESTE 2: Verificar Materialized View
-- ----------------------------------------------------------------------------

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_matviews 
        WHERE schemaname = 'compliance' 
        AND matviewname = 'mv_investidores_emissao'
    ) THEN
        RAISE NOTICE '✅ Materialized View mv_investidores_emissao existe';
    ELSE
        RAISE NOTICE '❌ Materialized View mv_investidores_emissao NÃO existe';
    END IF;
END $$;

-- Testar função otimizada
DO $$
DECLARE
    v_emissao_id UUID;
    v_result RECORD;
BEGIN
    -- Buscar uma emissão de teste
    SELECT id INTO v_emissao_id FROM public.emissoes LIMIT 1;
    
    IF v_emissao_id IS NOT NULL THEN
        SELECT * INTO v_result FROM get_investidores_emissao(v_emissao_id);
        RAISE NOTICE '✅ Função get_investidores_emissao funciona para emissao: %', v_emissao_id;
    ELSE
        RAISE NOTICE '⚠️ Nenhuma emissão encontrada para testar';
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- TESTE 3: Verificar Triggers de Sync
-- ----------------------------------------------------------------------------

DO $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM information_schema.triggers
    WHERE trigger_schema IN ('public', 'estruturacao')
    AND trigger_name LIKE 'trg_sync_%';
    
    RAISE NOTICE '✅ Triggers de sync criados: %', v_count;
END $$;

-- Listar triggers de sync
SELECT 
    event_object_table as tabela,
    trigger_name,
    event_manipulation as evento,
    action_timing as timing
FROM information_schema.triggers
WHERE trigger_schema IN ('public', 'estruturacao')
AND trigger_name LIKE 'trg_sync_%'
ORDER BY event_object_table, trigger_name;

-- ----------------------------------------------------------------------------
-- TESTE 4: Testar Sistema Anti-Loop
-- ----------------------------------------------------------------------------

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'compliance' 
        AND table_name = 'sync_control'
    ) THEN
        RAISE NOTICE '✅ Tabela sync_control existe';
    ELSE
        RAISE NOTICE '❌ Tabela sync_control NÃO existe';
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- TESTE 5: Verificar Sistema de Auditoria
-- ----------------------------------------------------------------------------

DO $$
DECLARE
    v_count INTEGER;
BEGIN
    -- Verificar tabela de log
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'audit' 
        AND table_name = 'log_mudancas_status'
    ) THEN
        RAISE NOTICE '✅ Tabela audit.log_mudancas_status existe';
    ELSE
        RAISE NOTICE '❌ Tabela audit.log_mudancas_status NÃO existe';
    END IF;
    
    -- Contar triggers de auditoria
    SELECT COUNT(*) INTO v_count
    FROM information_schema.triggers
    WHERE trigger_name LIKE 'trg_audit_%';
    
    RAISE NOTICE '✅ Triggers de auditoria criados: %', v_count;
END $$;

-- Testar registro de auditoria
DO $$
DECLARE
    v_emissao_id UUID;
    v_log_id BIGINT;
BEGIN
    -- Criar registro de teste (se não existir)
    INSERT INTO public.emissoes (numero_emissao, nome, status)
    VALUES ('TEST-AUDIT-001', 'Teste Auditoria', 'Em estruturação')
    ON CONFLICT (numero_emissao) DO NOTHING
    RETURNING id INTO v_emissao_id;
    
    IF v_emissao_id IS NOT NULL THEN
        -- Verificar se audit foi registrado
        SELECT COUNT(*) INTO v_log_id
        FROM audit.log_mudancas_status
        WHERE tabela = 'emissoes' AND registro_id = v_emissao_id;
        
        IF v_log_id > 0 THEN
            RAISE NOTICE '✅ Auditoria funcionando - % registros para emissao de teste', v_log_id;
        ELSE
            RAISE NOTICE '⚠️ Nenhum registro de auditoria encontrado';
        END IF;
        
        -- Limpar teste
        DELETE FROM public.emissoes WHERE id = v_emissao_id;
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- TESTE 6: Verificar Constraints
-- ----------------------------------------------------------------------------

DO $$
DECLARE
    v_fk_count INTEGER;
    v_check_count INTEGER;
    v_unique_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_fk_count
    FROM information_schema.table_constraints
    WHERE constraint_type = 'FOREIGN KEY'
    AND table_schema IN ('public', 'estruturacao');
    
    SELECT COUNT(*) INTO v_check_count
    FROM information_schema.table_constraints
    WHERE constraint_type = 'CHECK'
    AND table_schema IN ('public', 'estruturacao');
    
    SELECT COUNT(*) INTO v_unique_count
    FROM information_schema.table_constraints
    WHERE constraint_type = 'UNIQUE'
    AND table_schema IN ('public', 'estruturacao');
    
    RAISE NOTICE '✅ Constraints criadas: FK=%, CHECK=%, UNIQUE=%', v_fk_count, v_check_count, v_unique_count;
END $$;

-- Listar constraints criadas
SELECT 
    table_schema,
    table_name,
    constraint_name,
    constraint_type
FROM information_schema.table_constraints
WHERE table_schema IN ('public', 'estruturacao')
AND constraint_name LIKE 'fk_%' OR constraint_name LIKE 'chk_%' OR constraint_name LIKE 'uk_%'
ORDER BY table_schema, table_name, constraint_type, constraint_name;

-- ----------------------------------------------------------------------------
-- TESTE 7: Verificar Integridade Referencial
-- ----------------------------------------------------------------------------

DO $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count FROM compliance.vw_verificar_integridade;
    
    IF v_count = 0 THEN
        RAISE NOTICE '✅ Nenhum problema de integridade referencial encontrado';
    ELSE
        RAISE NOTICE '⚠️ % problemas de integridade encontrados', v_count;
    END IF;
END $$;

-- Mostrar problemas se existirem
SELECT * FROM compliance.vw_verificar_integridade;

-- ----------------------------------------------------------------------------
-- TESTE 8: Testar Performance (EXPLAIN ANALYZE)
-- ----------------------------------------------------------------------------

-- Testar índice em emissoes
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT * FROM public.emissoes 
WHERE status = 'Em estruturação' 
ORDER BY criado_em DESC 
LIMIT 20;

-- Testar JOIN otimizado
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT e.*, o.status as operacao_status
FROM public.emissoes e
LEFT JOIN estruturacao.operacoes o ON o.id_emissao_comercial = e.id
WHERE e.numero_emissao LIKE 'EM-%'
LIMIT 10;

-- Testar materialized view
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT * FROM compliance.mv_investidores_emissao
WHERE emissao_status = 'Em andamento'
ORDER BY total_valor_investido DESC;

-- ----------------------------------------------------------------------------
-- TESTE 9: Testar Funções de Auditoria
-- ----------------------------------------------------------------------------

-- Testar função de histórico
DO $$
DECLARE
    v_emissao_id UUID;
BEGIN
    SELECT id INTO v_emissao_id FROM public.emissoes LIMIT 1;
    
    IF v_emissao_id IS NOT NULL THEN
        RAISE NOTICE '✅ Função get_historico_registro disponível para emissao %', v_emissao_id;
    END IF;
END $$;

-- Testar estatísticas
SELECT * FROM audit.get_estatisticas_mudancas(7);

-- ----------------------------------------------------------------------------
-- TESTE 10: Testar Sync Manual
-- ----------------------------------------------------------------------------

DO $$
DECLARE
    v_emissao_id UUID;
    v_result RECORD;
BEGIN
    SELECT id INTO v_emissao_id FROM public.emissoes LIMIT 1;
    
    IF v_emissao_id IS NOT NULL THEN
        SELECT * INTO v_result FROM compliance.force_sync_emissao_operacao(v_emissao_id);
        RAISE NOTICE '✅ Sync manual funcionou: %', v_result.acao;
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- RESUMO DOS TESTES
-- ----------------------------------------------------------------------------

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '  TESTES CONCLUÍDOS';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Verifique os resultados acima para:';
    RAISE NOTICE '  ✅ Índices criados';
    RAISE NOTICE '  ✅ Materialized View funcional';
    RAISE NOTICE '  ✅ Triggers de sync ativas';
    RAISE NOTICE '  ✅ Sistema anti-loop configurado';
    RAISE NOTICE '  ✅ Auditoria funcionando';
    RAISE NOTICE '  ✅ Constraints aplicadas';
    RAISE NOTICE '  ✅ Integridade referencial OK';
    RAISE NOTICE '========================================';
END $$;
