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
-- Recriar a trigger de sincronização
DROP TRIGGER IF EXISTS trigger_auto_sync_compliance ON estruturacao.compliance_checks;

CREATE OR REPLACE FUNCTION estruturacao.sync_cnpj_to_compliance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_operacao RECORD;
BEGIN
    -- Buscar dados da operação
    SELECT * INTO v_operacao
    FROM estruturacao.operacoes
    WHERE id = NEW.operacao_id;
    
    IF NOT FOUND THEN
        RETURN NEW;
    END IF;
    
    -- Inserir/atualizar no compliance
    INSERT INTO compliance.verificacoes_pendentes (
        operacao_id, numero_emissao, nome_operacao, cnpj, tipo_entidade,
        nome_entidade, status, solicitado_por
    )
    VALUES (
        NEW.operacao_id, v_operacao.numero_emissao, v_operacao.nome_operacao,
        NEW.cnpj, NEW.tipo_entidade, NEW.nome_entidade, NEW.status, auth.uid()
    )
    ON CONFLICT (operacao_id, cnpj) WHERE status IN ('pendente', 'em_analise')
    DO UPDATE SET
        tipo_entidade = EXCLUDED.tipo_entidade,
        nome_entidade = EXCLUDED.nome_entidade,
        atualizado_em = now();
    
    RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_sync_cnpj_to_compliance
    AFTER INSERT ON estruturacao.compliance_checks
    FOR EACH ROW
    EXECUTE FUNCTION estruturacao.sync_cnpj_to_compliance();

-- Adicionar unique constraint se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_unique_verificacao_operacao_cnpj'
    ) THEN
        CREATE UNIQUE INDEX idx_unique_verificacao_operacao_cnpj 
        ON compliance.verificacoes_pendentes(operacao_id, cnpj) 
        WHERE status IN ('pendente', 'em_analise');
    END IF;
END $$;

-- Sincronizar CNPJs pendentes agora
INSERT INTO compliance.verificacoes_pendentes (
    operacao_id, numero_emissao, nome_operacao, cnpj, tipo_entidade,
    nome_entidade, status
)
SELECT 
    c.operacao_id, o.numero_emissao, o.nome_operacao, c.cnpj, c.tipo_entidade,
    c.nome_entidade, c.status
FROM estruturacao.compliance_checks c
JOIN estruturacao.operacoes o ON o.id = c.operacao_id
LEFT JOIN compliance.verificacoes_pendentes v ON v.operacao_id = c.operacao_id AND v.cnpj = c.cnpj
WHERE v.id IS NULL
ON CONFLICT (operacao_id, cnpj) WHERE status IN ('pendente', 'em_analise')
DO UPDATE SET
    tipo_entidade = EXCLUDED.tipo_entidade,
    nome_entidade = EXCLUDED.nome_entidade,
    atualizado_em = now();

NOTIFY pgrst, 'reload schema';
`;

async function run() {
  try {
    await client.connect();
    await client.query(sql);
    console.log('✅ Trigger recriada e CNPJs sincronizados!');
    await client.end();
  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}
run();
