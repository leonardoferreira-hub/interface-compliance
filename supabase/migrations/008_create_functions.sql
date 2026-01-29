-- Migration: 008_create_functions.sql
-- Descrição: Cria funções utilitárias e triggers para o módulo de investidores
-- Autor: Sistema Interface Compliance
-- Data: 2025-01-20

-- ============================================
-- FUNÇÃO: update_updated_at_column()
-- ============================================
-- Trigger function para atualizar automaticamente o campo updated_at
-- Usada em todas as tabelas do módulo de compliance
-- ============================================

CREATE OR REPLACE FUNCTION compliance.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION compliance.update_updated_at_column() IS 
'Trigger function para atualizar automaticamente o campo updated_at nas tabelas do compliance';

-- ============================================
-- APLICAR TRIGGER: investidores
-- ============================================
DROP TRIGGER IF EXISTS trg_investidores_updated_at ON compliance.investidores;

CREATE TRIGGER trg_investidores_updated_at
    BEFORE UPDATE ON compliance.investidores
    FOR EACH ROW
    EXECUTE FUNCTION compliance.update_updated_at_column();

-- ============================================
-- APLICAR TRIGGER: emissao_investidores
-- ============================================
DROP TRIGGER IF EXISTS trg_emissao_investidores_updated_at ON compliance.emissao_investidores;

CREATE TRIGGER trg_emissao_investidores_updated_at
    BEFORE UPDATE ON compliance.emissao_investidores
    FOR EACH ROW
    EXECUTE FUNCTION compliance.update_updated_at_column();

-- ============================================
-- FUNÇÃO: gerar_link_cadastro()
-- ============================================
-- Gera um token único e link de cadastro para um investidor
-- em uma emissão específica.
-- 
-- Parâmetros:
--   - p_emissao_id: UUID da emissão
--   - p_tipo_investidor: Tipo do investidor (PF, PJ, INSTITUCIONAL)
--   - p_pre_cadastro: JSON opcional com dados pré-cadastrados
--   - p_base_url: URL base do sistema (opcional, default: app URL)
--
-- Retorna:
--   - token: Token único gerado
--   - link: Link completo de acesso
--   - emissao_investidor_id: ID do registro criado
-- ============================================

CREATE OR REPLACE FUNCTION compliance.gerar_link_cadastro(
    p_emissao_id UUID,
    p_tipo_investidor VARCHAR(20) DEFAULT 'PF',
    p_pre_cadastro JSONB DEFAULT NULL,
    p_base_url TEXT DEFAULT NULL
)
RETURNS TABLE (
    token VARCHAR(64),
    link TEXT,
    emissao_investidor_id UUID
) AS $$
DECLARE
    v_token VARCHAR(64);
    v_link TEXT;
    v_id UUID;
    v_base_url TEXT;
BEGIN
    -- Validar tipo de investidor
    IF p_tipo_investidor NOT IN ('PF', 'PJ', 'INSTITUCIONAL') THEN
        RAISE EXCEPTION 'Tipo de investidor inválido: %. Use PF, PJ ou INSTITUCIONAL', p_tipo_investidor;
    END IF;
    
    -- Definir URL base
    v_base_url := COALESCE(
        p_base_url,
        current_setting('app.settings.base_url', true),
        'https://app.compliance.com'
    );
    
    -- Gerar token único usando encode e gen_random_bytes
    v_token := encode(gen_random_bytes(32), 'hex');
    
    -- Verificar se token já existe (colisão improvável mas possível)
    WHILE EXISTS (
        SELECT 1 FROM compliance.emissao_investidores 
        WHERE token_cadastro = v_token
    ) LOOP
        v_token := encode(gen_random_bytes(32), 'hex');
    END LOOP;
    
    -- Construir link completo
    v_link := v_base_url || '/cadastro/emissao/' || p_emissao_id::TEXT || '?token=' || v_token || '&tipo=' || LOWER(p_tipo_investidor);
    
    -- Inserir novo registro
    INSERT INTO compliance.emissao_investidores (
        emissao_id,
        investidor_id,
        token_cadastro,
        status_cadastro,
        link_cadastro,
        pre_cadastro,
        criado_por
    ) VALUES (
        p_emissao_id,
        NULL, -- Investidor ainda não cadastrado
        v_token,
        'LINK_GERADO',
        v_link,
        p_pre_cadastro,
        auth.uid()
    )
    RETURNING compliance.emissao_investidores.id INTO v_id;
    
    -- Retornar dados gerados
    RETURN QUERY SELECT v_token, v_link, v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION compliance.gerar_link_cadastro(UUID, VARCHAR, JSONB, TEXT) IS 
'Gera token único e link de cadastro para investidor em uma emissão. Retorna token, link e ID do registro.';

