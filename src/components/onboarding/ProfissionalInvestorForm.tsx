import { useState } from 'react';
import { motion } from 'framer-motion';
import { Briefcase, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import type { DeclaracaoProfissional } from '../../types/onboarding';

interface ProfissionalInvestorFormProps {
  initialData?: DeclaracaoProfissional;
  onSubmit: (data: DeclaracaoProfissional | undefined) => void;
  onSkip: () => void;
}

const declaracaoPadrao = `DECLARAÇÃO DE INVESTIDOR PROFISSIONAL

Eu, abaixo identificado, declaro para os devidos fins que:

1. Possuo mais de R$ 10.000.000,00 (dez milhões de reais) em investimentos;

2. Possuo conhecimento e experiência suficientes para avaliar os riscos de investimentos no mercado de capitais;

3. Estou ciente de que, ao me declarar investidor profissional, poderei ter acesso a produtos e serviços de investimento destinados exclusivamente a essa categoria;

4. Entendo que investidores profissionais possuem menos proteção regulatória em comparação com investidores não profissionais;

5. Declaro que as informações acima são verdadeiras e assumo total responsabilidade por elas.`;

export function ProfissionalInvestorForm({ 
  initialData, 
  onSubmit, 
  onSkip 
}: ProfissionalInvestorFormProps) {
  const [isProfissional, setIsProfissional] = useState(initialData?.isProfissional ?? false);
  const [possui10Milhoes, setPossui10Milhoes] = useState(initialData?.possui10MilhoesInvestimentos ?? false);
  const [possuiConhecimento, setPossuiConhecimento] = useState(initialData?.possuiConhecimentoMercado ?? false);
  const [declaracaoTexto, setDeclaracaoTexto] = useState(initialData?.declaracaoTexto || declaracaoPadrao);
  const [assinatura, setAssinatura] = useState('');
  const [dataAssinatura, setDataAssinatura] = useState(
    initialData?.dataAssinatura || new Date().toISOString().split('T')[0]
  );

  const podeEnviar = !isProfissional || (possui10Milhoes && possuiConhecimento && assinatura.length > 3);

  const handleSubmit = () => {
    if (!isProfissional) {
      onSubmit(undefined);
      return;
    }

    const data: DeclaracaoProfissional = {
      isProfissional: true,
      possui10MilhoesInvestimentos: possui10Milhoes,
      possuiConhecimentoMercado: possuiConhecimento,
      declaracaoTexto,
      dataAssinatura,
    };

    onSubmit(data);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#008080]/10 flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-[#008080]" />
            </div>
            <div>
              <CardTitle className="text-2xl text-[#008080]">
                Declaração de Investidor Profissional
              </CardTitle>
              <CardDescription>
                Etapa opcional - Você pode pular esta etapa
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Toggle Principal */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="space-y-1">
              <Label htmlFor="profissional-toggle" className="text-base font-medium cursor-pointer">
                Desejo me declarar Investidor Profissional
              </Label>
              <p className="text-sm text-gray-500">
                Ative esta opção se atende aos requisitos legais
              </p>
            </div>
            <Switch
              id="profissional-toggle"
              checked={isProfissional}
              onCheckedChange={setIsProfissional}
            />
          </div>

          {/* Conteúdo Condicional */}
          {isProfissional ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-6"
            >
              {/* Alerta */}
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium mb-1">Atenção</p>
                  <p>
                    Investidores profissionais têm acesso a produtos mais complexos e de maior risco, 
                    com menor proteção regulatória. Certifique-se de que entende as implicações desta declaração.
                  </p>
                </div>
              </div>

              {/* Requisitos */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-700">Requisitos Obrigatórios</h4>
                
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <Checkbox
                      id="requisito-10m"
                      checked={possui10Milhoes}
                      onCheckedChange={(checked) => setPossui10Milhoes(checked as boolean)}
                    />
                    <div className="space-y-1">
                      <Label htmlFor="requisito-10m" className="font-medium cursor-pointer">
                        Possuo mais de R$ 10.000.000,00 em investimentos
                      </Label>
                      <p className="text-sm text-gray-500">
                        Valor total em carteira de investimentos no mercado financeiro
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <Checkbox
                      id="requisito-conhecimento"
                      checked={possuiConhecimento}
                      onCheckedChange={(checked) => setPossuiConhecimento(checked as boolean)}
                    />
                    <div className="space-y-1">
                      <Label htmlFor="requisito-conhecimento" className="font-medium cursor-pointer">
                        Possuo conhecimento suficiente do mercado financeiro
                      </Label>
                      <p className="text-sm text-gray-500">
                        Tenho experiência e entendimento para avaliar riscos de investimentos
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Texto da Declaração */}
              <div className="space-y-2">
                <Label htmlFor="declaracao">Texto da Declaração</Label>
                <Textarea
                  id="declaracao"
                  value={declaracaoTexto}
                  onChange={(e) => setDeclaracaoTexto(e.target.value)}
                  rows={10}
                  className="font-mono text-sm resize-none"
                />
              </div>

              {/* Assinatura e Data */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="assinatura">Assinatura Digital (digite seu nome completo) *</Label>
                  <Input
                    id="assinatura"
                    value={assinatura}
                    onChange={(e) => setAssinatura(e.target.value)}
                    placeholder="Nome completo como assinatura"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="data">Data *</Label>
                  <Input
                    id="data"
                    type="date"
                    value={dataAssinatura}
                    onChange={(e) => setDataAssinatura(e.target.value)}
                  />
                </div>
              </div>

              {/* Status */}
              {possui10Milhoes && possuiConhecimento && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3"
                >
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <p className="text-sm text-green-800">
                    Você atende aos requisitos para se declarar investidor profissional
                  </p>
                </motion.div>
              )}
            </motion.div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              <p>Você optou por não se declarar investidor profissional.</p>
              <p className="text-sm mt-2">
                Esta é uma etapa opcional. Clique em "Pular" para continuar.
              </p>
            </div>
          )}

          {/* Botões */}
          <div className="flex gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onSkip}
              className="flex-1"
            >
              Pular Etapa
            </Button>
            
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={!podeEnviar}
              className="flex-1 bg-[#008080] hover:bg-[#006666] text-white"
            >
              {isProfissional ? 'Confirmar Declaração' : 'Continuar'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
