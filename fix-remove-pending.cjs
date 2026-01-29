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
-- Atualizar a função para DELETAR da tabela de pendentes quando aprovado/reprovado
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
    -- Pegar os dados antes de deletar
    SELECT * INTO v_verificacao
    FROM compliance.verificacoes_pendentes
    WHERE id = p_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('error', 'Verificação não encontrada');
    END IF;
    
    -- Adicionar ao histórico primeiro
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
    
    -- Sincronizar com a estruturação
    UPDATE estruturacao.compliance_checks
    SET 
        status = p_status,
        observacoes = p_observacoes,
        data_verificacao = now(),
        responsavel_id = auth.uid()
    WHERE operacao_id = v_verificacao.operacao_id 
      AND cnpj = v_verificacao.cnpj;
    
    -- Se aprovado/reprovado, REMOVER da lista de pendentes
    IF p_status IN ('aprovado', 'reprovado') THEN
        DELETE FROM compliance.verificacoes_pendentes
        WHERE id = p_id;
    ELSE
        -- Se apenas mudou para 'em_analise', atualizar
        UPDATE compliance.verificacoes_pendentes
        SET 
            status = p_status,
            observacoes = p_observacoes,
            data_analise = now(),
            analisado_por = auth.uid()
        WHERE id = p_id;
    END IF;
    
    -- Retornar os dados
    RETURN jsonb_build_object(
        'id', v_verificacao.id,
        'cnpj', v_verificacao.cnpj,
        'nome_entidade', v_verificacao.nome_entidade,
        'status', p_status,
        'observacoes', p_observacoes,
        'data_analise', now(),
        'analisado_por', auth.uid()
    );
END;
$$;

-- Atualizar o wrapper
CREATE OR REPLACE FUNCTION public.atualizar_verificacao(
    p_id UUID,
    p_status VARCHAR,
    p_observacoes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN compliance.atualizar_verificacao(p_id, p_status, p_observacoes);
END;
$$;

NOTIFY pgrst, 'reload schema';
`;

async function run() {
  try {
    await client.connect();
    await client.query(sql);
    console.log('✅ Função atualizada - aprovados/reprovados saem da lista!');
    await client.end();
  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}
run();
