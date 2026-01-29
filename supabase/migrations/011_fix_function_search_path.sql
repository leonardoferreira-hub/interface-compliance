-- Migration: Fix Function Search Paths - Prevent search path injection attacks
-- Created: 2025-01-20
-- Description: Sets explicit search_path on critical security functions

-- ============================================
-- Security Role Functions (public schema)
-- ============================================
ALTER FUNCTION public.is_admin() SET search_path = public, extensions;
ALTER FUNCTION public.is_gestor_estruturacao() SET search_path = public, extensions;
ALTER FUNCTION public.is_analista_estruturacao() SET search_path = public, extensions;
ALTER FUNCTION public.is_gestor_gestao() SET search_path = public, extensions;

-- ============================================
-- Compliance Functions (compliance schema)
-- ============================================
ALTER FUNCTION compliance.validar_token_onboarding() SET search_path = compliance, public, extensions;
ALTER FUNCTION compliance.salvar_onboarding() SET search_path = compliance, public, extensions;
ALTER FUNCTION compliance.finalizar_onboarding() SET search_path = compliance, public, extensions;
ALTER FUNCTION compliance.gerar_link_onboarding() SET search_path = compliance, public, extensions;
ALTER FUNCTION compliance.verificar_cnpj_existente() SET search_path = compliance, public, extensions;
ALTER FUNCTION compliance.atualizar_investidor() SET search_path = compliance, public, extensions;
ALTER FUNCTION compliance.atualizar_verificacao() SET search_path = compliance, public, extensions;
ALTER FUNCTION compliance.criar_vinculo_investidor_emissao() SET search_path = compliance, public, extensions;
ALTER FUNCTION compliance.aprovar_investidor_emissao() SET search_path = compliance, public, extensions;

-- ============================================
-- Investor Management Functions (public schema)
-- ============================================
ALTER FUNCTION public.criar_investidor() SET search_path = public, extensions;
ALTER FUNCTION public.get_investidor_detalhes() SET search_path = public, extensions;
ALTER FUNCTION public.adicionar_documento_investidor() SET search_path = public, extensions;
ALTER FUNCTION public.remover_documento_investidor() SET search_path = public, extensions;
ALTER FUNCTION public.validar_documento_investidor() SET search_path = public, extensions;
ALTER FUNCTION public.get_investidores_emissao() SET search_path = public, extensions;

-- ============================================
-- Estruturacao Functions (estruturacao schema)
-- ============================================
ALTER FUNCTION estruturacao.update_compliance_timestamp() SET search_path = estruturacao, public, extensions;
ALTER FUNCTION estruturacao.update_investidor_doc_timestamp() SET search_path = estruturacao, public, extensions;
ALTER FUNCTION estruturacao.sync_cnpj_to_compliance() SET search_path = estruturacao, compliance, public, extensions;
ALTER FUNCTION estruturacao.operacao_compliance_completo() SET search_path = estruturacao, public, extensions;

-- ============================================
-- Utility Functions (public schema)
-- ============================================
ALTER FUNCTION public.update_updated_at() SET search_path = public, extensions;
ALTER FUNCTION public.atualizar_updated_at() SET search_path = public, extensions;
ALTER FUNCTION public.log_alteracao() SET search_path = public, extensions;

-- ============================================
-- Documentation Comments
-- ============================================
COMMENT ON FUNCTION public.is_admin() IS 'Função de verificação de admin com search_path fixo para segurança';
COMMENT ON FUNCTION compliance.validar_token_onboarding() IS 'Função de validação de token com search_path fixo';
COMMENT ON FUNCTION compliance.salvar_onboarding() IS 'Função de salvamento de onboarding com search_path fixo';
COMMENT ON FUNCTION compliance.finalizar_onboarding() IS 'Função de finalização de onboarding com search_path fixo';