-- ============================================
-- FUNÇÃO: validar_token()
-- ============================================
-- Valida um token de cadastro e retorna os dados da emissão
-- associada junto com o status atual.
--
-- Parâmetros:
--   - p_token: Token a ser validado
--
-- Retorna:
--   - valido: Boolean indicando se o token é válido
--   - emissao_id: ID da emissão associada
--   - emissao_investidor_id: ID do registro de vínculo
--   - investidor_id: ID do investidor (se já cadastrado)
--   - tipo_investidor: Tipo do investidor (extraído do pre_cadastro ou padrão)
--   - status_cadastro: Status atual do cadastro
--   - pre_cadastro: Dados de pré-cadastro
--   - mensagem: Mensagem descritiva do resultado
--   - pode_cadastrar: Se o investidor pode prosseguir com o cadastro
-- ============================================

CREATE OR REPLACE FUNCTION compliance.validar_token(
    p_token VARCHAR(64)
)
RETURNS TABLE (
    valido BOOLEAN,
    emissao_id UUID,
    emissao_investidor_id UUID,
    investidor_id UUID,
    tipo_investidor VARCHAR(20),
    status_cadastro VARCHAR(30),
    pre_cadastro JSONB,
    mensagem TEXT,
    pode_cadastrar BOOLEAN
) AS $$
DECLARE
    v_registro RECORD;
    v_valido BOOLEAN := false;
    v_mensagem TEXT := '';
    v_pode_cadastrar BOOLEAN := false;
    v_tipo VARCHAR(20);
BEGIN
    -- Buscar registro pelo token
    SELECT 
        ei.id,
        ei.emissao_id,
        ei.investidor_id,
        ei.status_cadastro,
        ei.pre_cadastro,
        ei.data_primeiro_acesso
    INTO v_registro
    FROM compliance.emissao_investidores ei
    WHERE ei.token_cadastro = p_token;
    
    -- Verificar se token existe
    IF v_registro IS NULL THEN
        RETURN QUERY SELECT 
            false,
            NULL::UUID,
            NULL::UUID,
            NULL::UUID,
            NULL::VARCHAR,
            NULL::VARCHAR,
            NULL::JSONB,
            'Token não encontrado ou inválido'::TEXT,
            false;
        RETURN;
    END IF;
    
    -- Verificar status que impedem cadastro
    CASE v_registro.status_cadastro
        WHEN 'EXPIRADO' THEN
            v_mensagem := 'Link de cadastro expirado. Solicite um novo link.';
            v_valido := false;
            v_pode_cadastrar := false;
        WHEN 'CANCELADO' THEN
            v_mensagem := 'Cadastro cancelado. Entre em contato com o gestor.';
            v_valido := false;
            v_pode_cadastrar := false;
        WHEN 'APROVADO' THEN
            v_mensagem := 'Cadastro já aprovado.';
            v_valido := true;
            v_pode_cadastrar := false;
        WHEN 'REPROVADO' THEN
            v_mensagem := 'Cadastro reprovado. Entre em contato com o gestor.';
            v_valido := true;
            v_pode_cadastrar := false;
        WHEN 'EM_ANALISE' THEN
            v_mensagem := 'Cadastro em análise. Aguarde contato.';
            v_valido := true;
            v_pode_cadastrar := false;
        ELSE
            v_valido := true;
            v_pode_cadastrar := true;
            v_mensagem := 'Token válido. Prossiga com o cadastro.';
    END CASE;
    
    -- Determinar tipo do investidor
    IF v_registro.pre_cadastro ? 'tipo_investidor' THEN
        v_tipo := v_registro.pre_cadastro->>'tipo_investidor';
    ELSE
        v_tipo := 'PF'; -- Default
    END IF;
    
    -- Atualizar status para ACESSADO se for o primeiro acesso
    IF v_valido AND v_registro.data_primeiro_acesso IS NULL THEN
        UPDATE compliance.emissao_investidores
        SET 
            data_primeiro_acesso = NOW(),
            status_cadastro = 'ACESSADO'
        WHERE id = v_registro.id
        AND status_cadastro IN ('LINK_GERADO', 'EMAIL_ENVIADO', 'EMAIL_ERRO');
    END IF;
    
    -- Retornar resultado
    RETURN QUERY SELECT 
        v_valido,
        v_registro.emissao_id,
        v_registro.id,
        v_registro.investidor_id,
        v_tipo,
        CASE 
            WHEN v_registro.data_primeiro_acesso IS NULL 
                 AND v_registro.status_cadastro IN ('LINK_GERADO', 'EMAIL_ENVIADO', 'EMAIL_ERRO')
            THEN 'ACESSADO'::VARCHAR(30)
            ELSE v_registro.status_cadastro
        END,
        v_registro.pre_cadastro,
        v_mensagem,
        v_pode_cadastrar;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION compliance.validar_token(VARCHAR) IS 
