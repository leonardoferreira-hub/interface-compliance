import { useState, useMemo, memo } from 'react';
import { ShieldCheck, Users, Building2, FileCheck, AlertCircle, CheckCircle, Clock, ArrowRight, Bell } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Navigation } from '@/components/layout/Navigation';
import { useDashboard, useVerificacoesPendentes, useInvestidores } from '@/hooks/useCompliance';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { PageTransition, AnimatedCard, AnimatedListItem } from '@/components/ui/animations';
import { StatsCardSkeleton, CardListSkeleton } from '@/components/ui/skeletons';
import { EmptyState, EmptyTableState } from '@/components/ui/empty-state';
import { motion } from 'framer-motion';

// Badges de status com contraste melhorado para acessibilidade
const statusBadgeStyles: Record<string, string> = {
  pendente: 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-100',
  documentacao_pendente: 'bg-orange-100 text-orange-800 border-orange-300 hover:bg-orange-100',
  em_analise: 'bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-100',
  aprovado: 'bg-green-100 text-green-800 border-green-300 hover:bg-green-100',
  reprovado: 'bg-red-100 text-red-800 border-red-300 hover:bg-red-100',
};

const statusLabels: Record<string, string> = {
  pendente: 'Pendente',
  documentacao_pendente: 'Doc. Pendente',
  em_analise: 'Em Análise',
  aprovado: 'Aprovado',
  reprovado: 'Reprovado',
};

