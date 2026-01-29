import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Check, Loader2, CheckCircle } from 'lucide-react';
import { useOnboarding } from '@/hooks/useOnboarding';
import { StepIndicator } from './StepIndicator';
import { InvestorTypeSelector } from './InvestorTypeSelector';
import { PFForm } from './PFForm';
import { PJForm } from './PJForm';
import { InstitucionalForm } from './InstitucionalForm';
import { SuitabilityForm } from './SuitabilityForm';
import { ProfissionalInvestorForm } from './ProfissionalInvestorForm';
import { DocumentUpload } from './DocumentUpload';
import { ComplianceReview } from './ComplianceReview';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import type { TipoInvestidor, PerfilSuitability, RespostasSuitability } from '@/types/onboarding';

const steps = [
  { id: 'tipo', label: 'Tipo de Investidor' },
  { id: 'dados', label: 'Dados Cadastrais' },
  { id: 'suitability', label: 'Suitability' },
  { id: 'documentos', label: 'Documentos' },
  { id: 'revisao', label: 'Revisão' },
];

export function OnboardingWizard() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const {
    onboardingData,
    setTipo,
    setDadosPF,
    setDadosPJ,
    setDadosInstitucional,
    setSuitability,
    atualizarDados,
    submitOnboarding,
    isSubmitting,
    salvarProgresso,
  } = useOnboarding();

  const handleNext = () => {
    // Validar passo atual
    if (currentStep === 0 && !onboardingData.tipo) {
      toast.error('Selecione o tipo de investidor');
      return;
    }

    if (currentStep === 1) {
      // Validar dados preenchidos
      if (onboardingData.tipo === 'PF' && !onboardingData.dados_pf) {
        toast.error('Preencha os dados pessoais');
        return;
      }
      if (onboardingData.tipo === 'PJ' && !onboardingData.dados_pj) {
        toast.error('Preencha os dados da empresa');
        return;
      }
      if (onboardingData.tipo === 'INSTITUCIONAL' && !onboardingData.dados_institucional) {
        toast.error('Preencha os dados institucionais');
        return;
      }
    }

    if (currentStep === 2 && !onboardingData.perfil_calculado) {
      toast.error('Complete o questionário de suitability');
      return;
    }

    if (currentStep === 3 && onboardingData.documentos.length === 0) {
      toast.error('Anexe pelo menos um documento');
      return;
    }

    if (currentStep === 4 && !onboardingData.termos_aceitos) {
      toast.error('Você precisa aceitar os termos para continuar');
      return;
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
      salvarProgresso();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!onboardingData.termos_aceitos) {
      toast.error('Você precisa aceitar os termos para continuar');
      return;
    }

    const success = await submitOnboarding();
    if (success) {
      setShowSuccess(true);
    }
  };

  if (showSuccess) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Card className="text-center">
          <CardContent className="py-12">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Cadastro Enviado com Sucesso!
            </h2>
            <p className="text-gray-600 mb-6">
              Seus dados foram recebidos e estão em análise pelo time de compliance.
              Você receberá um e-mail com o resultado em breve.
            </p>
            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
              <p className="text-sm text-gray-600">
                <strong>Protocolo:</strong> {Date.now().toString(36).toUpperCase()}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Status:</strong> Em análise
              </p>
              <p className="text-sm text-gray-600">
                <strong>Prazo:</strong> Até 5 dias úteis
              </p>
            </div>
            <Button onClick={() => window.close()} variant="outline">
              Fechar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <InvestorTypeSelector
            value={onboardingData.tipo}
            onChange={(tipo: TipoInvestidor) => {
              setTipo(tipo);
              salvarProgresso();
            }}
          />
        );
      
      case 1:
        if (onboardingData.tipo === 'PF') {
          return (
            <PFForm
              value={onboardingData.dados_pf || {}}
              onChange={(dados) => {
                setDadosPF(dados);
                salvarProgresso();
              }}
            />
          );
        }
        if (onboardingData.tipo === 'PJ') {
          return (
            <PJForm
              value={onboardingData.dados_pj || {}}
              onChange={(dados) => {
                setDadosPJ(dados);
                salvarProgresso();
              }}
            />
          );
        }
        if (onboardingData.tipo === 'INSTITUCIONAL') {
          return (
            <InstitucionalForm
              value={onboardingData.dados_institucional || {}}
              onChange={(dados) => {
                setDadosInstitucional(dados);
                salvarProgresso();
              }}
            />
          );
        }
        return null;
      
      case 2:
        return (
          <div className="space-y-6">
            <SuitabilityForm
              value={onboardingData.suitability || {}}
              onChange={(respostas: RespostasSuitability, perfil: PerfilSuitability) => {
                setSuitability(respostas);
                salvarProgresso();
              }}
            />
            <ProfissionalInvestorForm
              value={onboardingData.profissional_info || null}
              onChange={(dados) => {
                atualizarDados({ profissional_info: dados, is_profissional: true });
                salvarProgresso();
              }}
            />
          </div>
        );
      
      case 3:
        return (
          <DocumentUpload
            value={onboardingData.documentos}
            onChange={(documentos) => {
              atualizarDados({ documentos });
              salvarProgresso();
            }}
            tipoInvestidor={onboardingData.tipo}
          />
        );
      
      case 4:
        return (
          <ComplianceReview
            data={onboardingData}
            onDeclaracoesChange={(declaracoes) => {
              atualizarDados({ declaracoes });
            }}
            onTermosChange={(aceito) => {
              atualizarDados({ termos_aceitos: aceito });
            }}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Step Indicator */}
      <div className="mb-8">
        <StepIndicator steps={steps} currentStep={currentStep} />
      </div>

      {/* Content */}
      <div className="mb-8">
        {renderStepContent()}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 0}
          className="flex items-center gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Voltar
        </Button>

        {currentStep < steps.length - 1 ? (
          <Button
            onClick={handleNext}
            className="flex items-center gap-2 bg-[#008080] hover:bg-[#006666]"
          >
            Próximo
            <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !onboardingData.termos_aceitos}
            className="flex items-center gap-2 bg-[#008080] hover:bg-[#006666]"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            {isSubmitting ? 'Enviando...' : 'Finalizar Cadastro'}
          </Button>
        )}
      </div>

      {/* Auto-save indicator */}
      <p className="text-center text-xs text-gray-400 mt-4">
        Seu progresso é salvo automaticamente
      </p>
    </div>
  );
}
