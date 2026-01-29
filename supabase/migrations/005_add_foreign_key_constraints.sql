-- ============================================================================
-- MIGRATION: 005_add_foreign_key_constraints.sql
-- DATA: 2026-01-29
-- DESCRIÇÃO: Adiciona constraints de chave estrangeira faltantes para garantir
--            integridade referencial entre as tabelas do sistema
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. VERIFICAR E ADICIONAR CONSTRAINTS PARA TABELA public.emissoes
-- ----------------------------------------------------------------------------

-- Verificar se existe coluna categoria_id antes de adicionar FK
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'emissoes' 
        AND column_name = 'categoria_id'
    ) THEN
        -- Verificar se já existe a constraint
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'fk_emissoes_categoria'
        ) THEN
            ALTER TABLE public.emissoes
            ADD CONSTRAINT fk_emissoes_categoria
            FOREIGN KEY (categoria_id) REFERENCES public.categorias(id)
            ON DELETE SET NULL ON UPDATE CASCADE;
            
            RAISE NOTICE 'Constraint fk_emissoes_categoria criada';
        END IF;
    END IF;
END $$;

-- Verificar se existe coluna veiculo_id antes de adicionar FK
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'emissoes' 
        AND column_name = 'veiculo_id'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'fk_emissoes_veiculo'
        ) THEN
            ALTER TABLE public.emissoes
            ADD CONSTRAINT fk_emissoes_veiculo
            FOREIGN KEY (veiculo_id) REFERENCES public.veiculos(id)
            ON DELETE SET NULL ON UPDATE CASCADE;
            
            RAISE NOTICE 'Constraint fk_emissoes_veiculo criada';
        END IF;
    END IF;
END $$;

-- Verificar se existe coluna criado_por antes de adicionar FK para auth.users
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'emissoes' 
        AND column_name = 'criado_por'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'fk_emissoes_criado_por'
        ) THEN
            ALTER TABLE public.emissoes
            ADD CONSTRAINT fk_emissoes_criado_por
            FOREIGN KEY (criado_por) REFERENCES auth.users(id)
            ON DELETE SET NULL ON UPDATE CASCADE;
            
            RAISE NOTICE 'Constraint fk_emissoes_criado_por criada';
        END IF;
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 2. VERIFICAR E ADICIONAR CONSTRAINTS PARA TABELA public.investidores
-- ----------------------------------------------------------------------------

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'investidores' 
        AND column_name = 'emissao_id'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'fk_investidores_emissao'
        ) THEN
            ALTER TABLE public.investidores
            ADD CONSTRAINT fk_investidores_emissao
            FOREIGN KEY (emissao_id) REFERENCES public.emissoes(id)
            ON DELETE CASCADE ON UPDATE CASCADE;
            
            RAISE NOTICE 'Constraint fk_investidores_emissao criada';
        END IF;
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 3. VERIFICAR E ADICIONAR CONSTRAINTS PARA TABELA estruturacao.operacoes
-- ----------------------------------------------------------------------------

-- FK para emissao (se existir coluna id_emissao_comercial)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'estruturacao' 
        AND table_name = 'operacoes' 
        AND column_name = 'id_emissao_comercial'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'fk_operacoes_emissao'
        ) THEN
            -- Adicionar constraint com validação diferida para dados existentes
            ALTER TABLE estruturacao.operacoes
            ADD CONSTRAINT fk_operacoes_emissao
            FOREIGN KEY (id_emissao_comercial) REFERENCES public.emissoes(id)
            ON DELETE SET NULL ON UPDATE CASCADE;
            
            RAISE NOTICE 'Constraint fk_operacoes_emissao criada';
        END IF;
    END IF;
END $$;

-- FK para analista de gestão
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'estruturacao' 
        AND table_name = 'operacoes' 
        AND column_name = 'analista_gestao_id'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'fk_operacoes_analista'
        ) THEN
            ALTER TABLE estruturacao.operacoes
            ADD CONSTRAINT fk_operacoes_analista
            FOREIGN KEY (analista_gestao_id) REFERENCES estruturacao.analistas_gestao(id)
            ON DELETE SET NULL ON UPDATE CASCADE;
            
            RAISE NOTICE 'Constraint fk_operacoes_analista criada';
        END IF;
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 4. VERIFICAR E ADICIONAR CONSTRAINTS PARA TABELA estruturacao.pendencias
-- ----------------------------------------------------------------------------