const StatusBadge = memo(function StatusBadge({ status }: { status: string }) {
  const style = statusBadgeStyles[status] || 'bg-gray-100 text-gray-800 border-gray-300';
  const label = statusLabels[status] || status;
  
  return (
    <Badge 
      variant="outline" 
      className={`${style} font-medium text-xs px-2 py-0.5`}
    >
      {label}
    </Badge>
  );
});

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: stats, isLoading } = useDashboard();
  const { data: verificacoes } = useVerificacoesPendentes();
  const { data: investidores } = useInvestidores();

  // Cards memoizados - recalcula apenas quando stats mudar
  const cards = useMemo(() => [
    {
      title: 'Verificações Pendentes',
      value: stats?.verificacoes_pendentes || 0,
      icon: Building2,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      path: '/verificacoes',
      urgent: (stats?.verificacoes_pendentes || 0) > 0,
    },
    {
      title: 'Em Análise',
      value: stats?.verificacoes_em_analise || 0,
      icon: FileCheck,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      path: '/verificacoes',
    },
    {
      title: 'Investidores Pendentes',
      value: stats?.investidores_pendentes || 0,
      icon: Users,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      path: '/investidores',
      urgent: (stats?.investidores_pendentes || 0) > 0,
    },
    {
      title: 'CNPJs Verificados (30d)',
      value: stats?.cnpjs_verificados_30d || 0,
      icon: ShieldCheck,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      path: '/historico',
    },
  ], [stats]);

  // Filtrar apenas itens pendentes para o To-Do - memoizado
  const pendentesVerificacao = useMemo(() => 
    verificacoes?.filter(v => v.status === 'pendente').slice(0, 5) || [],
  [verificacoes]);
  
  const pendentesInvestidor = useMemo(() => 
    investidores?.filter(i => 
      i.status_onboarding === 'pendente' || i.status_onboarding === 'documentacao_pendente'
    ).slice(0, 5) || [],
  [investidores]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50/50">
        <Navigation />
        <div className="container mx-auto py-6 px-4 space-y-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
              <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="h-4 w-64 bg-gray-200 rounded animate-pulse" />
          </div>
          <StatsCardSkeleton count={4} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <CardListSkeleton count={2} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50/50">
        <Navigation />
        <div className="container mx-auto py-6 px-4">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-2">
              <ShieldCheck className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold">Compliance</h1>
            </div>
            <p className="text-muted-foreground">
              Gestão de verificações, onboarding e due diligence
            </p>
          </motion.div>

          {/* Cards de Métricas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {cards.map((card, index) => {
              const Icon = card.icon;
              return (
                <AnimatedCard key={card.title} index={index}>
                  <Card 
                    className={`cursor-pointer hover:shadow-md transition-shadow h-full ${card.urgent ? 'border-amber-400' : ''}`}
                    onClick={() => navigate(card.path)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className={`p-2 rounded-lg ${card.bgColor}`}>
                          <Icon className={`h-5 w-5 ${card.color}`} />
                        </div>
                        {card.urgent && (
                          <Bell className="h-4 w-4 text-amber-500 animate-pulse" />
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{card.value}</div>
                      <p className="text-sm text-muted-foreground">{card.title}</p>
                    </CardContent>
                  </Card>
                </AnimatedCard>
              );
            })}
          </div>

          {/* Tabs com To-Do e Atividades */}
          <Tabs defaultValue="pendentes" className="space-y-4">
            <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 lg:w-auto lg:inline-grid">
              <TabsTrigger value="pendentes" className="text-xs sm:text-sm">
                <AlertCircle className="h-4 w-4 mr-2 hidden sm:inline" />
                Pendentes ({pendentesVerificacao.length + pendentesInvestidor.length})
              </TabsTrigger>
              <TabsTrigger value="verificacoes" className="text-xs sm:text-sm">
                <Building2 className="h-4 w-4 mr-2 hidden sm:inline" />
                Últimas Verificações
              </TabsTrigger>
              <TabsTrigger value="investidores" className="text-xs sm:text-sm">
                <Users className="h-4 w-4 mr-2 hidden sm:inline" />
                Últimos Investidores
              </TabsTrigger>
            </TabsList>

            {/* Tab Pendentes */}
            <TabsContent value="pendentes" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* To-Do Verificações */}
                <AnimatedCard index={0}>
                  <Card className="h-full">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-amber-600" />
                          Verificações Pendentes
                        </CardTitle>
                        {pendentesVerificacao.length > 0 && (
                          <Badge variant="secondary">{pendentesVerificacao.length} pendentes</Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      {pendentesVerificacao.length === 0 ? (
                        <EmptyState
                          icon={CheckCircle}
                          title="Nenhuma verificação pendente!"
                          description="Todas as análises estão em dia."
                          variant="compact"
                        />
                      ) : (
                        <div className="space-y-3">
                          {pendentesVerificacao.map((v, index) => (
                            <motion.div 
                              key={v.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200 cursor-pointer hover:bg-amber-100 transition-colors"
                              onClick={() => navigate('/verificacoes')}
                            >
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-sm truncate">{v.nome_entidade || v.cnpj}</p>
                                <p className="text-xs text-muted-foreground truncate">{v.numero_emissao} • {v.tipo_entidade}</p>
                              </div>
                              <Badge variant="outline" className="text-amber-600 shrink-0 ml-2">
                                <Clock className="h-3 w-3 mr-1" />
                                Pendente
                              </Badge>
                            </motion.div>
                          ))}
                          {verificacoes && verificacoes.filter(v => v.status === 'pendente').length > 5 && (
                            <Button 
                              variant="ghost" 
                              className="w-full text-sm"
                              onClick={() => navigate('/verificacoes')}
                            >
                              Ver todas ({verificacoes.filter(v => v.status === 'pendente').length})
                              <ArrowRight className="h-4 w-4 ml-2" />
                            </Button>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </AnimatedCard>

                {/* To-Do Investidores */}
                <AnimatedCard index={1}>
                  <Card className="h-full">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Users className="h-4 w-4 text-amber-600" />
                          Investidores Pendentes
                        </CardTitle>
                        {pendentesInvestidor.length > 0 && (
                          <Badge variant="secondary">{pendentesInvestidor.length} pendentes</Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      {pendentesInvestidor.length === 0 ? (
                        <EmptyState
                          icon={CheckCircle}
                          title="Nenhum investidor pendente!"
                          description="Todos os onboards estão completos."
                          variant="compact"
                        />
                      ) : (
                        <div className="space-y-3">
                          {pendentesInvestidor.map((inv, index) => (
                            <motion.div 
                              key={inv.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200 cursor-pointer hover:bg-amber-100 transition-colors"
                              onClick={() => navigate('/investidores')}
                            >
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-sm truncate">{inv.nome}</p>
                                <p className="text-xs text-muted-foreground truncate">{inv.tipo_investidor} • {inv.cpf_cnpj}</p>
                              </div>
                              <StatusBadge status={inv.status_onboarding} />
                            </motion.div>
                          ))}
                          {investidores && investidores.filter(i => 
                            i.status_onboarding === 'pendente' || i.status_onboarding === 'documentacao_pendente'
                          ).length > 5 && (
                            <Button 
                              variant="ghost" 
                              className="w-full text-sm"
                              onClick={() => navigate('/investidores')}
                            >
                              Ver todos ({investidores.filter(i => 
                                i.status_onboarding === 'pendente' || i.status_onboarding === 'documentacao_pendente'
                              ).length})
                              <ArrowRight className="h-4 w-4 ml-2" />
                            </Button>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </AnimatedCard>
              </div>
            </TabsContent>

            {/* Tab Últimas Verificações */}
            <TabsContent value="verificacoes">
              <AnimatedCard>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Últimas Verificações</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {verificacoes?.length === 0 ? (
                      <EmptyTableState
                        title="Nenhuma verificação encontrada"
                        description="Não há verificações registradas no sistema."
                      />
                    ) : (
                      <div className="divide-y">
                        {verificacoes?.slice(0, 10).map((v, index) => (
                          <motion.div 
                            key={v.id}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.03 }}
                            className="py-3 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors px-2 -mx-2 rounded"
                            onClick={() => navigate('/verificacoes')}
                          >
                            <div className="min-w-0 flex-1 mr-4">
                              <p className="font-medium text-sm truncate">{v.nome_entidade || v.cnpj}</p>
                              <p className="text-xs text-muted-foreground truncate">
                                {v.numero_emissao} • {format(new Date(v.data_solicitacao), 'dd/MM/yyyy', { locale: ptBR })}
                              </p>
                            </div>
                            <StatusBadge status={v.status} />
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </AnimatedCard>
            </TabsContent>

            {/* Tab Últimos Investidores */}
            <TabsContent value="investidores">
              <AnimatedCard>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Últimos Investidores Cadastrados</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {investidores?.length === 0 ? (
                      <EmptyTableState
                        title="Nenhum investidor encontrado"
                        description="Não há investidores cadastrados no sistema."
                      />
                    ) : (
                      <div className="divide-y">
                        {investidores?.slice(0, 10).map((inv, index) => (
                          <motion.div 
                            key={inv.id}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.03 }}
                            className="py-3 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors px-2 -mx-2 rounded"
                            onClick={() => navigate('/investidores')}
                          >
                            <div className="min-w-0 flex-1 mr-4">
                              <p className="font-medium text-sm truncate">{inv.nome}</p>
                              <p className="text-xs text-muted-foreground truncate">
                                {inv.tipo_investidor} • {format(new Date(inv.criado_em), 'dd/MM/yyyy', { locale: ptBR })}
                              </p>
                            </div>
                            <StatusBadge status={inv.status_onboarding} />
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </AnimatedCard>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </PageTransition>
  );
}
