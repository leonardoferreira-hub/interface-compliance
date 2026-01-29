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
-- Funções para gestão de documentos do investidor
CREATE OR REPLACE FUNCTION adicionar_documento_investidor(
    p_investidor_id uuid,
    p_tipo_documento text,
    p_nome_arquivo text,
    p_url_arquivo text,
    p_mime_type text,
    p_tamanho_bytes bigint
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result json;
BEGIN
    DELETE FROM compliance.investidor_documentos
    WHERE investidor_id = p_investidor_id
      AND tipo_documento = p_tipo_documento
      AND tipo_documento != 'outros';
    
    INSERT INTO compliance.investidor_documentos (
        investidor_id, tipo_documento, nome_arquivo, url_arquivo,
        mime_type, tamanho_bytes, status, enviado_por
    )
    VALUES (
        p_investidor_id, p_tipo_documento, p_nome_arquivo, p_url_arquivo,
        p_mime_type, p_tamanho_bytes, 'pendente', auth.uid()
    )
    RETURNING to_jsonb(*) INTO v_result;
    
    UPDATE compliance.investidores
    SET status_onboarding = 'em_analise'
    WHERE id = p_investidor_id
      AND status_onboarding = 'documentacao_pendente';
    
    RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION remover_documento_investidor(p_documento_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM compliance.investidor_documentos WHERE id = p_documento_id;
    RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION validar_documento_investidor(
    p_documento_id uuid,
    p_status text,
    p_observacoes text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_investidor_id uuid;
    v_result json;
BEGIN
    UPDATE compliance.investidor_documentos
    SET status = p_status, observacoes = p_observacoes,
        validado_por = auth.uid(), data_validacao = now()
    WHERE id = p_documento_id
    RETURNING investidor_id, to_jsonb(*) INTO v_investidor_id, v_result;
    
    IF p_status = 'aprovado' THEN
        IF NOT EXISTS (
            SELECT 1 FROM compliance.investidor_documentos
            WHERE investidor_id = v_investidor_id
              AND tipo_documento IN ('kyc', 'suitability', 'ficha_cadastral')
              AND status != 'aprovado'
        ) THEN
            UPDATE compliance.investidores
            SET status_onboarding = 'aprovado'
            WHERE id = v_investidor_id AND status_onboarding = 'em_analise';
        END IF;
    END IF;
    
    RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION adicionar_documento_investidor TO authenticated;
GRANT EXECUTE ON FUNCTION remover_documento_investidor TO authenticated;
GRANT EXECUTE ON FUNCTION validar_documento_investidor TO authenticated;

NOTIFY pgrst, 'reload schema';
`;

async function runSQL() {
  try {
    await client.connect();
    await client.query(sql);
    console.log('✅ Funções de documentos criadas!');
    await client.end();
  } catch (err) {
    console.error('❌ Erro:', err.message);
    process.exit(1);
  }
}

runSQL();
