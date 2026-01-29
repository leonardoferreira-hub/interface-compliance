import { motion } from 'framer-motion';
import { Building2, User, Landmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { InvestorType, ComplianceStep } from '../../types/onboarding';

interface StepIndicatorProps {
  currentStep: ComplianceStep;
  currentStepIndex: number;
  steps: ComplianceStep[];
  onStepClick?: (step: ComplianceStep) => void;
}

const stepLabels: Record<ComplianceStep, string> = {
  TIPO: 'Tipo',
  DADOS_CADASTRAIS: 'Dados',
  SUITABILITY: 'Suitability',
  PROFISSIONAL: 'Profissional',
  DOCUMENTOS: 'Documentos',
  REVISAO: 'Revisão',
  CONFIRMACAO: 'Confirmação',
};

export function StepIndicator({ currentStep, currentStepIndex, steps, onStepClick }: StepIndicatorProps) {
  return (
    <div className="w-full mb-8">
      {/* Desktop */}
      <div className="hidden md:flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = index < currentStepIndex;
          const isCurrent = index === currentStepIndex;
          const isClickable = index <= currentStepIndex && onStepClick;

          return (
            <div key={step} className="flex items-center">
              <button
                onClick={() => isClickable && onStepClick?.(step)}
                disabled={!isClickable}
                className={`
                  flex flex-col items-center transition-all duration-300
                  ${isClickable ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}
                `}
              >
                <div
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold
                    transition-all duration-300
                    ${isCompleted ? 'bg-green-500 text-white' : ''}
                    ${isCurrent ? 'bg-[#008080] text-white ring-4 ring-[#008080]/20' : ''}
                    ${!isCompleted && !isCurrent ? 'bg-gray-200 text-gray-500' : ''}
                  `}
                >
                  {isCompleted ? '✓' : index + 1}
                </div>
                <span
                  className={`
                    mt-2 text-xs font-medium
                    ${isCurrent ? 'text-[#008080]' : 'text-gray-500'}
                  `}
                >
                  {stepLabels[step]}
                </span>
              </button>
              {index < steps.length - 1 && (
                <div
                  className={`
                    w-12 h-0.5 mx-2 transition-all duration-300
                    ${isCompleted ? 'bg-green-500' : 'bg-gray-200'}
                  `}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile */}
      <div className="md:hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-[#008080]">
            Passo {currentStepIndex + 1} de {steps.length}
          </span>
          <span className="text-sm text-gray-500">{stepLabels[currentStep]}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <motion.div
            className="bg-[#008080] h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>
    </div>
  );
}

interface InvestorTypeSelectorProps {
  selectedType: InvestorType | null;
  onSelect: (type: InvestorType) => void;
}

const investorTypes = [
  {
    type: 'PF' as InvestorType,
    label: 'Pessoa Física',
    description: 'Para investidores individuais',
    icon: User,
  },
  {
    type: 'PJ' as InvestorType,
    label: 'Pessoa Jurídica',
    description: 'Para empresas e sociedades',
    icon: Building2,
  },
  {
    type: 'INSTITUCIONAL' as InvestorType,
    label: 'Institucional',
    description: 'Para fundos e instituições financeiras',
    icon: Landmark,
  },
];

export function InvestorTypeSelector({ selectedType, onSelect }: InvestorTypeSelectorProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {investorTypes.map((type) => {
        const Icon = type.icon;
        const isSelected = selectedType === type.type;

        return (
          <motion.div
            key={type.type}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Card
              onClick={() => onSelect(type.type)}
              className={`
                cursor-pointer transition-all duration-300 h-full
                ${isSelected ? 'border-[#008080] ring-2 ring-[#008080]/20' : 'hover:border-gray-300'}
              `}
            >
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div
                  className={`
                    w-16 h-16 rounded-full flex items-center justify-center mb-4
                    transition-all duration-300
                    ${isSelected ? 'bg-[#008080] text-white' : 'bg-gray-100 text-gray-500'}
                  `}
                >
                  <Icon className="w-8 h-8" />
                </div>
                <CardTitle className="text-lg mb-2">{type.label}</CardTitle>
                <CardDescription>{type.description}</CardDescription>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}

interface WizardNavigationProps {
  onNext: () => void;
  onPrevious: () => void;
  canGoNext: boolean;
  canGoPrevious: boolean;
  isLastStep?: boolean;
  isSubmitting?: boolean;
}

export function WizardNavigation({
  onNext,
  onPrevious,
  canGoNext,
  canGoPrevious,
  isLastStep = false,
  isSubmitting = false,
}: WizardNavigationProps) {
  return (
    <div className="flex justify-between mt-8">
      <Button
        variant="outline"
        onClick={onPrevious}
        disabled={!canGoPrevious || isSubmitting}
        className="px-6"
      >
        Voltar
      </Button>
      
      <Button
        onClick={onNext}
        disabled={!canGoNext || isSubmitting}
        className="px-6 bg-[#008080] hover:bg-[#006666] text-white"
      >
        {isSubmitting ? (
          <span className="flex items-center gap-2">
            <motion.div
              className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
            Enviando...
          </span>
        ) : isLastStep ? (
          'Finalizar'
        ) : (
          'Continuar'
        )}
      </Button>
    </div>
  );
}
