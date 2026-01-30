import { useState, useCallback, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import type { 
  ComplianceData,
  ValidacaoToken,
  InvestorType,
  PerfilInvestidor,
  DadosPF,
  DadosPJ,
  DadosInstitucional,
  Suitability,
  Documento,
  DeclaracaoProfissional,
  ComplianceStep
} from '../types/onboarding';

const ONBOARDING_STORAGE_KEY = 'compliance_onboarding_data';

const perguntasSuitability = [
  {
    id: 1,
    pergunta: 'Qual é o seu objetivo ao investir?',
    opcoes: [
      { valor: 1, texto: 'Preservar capital, evitando perdas' },
      { valor: 2, texto: 'Obter renda regular' },
      { valor: 3, texto: 'Crescimento moderado do capital' },
      { valor: 4, texto: 'Maximizar ganhos, assumindo maiores riscos' },
    ],
  },
  {
    id: 2,
    pergunta: 'Por quanto tempo pretende manter seus investimentos?',
    opcoes: [
      { valor: 1, texto: 'Menos de 1 ano' },
      { valor: 2, texto: 'De 1 a 3 anos' },
      { valor: 3, texto: 'De 3 a 5 anos' },
      { valor: 4, texto: 'Mais de 5 anos' },
    ],
  },
  {
    id: 3,
    pergunta: 'Qual porcentagem da sua renda mensal você consegue poupar?',
    opcoes: [
      { valor: 1, texto: 'Menos de 10%' },
      { valor: 2, texto: 'De 10% a 20%' },
      { valor: 3, texto: 'De 20% a 30%' },
      { valor: 4, texto: 'Mais de 30%' },
    ],
  },
  {
    id: 4,
    pergunta: 'Em uma situação de queda de 20% no mercado, o que você faria?',
    opcoes: [
      { valor: 1, texto: 'Venderia todos os investimentos imediatamente' },
      { valor: 2, texto: 'Venderia parte dos investimentos' },
      { valor: 3, texto: 'Manteria os investimentos e esperaria' },
      { valor: 4, texto: 'Aproveitaria para comprar mais' },
    ],
  },
  {
    id: 5,
    pergunta: 'Qual é a sua experiência com investimentos?',
    opcoes: [
      { valor: 1, texto: 'Nenhuma experiência' },
      { valor: 2, texto: 'Poupança e CDB apenas' },
      { valor: 3, texto: 'Investi em ações ou fundos multimercado' },
      { valor: 4, texto: 'Experiência avançada com diversos produtos' },
    ],
  },
  {
    id: 6,
    pergunta: 'Qual é a sua faixa de renda mensal?',
    opcoes: [
      { valor: 1, texto: 'Até R$ 5.000' },
      { valor: 2, texto: 'De R$ 5.000 a R$ 15.000' },
      { valor: 3, texto: 'De R$ 15.000 a R$ 50.000' },
      { valor: 4, texto: 'Acima de R$ 50.000' },
    ],
  },
  {
    id: 7,
    pergunta: 'Qual a composição do seu patrimônio atual?',
    opcoes: [
      { valor: 1, texto: 'Majoritariamente em renda fixa e poupança' },
      { valor: 2, texto: 'Balanceado entre renda fixa e variável' },
      { valor: 3, texto: 'Majoritariamente em renda variável' },
      { valor: 4, texto: 'Diversificado com investimentos alternativos' },
    ],
  },
  {
    id: 8,
    pergunta: 'Você depende dos rendimentos dos investimentos para despesas?',
    opcoes: [
      { valor: 1, texto: 'Sim, totalmente' },
      { valor: 2, texto: 'Sim, parcialmente' },
      { valor: 3, texto: 'Não, mas posso precisar em emergências' },
      { valor: 4, texto: 'Não, tenho outras fontes de renda' },
    ],
  },
  {
    id: 9,
    pergunta: 'Qual é o seu conhecimento sobre o mercado de capitais?',
    opcoes: [
      { valor: 1, texto: 'Nenhum conhecimento' },
      { valor: 2, texto: 'Básico' },
      { valor: 3, texto: 'Intermediário' },
      { valor: 4, texto: 'Avançado' },
    ],
  },
  {
    id: 10,
    pergunta: 'Como você reagiria se seus investimentos perdessem 30% em 6 meses?',
    opcoes: [
      { valor: 1, texto: 'Entraria em pânico e venderia tudo' },
      { valor: 2, texto: 'Ficaria preocupado e reduziria exposição' },
      { valor: 3, texto: 'Manteria a calma e aguardaria recuperação' },
      { valor: 4, texto: 'Veria como oportunidade de compra' },
    ],
  },
  {
    id: 11,
    pergunta: 'Qual é a sua idade?',
    opcoes: [
      { valor: 1, texto: 'Acima de 60 anos' },
      { valor: 2, texto: 'Entre 46 e 60 anos' },
      { valor: 3, texto: 'Entre 31 e 45 anos' },
      { valor: 4, texto: 'Até 30 anos' },
    ],
  },
  {
    id: 12,
    pergunta: 'Você possui reserva de emergência?',
    opcoes: [
      { valor: 1, texto: 'Não possuo' },
      { valor: 2, texto: 'Menos de 3 meses de despesas' },
      { valor: 3, texto: 'De 3 a 6 meses de despesas' },
      { valor: 4, texto: 'Mais de 6 meses de despesas' },
    ],
  },
];

const steps: ComplianceStep[] = [
  'TIPO',
  'DADOS_CADASTRAIS',
  'SUITABILITY',
  'PROFISSIONAL',
  'DOCUMENTOS',
  'REVISAO',
  'CONFIRMACAO',
];

const initialData: ComplianceData = {
  investorType: 'PF',
  suitability: {
    respostas: [],
    pontuacaoTotal: 0,
    perfil: 'CONSERVADOR',
  },
  documentos: [],
  status: 'pending',
};

interface UseOnboardingReturn {
  token: string | null;
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  validacao: ValidacaoToken | null;
  currentStep: ComplianceStep;
  currentStepIndex: number;
  data: ComplianceData;
  onboardingData: ComplianceData; // Alias
  perguntasSuitability: typeof perguntasSuitability;
  steps: typeof steps;
  validarToken: (token: string) => Promise<boolean>;
  salvarProgresso: () => void;
  carregarProgresso: () => void;
  submitOnboarding: () => Promise<boolean>;
  setCurrentStep: (step: ComplianceStep) => void;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  updateInvestorType: (type: InvestorType) => void;
  updateDadosPF: (dados: DadosPF) => void;
  updateDadosPJ: (dados: DadosPJ) => void;
  updateDadosInstitucional: (dados: DadosInstitucional) => void;
  updateSuitability: (suitability: Suitability) => void;
  updateDocumentos: (documentos: Documento[]) => void;
  updateDeclaracaoProfissional: (declaracao?: DeclaracaoProfissional) => void;
  canProceedToNextStep: () => boolean;
  // Aliases para compatibilidade com OnboardingWizard
  setTipo: (type: InvestorType) => void;
  setDadosPF: (dados: DadosPF) => void;
  setDadosPJ: (dados: DadosPJ) => void;
  setDadosInstitucional: (dados: DadosInstitucional) => void;
  setSuitability: (suitability: Suitability) => void;
  atualizarDados: (campo: string, valor: any) => void;
}

export function useOnboarding(): UseOnboardingReturn {
  const { token: urlToken } = useParams<{ token: string }>();
  
  // Pegar emissaoId do query param (vem como ?emissao=uuid)
  const searchParams = new URLSearchParams(window.location.search);
  const emissaoIdFromQuery = searchParams.get('emissao');
  
  const [token, setToken] = useState<string | null>(urlToken || null);
  const [emissaoId, setEmissaoId] = useState<string | null>(emissaoIdFromQuery);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validacao, setValidacao] = useState<ValidacaoToken | null>(null);
  const [currentStep, setCurrentStep] = useState<ComplianceStep>('TIPO');
  const [data, setData] = useState<ComplianceData>(initialData);

  const currentStepIndex = steps.indexOf(currentStep);

  // Validar token no Supabase
  const validarToken = useCallback(async (tokenParam: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Buscar token na tabela emissao_investidores
      const { data: tokenData, error: tokenError } = await supabase
        .from('emissao_investidores')
        .select(`
          *,
          emissao:emissao_id (*)
        `)
        .eq('token_cadastro', tokenParam)
        .single();

      if (tokenError || !tokenData) {
        setValidacao({ 
          valido: false, 
          message: 'Token inválido ou não encontrado' 
        });
        return false;
      }

      // Verificar se já foi preenchido
      if (tokenData.status_cadastro === 'preenchido' || tokenData.investidor_id) {
        setValidacao({ 
          valido: false, 
          message: 'Este cadastro já foi preenchido' 
        });
        return false;
      }

      setValidacao({
        valido: true,
        emissao_id: tokenData.emissao_id,
        status: tokenData.status_cadastro,
      });

      setData(prev => ({
        ...prev,
        emissaoId: tokenData.emissao_id,
      }));

      return true;
    } catch (err: any) {
      setError(err.message || 'Erro ao validar token');
      setValidacao({ valido: false, message: 'Erro ao validar token' });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Salvar progresso no localStorage
  const salvarProgresso = useCallback(() => {
    if (token) {
      localStorage.setItem(`${ONBOARDING_STORAGE_KEY}_${token}`, JSON.stringify({
        data,
        currentStep,
        timestamp: new Date().toISOString(),
      }));
      toast.success('Progresso salvo automaticamente');
    }
  }, [token, data, currentStep]);

  // Carregar progresso do localStorage
  const carregarProgresso = useCallback(() => {
    if (token) {
      const saved = localStorage.getItem(`${ONBOARDING_STORAGE_KEY}_${token}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.data) {
            setData(parsed.data);
          }
          if (parsed.currentStep) {
            setCurrentStep(parsed.currentStep);
          }
          toast.success('Progresso anterior recuperado');
          return true;
        } catch {
          return false;
        }
      }
    }
    return false;
  }, [token]);

  // Limpar progresso
  const limparProgresso = useCallback(() => {
    if (token) {
      localStorage.removeItem(`${ONBOARDING_STORAGE_KEY}_${token}`);
    }
  }, [token]);

  // Submit final
  const submitOnboarding = useCallback(async (): Promise<boolean> => {
    if (!token || !validacao?.valido) {
      toast.error('Token inválido');
      return false;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Criar investidor - usando estrutura JSONB do banco
      let cpf_cnpj = '';
      let nome = '';
      let email = '';
      let telefone = '';
      let tipo = 'pessoa_fisica';
      let kyc_json: any = {};

      if (data.investorType === 'PF' && data.dadosPF) {
        cpf_cnpj = data.dadosPF.cpf?.replace(/\D/g, '') || '';
        nome = data.dadosPF.nome || '';
        email = data.dadosPF.email || '';
        telefone = data.dadosPF.telefone || '';
        tipo = 'pessoa_fisica';
        kyc_json = {
          nome_completo: data.dadosPF.nome,
          cpf: data.dadosPF.cpf,
          data_nascimento: data.dadosPF.dataNascimento,
          profissao: data.dadosPF.ocupacao,
          renda_mensal: data.dadosPF.rendimentosAnuais,
          patrimonio: data.dadosPF.patrimonio,
          is_pep: data.dadosPF.isPEP,
          cargo_pep: data.dadosPF.cargoPEP,
          endereco: data.dadosPF.endereco,
        };
      } else if (data.investorType === 'PJ' && data.dadosPJ) {
        cpf_cnpj = data.dadosPJ.cnpj?.replace(/\D/g, '') || '';
        nome = data.dadosPJ.denominacaoSocial || '';
        email = data.dadosPJ.email || '';
        telefone = data.dadosPJ.telefone || '';
        tipo = 'pessoa_juridica';
        kyc_json = {
          razao_social: data.dadosPJ.denominacaoSocial,
          cnpj: data.dadosPJ.cnpj,
          faturamento_medio: data.dadosPJ.faturamentoMedioMensal,
          patrimonio: data.dadosPJ.patrimonio,
          controladores: data.dadosPJ.controladores,
          administradores: data.dadosPJ.administradores,
          endereco: data.dadosPJ.endereco,
        };
      } else if (data.investorType === 'INSTITUCIONAL' && data.dadosInstitucional) {
        cpf_cnpj = data.dadosInstitucional.cnpj?.replace(/\D/g, '') || '';
        nome = data.dadosInstitucional.denominacaoSocial || '';
        email = data.dadosInstitucional.email || '';
        telefone = data.dadosInstitucional.telefone || '';
        tipo = 'pessoa_juridica';
        kyc_json = {
          razao_social: data.dadosInstitucional.denominacaoSocial,
          cnpj: data.dadosInstitucional.cnpj,
          tipo_instituicao: data.dadosInstitucional.tipoInstituicao,
          patrimonio_liquido: data.dadosInstitucional.patrimonioLiquido,
          responsavel: data.dadosInstitucional.responsavel,
          endereco: data.dadosInstitucional.endereco,
        };
      }

      const investidorData: any = {
        cpf_cnpj,
        nome,
        email,
        telefone,
        tipo,
        tipo_investidor: data.declaracaoProfissional?.isProfissional ? 'profissional' : 'varejo',
        status_onboarding: 'em_analise',
        kyc_json,
        suitability_json: data.suitability,
        perfil_risco: data.suitability.perfil,
      };

      // Inserir investidor via RPC (contorna limitação de view)
      const { data: investidor, error: investidorError } = await supabase
        .rpc('criar_investidor', {
          p_cpf_cnpj: cpf_cnpj,
          p_nome: nome,
          p_email: email || null,
          p_telefone: telefone || null,
          p_tipo: tipo,
          p_tipo_investidor: investidorData.tipo_investidor,
          p_status_onboarding: investidorData.status_onboarding,
          p_kyc_json: kyc_json,
          p_suitability_json: investidorData.suitability_json,
          p_perfil_risco: investidorData.perfil_risco || null,
          p_token_acesso: token || null,
        });

      if (investidorError) {
        console.error('Erro ao criar investidor:', investidorError);
        throw new Error('Erro ao salvar dados do investidor');
      }

      // Vincular investidor à emissão (emissaoId vem do query param ?emissao=)
      if (emissaoId) {
        console.log('🔗 Vinculando investidor:', { emissaoId, investidor, cpf_cnpj });
        const { data: vinculoResult, error: vinculoError } = await supabase.rpc('vincular_investidor_pos_cadastro', {
          p_emissao_id: emissaoId,
          p_investidor_id: investidor.id,
          p_cpf_cnpj: cpf_cnpj,
        });

        console.log('🔗 Resultado vínculo:', { vinculoResult, vinculoError });
        if (vinculoError) {
          console.error('Erro ao vincular investidor à emissão:', vinculoError);
        }
      } else {
        console.warn('⚠️ emissaoId não encontrado no query param, vínculo não criado');
      }

      // Limpar progresso salvo
      limparProgresso();

      toast.success('Cadastro enviado com sucesso!');
      return true;
    } catch (err: any) {
      console.error('Erro no submit:', err);
      setError(err.message || 'Erro ao enviar cadastro');
      toast.error(err.message || 'Erro ao enviar cadastro');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [token, validacao, data, limparProgresso]);

  // Navigation
  const goToNextStep = useCallback(() => {
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  }, [currentStep]);

  const goToPreviousStep = useCallback(() => {
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  }, [currentStep]);

  // Data updates
  const updateInvestorType = useCallback((type: InvestorType) => {
    setData((prev) => ({ ...prev, investorType: type }));
  }, []);

  const updateDadosPF = useCallback((dados: DadosPF) => {
    setData((prev) => ({ ...prev, dadosPF: dados }));
  }, []);

  const updateDadosPJ = useCallback((dados: DadosPJ) => {
    setData((prev) => ({ ...prev, dadosPJ: dados }));
  }, []);

  const updateDadosInstitucional = useCallback((dados: DadosInstitucional) => {
    setData((prev) => ({ ...prev, dadosInstitucional: dados }));
  }, []);

  const updateSuitability = useCallback((suitability: Suitability) => {
    setData((prev) => ({ ...prev, suitability }));
  }, []);

  const updateDocumentos = useCallback((documentos: Documento[]) => {
    setData((prev) => ({ ...prev, documentos }));
  }, []);

  const updateDeclaracaoProfissional = useCallback((declaracao?: DeclaracaoProfissional) => {
    setData((prev) => ({ ...prev, declaracaoProfissional: declaracao }));
  }, []);

  const canProceedToNextStep = useCallback((): boolean => {
    switch (currentStep) {
      case 'TIPO':
        return !!data.investorType;
      case 'DADOS_CADASTRAIS':
        if (data.investorType === 'PF') return !!data.dadosPF;
        if (data.investorType === 'PJ') return !!data.dadosPJ;
        if (data.investorType === 'INSTITUCIONAL') return !!data.dadosInstitucional;
        return false;
      case 'SUITABILITY':
        return data.suitability.respostas.length === 12;
      case 'PROFISSIONAL':
        return true; // Opcional
      case 'DOCUMENTOS':
        return data.documentos.length > 0;
      case 'REVISAO':
        return true;
      case 'CONFIRMACAO':
        return data.status === 'completed';
      default:
        return false;
    }
  }, [currentStep, data]);

  // Carregar progresso ao montar
  useEffect(() => {
    if (urlToken) {
      setToken(urlToken);
      const saved = localStorage.getItem(`${ONBOARDING_STORAGE_KEY}_${urlToken}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.data) setData(parsed.data);
          if (parsed.currentStep) setCurrentStep(parsed.currentStep);
        } catch {
          // Ignora erro de parse
        }
      }
      validarToken(urlToken);
    }
  }, [urlToken, validarToken]);

  return {
    token,
    isLoading,
    isSubmitting,
    error,
    validacao,
    currentStep,
    currentStepIndex,
    data,
    // Alias para compatibilidade com OnboardingWizard
    onboardingData: data,
    perguntasSuitability,
    steps,
    validarToken,
    salvarProgresso,
    carregarProgresso,
    submitOnboarding,
    setCurrentStep,
    goToNextStep,
    goToPreviousStep,
    updateInvestorType,
    updateDadosPF,
    updateDadosPJ,
    updateDadosInstitucional,
    updateSuitability,
    updateDocumentos,
    updateDeclaracaoProfissional,
    canProceedToNextStep,
    // Aliases para compatibilidade
    setTipo: updateInvestorType,
    setDadosPF: updateDadosPF,
    setDadosPJ: updateDadosPJ,
    setDadosInstitucional: updateDadosInstitucional,
    setSuitability: updateSuitability,
    atualizarDados: (campo: string, valor: any) => {
      // Helper para atualização genérica
      console.log('atualizarDados:', campo, valor);
    },
  };
}
