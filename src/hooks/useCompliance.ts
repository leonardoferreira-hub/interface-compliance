import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// ============= Types =============

export interface CNPJVerificado {
  id: string;
  cnpj: string;
  razao_social: string | null;
  nome_fantasia: string | null;
  situacao_cadastral: string | null;
  data_abertura: string | null;
  atividade_principal: string | null;
  endereco: any;
  qsa: any;
  status_compliance: 'aprovado' | 'reprovado' | 'pendente';
  observacoes: string | null;
  verificado_por: string | null;
  data_verificacao: string | null;
}

export interface VerificacaoPendente {
  id: string;
  operacao_id: string | null;
  numero_emissao: string | null;
  nome_operacao: string | null;
  cnpj: string;
  tipo_entidade: string;
  nome_entidade: string | null;
  status: 'pendente' | 'em_analise' | 'aprovado' | 'reprovado';
  observacoes: string | null;
  solicitado_por: string | null;
  data_solicitacao: string;
  analisado_por: string | null;
  data_analise: string | null;
}

export interface Investidor {
  id: string;
  cpf_cnpj: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  tipo: 'pessoa_fisica' | 'pessoa_juridica';
  tipo_investidor: 'varejo' | 'qualificado' | 'profissional';
  status_onboarding: 'pendente' | 'documentacao_pendente' | 'em_analise' | 'aprovado' | 'reprovado';
  perfil_risco: string | null;
  origem: string;
  criado_em: string;
}

export interface DashboardStats {
  verificacoes_pendentes: number;
  verificacoes_em_analise: number;
  investidores_pendentes: number;
  investidores_em_analise: number;
  cnpjs_verificados_30d: number;
}

// ============= Queries =============

export function useDashboard() {
  return useQuery({
    queryKey: ['compliance-dashboard'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_compliance_dashboard')
        .select('*')
        .single();
      
      if (error) throw error;
      return data as DashboardStats;
    },
  });
}

export function useVerificacoesPendentes(status?: string) {
  return useQuery({
    queryKey: ['verificacoes-pendentes', status],
    queryFn: async () => {
      let query = supabase
        .from('v_compliance_verificacoes')
        .select('*')
        .order('data_solicitacao', { ascending: false });
      
      if (status) {
        query = query.eq('status', status);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as VerificacaoPendente[];
    },
  });
}

export function useCNPJsVerificados(cnpj?: string) {
  return useQuery({
    queryKey: ['cnpjs-verificados', cnpj],
    queryFn: async () => {
      let query = supabase
        .from('v_compliance_cnpjs')
        .select('*')
        .order('data_verificacao', { ascending: false });
      
      if (cnpj) {
        query = query.eq('cnpj', cnpj);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as CNPJVerificado[];
    },
  });
}

export function useInvestidores(status?: string) {
  return useQuery({
    queryKey: ['compliance-investidores', status],
    queryFn: async () => {
      let query = supabase
        .from('v_compliance_investidores')
        .select('*')
        .order('criado_em', { ascending: false });
      
      if (status) {
        query = query.eq('status_onboarding', status);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as Investidor[];
    },
  });
}

// ============= Mutations =============

export function useAnalisarVerificacao() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      id,
      status,
      observacoes,
    }: {
      id: string;
      status: 'aprovado' | 'reprovado' | 'em_analise';
      observacoes?: string;
    }) => {
      const { data, error } = await supabase
        .rpc('atualizar_verificacao', {
          p_id: id,
          p_status: status,
          p_observacoes: observacoes || null,
        });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['verificacoes-pendentes'] });
      queryClient.invalidateQueries({ queryKey: ['compliance-dashboard'] });
      toast.success('Análise registrada');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Erro ao analisar');
    },
  });
}

