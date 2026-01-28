# 🚀 Início Rápido - Migração de Dados

## ✅ Pré-requisitos Concluídos
- [x] Python instalado
- [x] Dependências instaladas
- [x] Planilha encontrada: `Pipe - Overview (3).xlsx`
- [x] 269 linhas de dados identificadas

---

## 📊 Estrutura da Planilha Detectada

**Abas encontradas:**
1. Histórico (269 linhas) ← Principal
2. Infos financeiro
3. Infos Gestão
4. Base de Dados
5. Pipe
6. Resumo
7. Compliance
8. Pendências
9. Prestadores

**Colunas principais (47 total):**
- UID, PMO, Categoria, Operação
- Previsão de Liquidação, Veículo, Emissão
- Volume, Remuneração, Status
- Data de Entrada no Pipe, Data de Liquidação
- Analista Gestão, Analista Financeiro, Analista Contábil
- E mais...

---

## 🔧 Passo 1: Configurar Credenciais do Supabase

Você precisa obter 2 informações do seu projeto Supabase:

### Como Obter as Credenciais:

1. **Acesse**: https://app.supabase.com
2. **Selecione seu projeto**
3. **Vá em**: Settings → API

Você verá:
- **Project URL**: `https://xxx.supabase.co`
- **anon public** (não use essa!)
- **service_role secret** ← **USE ESSA!**

### Configurar no Windows:

Abra o **PowerShell** e execute:

```powershell
# Substituir pelos seus valores reais
$env:SUPABASE_URL="https://SEU_PROJETO.supabase.co"
$env:SUPABASE_SERVICE_KEY="eyJhbGc...SUA_CHAVE_AQUI"
```

**⚠️ IMPORTANTE**:
- Use a **service_role** key, não a anon key
- A service_role key é secreta - não compartilhe!

---

## 🎯 Passo 2: Executar Migração

No mesmo PowerShell, execute:

```powershell
# Navegar até a pasta do projeto
cd "c:\Users\Leonardo\Documents\GitHub\interfaceestruturacao"

# Executar migração
python scripts\migrate_data.py
```

---

## ✅ O Que o Script Fará:

1. ✅ Conectar ao Supabase
2. ✅ Buscar referências (categorias, veículos, usuários, analistas)
3. ✅ Ler abas: Histórico, Pipe, Pendências
4. ✅ Para cada linha:
   - Mapear colunas
   - Converter datas
   - Inserir em `estruturacao.operacoes`
5. ✅ Mostrar progresso em tempo real
6. ✅ Exibir resumo (sucessos/erros)

---

## 📊 Saída Esperada:

```
============================================================
INICIANDO MIGRACAO DE DADOS
============================================================
Carregando planilha: Pipe - Overview (3).xlsx
   Abas encontradas: ['Historico', 'Pipe', ...]
   Aba 'Historico' carregada com 269 linhas

Buscando referencias do banco de dados...
   Categorias: 5 encontradas
   Veiculos: 2 encontrados
   Usuarios: 3 encontrados
   Analistas: 4 encontrados

Processando aba: HISTORICO
   Total de linhas: 269
   Linha 2: EM-20260115-0019 - Operacao XYZ
   Linha 3: EM-20260116-0020 - Operacao ABC
   ...

============================================================
RESUMO DA MIGRACAO
============================================================
Sucessos: 250
Erros: 19
Total processado: 269
============================================================
```

---

## ⚠️ Possíveis Erros e Soluções

### ❌ "Variáveis de ambiente não configuradas"
**Solução**: Execute novamente os comandos do Passo 1

### ❌ "Foreign key violation" ou "null value in column"
**Solução**: Você precisa popular as tabelas de referência primeiro:

```sql
-- Execute no SQL Editor do Supabase:

-- 1. Criar categorias (se não existirem)
INSERT INTO base_custos.categorias (codigo, descricao)
VALUES ('CRI', 'Certificado de Recebíveis Imobiliários'),
       ('CRA', 'Certificado de Recebíveis do Agronegócio'),
       ('DEB', 'Debênture');

-- 2. Criar veículos (se não existirem)
INSERT INTO base_custos.veiculos (sigla, descricao)
VALUES ('PS', 'Patrimônio Separado'),
       ('VE', 'Veículo Exclusivo');

-- 3. Criar analistas
INSERT INTO estruturacao.analistas_gestao (nome, email, tipo)
VALUES ('Analista Exemplo', 'analista@email.com', 'gestao');
```

### ❌ Muitos erros na migração
**Solução**:
1. Verifique se as colunas da planilha mudaram
2. Ajuste o mapeamento em `scripts/migrate_data.py`
3. Execute novamente

---

## 🔍 Validar Dados Migrados

Após a migração, execute no SQL Editor do Supabase:

```sql
-- Contar total de operações
SELECT COUNT(*) FROM estruturacao.operacoes;

-- Ver distribuição por status
SELECT status, COUNT(*) as total
FROM estruturacao.operacoes
GROUP BY status
ORDER BY total DESC;

-- Ver últimas 10 operações
SELECT numero_emissao, nome_operacao, status, criado_em
FROM estruturacao.operacoes
ORDER BY criado_em DESC
LIMIT 10;
```

---

## 📞 Próximos Passos

Após migração bem-sucedida:

1. ✅ Validar dados no Supabase Dashboard
2. ✅ Popular hierarquia de analistas (se necessário)
3. ✅ Testar RLS policies
4. ✅ Conectar frontend aos dados reais
5. ✅ Celebrar! 🎉

---

**Dúvidas?** Consulte [README_MIGRACAO.md](README_MIGRACAO.md) para detalhes completos.
