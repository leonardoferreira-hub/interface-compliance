# 🗄️ Otimizações do Banco de Dados - Compliance

Este diretório contém as migrations para otimização do banco de dados do sistema de compliance.

## 📁 Estrutura

```
interface-compliance/supabase/migrations/
├── 001_create_compliance_indexes.sql      # Índices para performance
├── 002_optimize_get_investidores_emissao.sql  # Materialized view e caching
├── 003_fix_sync_triggers.sql              # Triggers de sync otimizadas
├── 004_create_audit_system.sql            # Sistema de auditoria
├── 005_add_foreign_key_constraints.sql    # Constraints de integridade
└── README.md                              # Este arquivo
```

---

## 🔧 Migrations

### 001 - Índices de Performance

**Arquivo:** `001_create_compliance_indexes.sql`

Cria índices nas tabelas principais para melhorar performance:

| Tabela | Índice | Propósito |
|--------|--------|-----------|
| `public.emissoes` | `idx_emissoes_status` | Filtros por status |
| `public.emissoes` | `idx_emissoes_numero_emissao` | Busca por número |
| `public.emissoes` | `idx_emissoes_status_criado_em` | Listagens ordenadas |
| `estruturacao.operacoes` | `idx_operacoes_id_emissao_comercial` | JOIN com emissões |
| `estruturacao.operacoes` | `idx_operacoes_status` | Filtros por status |
| `estruturacao.pendencias` | `idx_pendencias_operacao_id` | JOIN com operações |
| `estruturacao.pendencias` | `idx_pendencias_status_prioridade_criado_em` | Lista de pendências |

**Índices Full-Text:**
- Busca textual em `nome_operacao` e `nome` das emissões

---

### 002 - Otimização get_investidores_emissao

**Arquivo:** `002_optimize_get_investidores_emissao.sql`

#### Materialized View

Cria `compliance.mv_investidores_emissao` para cachear dados agregados:

```sql
SELECT * FROM compliance.mv_investidores_emissao 
WHERE emissao_id = 'uuid-aqui';
```

**Colunas:**
- `total_investidores`
- `investidores_ativos/pendentes/cancelados`
- `total_valor_investido`
- `investidores_json` (array JSONB)

#### Funções Criadas

| Função | Descrição |
|--------|-----------|
| `get_investidores_emissao(uuid)` | Usa MV para resposta rápida |
| `get_investidores_emissao_raw(uuid)` | Lista raw sem agregação |
| `refresh_mv_investidores_emissao()` | Atualiza a MV (CONCURRENTLY) |

#### Uso

```sql
-- Consulta otimizada
SELECT * FROM get_investidores_emissao('uuid-da-emissao');

-- Atualizar cache após mudanças
SELECT refresh_mv_investidores_emissao();
```

---

### 003 - Triggers de Sync

**Arquivo:** `003_fix_sync_triggers.sql`

#### Sistema Anti-Loop

Cria `compliance.sync_control` para prevenir loops entre triggers bidirecionais.

#### Triggers

| Trigger | Tabela | Ação |
|---------|--------|------|
| `trg_sync_emissao_to_operacao` | `public.emissoes` | Sync para operações |
| `trg_sync_operacao_to_emissao` | `estruturacao.operacoes` | Sync para emissões |
| `trg_sync_pendencias_status` | `estruturacao.pendencias` | Atualiza status da operação |

#### Funções Auxiliares

```sql
-- Forçar sync manual (útil para correções)
SELECT * FROM compliance.force_sync_emissao_operacao('uuid-emissao');

-- Verificar sync em andamento
SELECT compliance.is_sync_in_progress('emissoes', 'operacoes', 'uuid');
```

---

### 004 - Sistema de Auditoria

**Arquivo:** `004_create_audit_system.sql`

#### Tabela de Log

`audit.log_mudancas_status` armazena:
- Mudanças de status
- UPDATEs em campos importantes
- INSERTs e DELETEs
- Usuário, timestamp, IP

#### Triggers de Auditoria

| Tabela | Trigger |
|--------|---------|
| `public.emissoes` | `trg_audit_emissoes` |
| `estruturacao.operacoes` | `trg_audit_operacoes` |
| `estruturacao.pendencias` | `trg_audit_pendencias` |
| `public.investidores` | `trg_audit_investidores` |

#### Funções de Consulta

```sql
-- Histórico de um registro
SELECT * FROM audit.get_historico_registro('operacoes', 'uuid', 50);

-- Mudanças por período
SELECT * FROM audit.get_mudancas_periodo('2026-01-01', '2026-01-31');

-- Estatísticas (últimos 30 dias)
SELECT * FROM audit.get_estatisticas_mudancas(30);

-- Dashboard
SELECT * FROM audit.vw_ultimas_mudancas;
```

#### Manutenção

```sql
-- Limpar logs antigos (mantém 365 dias por padrão)
SELECT audit.limpar_logs_antigos(180);
```

---

### 005 - Constraints de Integridade

**Arquivo:** `005_add_foreign_key_constraints.sql`

#### Foreign Keys

