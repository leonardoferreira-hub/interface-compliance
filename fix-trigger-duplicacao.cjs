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
-- Corrigir trigger para não duplicar CNPJ no compliance
-- O CNPJ já é inserido na criação da emissão pelo trigger_sync_cnpj_compliance
CREATE OR REPLACE FUNCTION sync_emissao_to_estruturacao_and_compliance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_numero_emissao text;
BEGIN
    -- Só executa se status for 'aceita'
    IF NEW.status IS DISTINCT FROM 'aceita' THEN
        RETURN NEW;
    END IF;
    
    v_numero_emissao := COALESCE(
        NEW.numero_emissao,
        'EM-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 9999)::text, 4, '0')
    );
    
    -- Sincronizar com estruturação
    INSERT INTO estruturacao.operacoes (
        id, id_emissao_comercial, numero_emissao, nome_operacao, status,
        volume, empresa_cnpj, empresa_razao_social, data_entrada_pipe
    )
    VALUES (
        NEW.id, NEW.id, v_numero_emissao, COALESCE(NEW.nome_operacao, 'Operação ' || v_numero_emissao),
        'Em Estruturação', NEW.volume, NEW.empresa_cnpj, NEW.empresa_razao_social, CURRENT_DATE
    )
    ON CONFLICT (id) DO UPDATE SET
        numero_emissao = EXCLUDED.numero_emissao,
        nome_operacao = EXCLUDED.nome_operacao,
        volume = EXCLUDED.volume,
        empresa_cnpj = EXCLUDED.empresa_cnpj,
        empresa_razao_social = EXCLUDED.empresa_razao_social,
        atualizado_em = now();
    
    -- NÃO insere no compliance aqui - já foi inserido na criação da emissão
    -- e será atualizado quando o compliance aprovar
    
    RETURN NEW;
END;
$$;

NOTIFY pgrst, 'reload schema';
`;

async function run() {
  try {
    await client.connect();
    await client.query(sql);
    console.log('✅ Trigger corrigido! CNPJ não será duplicado.');
    await client.end();
  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}
run();
