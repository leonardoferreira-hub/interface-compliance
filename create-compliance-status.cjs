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
BEGIN
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
        WHERE cnpj = (SELECT empresa_cnpj FROM public.emissoes WHERE id = p_emissao_id LIMIT 1)
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
                'status', 'nao_encontrado',
                'aprovado', false,
                'reprovado', false,
                'pendente', false,
                'em_analise', false
            );
        END IF;
    END IF;
    
    RETURN v_result;
END;
$$;

-- Criar view para status de compliance de todas as emissões
CREATE OR REPLACE VIEW public.v_emissoes_compliance_status AS
SELECT 
    e.id as emissao_id,
    e.numero_emissao,
    e.empresa_cnpj,
    e.status_proposta,
    COALESCE(
        vp.status,
        cv.status_compliance,
        'pendente'
    ) as compliance_status,
    COALESCE(vp.nome_entidade, cv.razao_social) as nome_entidade,
    CASE 
        WHEN vp.status = 'aprovado' OR cv.status_compliance = 'aprovado' THEN true
        ELSE false
    END as compliance_aprovado
FROM public.emissoes e
LEFT JOIN compliance.verificacoes_pendentes vp ON vp.operacao_id = e.id
LEFT JOIN compliance.cnpjs_verificados cv ON cv.cnpj = e.empresa_cnpj
WHERE vp.id IS NOT NULL OR cv.id IS NOT NULL OR e.empresa_cnpj IS NOT NULL;

NOTIFY pgrst, 'reload schema';
`;

async function run() {
  try {
    await client.connect();
    await client.query(sql);
    console.log('✅ Função e view de status do compliance criadas!');
    await client.end();
  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}
run();
