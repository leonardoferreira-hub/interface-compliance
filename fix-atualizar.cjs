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
-- Corrigir função atualizar_verificacao
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
    v_result jsonb;
    v_verificacao RECORD;
BEGIN
    -- Atualizar e retornar os dados
    UPDATE compliance.verificacoes_pendentes
    SET 
        status = p_status,
        observacoes = p_observacoes,
        data_analise = now(),
        analisado_por = auth.uid()
    WHERE id = p_id
    RETURNING * INTO v_verificacao;
    
    -- Converter para JSONB
    v_result := to_jsonb(v_verificacao);
    
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
        SELECT 
            cnpj,
            nome_entidade,
            p_status,
            p_observacoes,
            auth.uid(),
            'verificacao'
        FROM compliance.verificacoes_pendentes
        WHERE id = p_id
        ON CONFLICT (cnpj) DO UPDATE SET
            status_compliance = p_status,
            observacoes = p_observacoes,
            data_verificacao = now(),
            verificado_por = auth.uid();
    END IF;
    
    RETURN v_result;
END;
$$;

NOTIFY pgrst, 'reload schema';
`;

async function run() {
  try {
    await client.connect();
    await client.query(sql);
    console.log('✅ Função atualizar_verificacao corrigida!');
    await client.end();
  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}
run();