-- FK para operacao
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'estruturacao' 
        AND table_name = 'pendencias' 
        AND column_name = 'operacao_id'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'fk_pendencias_operacao'
        ) THEN
            ALTER TABLE estruturacao.pendencias
            ADD CONSTRAINT fk_pendencias_operacao
            FOREIGN KEY (operacao_id) REFERENCES estruturacao.operacoes(id)
            ON DELETE CASCADE ON UPDATE CASCADE;
            
            RAISE NOTICE 'Constraint fk_pendencias_operacao criada';
        END IF;
    END IF;
END $$;

-- FK para responsável
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'estruturacao' 
        AND table_name = 'pendencias' 
        AND column_name = 'responsavel_id'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'fk_pendencias_responsavel'
        ) THEN
            ALTER TABLE estruturacao.pendencias
            ADD CONSTRAINT fk_pendencias_responsavel
            FOREIGN KEY (responsavel_id) REFERENCES estruturacao.analistas_gestao(id)
            ON DELETE SET NULL ON UPDATE CASCADE;
            
            RAISE NOTICE 'Constraint fk_pendencias_responsavel criada';
        END IF;
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 5. VERIFICAR E ADICIONAR CONSTRAINTS PARA TABELA estruturacao.analistas_gestao
-- ----------------------------------------------------------------------------

-- FK para auth.users
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'estruturacao' 
        AND table_name = 'analistas_gestao' 
        AND column_name = 'user_id'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'fk_analistas_user'
        ) THEN
            ALTER TABLE estruturacao.analistas_gestao
            ADD CONSTRAINT fk_analistas_user
            FOREIGN KEY (user_id) REFERENCES auth.users(id)
            ON DELETE CASCADE ON UPDATE CASCADE;
            
            RAISE NOTICE 'Constraint fk_analistas_user criada';
        END IF;
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 6. CRIAR CONSTRAINTS DE UNICIDADE ADICIONAIS
-- ----------------------------------------------------------------------------

-- Garantir que número_emissao seja único na tabela emissoes
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'uk_emissoes_numero_emissao'
    ) THEN
        ALTER TABLE public.emissoes
        ADD CONSTRAINT uk_emissoes_numero_emissao
        UNIQUE (numero_emissao);
        
        RAISE NOTICE 'Constraint uk_emissoes_numero_emissao criada';
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Não foi possível criar uk_emissoes_numero_emissao: %', SQLERRM;
END $$;

-- Garantir que número_emissao seja único na tabela operacoes
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'uk_operacoes_numero_emissao'
    ) THEN
        ALTER TABLE estruturacao.operacoes
        ADD CONSTRAINT uk_operacoes_numero_emissao
        UNIQUE (numero_emissao);
        
        RAISE NOTICE 'Constraint uk_operacoes_numero_emissao criada';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Não foi possível criar uk_operacoes_numero_emissao: %', SQLERRM;
    END;
END $$;

-- Garantir que id_emissao_comercial seja único na tabela operacoes
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'estruturacao' 
        AND table_name = 'operacoes' 
        AND column_name = 'id_emissao_comercial'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'uk_operacoes_id_emissao'
        ) THEN
            ALTER TABLE estruturacao.operacoes
            ADD CONSTRAINT uk_operacoes_id_emissao
            UNIQUE (id_emissao_comercial);
            
            RAISE NOTICE 'Constraint uk_operacoes_id_emissao criada';
        END IF;
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Não foi possível criar uk_operacoes_id_emissao: %', SQLERRM;
END $$;

-- Garantir que email seja único na tabela analistas_gestao
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'estruturacao' 
        AND table_name = 'analistas_gestao' 
        AND column_name = 'email'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'uk_analistas_email'
        ) THEN
            ALTER TABLE estruturacao.analistas_gestao
            ADD CONSTRAINT uk_analistas_email
            UNIQUE (email);
            
            RAISE NOTICE 'Constraint uk_analistas_email criada';
        END IF;
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Não foi possível criar uk_analistas_email: %', SQLERRM;
END $$;

