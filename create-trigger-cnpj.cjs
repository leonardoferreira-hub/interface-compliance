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
-- Criar função para sincronizar CNPJ com compliance na criação
CREATE OR REPLACE FUNCTION sync_cnpj_to_compliance_on_create()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Só cria verificação no compliance se tiver CNPJ
    IF NEW.empresa_cnpj IS NOT NULL THEN
        INSERT INTO compliance.verificacoes_pendentes (
            operacao_id, numero_emissao, nome_operacao, cnpj, tipo_entidade,
            nome_entidade, status
        )
        VALUES (
            NEW.id, 
            NEW.numero_emissao, 
            COALESCE(NEW.nome_operacao, 'Operação ' || NEW.numero_emissao),
            NEW.empresa_cnpj, 
            'emitente', 
            NEW.empresa_razao_social, 
            'pendente'
        )
        ON CONFLICT DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Criar trigger para CNPJ na criação
DROP TRIGGER IF EXISTS trigger_sync_cnpj_compliance ON public.emissoes;

CREATE TRIGGER trigger_sync_cnpj_compliance
    AFTER INSERT ON public.emissoes
    FOR EACH ROW
    EXECUTE FUNCTION sync_cnpj_to_compliance_on_create();

NOTIFY pgrst, 'reload schema';
`;

async function run() {
  try {
    await client.connect();
    await client.query(sql);
    console.log('✅ Trigger criado! CNPJ vai pro compliance na criação da emissão');
    await client.end();
  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}
run();
