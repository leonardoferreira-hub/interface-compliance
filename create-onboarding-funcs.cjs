const { Client } = require('pg');

const client = new Client({
  host: 'db.gthtvpujwukbfgokghne.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'BThhbtySBLX43Zc2',
  ssl: { rejectUnauthorized: false }
});

const sql = `
-- Função para validar token de onboarding
CREATE OR REPLACE FUNCTION compliance.validar_token_onboarding(p_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_inv RECORD;
BEGIN
    SELECT * INTO v_inv
    FROM compliance.investidores
    WHERE token_acesso = p_token
      AND token_expira_em > now()
      AND status_onboarding IN ('pendente', 'documentacao_pendente');
    
    IF NOT FOUND THEN
        RETURN NULL;
    END IF;
    
    RETURN jsonb_build_object(
        'id', v_inv.id,
        'nome', v_inv.nome,
        'cpf_cnpj', v_inv.cpf_cnpj,
        'email', v_inv.email,
        'telefone', v_inv.telefone,
        'tipo', v_inv.tipo,
        'tipo_investidor', v_inv.tipo_investidor
    );
END;
$$;

-- Função para salvar dados do onboarding
CREATE OR REPLACE FUNCTION compliance.salvar_onboarding(
    p_id UUID,
    p_kyc_json JSONB,
    p_suitability_json JSONB,
    p_perfil_risco TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE compliance.investidores
    SET 
        kyc_json = p_kyc_json,
        suitability_json = p_suitability_json,
        perfil_risco = p_perfil_risco,
        status_onboarding = 'documentacao_pendente',
        atualizado_em = now()
    WHERE id = p_id;
    
    RETURN FOUND;
END;
$$;

-- Função para finalizar onboarding
CREATE OR REPLACE FUNCTION compliance.finalizar_onboarding(p_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE compliance.investidores
    SET 
        status_onboarding = 'em_analise',
        token_acesso = NULL,
        token_expira_em = NULL,
        atualizado_em = now()
    WHERE id = p_id;
    
    RETURN FOUND;
END;
$$;

-- Função para gerar link de onboarding (para uso interno)
CREATE OR REPLACE FUNCTION compliance.gerar_link_onboarding(
    p_investidor_id UUID,
    p_dias_validade INTEGER DEFAULT 7
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_token TEXT;
    v_base_url TEXT := 'http://100.91.53.76:5176/onboarding/';
BEGIN
    -- Gerar token único
    v_token := encode(gen_random_bytes(32), 'hex');
    
    -- Salvar token no investidor
    UPDATE compliance.investidores
    SET 
        token_acesso = v_token,
        token_expira_em = now() + (p_dias_validade || ' days')::INTERVAL,
        atualizado_em = now()
    WHERE id = p_investidor_id;
    
    RETURN v_base_url || v_token;
END;
$$;

-- Wrappers no schema public
DROP FUNCTION IF EXISTS public.validar_token_onboarding(TEXT);
DROP FUNCTION IF EXISTS public.salvar_onboarding(UUID, JSONB, JSONB, TEXT);
DROP FUNCTION IF EXISTS public.finalizar_onboarding(UUID);
DROP FUNCTION IF EXISTS public.gerar_link_onboarding(UUID, INTEGER);

CREATE OR REPLACE FUNCTION public.validar_token_onboarding(p_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN compliance.validar_token_onboarding(p_token);
END;
$$;

CREATE OR REPLACE FUNCTION public.salvar_onboarding(
    p_id UUID,
    p_kyc_json JSONB,
    p_suitability_json JSONB,
    p_perfil_risco TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN compliance.salvar_onboarding(p_id, p_kyc_json, p_suitability_json, p_perfil_risco);
END;
$$;

CREATE OR REPLACE FUNCTION public.finalizar_onboarding(p_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN compliance.finalizar_onboarding(p_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.gerar_link_onboarding(
    p_investidor_id UUID,
    p_dias_validade INTEGER DEFAULT 7
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN compliance.gerar_link_onboarding(p_investidor_id, p_dias_validade);
END;
$$;

NOTIFY pgrst, 'reload schema';
`;

async function run() {
  try {
    await client.connect();
    await client.query(sql);
    console.log('✅ Funções de onboarding criadas!');
    await client.end();
  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}
run();
