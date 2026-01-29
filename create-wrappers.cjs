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
-- Criar wrappers no schema public que chamam as funções do compliance
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

CREATE OR REPLACE FUNCTION public.atualizar_investidor(
    p_id UUID,
    p_status VARCHAR,
    p_observacoes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN compliance.atualizar_investidor(p_id, p_status, p_observacoes);
END;
$$;

NOTIFY pgrst, 'reload schema';
`;

async function run() {
  try {
    await client.connect();
    await client.query(sql);
    console.log('✅ Wrappers criados no schema public!');
    await client.end();
  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}
run();
