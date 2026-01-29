import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, AlertCircle, TrendingUp, Scale, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { Suitability, PerfilInvestidor } from '../../types/onboarding';

interface SuitabilityFormProps {
  perguntas: {
    id: number;
    pergunta: string;
    opcoes: { valor: number; texto: string }[];
  }[];
  initialData?: Suitability;
  onSubmit: (data: Suitability) => void;
}

const perfilConfig: Record<PerfilInvestidor, {
  label: string;
  cor: string;
  bg: string;
  icone: typeof TrendingUp;
  descricao: string;
}> = {
  CONSERVADOR: {
    label: 'Conservador',
    cor: 'text-blue-600',
    bg: 'bg-blue-50',
    icone: Scale,
    descricao: 'Prioriza a segurança do capital, aceitando menor rentabilidade em troca de menor risco.',
  },
  MODERADO: {
    label: 'Moderado',
    cor: 'text-yellow-600',
    bg: 'bg-yellow-50',
    icone: Target,
    descricao: 'Busca equilíbrio entre risco e retorno, aceitando volatilidade moderada.',
  },
  AGRESSIVO: {
    label: 'Agressivo',
    cor: 'text-red-600',
    bg: 'bg-red-50',
    icone: TrendingUp,
    descricao: 'Busca maximizar ganhos, aceitando alta volatilidade e riscos maiores.',
  },
};

export function SuitabilityForm({ perguntas, initialData, onSubmit }: SuitabilityFormProps) {
  const [respostas, setRespostas] = useState<Record<number, number>>({});
  const [showResult, setShowResult] = useState(false);

  // Inicializar com dados existentes
  useEffect(() => {
    if (initialData?.respostas) {
      const respostasMap: Record<number, number> = {};
      initialData.respostas.forEach((r) => {
        respostasMap[r.perguntaId] = r.resposta;
      });
      setRespostas(respostasMap);
    }
  }, [initialData]);

  const handleResposta = (perguntaId: number, valor: number) => {
    setRespostas((prev) => ({ ...prev, [perguntaId]: valor }));
  };

  const calcularResultado = (): Suitability => {
    const respostasArray = Object.entries(respostas).map(
      ([perguntaId, resposta]) => ({
        perguntaId: parseInt(perguntaId),
        resposta,
      })
    );

    const pontuacaoTotal = respostasArray.reduce((acc, r) => acc + r.resposta, 0);
    
    let perfil: PerfilInvestidor;
    if (pontuacaoTotal >= 13 && pontuacaoTotal <= 26) {
      perfil = 'CONSERVADOR';
    } else if (pontuacaoTotal >= 27 && pontuacaoTotal <= 39) {
      perfil = 'MODERADO';
    } else {
      perfil = 'AGRESSIVO';
    }

    return {
      respostas: respostasArray,
      pontuacaoTotal,
      perfil,
    };
  };

  const handleSubmit = () => {
    const resultado = calcularResultado();
    setShowResult(true);
    onSubmit(resultado);
  };

  const totalRespondidas = Object.keys(respostas).length;
  const progresso = (totalRespondidas / perguntas.length) * 100;
  const todasRespondidas = totalRespondidas === perguntas.length;

  const resultado = todasRespondidas ? calcularResultado() : null;
  const perfilInfo = resultado ? perfilConfig[resultado.perfil] : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Header com Progresso */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl text-[#008080]">
            Questionário de Suitability
          </CardTitle>
          <p className="text-gray-600">
            Responda as perguntas abaixo para determinar seu perfil de investidor.
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">
                {totalRespondidas} de {perguntas.length} perguntas respondidas
              </span>
              <span className="font-medium text-[#008080]">{Math.round(progresso)}%</span>
            </div>
            <Progress value={progresso} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Perguntas */}
      <div className="space-y-4">
        {perguntas.map((pergunta, index) => (
          <motion.div
            key={pergunta.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className={cn(
              "transition-all duration-200",
              respostas[pergunta.id] ? "border-green-300" : ""
            )}>
              <CardContent className="p-6">
                <div className="flex items-start gap-3 mb-4">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#008080]/10 text-[#008080] flex items-center justify-center font-semibold text-sm">
                    {pergunta.id}
                  </span>
                  <h4 className="font-medium text-gray-900 pt-1">
                    {pergunta.pergunta}
                  </h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-11">
                  {pergunta.opcoes.map((opcao) => (
                    <button
                      key={opcao.valor}
                      type="button"
                      onClick={() => handleResposta(pergunta.id, opcao.valor)}
                      className={cn(
                        "relative p-4 rounded-lg border-2 text-left transition-all duration-200",
                        respostas[pergunta.id] === opcao.valor
                          ? "border-[#008080] bg-[#008080]/5"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5",
                          respostas[pergunta.id] === opcao.valor
                            ? "border-[#008080] bg-[#008080]"
                            : "border-gray-300"
                        )}>
                          {respostas[pergunta.id] === opcao.valor && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </div>
                        <span className="text-sm text-gray-700">{opcao.texto}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Resultado */}
      {todasRespondidas && perfilInfo && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <Card className={cn("border-2", perfilInfo.bg.replace('bg-', 'border-'))}>
            <CardContent className="p-8 text-center">
              <div className={cn(
                "w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center",
                perfilInfo.bg
              )}>
                <perfilInfo.icone className={cn("w-10 h-10", perfilInfo.cor)} />
              </div>

              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Seu Perfil: <span className={perfilInfo.cor}>{perfilInfo.label}</span>
              </h3>

              <p className="text-4xl font-bold text-gray-900 mb-2">
                {resultado?.pontuacaoTotal} <span className="text-lg text-gray-500">pontos</span>
              </p>

              <p className="text-gray-600 max-w-md mx-auto mb-6">
                {perfilInfo.descricao}
              </p>

              <div className="flex justify-center gap-2 text-sm text-gray-500">
                <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full">
                  13-26: Conservador
                </div>
                <div className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full">
                  27-39: Moderado
                </div>
                <div className="px-3 py-1 bg-red-100 text-red-700 rounded-full">
                  40-52: Agressivo
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Botão Continuar */}
      {todasRespondidas ? (
        <Button
          onClick={handleSubmit}
          className="w-full bg-[#008080] hover:bg-[#006666] text-white py-6 text-lg"
        >
          Confirmar Perfil e Continuar
        </Button>
      ) : (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            <p className="text-sm text-yellow-800">
              Responda todas as {perguntas.length} perguntas para continuar
            </p>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}