'Valida um token de cadastro e retorna dados da emissão e permissões. Atualiza status para ACESSADO no primeiro uso.';

-- ============================================
-- FUNÇÃO: atualizar_status_cadastro()
-- ============================================
-- Atualiza o status do cadastro de um investidor em uma emissão
-- e registra o histórico da mudança.
--
-- Parâmetros:
--   - p_emissao_investidor_id: ID do registro de vínculo
--   - p_novo_status: Novo status a ser definido
--   - p_observacao: Observação opcional sobre a mudança
--
-- Retorna:
--   - sucesso: Boolean indicando se a operação foi bem-sucedida
--   - mensagem: Mensagem descritiva
-- ============================================

CREATE OR REPLACE FUNCTION compliance.atualizar_status_cadastro(
    p_emissao_investidor_id UUID,
    p_novo_status VARCHAR(30),
    p_observacao TEXT DEFAULT NULL
)
RETURNS TABLE (
    sucesso BOOLEAN,
    mensagem TEXT
) AS $$
DECLARE
    v_status_atual VARCHAR(30);
    v_transicao_valida BOOLEAN := false;
BEGIN
    -- Verificar se o registro existe
    SELECT status_cadastro INTO v_status_atual
    FROM compliance.emissao_investidores
    WHERE id = p_emissao_investidor_id;
    
    IF v_status_atual IS NULL THEN
        RETURN QUERY SELECT false, 'Registro não encontrado'::TEXT;
        RETURN;
    END IF;
    
    -- Verificar transição de status válida
    v_transicao_valida := CASE
        -- De LINK_GERADO para outros
        WHEN v_status_atual = 'LINK_GERADO' AND p_novo_status IN ('EMAIL_ENVIADO', 'EMAIL_ERRO', 'ACESSADO', 'CANCELADO') THEN true
        -- De EMAIL_ENVIADO para outros
        WHEN v_status_atual = 'EMAIL_ENVIADO' AND p_novo_status IN ('EMAIL_ERRO', 'ACESSADO', 'CANCELADO') THEN true
        -- De ACESSADO para outros
        WHEN v_status_atual = 'ACESSADO' AND p_novo_status IN ('INICIADO', 'CANCELADO') THEN true
        -- De INICIADO para outros
        WHEN v_status_atual = 'INICIADO' AND p_novo_status IN ('DADOS_PREENCHIDOS', 'CANCELADO') THEN true
        -- De DADOS_PREENCHIDOS para outros
        WHEN v_status_atual = 'DADOS_PREENCHIDOS' AND p_novo_status IN ('DOCUMENTOS_ENVIADOS', 'CANCELADO') THEN true
        -- De DOCUMENTOS_ENVIADOS para outros
        WHEN v_status_atual = 'DOCUMENTOS_ENVIADOS' AND p_novo_status IN ('EM_ANALISE', 'CANCELADO') THEN true
        -- De EM_ANALISE para outros
        WHEN v_status_atual = 'EM_ANALISE' AND p_novo_status IN ('APROVADO', 'REPROVADO', 'CANCELADO') THEN true
        -- Mesmo status (atualização sem mudança)
        WHEN v_status_atual = p_novo_status THEN true
        ELSE false
    END;
    
    IF NOT v_transicao_valida THEN
        RETURN QUERY SELECT false, 
            format('Transição de status inválida: %s -> %s', v_status_atual, p_novo_status);
        RETURN;
    END IF;
    
    -- Atualizar status
    UPDATE compliance.emissao_investidores
    SET 
        status_cadastro = p_novo_status,
        observacoes = COALESCE(observacoes || E'\n' || NOW()::TEXT || ': ' || p_observacao, p_observacao)
    WHERE id = p_emissao_investidor_id;
    
    -- Registrar no log de auditoria (se tabela existir)
    -- INSERT INTO compliance.audit_log (...)
    
    RETURN QUERY SELECT true, 
        format('Status atualizado de %s para %s', v_status_atual, p_novo_status);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION compliance.atualizar_status_cadastro(UUID, VARCHAR, TEXT) IS 
'Atualiza o status do cadastro de um investidor com validação de transições permitidas.';

-- ============================================
-- FUNÇÃO: buscar_investidor_por_documento()
-- ============================================
-- Busca um investidor pelo CPF ou CNPJ.
-- 
-- Parâmetros:
--   - p_documento: CPF ou CNPJ (somente números ou formatado)
--
-- Retorna:
--   - Lista de investidores que correspondem ao documento
-- ============================================

