-- Migration: Fix RLS Policies - Remove permissive allow_all policies
-- Created: 2025-01-20
-- Description: Removes overly permissive RLS policies and creates appropriate access controls

-- ============================================
-- 1. compliance.cnpjs_verificados
-- ============================================
DROP POLICY IF EXISTS allow_all ON compliance.cnpjs_verificados;

CREATE POLICY cnpjs_verificados_select ON compliance.cnpjs_verificados
  FOR SELECT USING (true);  -- Public SELECT only

CREATE POLICY cnpjs_verificados_all ON compliance.cnpjs_verificados
  FOR ALL USING (auth.role() = 'authenticated');  -- Authenticated for other operations

-- ============================================
-- 2. compliance.investidores
-- ============================================
DROP POLICY IF EXISTS allow_all ON compliance.investidores;

CREATE POLICY investidores_select ON compliance.investidores
  FOR SELECT USING (true);

CREATE POLICY investidores_all ON compliance.investidores
  FOR ALL USING (auth.role() = 'authenticated');

-- ============================================
-- 3. compliance.verificacoes_pendentes
-- ============================================
DROP POLICY IF EXISTS allow_all ON compliance.verificacoes_pendentes;

CREATE POLICY verificacoes_select ON compliance.verificacoes_pendentes
  FOR SELECT USING (true);

CREATE POLICY verificacoes_all ON compliance.verificacoes_pendentes
  FOR ALL USING (auth.role() = 'authenticated');

-- ============================================
-- 4. estruturacao.compliance_checks
-- ============================================
DROP POLICY IF EXISTS allow_all ON estruturacao.compliance_checks;

CREATE POLICY compliance_checks_select ON estruturacao.compliance_checks
  FOR SELECT USING (true);

CREATE POLICY compliance_checks_all ON estruturacao.compliance_checks
  FOR ALL USING (auth.role() = 'authenticated');

-- ============================================
-- 5. estruturacao.operacoes - remove dangerous anon policy
-- ============================================
DROP POLICY IF EXISTS dev_anon_update_operacoes ON estruturacao.operacoes;
-- Keep only restrictive policies

-- ============================================
-- 6. public.categorias
-- ============================================
DROP POLICY IF EXISTS allow_all_categorias ON public.categorias;

CREATE POLICY categorias_select ON public.categorias
  FOR SELECT USING (true);

CREATE POLICY categorias_all ON public.categorias
  FOR ALL USING (auth.role() = 'authenticated');

-- ============================================
-- 7. public.custos
-- ============================================
DROP POLICY IF EXISTS allow_all_custos ON public.custos;

CREATE POLICY custos_select ON public.custos
  FOR SELECT USING (true);

CREATE POLICY custos_all ON public.custos
  FOR ALL USING (auth.role() = 'authenticated');

-- ============================================
-- 8. public.custos_emissao - remove dangerous anon policies
-- ============================================
DROP POLICY IF EXISTS dev_anon_insert_custos_emissao ON public.custos_emissao;
DROP POLICY IF EXISTS dev_anon_update_custos_emissao ON public.custos_emissao;

-- ============================================
-- 9. public.custos_linhas - remove dangerous anon policies
-- ============================================
DROP POLICY IF EXISTS dev_anon_delete_custos_linhas ON public.custos_linhas;
DROP POLICY IF EXISTS dev_anon_insert_custos_linhas ON public.custos_linhas;
DROP POLICY IF EXISTS dev_anon_update_custos_linhas ON public.custos_linhas;

-- ============================================
-- 10. public.dados_empresa
-- ============================================
DROP POLICY IF EXISTS allow_all_dados_empresa ON public.dados_empresa;

CREATE POLICY dados_empresa_select ON public.dados_empresa
  FOR SELECT USING (true);

CREATE POLICY dados_empresa_all ON public.dados_empresa
  FOR ALL USING (auth.role() = 'authenticated');

-- ============================================
-- 11. public.dados_estruturacao - remove dangerous anon policies
-- ============================================
DROP POLICY IF EXISTS allow_all_dados_estruturacao ON public.dados_estruturacao;
DROP POLICY IF EXISTS dev_anon_insert_dados_estruturacao ON public.dados_estruturacao;
DROP POLICY IF EXISTS dev_anon_update_dados_estruturacao ON public.dados_estruturacao;

CREATE POLICY dados_estruturacao_select ON public.dados_estruturacao
  FOR SELECT USING (true);

CREATE POLICY dados_estruturacao_all ON public.dados_estruturacao
  FOR ALL USING (auth.role() = 'authenticated');

-- ============================================
-- 12. public.historico_emissoes
-- ============================================
DROP POLICY IF EXISTS allow_all_historico_emissoes ON public.historico_emissoes;

CREATE POLICY historico_select ON public.historico_emissoes
  FOR SELECT USING (true);

CREATE POLICY historico_all ON public.historico_emissoes
  FOR ALL USING (auth.role() = 'authenticated');

-- ============================================
-- 13. public.lastros
-- ============================================
DROP POLICY IF EXISTS allow_all_lastros ON public.lastros;

CREATE POLICY lastros_select ON public.lastros
  FOR SELECT USING (true);

CREATE POLICY lastros_all ON public.lastros
  FOR ALL USING (auth.role() = 'authenticated');

-- ============================================
-- 14. public.prestadores_precos
-- ============================================
DROP POLICY IF EXISTS allow_all_prestadores_precos ON public.prestadores_precos;

CREATE POLICY prestadores_precos_select ON public.prestadores_precos
  FOR SELECT USING (true);

CREATE POLICY prestadores_precos_all ON public.prestadores_precos
  FOR ALL USING (auth.role() = 'authenticated');

-- ============================================
-- 15. public.prestadores_precos_emissao
-- ============================================
DROP POLICY IF EXISTS allow_all_prestadores_precos_emissao ON public.prestadores_precos_emissao;

CREATE POLICY prestadores_precos_emissao_select ON public.prestadores_precos_emissao
  FOR SELECT USING (true);

CREATE POLICY prestadores_precos_emissao_all ON public.prestadores_precos_emissao
  FOR ALL USING (auth.role() = 'authenticated');

-- ============================================
-- 16. public.series - remove dangerous anon policy
-- ============================================
DROP POLICY IF EXISTS dev_anon_delete_series ON public.series;
