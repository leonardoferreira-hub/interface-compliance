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
-- Criar função para buscar status do compliance para uma emissão
CREATE OR REPLACE FUNCTION public.get_status_compliance_emissao(p_emissao_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSONB;
    v_verificacao RECORD;
    v_cnpj TEXT;
BEGIN
    -- Buscar CNPJ da emissão
    SELECT empresa_cnpj INTO v_cnpj
    FROM public.emissoes
    WHERE id = p_emissao_id;
    
    -- Buscar verificação pendente
    SELECT 
        status,
        cnpj,
        nome_entidade,
        CASE 
            WHEN status = 'aprovado' THEN 'aprovado'
            WHEN status = 'reprovado' THEN 'reprovado'
            WHEN status = 'em_analise' THEN 'em_analise'
            ELSE 'pendente'
        END as status_normalizado
    INTO v_verificacao
    FROM compliance.verificacoes_pendentes
    WHERE operacao_id = p_emissao_id
       OR (cnpj = v_cnpj AND status IN ('pendente', 'em_analise'))
    LIMIT 1;
    
    IF FOUND THEN
        v_result := jsonb_build_object(
            'status', v_verificacao.status_normalizado,
            'cnpj', v_verificacao.cnpj,
            'nome_entidade', v_verificacao.nome_entidade,
            'aprovado', v_verificacao.status_normalizado = 'aprovado',
            'reprovado', v_verificacao.status_normalizado = 'reprovado',
            'pendente', v_verificacao.status_normalizado = 'pendente',
            'em_analise', v_verificacao.status_normalizado = 'em_analise'
        );
    ELSE
        -- Verificar no histórico de CNPJs verificados
        SELECT 
            status_compliance as status,
            cnpj,
            razao_social as nome_entidade,
            'aprovado' as status_normalizado
        INTO v_verificacao
        FROM compliance.cnpjs_verificados
        WHERE cnpj = v_cnpj
        LIMIT 1;
        
        IF FOUND THEN
            v_result := jsonb_build_object(
                'status', v_verificacao.status_normalizado,
                'cnpj', v_verificacao.cnpj,
                'nome_entidade', v_verificacao.nome_entidade,
                'aprovado', true,
                'reprovado', false,
                'pendente', false,
                'em_analise', false
            );
        ELSE
            v_result := jsonb_build_object(
                'status', 'pendente',
                'aprovado', false,
                'reprovado', false,
                'pendente', true,
                'em_analise', false
            );
        END IF;
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
    console.log('✅ Função de status do compliance criada!');
    await client.end();
  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}
run();