-- Garantir que user_id seja único na tabela analistas_gestao
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'estruturacao' 
        AND table_name = 'analistas_gestao' 
        AND column_name = 'user_id'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'uk_analistas_user_id'
        ) THEN
            ALTER TABLE estruturacao.analistas_gestao
            ADD CONSTRAINT uk_analistas_user_id
            UNIQUE (user_id);
            
            RAISE NOTICE 'Constraint uk_analistas_user_id criada';
        END IF;
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Não foi possível criar uk_analistas_user_id: %', SQLERRM;
END $$;

-- ----------------------------------------------------------------------------
-- 7. ADICIONAR CONSTRAINTS CHECK PARA VALIDAÇÃO DE DADOS
-- ----------------------------------------------------------------------------

-- Check para status válidos em emissoes
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'chk_emissoes_status'
    ) THEN
        ALTER TABLE public.emissoes
        ADD CONSTRAINT chk_emissoes_status
        CHECK (status IN ('Em estruturação', 'Em andamento', 'Concluída', 'Cancelada', 'Suspenso'));
        
        RAISE NOTICE 'Constraint chk_emissoes_status criada';
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Não foi possível criar chk_emissoes_status: %', SQLERRM;
END $$;

-- Check para status válidos em operacoes
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'chk_operacoes_status'
    ) THEN
        ALTER TABLE estruturacao.operacoes
        ADD CONSTRAINT chk_operacoes_status
        CHECK (status IN ('Em estruturação', 'Em andamento', 'Liquidada', 'Cancelada', 'Bloqueada', 'Pendente'));
        
        RAISE NOTICE 'Constraint chk_operacoes_status criada';
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Não foi possível criar chk_operacoes_status: %', SQLERRM;
END $$;

-- Check para status válidos em pendencias
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'chk_pendencias_status'
    ) THEN
        ALTER TABLE estruturacao.pendencias
        ADD CONSTRAINT chk_pendencias_status
        CHECK (status IN ('Pendente', 'Em andamento', 'Concluída', 'Cancelada'));
        
        RAISE NOTICE 'Constraint chk_pendencias_status criada';
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Não foi possível criar chk_pendencias_status: %', SQLERRM;
END $$;

-- Check para prioridade válida em pendencias
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'estruturacao' 
        AND table_name = 'pendencias' 
        AND column_name = 'prioridade'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'chk_pendencias_prioridade'
        ) THEN
            ALTER TABLE estruturacao.pendencias
            ADD CONSTRAINT chk_pendencias_prioridade
            CHECK (prioridade IN ('Baixa', 'Média', 'Alta', 'Crítica'));
            
            RAISE NOTICE 'Constraint chk_pendencias_prioridade criada';
        END IF;
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Não foi possível criar chk_pendencias_prioridade: %', SQLERRM;
END $$;

-- Check para valor positivo em emissoes
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'emissoes' 
        AND column_name = 'valor_total'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'chk_emissoes_valor_total'
        ) THEN
            ALTER TABLE public.emissoes
            ADD CONSTRAINT chk_emissoes_valor_total
            CHECK (valor_total IS NULL OR valor_total >= 0);
            
            RAISE NOTICE 'Constraint chk_emissoes_valor_total criada';
        END IF;
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Não foi possível criar chk_emissoes_valor_total: %', SQLERRM;
END $$;

-- ----------------------------------------------------------------------------
-- 8. VIEW PARA VERIFICAR INTEGRIDADE REFERENCIAL
-- ----------------------------------------------------------------------------

CREATE OR REPLACE VIEW compliance.vw_verificar_integridade AS

-- Verificar operações sem emissão correspondente
SELECT 
    'Operação sem emissão' as problema,
    o.id as registro_id,
    o.numero_emissao,
    'estruturacao.operacoes' as tabela
FROM estruturacao.operacoes o
LEFT JOIN public.emissoes e ON e.id = o.id_emissao_comercial
WHERE o.id_emissao_comercial IS NOT NULL 
  AND e.id IS NULL

UNION ALL

-- Verificar pendências sem operação correspondente
SELECT 
    'Pendência sem operação' as problema,
    p.id as registro_id,
    NULL as numero_emissao,
    'estruturacao.pendencias' as tabela
