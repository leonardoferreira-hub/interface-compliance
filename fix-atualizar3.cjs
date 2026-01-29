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
-- Dropar e recriar a função de forma simples
DROP FUNCTION IF EXISTS compliance.atualizar_verificacao(UUID, VARCHAR, TEXT);

CREATE OR REPLACE FUNCTION compliance.atualizar_verificacao(
    p_id UUID,
    p_status VARCHAR(20),
    p_observacoes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_verificacao compliance.verificacoes_pendentes%ROWTYPE;
BEGIN
    -- Atualizar
    UPDATE compliance.verificacoes_pendentes
    SET 
        status = p_status,
        observacoes = p_observacoes,
        data_analise = now(),
        analisado_por = auth.uid()
    WHERE id = p_id
    RETURNING * INTO v_verificacao;
    
    -- Se aprovado/reprovado, adicionar ao histórico
    IF p_status IN ('aprovado', 'reprovado') THEN
        INSERT INTO compliance.cnpjs_verificados (
            cnpj, 
            razao_social, 
            status_compliance, 
            observacoes,
            verificado_por,
            origem
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

NOTIFY pgrst, 'reload schema';
`;

async function run() {
  try {
    await client.connect();
    await client.query(sql);
    console.log('✅ Função corrigida com jsonb_build_object!');
    await client.end();
  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}
run();