CREATE OR REPLACE FUNCTION compliance.buscar_investidor_por_documento(
    p_documento TEXT
)
RETURNS TABLE (
    id UUID,
    tipo VARCHAR(20),
    nome TEXT,
    documento TEXT,
    status VARCHAR(20),
    created_at TIMESTAMPTZ
) AS $$
DECLARE
    v_documento_limpo TEXT;
BEGIN
    -- Remover formatação do documento (pontos, traços, barras)
    v_documento_limpo := regexp_replace(p_documento, '[^0-9]', '', 'g');
    
    RETURN QUERY
    SELECT 
        i.id,
        i.tipo,
        CASE 
            WHEN i.tipo = 'PF' THEN i.dados_pf->>'nome_completo'
            WHEN i.tipo = 'PJ' THEN COALESCE(i.dados_pj->>'nome_fantasia', i.dados_pj->>'razao_social')
            ELSE COALESCE(i.dados_institucional->>'nome_fantasia', i.dados_institucional->>'razao_social')
        END AS nome,
        CASE 
            WHEN i.tipo = 'PF' THEN i.dados_pf->>'cpf'
            WHEN i.tipo = 'PJ' THEN i.dados_pj->>'cnpj'
            ELSE i.dados_institucional->>'cnpj'
        END AS documento,
        i.status,
        i.created_at
    FROM compliance.investidores i
    WHERE 
        (i.tipo = 'PF' AND regexp_replace(i.dados_pf->>'cpf', '[^0-9]', '', 'g') = v_documento_limpo)
        OR
        (i.tipo = 'PJ' AND regexp_replace(i.dados_pj->>'cnpj', '[^0-9]', '', 'g') = v_documento_limpo)
        OR
        (i.tipo = 'INSTITUCIONAL' AND regexp_replace(i.dados_institucional->>'cnpj', '[^0-9]', '', 'g') = v_documento_limpo);
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION compliance.buscar_investidor_por_documento(TEXT) IS 
'Busca investidor por CPF ou CNPJ (aceita formatado ou somente números).';

-- ============================================
-- FUNÇÃO: associar_investidor_ao_token()
-- ============================================
-- Associa um investidor existente ou recém-criado ao token de cadastro.
-- Usada após o investidor completar o cadastro.
--
-- Parâmetros:
--   - p_token: Token de cadastro
--   - p_investidor_id: ID do investidor a ser associado
--
-- Retorna:
--   - sucesso: Boolean
--   - mensagem: Texto descritivo
-- ============================================

CREATE OR REPLACE FUNCTION compliance.associar_investidor_ao_token(
    p_token VARCHAR(64),
    p_investidor_id UUID
)
RETURNS TABLE (
    sucesso BOOLEAN,
    mensagem TEXT
) AS $$
DECLARE
    v_emissao_investidor_id UUID;
    v_investidor_existente UUID;
BEGIN
    -- Verificar se o token existe e está pendente
    SELECT ei.id, ei.investidor_id 
    INTO v_emissao_investidor_id, v_investidor_existente
    FROM compliance.emissao_investidores ei
    WHERE ei.token_cadastro = p_token
    AND ei.status_cadastro IN ('INICIADO', 'DADOS_PREENCHIDOS', 'DOCUMENTOS_ENVIADOS');
    
    IF v_emissao_investidor_id IS NULL THEN
        RETURN QUERY SELECT false, 'Token inválido ou cadastro não está em andamento'::TEXT;
        RETURN;
    END IF;
    
    -- Verificar se já existe investidor associado
    IF v_investidor_existente IS NOT NULL THEN
        RETURN QUERY SELECT false, 'Token já possui investidor associado'::TEXT;
        RETURN;
    END IF;
    
    -- Verificar se o investidor existe
    IF NOT EXISTS (SELECT 1 FROM compliance.investidores WHERE id = p_investidor_id) THEN
        RETURN QUERY SELECT false, 'Investidor não encontrado'::TEXT;
        RETURN;
    END IF;
    
    -- Atualizar associação
    UPDATE compliance.emissao_investidores
    SET investidor_id = p_investidor_id
    WHERE id = v_emissao_investidor_id;
    
    RETURN QUERY SELECT true, 'Investidor associado com sucesso'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION compliance.associar_investidor_ao_token(VARCHAR, UUID) IS 
'Associa um investidor a um token de cadastro após conclusão do formulário.';

-- ============================================
-- PERMISSÕES
-- ============================================
-- Garantir que usuários autenticados possam executar as funções

GRANT EXECUTE ON FUNCTION compliance.gerar_link_cadastro(UUID, VARCHAR, JSONB, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION compliance.validar_token(VARCHAR) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION compliance.atualizar_status_cadastro(UUID, VARCHAR, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION compliance.buscar_investidor_por_documento(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION compliance.associar_investidor_ao_token(VARCHAR, UUID) TO authenticated;

-- ============================================
-- FIM DA MIGRATION
-- ============================================