export function useCriarInvestidor() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (investidor: {
      cpf_cnpj: string;
      nome: string;
      email?: string;
      telefone?: string;
      tipo?: string;
      tipo_investidor?: string;
    }) => {
      const { data, error } = await supabase
        .rpc('criar_investidor', {
          p_cpf_cnpj: investidor.cpf_cnpj,
          p_nome: investidor.nome,
          p_email: investidor.email || null,
          p_telefone: investidor.telefone || null,
          p_tipo: investidor.tipo || 'pessoa_fisica',
          p_tipo_investidor: investidor.tipo_investidor || 'varejo',
        });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compliance-investidores'] });
      queryClient.invalidateQueries({ queryKey: ['compliance-dashboard'] });
      toast.success('Investidor criado');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Erro ao criar investidor');
    },
  });
}

export function useAnalisarInvestidor() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      id,
      status,
      observacoes,
    }: {
      id: string;
      status: 'aprovado' | 'reprovado' | 'em_analise';
      observacoes?: string;
    }) => {
      const { data, error } = await supabase
        .rpc('atualizar_investidor', {
          p_id: id,
          p_status: status,
          p_observacoes: observacoes || null,
        });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compliance-investidores'] });
      queryClient.invalidateQueries({ queryKey: ['compliance-dashboard'] });
      toast.success('Análise registrada');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Erro ao analisar');
    },
  });
}

// Buscar detalhes do investidor
export function useInvestidorDetalhes(id: string | undefined) {
  return useQuery({
    queryKey: ['investidor-detalhes', id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .rpc('get_investidor_detalhes', {
          p_id: id,
        });
      
      if (error) throw error;
      return data as unknown as {
        investidor: Investidor;
        documentos: any[];
      };
    },
    enabled: !!id,
  });
}

// ============= Compliance Checks =============

export interface ComplianceCheck {
  id: string;
  operacao_id: string;
  tipo: string;
  status: 'pendente' | 'aprovado' | 'reprovado';
  observacao?: string;
  criado_em?: string;
  atualizado_em?: string;
}

export function useComplianceChecks(operacaoId: string | undefined) {
  return useQuery({
    queryKey: ['compliance-checks', operacaoId],
    queryFn: async () => {
      if (!operacaoId) return [];
      const { data, error } = await supabase
        .from('compliance_checks' as any)
        .select('*')
        .eq('operacao_id', operacaoId);
      if (error) {
        console.warn('Erro ao buscar compliance checks:', error);
        return [];
      }
      return (data || []) as ComplianceCheck[];
    },
    enabled: !!operacaoId,
  });
}

export function useCreateComplianceCheck() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (check: Partial<ComplianceCheck>) => {
      const { data, error } = await supabase
        .from('compliance_checks' as any)
        .insert(check)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['compliance-checks', variables.operacao_id] });
    },
  });
}

export function useDeleteComplianceCheck() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, operacaoId }: { id: string; operacaoId: string }) => {
      const { error } = await supabase
        .from('compliance_checks' as any)
        .delete()
        .eq('id', id);
      if (error) throw error;
      return { id, operacaoId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['compliance-checks', data.operacaoId] });
    },
  });
}

export function useUpdateComplianceStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, observacao }: { id: string; status: string; observacao?: string }) => {
      const { data, error } = await supabase
        .from('compliance_checks' as any)
        .update({ status, observacao })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compliance-checks'] });
    },
  });
}

export function useOperacaoComplianceCompleto(operacaoId: string | undefined) {
  return useQuery({
    queryKey: ['operacao-compliance-completo', operacaoId],
    queryFn: async () => {
      if (!operacaoId) return null;
      // Buscar operação com dados de compliance
      const { data, error } = await supabase
        .rpc('get_operacao_compliance_completo' as any, { p_operacao_id: operacaoId });
      if (error) {
        console.warn('RPC não disponível, retornando dados básicos');
        return { operacao: null, checks: [], investidores: [] };
      }
      return data as unknown as {
        operacao: any;
        checks: ComplianceCheck[];
        investidores: any[];
      };
    },
    enabled: !!operacaoId,
  });
}