| Tabela | Coluna | Referência | Ação ON DELETE |
|--------|--------|------------|----------------|
| `emissoes` | `categoria_id` | `categorias(id)` | SET NULL |
| `emissoes` | `veiculo_id` | `veiculos(id)` | SET NULL |
| `emissoes` | `criado_por` | `auth.users(id)` | SET NULL |
| `investidores` | `emissao_id` | `emissoes(id)` | CASCADE |
| `operacoes` | `id_emissao_comercial` | `emissoes(id)` | SET NULL |
| `operacoes` | `analista_gestao_id` | `analistas_gestao(id)` | SET NULL |
| `pendencias` | `operacao_id` | `operacoes(id)` | CASCADE |
| `pendencias` | `responsavel_id` | `analistas_gestao(id)` | SET NULL |
| `analistas_gestao` | `user_id` | `auth.users(id)` | CASCADE |

#### Constraints UNIQUE

- `emissoes.numero_emissao`
- `operacoes.numero_emissao`
- `operacoes.id_emissao_comercial`
- `analistas_gestao.email`
- `analistas_gestao.user_id`

#### Constraints CHECK

- `chk_emissoes_status`: Valida status permitidos
- `chk_operacoes_status`: Valida status permitidos
- `chk_pendencias_status`: Valida status permitidos
- `chk_pendencias_prioridade`: Valida prioridades
- `chk_emissoes_valor_total`: Valor >= 0

#### Verificação de Integridade

```sql
-- Verificar registros órfãos
SELECT * FROM compliance.vw_verificar_integridade;

-- Corrigir automaticamente
SELECT * FROM compliance.corrigir_integridade();
```

---

## 🚀 Como Aplicar

### Opção 1: SQL Editor do Supabase

1. Acesse o SQL Editor no Dashboard do Supabase
2. Cole o conteúdo de cada migration
3. Execute na ordem numérica (001 → 005)

### Opção 2: CLI do Supabase

```bash
# Linkar projeto
supabase link --project-ref seu-project-ref

# Aplicar migrations
supabase db push
```

### Opção 3: Programaticamente

```sql
-- Executar todas as migrations em ordem
\i 001_create_compliance_indexes.sql
\i 002_optimize_get_investidores_emissao.sql
\i 003_fix_sync_triggers.sql
\i 004_create_audit_system.sql
\i 005_add_foreign_key_constraints.sql
```

---

## 📊 Testes de Performance

### Antes/Depois dos Índices

```sql
-- Testar query de listagem
EXPLAIN ANALYZE
SELECT * FROM emissoes 
WHERE status = 'Em estruturação' 
ORDER BY criado_em DESC;

-- Testar JOIN
EXPLAIN ANALYZE
SELECT e.*, o.status as operacao_status
FROM emissoes e
LEFT JOIN operacoes o ON o.id_emissao_comercial = e.id
WHERE e.numero_emissao = 'EM-0001';
```

### Testar Materialized View

```sql
-- Comparar performance
EXPLAIN ANALYZE 
SELECT * FROM get_investidores_emissao('uuid');

EXPLAIN ANALYZE 
SELECT * FROM mv_investidores_emissao 
WHERE emissao_id = 'uuid';
```

---

## ⚠️ Notas Importantes

### Compatibilidade
- Todas as migrations usam `IF NOT EXISTS` para evitar erros
- Constraints são adicionadas com verificação de dados existentes
- Triggers têm proteção contra loops infinitos

### Manutenção
- **Materialized View:** Atualizar via `refresh_mv_investidores_emissao()` após grandes alterações
- **Logs de Auditoria:** Configurar limpeza periódica com `limpar_logs_antigos()`
- **Sync Control:** Registros expiram automaticamente após 5 segundos

### Rollback
Se precisar reverter:

```sql
-- Remover triggers
DROP TRIGGER IF EXISTS trg_audit_emissoes ON public.emissoes;
DROP TRIGGER IF EXISTS trg_sync_emissao_to_operacao ON public.emissoes;

-- Remover materialized view
DROP MATERIALIZED VIEW IF EXISTS compliance.mv_investidores_emissao;

-- Remover índices (exemplo)
DROP INDEX IF EXISTS idx_emissoes_status;
```

---

## 📈 Próximos Passos Sugeridos

1. **Agendar Refresh da MV:**
   ```sql
   -- Via pg_cron (se disponível)
   SELECT cron.schedule('refresh-mv-investidores', '*/15 * * * *', 
     'SELECT compliance.refresh_mv_investidores_emissao()');
   ```

2. **Configurar Retenção de Logs:**
   ```sql
   -- Job diário para limpar logs antigos
   SELECT cron.schedule('cleanup-audit', '0 2 * * *', 
     'SELECT audit.limpar_logs_antigos(365)');
   ```

3. **Monitorar Performance:**
   ```sql
   -- Criar view de estatísticas de queries lentas
   SELECT * FROM pg_stat_statements 
   WHERE query LIKE '%emissoes%' 
   ORDER BY mean_time DESC;
   ```

---

## 🆘 Suporte

Em caso de problemas:
1. Verifique os logs do PostgreSQL
2. Consulte `compliance.vw_verificar_integridade` para dados inconsistentes
3. Use `compliance.corrigir_integridade()` para correções automáticas
