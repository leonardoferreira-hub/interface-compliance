import { User, Building2, Landmark } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { TipoInvestidor } from '@/types/onboarding';

interface InvestorTypeSelectorProps {
  value: TipoInvestidor | null;
  onChange: (tipo: TipoInvestidor) => void;
}

const opcoes = [
  {
    id: 'PF' as TipoInvestidor,
    label: 'Pessoa Física',
    description: 'Investidor individual',
    icon: User,
  },
  {
    id: 'PJ' as TipoInvestidor,
    label: 'Pessoa Jurídica',
    description: 'Empresa ou sociedade',
    icon: Building2,
  },
  {
    id: 'INSTITUCIONAL' as TipoInvestidor,
    label: 'Institucional',
    description: 'Fundos, clubes, etc.',
    icon: Landmark,
  },
];

export function InvestorTypeSelector({ value, onChange }: InvestorTypeSelectorProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {opcoes.map((opcao) => {
        const Icon = opcao.icon;
        const isSelected = value === opcao.id;

        return (
          <Card
            key={opcao.id}
            onClick={() => onChange(opcao.id)}
            className={cn(
              "cursor-pointer transition-all duration-200 hover:shadow-md",
              isSelected && "ring-2 ring-[#008080] border-[#008080] bg-[#008080]/5"
            )}
          >
            <CardContent className="p-6 flex flex-col items-center text-center">
              <div className={cn(
                "w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors",
                isSelected ? "bg-[#008080] text-white" : "bg-gray-100 text-gray-500"
              )}>
                <Icon className="h-8 w-8" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{opcao.label}</h3>
              <p className="text-sm text-gray-500">{opcao.description}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
