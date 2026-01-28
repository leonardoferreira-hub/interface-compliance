# 📊 Guia de Migração de Dados - Excel → Supabase

Este guia detalha o processo completo de migração dos dados da planilha Excel para o Supabase.

---

## 📋 Pré-requisitos

1. **Python 3.8+** instalado
2. **Planilha Excel** com os dados (`Pipe - Overview (3).xlsx`)
3. **Acesso ao Supabase** com as credenciais (URL e Service Key)
4. **Migrações SQL executadas** no Supabase (schema `estruturacao` criado)

---

## 🚀 Passo a Passo

### 1️⃣ Configurar Variáveis de Ambiente

#### No Windows (PowerShell):
```powershell
# Navegar até a pasta do projeto
cd c:\Users\Leonardo\Documents\GitHub\interfaceestruturacao

# Configurar variáveis de ambiente
$env:SUPABASE_URL="https://seu-projeto.supabase.co"
$env:SUPABASE_SERVICE_KEY="sua_service_role_key_aqui"
```

#### No Windows (CMD):
```cmd
set SUPABASE_URL=https://seu-projeto.supabase.co
set SUPABASE_SERVICE_KEY=sua_service_role_key_aqui
```

#### No Linux/Mac:
```bash
export SUPABASE_URL="https://seu-projeto.supabase.co"
export SUPABASE_SERVICE_KEY="sua_service_role_key_aqui"
```

**⚠️ IMPORTANTE**: Use a **Service Role Key**, não a Anon Key! A Service Role Key tem permissões de admin necessárias para inserir dados.

---

### 2️⃣ Instalar Dependências Python

```bash
# Criar ambiente virtual (recomendado)
python -m venv venv

# Ativar ambiente virtual
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Instalar dependências
pip install -r scripts/requirements.txt
```

---

### 3️⃣ Verificar Estrutura da Planilha

Abra a planilha `Pipe - Overview (3).xlsx` e verifique se contém as seguintes abas:

- **Pipe** - Operações ativas
- **Histórico** - Operações finalizadas
- **Pendências** - Pendências de operações liquidadas

**Colunas esperadas** (podem variar):
- Emissão
- Operação
- PMO
- Categoria
- Veículo
- Volume
- Status
- Data de Entrada no Pipe
- Previsão de Liquidação
- Data de Liquidação
- Analista Gestão
- CNPJ
- Razão Social
- Floating
- Próximos Passos
- Alertas
- Resumo
- Fee Estruturação
- Fee Gestão / Remuneração
- Boletagem

**Nota**: O script tentará mapear automaticamente variações nos nomes das colunas (com e sem acentos).

---

### 4️⃣ Popular Tabelas de Referência (IMPORTANTE!)

Antes de migrar as operações, você precisa popular as tabelas de referência no Supabase:

#### A) Criar Analistas de Gestão

Execute no SQL Editor do Supabase:

```sql
-- Exemplo: criar analistas
INSERT INTO estruturacao.analistas_gestao (nome, email, tipo)
VALUES
  ('João Silva', 'joao@email.com', 'gestao'),
  ('Maria Santos', 'maria@email.com', 'financeiro'),
  ('Pedro Costa', 'pedro@email.com', 'contabil');

-- Criar hierarquia (opcional)
INSERT INTO estruturacao.hierarquia_analistas
  (analista_gestao_id, analista_financeiro_id, analista_contabil_id)
SELECT
  (SELECT id FROM estruturacao.analistas_gestao WHERE nome = 'João Silva'),
  (SELECT id FROM estruturacao.analistas_gestao WHERE nome = 'Maria Santos'),
  (SELECT id FROM estruturacao.analistas_gestao WHERE nome = 'Pedro Costa');
```

#### B) Criar Usuários (PMOs)

No Supabase Dashboard:
1. Vá em **Authentication** > **Users**
2. Clique em **Add User**
3. Crie usuários para cada PMO da planilha
4. Depois, execute:

```sql
-- Criar perfis de usuário
INSERT INTO public.user_profiles (id, nome, email, perfil)
VALUES
  ('uuid-do-usuario-1', 'Nome do PMO 1', 'pmo1@email.com', 'analista_estruturacao'),
  ('uuid-do-usuario-2', 'Nome do PMO 2', 'pmo2@email.com', 'analista_estruturacao');
```

