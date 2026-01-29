import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  Building2, 
  Search, 
  CheckCircle, 
  XCircle, 
  Clock,
  AlertCircle,
  Loader2,
  Filter,
  Inbox
} from 'lucide-react';
import { Navigation } from '@/components/layout/Navigation';
import { 
  useVerificacoesPendentes, 
  useAnalisarVerificacao,
  type VerificacaoPendente 
} from '@/hooks/useCompliance';
import { useConsultaCNPJ } from '@/hooks/useConsultaCNPJ';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PageTransition, AnimatedListItem } from '@/components/ui/animations';
import { CardListSkeleton } from '@/components/ui/skeletons';
import { EmptyState, EmptySearchState } from '@/components/ui/empty-state';
import { motion, AnimatePresence } from 'framer-motion';

// Status config com contraste melhorado para acessibilidade
const statusConfig = {
  pendente: { 
    label: 'Pendente', 
    className: 'bg-amber-100 text-amber-800 border-amber-300 font-medium',
    icon: Clock 
  },
  em_analise: { 
    label: 'Em Análise', 
    className: 'bg-blue-100 text-blue-800 border-blue-300 font-medium',
    icon: AlertCircle 
  },
  aprovado: { 
    label: 'Aprovado', 
    className: 'bg-green-100 text-green-800 border-green-300 font-medium',
    icon: CheckCircle 
  },
  reprovado: { 
    label: 'Reprovado', 
    className: 'bg-red-100 text-red-800 border-red-300 font-medium',
    icon: XCircle 
  },
};

