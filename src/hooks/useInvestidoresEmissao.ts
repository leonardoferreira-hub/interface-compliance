import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface InvestidorEmissao {
  id: string;
  emissao_id: string;
  investidor_id: string | null;
  numero_emissao: string;
  cnpj_cpf: string;
  nome: string;
  tipo: 'pessoa_fisica' | 'pessoa_juridica' | 'institucional';
  status: 'pendente_cadastro' | 'em_analise' | 'aprovado' | 'reprovado' | 'integralizado';
  status_efetivo: string;
  cadastro_valido: boolean;
  cadastro_valido_ate: string;
  usou_cadastro_existente: boolean;
  valor_integralizacao: number;
  percentual_pld: number;
  nome_investidor: string;
  email_investidor: string;
  telefone_investidor: string;
}

// Buscar investidores vinculados a uma emissão
export function useInvestidoresEmissao(emissaoId: string | undefined) {
  return useQuery({
    queryKey: ['investidores-emissao', emissaoId],
    queryFn: async () => {
      if (!emissaoId) return [];
      
      const { data, error } = await (supabase as any)
        .from('v_investidores_emissao')
        .select('*')
        .eq('emissao_id', emissaoId)
        .order('criado_em', { ascending: true });
      
      if (error) throw error;
      return data as InvestidorEmissao[];
    },
    enabled: !!emissaoId,
  });
}

// Gerar link para cadastro de investidores na emissão
export function useGerarLinkCadastroEmissao() {
  return useMutation({
    mutationFn: async (emissaoId: string) => {
      const baseUrl = window.location.origin;
      return `${baseUrl}/cadastro-investidores/${emissaoId}`;
    },
    onSuccess: (link) => {
      navigator.clipboard.writeText(link);
      toast.success('Link copiado para a área de transferência!');
    },
  });
}

// Hook para verificar status do investidor na emissão
export function useStatusInvestidorEmissao(emissaoId: string | undefined) {
  const { data: investidores } = useInvestidoresEmissao(emissaoId);
  
  const total = investidores?.length || 0;
  const prontos = investidores?.filter(i => i.status_efetivo === 'pronto_para_integralizar').length || 0;
  const pendentes = investidores?.filter(i => i.status === 'pendente_cadastro').length || 0;
  const emAnalise = investidores?.filter(i => i.status === 'em_analise').length || 0;
  const vencidos = investidores?.filter(i => i.status_efetivo === 'cadastro_vencido').length || 0;
  
  return {
    total,
    prontos,
    pendentes,
    emAnalise,
    vencidos,
    todosProntos: total > 0 && prontos === total,
    podeIntegralizar: prontos > 0,
  };
}