---

### 5️⃣ Executar Migração

```bash
# Navegar até a pasta do projeto
cd c:\Users\Leonardo\Documents\GitHub\interfaceestruturacao

# Executar script de migração
python scripts/migrate_data.py
```

**Saída esperada**:
```
============================================================
🚀 INICIANDO MIGRAÇÃO DE DADOS
============================================================
📂 Carregando planilha: Pipe - Overview (3).xlsx
   Abas encontradas: ['Pipe', 'Histórico', 'Pendências']
   ✅ Aba 'Pipe' carregada com 50 linhas
   ✅ Aba 'Histórico' carregada com 30 linhas

🔍 Buscando referências do banco de dados...
   Categorias: 5 encontradas
   Veículos: 2 encontrados
   Usuários: 3 encontrados
   Analistas: 4 encontrados

📊 Processando aba: PIPE
   Total de linhas: 50
   ✅ Linha 2: EM-20260115-0019 - Operação XYZ
   ✅ Linha 3: EM-20260116-0020 - Operação ABC
   ...

============================================================
📈 RESUMO DA MIGRAÇÃO
============================================================
✅ Sucessos: 75
❌ Erros: 5
📊 Total processado: 80
============================================================

✨ Migração concluída!
```

---

### 6️⃣ Validar Dados Migrados

Execute no SQL Editor do Supabase:

```sql
-- Contar operações migradas
SELECT COUNT(*) as total_operacoes
FROM estruturacao.operacoes;

-- Ver operações por status
SELECT status, COUNT(*) as quantidade
FROM estruturacao.operacoes
GROUP BY status
ORDER BY quantidade DESC;

-- Ver últimas 10 operações inseridas
SELECT numero_emissao, nome_operacao, status, criado_em
FROM estruturacao.operacoes
ORDER BY criado_em DESC
LIMIT 10;
```

---

## 🔧 Troubleshooting

### Erro: "Variáveis de ambiente não configuradas"
**Solução**: Configure `SUPABASE_URL` e `SUPABASE_SERVICE_KEY` conforme passo 1.

### Erro: "Arquivo não encontrado"
**Solução**: Certifique-se de que `Pipe - Overview (3).xlsx` está na raiz do projeto.

### Erro: "Foreign key violation"
**Solução**: Popule as tabelas de referência primeiro (passo 4).

### Muitos erros na migração
**Solução**:
1. Verifique se os nomes das colunas na planilha correspondem aos esperados
2. Ajuste o mapeamento no arquivo `migrate_data.py` função `migrar_operacao()`
3. Verifique se há valores nulos em campos obrigatórios

### Erro: "Module not found"
**Solução**:
```bash
pip install -r scripts/requirements.txt
```

---

## 📝 Customizações

### Adaptar Mapeamento de Colunas

Se os nomes das colunas na sua planilha forem diferentes, edite a função `migrar_operacao()` em `migrate_data.py`:

```python
def migrar_operacao(row, refs):
    return {
        'numero_emissao': str(row.get('NOME_COLUNA_NA_SUA_PLANILHA', '')),
        # ... resto dos campos
    }
```

### Adicionar Novos Campos

Para migrar campos adicionais:

1. Adicione o campo no dicionário retornado por `migrar_operacao()`
2. Certifique-se de que a coluna existe na tabela SQL

---

## 🎯 Próximos Passos Após Migração

1. ✅ Validar dados no Supabase Dashboard
2. ✅ Testar queries e RLS policies
3. ✅ Popular pendências (se aplicável)
4. ✅ Configurar hierarquia de analistas
5. ✅ Testar aplicação web com dados reais

---

## 📚 Referências

- [Documentação Supabase](https://supabase.com/docs)
- [Pandas Documentation](https://pandas.pydata.org/docs/)
- [Python Supabase Client](https://github.com/supabase-community/supabase-py)

---

**Desenvolvido por**: Claude Code + Leonardo
**Data**: 24 de Janeiro de 2026
