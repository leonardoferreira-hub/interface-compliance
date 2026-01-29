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
-- Criar função no schema public para buscar investidores da emissão
CREATE OR REPLACE FUNCTION public.get_investidores_emissao(p_emissao_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', ie.id,
            'cnpj_cpf', ie.cnpj_cpf,
            'nome', ie.nome,
            'tipo', ie.tipo,
            'status', ie.status,
            'status_efetivo', COALESCE(
                CASE 
                    WHEN ie.status = 'aprovado' AND ie.cadastro_valido_ate > now() 
                    THEN 'pronto_para_integralizar'
                    WHEN ie.status = 'aprovado' AND ie.cadastro_valido_ate <= now() 
                    THEN 'cadastro_vencido'
                    ELSE ie.status
                END, 
                ie.status
            ),
            'cadastro_valido', CASE WHEN ie.cadastro_valido_ate > now() THEN TRUE ELSE FALSE END,
            'cadastro_valido_ate', ie.cadastro_valido_ate,
            'valor_integralizacao', ie.valor_integralizacao,
            'usou_cadastro_existente', ie.usou_cadastro_existente
        ) ORDER BY ie.criado_em
    )
    INTO v_result
    FROM compliance.investidor_emissao ie
    WHERE ie.emissao_id = p_emissao_id;
    
    RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

NOTIFY pgrst, 'reload schema';
`;

async function run() {
  try {
    await client.connect();
    await client.query(sql);
    console.log('✅ Função get_investidores_emissao criada no schema public!');
    await client.end();
  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}
run();
