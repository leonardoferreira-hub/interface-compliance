import { motion } from 'framer-motion';
import { 
  CheckCircle2, 
  User, 
  Building2, 
  Scale, 
  Briefcase, 
  FileText,
  AlertCircle,
  TrendingUp,
  Target,
  MapPin,
  Wallet,
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { ComplianceData, PerfilInvestidor } from '../../types/onboarding';

interface ComplianceReviewProps {
  data: ComplianceData;
  onSubmit: () => void;
  isSubmitting: boolean;
}

const perfilConfig: Record<PerfilInvestidor, { label: string; cor: string; bg: string; icone: typeof TrendingUp }> = {
  CONSERVADOR: {
    label: 'Conservador',
    cor: 'text-blue-600',
    bg: 'bg-blue-50',
    icone: Scale,
  },
  MODERADO: {
    label: 'Moderado',
    cor: 'text-yellow-600',
    bg: 'bg-yellow-50',
    icone: Target,
  },
  AGRESSIVO: {
    label: 'Agressivo',
    cor: 'text-red-600',
    bg: 'bg-red-50',
    icone: TrendingUp,
  },
};

function formatCPF(cpf: string): string {
  const cleaned = cpf.replace(/\D/g, '');
  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

function formatCNPJ(cnpj: string): string {
  const cleaned = cnpj.replace(/\D/g, '');
  return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
}

function formatCEP(cep: string): string {
  const cleaned = cep.replace(/\D/g, '');
  return cleaned.replace(/(\d{5})(\d{3})/, '$1-$2');
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR');
}

export function ComplianceReview({ data, onSubmit, isSubmitting }: ComplianceReviewProps) {
  const perfilInfo = perfilConfig[data.suitability.perfil];

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
          <CardTitle className="text-2xl text-[#008080]">
            Revisão Final
          </CardTitle>
          <p className="text-gray-600">
            Revise seus dados antes de confirmar o envio.
          </p>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Tipo de Investidor */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
              <User className="w-5 h-5 text-[#008080]" />
              Tipo de Investidor
            </h3>
            <div className="p-4 bg-gray-50 rounded-lg">
              <Badge variant="outline" className="text-base px-3 py-1">
                {data.investorType === 'PF' && 'Pessoa Física'}
                {data.investorType === 'PJ' && 'Pessoa Jurídica'}
                {data.investorType === 'INSTITUCIONAL' && 'Institucional'}
              </Badge>
            </div>
          </div>

          <Separator />

          {/* Dados Cadastrais */}
          {data.dadosPF && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                <User className="w-5 h-5 text-[#008080]" />
                Dados Pessoais
              </h3>
              <div className="p-4 bg-gray-50 rounded-lg space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-500">Nome</span>
                    <p className="font-medium">{data.dadosPF.nome}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">CPF</span>
                    <p className="font-medium">{formatCPF(data.dadosPF.cpf)}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">RG</span>
                    <p className="font-medium">{data.dadosPF.rg} - {data.dadosPF.orgaoEmissor}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Nascimento</span>
                    <p className="font-medium">{formatDate(data.dadosPF.dataNascimento)}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Estado Civil</span>
                    <p className="font-medium">{data.dadosPF.estadoCivil.replace(/_/g, ' ')}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Naturalidade</span>
                    <p className="font-medium">{data.dadosPF.naturalidade}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Ocupação</span>
                    <p className="font-medium">{data.dadosPF.ocupacao}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Email</span>
                    <p className="font-medium">{data.dadosPF.email}</p>
                  </div>
                </div>

                <Separator />

                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-gray-400 mt-1" />
                  <div>
                    <span className="text-sm text-gray-500">Endereço</span>
                    <p className="font-medium">
                      {data.dadosPF.endereco.logradouro}, {data.dadosPF.endereco.numero}
                      {data.dadosPF.endereco.complemento && ` - ${data.dadosPF.endereco.complemento}`}
                    </p>
                    <p className="text-sm text-gray-600">
                      {data.dadosPF.endereco.bairro} - {formatCEP(data.dadosPF.endereco.cep)}
                    </p>
                    <p className="text-sm text-gray-600">
                      {data.dadosPF.endereco.cidade}/{data.dadosPF.endereco.estado}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-gray-400" />
                    <div>
                      <span className="text-sm text-gray-500">Rendimentos Anuais</span>
                      <p className="font-medium">{formatCurrency(data.dadosPF.rendimentosAnuais)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-gray-400" />
                    <div>
                      <span className="text-sm text-gray-500">Patrimônio</span>
                      <p className="font-medium">{formatCurrency(data.dadosPF.patrimonio)}</p>
                    </div>
                  </div>
                </div>

                {data.dadosPF.isPEP && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <span className="text-sm font-medium text-amber-800">
                      ⚠️ Pessoa Exposta Politicamente (PEP)
                    </span>
                    <p className="text-sm text-amber-700">Cargo: {data.dadosPF.cargoPEP}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {data.dadosPJ && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#008080]" />
                Dados da Empresa
              </h3>
              <div className="p-4 bg-gray-50 rounded-lg space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-500">Razão Social</span>
                    <p className="font-medium">{data.dadosPJ.denominacaoSocial}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">CNPJ</span>
                    <p className="font-medium">{formatCNPJ(data.dadosPJ.cnpj)}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Email</span>
                    <p className="font-medium">{data.dadosPJ.email}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Telefone</span>
                    <p className="font-medium">{data.dadosPJ.telefone}</p>
                  </div>
                </div>

                <Separator />

                <div>
                  <span className="text-sm text-gray-500 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Controladores ({data.dadosPJ.controladores.length})
                  </span>
                  <div className="mt-2 space-y-2">
                    {data.dadosPJ.controladores.map((c, i) => (
                      <div key={i} className="text-sm">
                        <span className="font-medium">{c.nome}</span>
                        <span className="text-gray-500"> - CPF: {formatCPF(c.cpf)}</span>
                        {c.isPEP && <Badge variant="destructive" className="ml-2 text-xs">PEP</Badge>}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-sm text-gray-500 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Administradores ({data.dadosPJ.administradores.length})
                  </span>
                  <div className="mt-2 space-y-2">
                    {data.dadosPJ.administradores.map((a, i) => (
                      <div key={i} className="text-sm">
                        <span className="font-medium">{a.nome}</span>
                        <span className="text-gray-500"> - {a.cargo}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {data.dadosPJ.procuradores.length > 0 && (
                  <div>
                    <span className="text-sm text-gray-500 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Procuradores ({data.dadosPJ.procuradores.length})
                    </span>
                    <div className="mt-2 space-y-2">
                      {data.dadosPJ.procuradores.map((p, i) => (
                        <div key={i} className="text-sm">
                          <span className="font-medium">{p.nome}</span>
                          <span className="text-gray-500"> - {p.poderes}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <Separator />

          {/* Suitability */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
              <Scale className="w-5 h-5 text-[#008080]" />
              Perfil de Investidor
            </h3>
            <div className={`p-6 rounded-lg ${perfilInfo.bg} text-center`}>
              <div className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center bg-white">
                <perfilInfo.icone className={`w-8 h-8 ${perfilInfo.cor}`} />
              </div>
              <p className="text-sm text-gray-600 mb-1">Seu perfil é</p>
              <h4 className={`text-2xl font-bold ${perfilInfo.cor}`}>
                {perfilInfo.label}
              </h4>
              <p className="text-gray-600 mt-2">
                {data.suitability.pontuacaoTotal} pontos
              </p>
            </div>
          </div>

          <Separator />

          {/* Declaração Profissional */}
          {data.declaracaoProfissional?.isProfissional && (
            <>
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-[#008080]" />
                  Declaração de Investidor Profissional
                </h3>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 text-green-600 mb-2">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="font-medium">Declaração realizada</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Data: {data.declaracaoProfissional.dataAssinatura && formatDate(data.declaracaoProfissional.dataAssinatura)}
                  </p>
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Documentos */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#008080]" />
              Documentos Anexados
            </h3>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="secondary">{data.documentos.length} arquivo(s)</Badge>
              </div>
              <div className="space-y-2">
                {data.documentos.map((doc, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">{doc.tipo.replace(/_/g, ' ')}:</span>
                    <span className="text-gray-600 truncate">{doc.nome}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <Separator />

          {/* Confirmação */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-800">
              Ao confirmar, declaro que todas as informações fornecidas são verdadeiras 
              e assumo total responsabilidade por elas. Entendo que informações falsas 
              podem resultar em consequências legais.
            </p>
          </div>

          <Button
            onClick={onSubmit}
            disabled={isSubmitting}
            className="w-full bg-[#008080] hover:bg-[#006666] text-white py-6 text-lg"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <motion.div
                  className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                />
                Enviando...
              </span>
            ) : (
              'Confirmar e Enviar'
            )}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
