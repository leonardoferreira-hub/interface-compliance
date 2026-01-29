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
-- Tabela para vincular investidores a emissões
CREATE TABLE IF NOT EXISTS compliance.investidor_emissao (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    emissao_id UUID NOT NULL,
    investidor_id UUID REFERENCES compliance.investidores(id),
    operacao_id UUID,
    numero_emissao TEXT,
    
    -- Dados do investidor (snapshot no momento da vinculação)
    cnpj_cpf TEXT NOT NULL,
    nome TEXT,
    tipo TEXT CHECK (tipo IN ('pessoa_fisica', 'pessoa_juridica', 'institucional')),
    
    -- Status no fluxo
    status TEXT DEFAULT 'pendente_cadastro' CHECK (status IN (
        'pendente_cadastro',   -- Aguardando preencher formulário
        'em_analise',          -- Compliance analisando
        'aprovado',            -- Aprovado, pode integralizar
        'reprovado',           -- Reprovado
        'integralizado'        -- Já fez a integralização
    )),
    
    -- Validação de 1 ano
    cadastro_valido_ate TIMESTAMP WITH TIME ZONE,
    
    -- Check se usou dados existentes (CNPJ já cadastrado)
    usou_cadastro_existente BOOLEAN DEFAULT FALSE,
    cadastro_origem_id UUID, -- Referência ao investidor original se existir
    
    -- Dados do formulário
    valor_integralizacao DECIMAL(15,2),
    percentual_pld DECIMAL(5,2),
    
    -- Timestamps
    convite_enviado_em TIMESTAMP WITH TIME ZONE,
    cadastro_preenchido_em TIMESTAMP WITH TIME ZONE,
    analisado_em TIMESTAMP WITH TIME ZONE,
    integralizado_em TIMESTAMP WITH TIME ZONE,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT now(),
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_investidor_emissao_emissao 
ON compliance.investidor_emissao(emissao_id);

CREATE INDEX IF NOT EXISTS idx_investidor_emissao_investidor 
ON compliance.investidor_emissao(investidor_id);

CREATE INDEX IF NOT EXISTS idx_investidor_emissao_cnpj 
ON compliance.investidor_emissao(cnpj_cpf);

CREATE INDEX IF NOT EXISTS idx_investidor_emissao_status 
ON compliance.investidor_emissao(status);

-- View para ver investidores por emissão com dados completos
CREATE OR REPLACE VIEW compliance.v_investidores_emissao AS
SELECT 
    ie.*,
    i.nome as nome_investidor,
    i.email as email_investidor,
    i.telefone as telefone_investidor,
    i.status_onboarding as status_compliance_geral,
    CASE 
        WHEN ie.cadastro_valido_ate > now() THEN TRUE 
        ELSE FALSE 
    END as cadastro_valido,
    CASE 
        WHEN ie.status = 'aprovado' AND ie.cadastro_valido_ate > now() THEN 'pronto_para_integralizar'
        WHEN ie.status = 'aprovado' AND ie.cadastro_valido_ate <= now() THEN 'cadastro_vencido'
        ELSE ie.status
    END as status_efetivo
FROM compliance.investidor_emissao ie
LEFT JOIN compliance.investidores i ON i.id = ie.investidor_id;

-- Função para verificar se CNPJ já existe e está válido
CREATE OR REPLACE FUNCTION compliance.verificar_cnpj_existente(p_cnpj TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_investidor RECORD;
BEGIN
    SELECT * INTO v_investidor
    FROM compliance.investidores
    WHERE cpf_cnpj = p_cnpj
      AND status_onboarding = 'aprovado'
    ORDER BY atualizado_em DESC
    LIMIT 1;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('existe', FALSE);
    END IF;
    
    -- Verificar se cadastro tem menos de 1 ano
    IF v_investidor.atualizado_em > now() - INTERVAL '1 year' THEN
        RETURN jsonb_build_object(
            'existe', TRUE,
            'valido', TRUE,
            'investidor_id', v_investidor.id,
            'nome', v_investidor.nome,
            'email', v_investidor.email,
            'telefone', v_investidor.telefone,
            'tipo', v_investidor.tipo,
            'tipo_investidor', v_investidor.tipo_investidor,
            'kyc_json', v_investidor.kyc_json,
            'suitability_json', v_investidor.suitability_json,
            'data_atualizacao', v_investidor.atualizado_em
        );
    ELSE
        RETURN jsonb_build_object(
            'existe', TRUE,
            'valido', FALSE,
            'investidor_id', v_investidor.id,
            'mensagem', 'Cadastro expirado (mais de 1 ano). Necessário atualizar.'
        );
    END IF;
END;
$$;

-- Função para criar vinculação investidor-emissão
CREATE OR REPLACE FUNCTION compliance.criar_vinculo_investidor_emissao(
    p_emissao_id UUID,
    p_numero_emissao TEXT,
    p_cnpj_cpf TEXT,
    p_tipo TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_id UUID;
    v_check JSONB;
    v_investidor_id UUID;
BEGIN
    -- Verificar se CNPJ já existe na base
    v_check := compliance.verificar_cnpj_existente(p_cnpj_cpf);
    
    -- Se existe e está válido, vincular ao investidor existente
    IF (v_check->>'existe')::BOOLEAN AND (v_check->>'valido')::BOOLEAN THEN
        v_investidor_id := (v_check->>'investidor_id')::UUID;
        
        INSERT INTO compliance.investidor_emissao (
            emissao_id, investidor_id, numero_emissao,
            cnpj_cpf, nome, tipo,
            status, cadastro_valido_ate, usou_cadastro_existente, cadastro_origem_id
        ) VALUES (
            p_emissao_id, v_investidor_id, p_numero_emissao,
            p_cnpj_cpf, v_check->>'nome', p_tipo,
            'aprovado', 
            (v_check->>'data_atualizacao')::TIMESTAMP + INTERVAL '1 year',
            TRUE,
            v_investidor_id
        )
        RETURNING id INTO v_id;
        
        RETURN jsonb_build_object(
            'id', v_id,
            'usou_existente', TRUE,
            'investidor_id', v_investidor_id
        );
    END IF;
    
    -- Se não existe ou está expirado, criar novo pendente
    INSERT INTO compliance.investidor_emissao (
        emissao_id, numero_emissao,
        cnpj_cpf, tipo, status
    ) VALUES (
        p_emissao_id, p_numero_emissao,
        p_cnpj_cpf, p_tipo, 'pendente_cadastro'
    )
    RETURNING id INTO v_id;
    
    RETURN jsonb_build_object(
        'id', v_id,
        'usou_existente', FALSE
    );
END;
$$;

-- Função para aprovar investidor na emissão
CREATE OR REPLACE FUNCTION compliance.aprovar_investidor_emissao(
    p_vinculo_id UUID,
    p_observacoes TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE compliance.investidor_emissao
    SET 
        status = 'aprovado',
        cadastro_valido_ate = now() + INTERVAL '1 year',
        analisado_em = now(),
        atualizado_em = now()
    WHERE id = p_vinculo_id;
    
    RETURN FOUND;
END;
$$;

-- Wrappers no schema public
DROP FUNCTION IF EXISTS public.verificar_cnpj_existente(TEXT);
DROP FUNCTION IF EXISTS public.criar_vinculo_investidor_emissao(UUID, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.aprovar_investidor_emissao(UUID, TEXT);

CREATE OR REPLACE FUNCTION public.verificar_cnpj_existente(p_cnpj TEXT)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$ BEGIN RETURN compliance.verificar_cnpj_existente(p_cnpj); END; $$;

CREATE OR REPLACE FUNCTION public.criar_vinculo_investidor_emissao(
    p_emissao_id UUID, p_numero_emissao TEXT, p_cnpj_cpf TEXT, p_tipo TEXT
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$ BEGIN RETURN compliance.criar_vinculo_investidor_emissao(p_emissao_id, p_numero_emissao, p_cnpj_cpf, p_tipo); END; $$;

CREATE OR REPLACE FUNCTION public.aprovar_investidor_emissao(p_vinculo_id UUID, p_observacoes TEXT DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER
AS $$ BEGIN RETURN compliance.aprovar_investidor_emissao(p_vinculo_id, p_observacoes); END; $$;

NOTIFY pgrst, 'reload schema';
`;

async function run() {
  try {
    await client.connect();
    await client.query(sql);
    console.log('✅ Estrutura de vinculação investidor-emissão criada!');
    await client.end();
  } catch (err) {
    console.error('❌ Erro:', err.message);
    console.error(err.stack);
  }
}
run();
