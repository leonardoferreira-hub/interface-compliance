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
-- Dropar todas as versões das funções problemáticas
DROP FUNCTION IF EXISTS compliance.atualizar_verificacao(UUID, VARCHAR, TEXT);
DROP FUNCTION IF EXISTS compliance.atualizar_verificacao(UUID, character varying, TEXT);
DROP FUNCTION IF EXISTS compliance.atualizar_investidor(UUID, VARCHAR, TEXT);
DROP FUNCTION IF EXISTS compliance.atualizar_investidor(UUID, character varying, TEXT);

-- Recriar atualizar_verificacao corretamente
CREATE OR REPLACE FUNCTION compliance.atualizar_verificacao(
    p_id UUID,
    p_status VARCHAR,
    p_observacoes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_verificacao RECORD;
BEGIN
    -- Atualizar e pegar os dados
    UPDATE compliance.verificacoes_pendentes
    SET 
        status = p_status,
        observacoes = p_observacoes,
        data_analise = now(),
        analisado_por = auth.uid()
    WHERE id = p_id
    RETURNING id, cnpj, nome_entidade, status, observacoes, data_analise, analisado_por
    INTO v_verificacao;
    
    -- Se aprovado/reprovado, adicionar ao histórico
    IF p_status IN ('aprovado', 'reprovado') THEN
        INSERT INTO compliance.cnpjs_verificados (
            cnpj, razao_social, status_compliance, observacoes, verificado_por, origem
        )
        VALUES (
            v_verificacao.cnpj,
            v_verificacao.nome_entidade,
            p_status,
            p_observacoes,
            auth.uid(),
            'verificacao'
        )
        ON CONFLICT (cnpj) DO UPDATE SET
            status_compliance = p_status,
            observacoes = p_observacoes,
            data_verificacao = now(),
            verificado_por = auth.uid();
    END IF;
    
    -- Retornar como jsonb
    RETURN jsonb_build_object(
        'id', v_verificacao.id,
        'cnpj', v_verificacao.cnpj,
        'nome_entidade', v_verificacao.nome_entidade,
        'status', v_verificacao.status,
        'observacoes', v_verificacao.observacoes,
        'data_analise', v_verificacao.data_analise,
        'analisado_por', v_verificacao.analisado_por
    );
END;
$$;

-- Recriar atualizar_investidor corretamente
CREATE OR REPLACE FUNCTION compliance.atualizar_investidor(
    p_id UUID,
    p_status VARCHAR,
    p_observacoes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_inv RECORD;
BEGIN
    UPDATE compliance.investidores
    SET 
        status_onboarding = p_status,
        observacoes = p_observacoes,
        data_analise = now(),
        analisado_por = auth.uid()
    WHERE id = p_id
    RETURNING id, nome, cpf_cnpj, status_onboarding, observacoes, data_analise, analisado_por
    INTO v_inv;
    
    RETURN jsonb_build_object(
        'id', v_inv.id,
        'nome', v_inv.nome,
        'cpf_cnpj', v_inv.cpf_cnpj,
        'status_onboarding', v_inv.status_onboarding,
        'observacoes', v_inv.observacoes,
        'data_analise', v_inv.data_analise,
        'analisado_por', v_inv.analisado_por
    );
END;
$$;

NOTIFY pgrst, 'reload schema';
`;

async function run() {
  try {
    await client.connect();
    await client.query(sql);
    console.log('✅ Funções corrigidas!');
    await client.end();
  } catch (err) {
    console.error('❌ Erro:', err.message);
    console.error(err.stack);
  }
}
run();