export default function VerificacoesPage() {
  const [filtroStatus, setFiltroStatus] = useState<string>('');
  const [busca, setBusca] = useState('');
  const [selecionado, setSelecionado] = useState<VerificacaoPendente | null>(null);
  const [observacao, setObservacao] = useState('');
  
  const { data: verificacoes, isLoading, error } = useVerificacoesPendentes(filtroStatus || undefined);
  const analisar = useAnalisarVerificacao();
  const { data: cnpjData, consultar, isLoading: consultando } = useConsultaCNPJ();

  // Debug
  console.log('Verificacoes:', verificacoes);
  console.log('Error:', error);

  const filtered = verificacoes?.filter(v => 
    v.cnpj.includes(busca) ||
    v.nome_entidade?.toLowerCase().includes(busca.toLowerCase()) ||
    v.numero_emissao?.toLowerCase().includes(busca.toLowerCase())
  ) || [];

  const handleAnalisar = async (id: string, status: 'aprovado' | 'reprovado' | 'em_analise') => {
    if (status === 'reprovado' && !observacao.trim()) {
      alert('Justificativa obrigatória para reprovação');
      return;
    }
    
    await analisar.mutateAsync({
      id,
      status,
      observacoes: observacao,
    });
    
    setSelecionado(null);
    setObservacao('');
  };

  const handleConsultarCNPJ = async (cnpj: string) => {
    await consultar(cnpj);
  };

  const clearSearch = () => {
    setBusca('');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="container mx-auto py-6 px-4 space-y-6">
          <div>
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-2" />
            <div className="h-4 w-64 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 h-10 bg-gray-200 rounded animate-pulse" />
            <div className="w-full sm:w-48 h-10 bg-gray-200 rounded animate-pulse" />
          </div>
          <CardListSkeleton count={5} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="container mx-auto py-6 px-4">
          <Card className="border-red-200">
            <CardContent className="py-8 text-center">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
              <p className="text-red-600">Erro ao carregar dados</p>
              <p className="text-sm text-muted-foreground mt-2">{error.message}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50/50">
        <Navigation />
        <div className="container mx-auto py-6 px-4">
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <h1 className="text-2xl font-bold">Verificações de CNPJ</h1>
            <p className="text-muted-foreground">
              Análise de CNPJs enviados pela estruturação
            </p>
          </motion.div>

          {/* Filtros - Responsivos */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col sm:flex-row gap-4 mb-6"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por CNPJ, nome ou operação..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filtroStatus || 'todos'} onValueChange={(v) => setFiltroStatus(v === 'todos' ? '' : v)}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="em_analise">Em Análise</SelectItem>
                <SelectItem value="aprovado">Aprovado</SelectItem>
                <SelectItem value="reprovado">Reprovado</SelectItem>
              </SelectContent>
            </Select>
          </motion.div>

          {/* Lista */}
          <div className="space-y-4">
            {filtered.length === 0 ? (
              busca ? (
                <EmptySearchState searchTerm={busca} onClear={clearSearch} />
              ) : (
                <EmptyState
                  icon={Inbox}
                  title="Nenhuma verificação encontrada"
                  description={filtroStatus 
                    ? `Não há verificações com status "${statusConfig[filtroStatus as keyof typeof statusConfig]?.label || filtroStatus}".`
                    : "Não há verificações pendentes no momento."
                  }
                  action={{ 
                    label: 'Limpar filtros', 
                    onClick: () => { setBusca(''); setFiltroStatus(''); }
                  }}
                />
              )
            ) : (
              <AnimatePresence mode="popLayout">
                {filtered.map((verif, index) => {
                  const status = statusConfig[verif.status];
                  const StatusIcon = status.icon;
                  const isSelecionado = selecionado?.id === verif.id;

                  return (
                    <AnimatedListItem key={verif.id} index={index}>
                      <Card className={`transition-all duration-200 ${isSelecionado ? 'border-primary ring-1 ring-primary' : 'hover:border-muted-foreground/20'}`}>
                        <CardContent className="py-4">
                          <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                            {/* Info principal */}
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 mb-2">
                                <Badge 
                                  variant="outline" 
                                  className={status.className}
                                >
                                  <StatusIcon className="h-3 w-3 mr-1" />
                                  {status.label}
                                </Badge>
                                <span className="text-sm text-muted-foreground">
                                  {verif.tipo_entidade}
                                </span>
                              </div>
                              
                              <div className="space-y-1">
                                <p className="font-medium text-lg">
                                  {verif.cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')}
                                </p>
                                {verif.nome_entidade && (
                                  <p className="text-muted-foreground truncate">{verif.nome_entidade}</p>
                                )}
                                {verif.numero_emissao && (
                                  <p className="text-sm text-muted-foreground">
                                    Operação: {verif.numero_emissao}
                                    {verif.nome_operacao && ` - ${verif.nome_operacao}`}
                                  </p>
                                )}
                                <p className="text-xs text-muted-foreground">
                                  Solicitado em: {format(new Date(verif.data_solicitacao), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                                </p>
                              </div>

                              {verif.observacoes && (
                                <div className="mt-3 p-2 bg-red-50 text-red-800 text-sm rounded border border-red-200">
                                  <strong>Justificativa:</strong> {verif.observacoes}
                                </div>
                              )}
                            </div>

                            {/* Ações - Responsivo */}
                            <div className="flex flex-wrap gap-2">
                              {verif.status !== 'aprovado' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-green-700 border-green-300 hover:bg-green-50"
                                  onClick={() => handleAnalisar(verif.id, 'aprovado')}
                                  disabled={analisar.isPending}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Aprovar
                                </Button>
                              )}
                              
                              {verif.status !== 'reprovado' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-700 border-red-300 hover:bg-red-50"
                                  onClick={() => setSelecionado(isSelecionado ? null : verif)}
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Reprovar
                                </Button>
                              )}

                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleConsultarCNPJ(verif.cnpj)}
                                disabled={consultando}
                              >
                                {consultando ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  'Consultar CNPJ'
                                )}
                              </Button>
                            </div>
                          </div>

                          {/* Form de reprovação */}
                          <AnimatePresence>
                            {isSelecionado && (
                              <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg overflow-hidden"
                              >
                                <label className="text-sm font-medium text-red-800">
                                  Justificativa da Reprovação *
                                </label>
                                <Textarea
                                  value={observacao}
                                  onChange={(e) => setObservacao(e.target.value)}
                                  placeholder="Informe o motivo da reprovação..."
                                  className="mt-2 bg-white border-red-200 focus:border-red-400"
                                />
                                <div className="flex flex-col sm:flex-row justify-end gap-2 mt-3">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      setSelecionado(null);
                                      setObservacao('');
                                    }}
                                  >
                                    Cancelar
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    disabled={!observacao.trim() || analisar.isPending}
                                    onClick={() => handleAnalisar(verif.id, 'reprovado')}
                                  >
                                    {analisar.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                    Confirmar Reprovação
                                  </Button>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          {/* Dados da consulta CNPJ */}
                          <AnimatePresence>
                            {cnpjData && isSelecionado && (
                              <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-4 p-4 bg-muted rounded-lg overflow-hidden"
                              >
                                <h4 className="font-medium mb-2">Dados da Consulta CNPJ</h4>
                                <div className="text-sm space-y-1">
                                  <p><strong>Razão Social:</strong> {cnpjData.razao_social}</p>
                                  <p><strong>Situação:</strong> {cnpjData.situacao}</p>
                                  <p><strong>Atividade:</strong> {cnpjData.atividade_principal?.text || 'Não informado'}</p>
                                  <p><strong>Endereço:</strong> {cnpjData.logradouro}, {cnpjData.numero} - {cnpjData.municipio}/{cnpjData.uf}</p>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </CardContent>
                      </Card>
                    </AnimatedListItem>
                  );
                })}
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