FROM estruturacao.pendencias p
LEFT JOIN estruturacao.operacoes o ON o.id = p.operacao_id
WHERE p.operacao_id IS NOT NULL 
  AND o.id IS NULL

UNION ALL

-- Verificar investidores sem emissão correspondente
SELECT 
    'Investidor sem emissão' as problema,
    i.id as registro_id,
    NULL as numero_emissao,
    'public.investidores' as tabela
FROM public.investidores i
LEFT JOIN public.emissoes e ON e.id = i.emissao_id
WHERE i.emissao_id IS NOT NULL 
  AND e.id IS NULL;

COMMENT ON VIEW compliance.vw_verificar_integridade IS 
'View para identificar registros órfãos sem integridade referencial';

GRANT SELECT ON compliance.vw_verificar_integridade TO authenticated;

-- ----------------------------------------------------------------------------
-- 9. FUNÇÃO PARA CORRIGIR INTEGRIDADE
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION compliance.corrigir_integridade()
RETURNS TABLE (
    problema TEXT,
    registro_id UUID,
    acao TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    -- Corrigir operações com emissão inválida
    FOR registro_id IN 
        SELECT o.id 
        FROM estruturacao.operacoes o
        LEFT JOIN public.emissoes e ON e.id = o.id_emissao_comercial
        WHERE o.id_emissao_comercial IS NOT NULL AND e.id IS NULL
    LOOP
        UPDATE estruturacao.operacoes 
        SET id_emissao_comercial = NULL,
            atualizado_em = now()
        WHERE id = registro_id;
        
        RETURN QUERY SELECT 
            'Operação sem emissão'::TEXT,
            registro_id,
            'Emissão desvinculada'::TEXT;
    END LOOP;
    
    -- Corrigir pendências com operação inválida
    FOR registro_id IN 
        SELECT p.id 
        FROM estruturacao.pendencias p
        LEFT JOIN estruturacao.operacoes o ON o.id = p.operacao_id
        WHERE p.operacao_id IS NOT NULL AND o.id IS NULL
    LOOP
        DELETE FROM estruturacao.pendencias WHERE id = registro_id;
        
        RETURN QUERY SELECT 
            'Pendência sem operação'::TEXT,
            registro_id,
            'Pendência removida'::TEXT;
    END LOOP;
    
    -- Corrigir investidores com emissão inválida
    FOR registro_id IN 
        SELECT i.id 
        FROM public.investidores i
        LEFT JOIN public.emissoes e ON e.id = i.emissao_id
        WHERE i.emissao_id IS NOT NULL AND e.id IS NULL
    LOOP
        DELETE FROM public.investidores WHERE id = registro_id;
        
        RETURN QUERY SELECT 
            'Investidor sem emissão'::TEXT,
            registro_id,
            'Investidor removido'::TEXT;
    END LOOP;
    
    RETURN;
END;
$$;

COMMENT ON FUNCTION compliance.corrigir_integridade() IS 
'Corrige registros órfãos removendo ou desvinculando referências inválidas';

GRANT EXECUTE ON FUNCTION compliance.corrigir_integridade() TO authenticated;

-- ----------------------------------------------------------------------------
-- 10. LISTAR TODAS AS CONSTRAINTS CRIADAS
-- ----------------------------------------------------------------------------

SELECT 
    tc.constraint_name,
    tc.table_schema,
    tc.table_name,
    tc.constraint_type,
    COALESCE(
        kcu.column_name,
        ccu.column_name
    ) as column_name,
    CASE 
        WHEN tc.constraint_type = 'FOREIGN KEY' THEN
            ccu.table_schema || '.' || ccu.table_name || '.' || ccu.column_name
        ELSE NULL
    END as references
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name 
    AND tc.table_schema = kcu.table_schema
LEFT JOIN information_schema.constraint_column_usage ccu
    ON tc.constraint_name = ccu.constraint_name
    AND tc.table_schema = ccu.table_schema
WHERE tc.table_schema IN ('public', 'estruturacao', 'compliance', 'audit')
ORDER BY tc.table_schema, tc.table_name, tc.constraint_type, tc.constraint_name;
