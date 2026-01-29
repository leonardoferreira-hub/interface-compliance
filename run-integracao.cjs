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
CREATE OR REPLACE FUNCTION public.sync_emissao_to_estruturacao_and_compliance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_operacao_id uuid;
    v_numero_emissao text;
BEGIN
    v_numero_emissao := COALESCE(
        NEW.numero_emissao,
        'EM-' || TO_CHAR(NEW.data_emissao, 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 9999)::text, 4, '0')
    );
    
    INSERT INTO estruturacao.operacoes (
        id, numero_emissao, nome_operacao, status, valor_total, data_emissao,
        empresa_cnpj, empresa_razao_social, origem
    )
    VALUES (
        NEW.id, v_numero_emissao, COALESCE(NEW.nome_operacao, 'Operação ' || v_numero_emissao),
        'pendente', NEW.valor_total, NEW.data_emissao,
        NEW.empresa_cnpj, NEW.empresa_razao_social, 'comercial'
    )
    ON CONFLICT (id) DO UPDATE SET
        numero_emissao = EXCLUDED.numero_emissao,
        nome_operacao = EXCLUDED.nome_operacao,
        valor_total = EXCLUDED.valor_total,
        empresa_cnpj = EXCLUDED.empresa_cnpj,
        empresa_razao_social = EXCLUDED.empresa_razao_social,
        atualizado_em = now();
    
    IF NEW.empresa_cnpj IS NOT NULL THEN
        INSERT INTO compliance.verificacoes_pendentes (
            operacao_id, numero_emissao, nome_operacao, cnpj, tipo_entidade,
            nome_entidade, status, origem
        )
        VALUES (
            NEW.id, v_numero_emissao, COALESCE(NEW.nome_operacao, 'Operação ' || v_numero_emissao),
            NEW.empresa_cnpj, 'emitente', NEW.empresa_razao_social, 'pendente', 'comercial'
        )
        ON CONFLICT DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_sync_emissao_to_estruturacao ON public.emissoes;
CREATE TRIGGER trigger_sync_emissao_to_estruturacao
    AFTER INSERT OR UPDATE ON public.emissoes
    FOR EACH ROW EXECUTE FUNCTION public.sync_emissao_to_estruturacao_and_compliance();

CREATE OR REPLACE VIEW public.v_operacoes_compliance_unificado AS
SELECT 
    o.id, o.numero_emissao, o.nome_operacao, o.status as status_operacao,
    o.valor_total, o.data_emissao, o.empresa_cnpj, o.empresa_razao_social,
    COUNT(v.id) as total_verificacoes,
    COUNT(v.id) FILTER (WHERE v.status = 'pendente') as pendentes,
    COUNT(v.id) FILTER (WHERE v.status = 'em_analise') as em_analise,
    COUNT(v.id) FILTER (WHERE v.status = 'aprovado') as aprovados,
    COUNT(v.id) FILTER (WHERE v.status = 'reprovado') as reprovados,
    CASE 
        WHEN COUNT(v.id) = 0 THEN 'sem_verificacoes'
        WHEN COUNT(v.id) FILTER (WHERE v.status = 'reprovado') > 0 THEN 'bloqueado'
        WHEN COUNT(v.id) FILTER (WHERE v.status != 'aprovado') = 0 THEN 'aprovado'
        ELSE 'pendente'
    END as status_compliance
FROM estruturacao.operacoes o
LEFT JOIN compliance.verificacoes_pendentes v ON v.operacao_id = o.id
GROUP BY o.id, o.numero_emissao, o.nome_operacao, o.status, o.valor_total, o.data_emissao, o.empresa_cnpj, o.empresa_razao_social;

GRANT SELECT ON public.v_operacoes_compliance_unificado TO authenticated;
NOTIFY pgrst, 'reload schema';
`;

async function run() {
  try {
    await client.connect();
    await client.query(sql);
    console.log('✅ Integração criada!');
    await client.end();
  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}
run();
