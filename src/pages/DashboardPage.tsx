import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  ArrowRight,
  FileText,
  TrendingUp
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface DashboardStats {
  totalInvestidores: number;
  pendentesAnalise: number;
  aprovadosHoje: number;
  reprovados: number;
}

interface AnaliseRecente {
  id: string;
  nome: string;
  tipo: string;
  status: 'pendente' | 'em_analise' | 'aprovado' | 'reprovado';
  data: string;
}

export function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalInvestidores: 0,
    pendentesAnalise: 0,
    aprovadosHoje: 0,
    reprovados: 0,
  });
  const [analisesRecentes, setAnalisesRecentes] = useState<AnaliseRecente[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // Buscar estatísticas
      const { data: investidores, error } = await supabase
        .from('investidores')
        .select('id, status, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const hoje = new Date().toISOString().split('T')[0];
      
      setStats({
        totalInvestidores: investidores?.length || 0,
        pendentesAnalise: investidores?.filter(i => i.status === 'pendente').length || 0,
        aprovadosHoje: investidores?.filter(i => 
          i.status === 'aprovado' && i.created_at.startsWith(hoje)
        ).length || 0,
        reprovados: investidores?.filter(i => i.status === 'reprovado').length || 0,
      });

      // Buscar análises recentes
      const { data: recentes } = await supabase
        .from('investidores')
        .select('id, nome_pf, razao_social, tipo, status, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      if (recentes) {
        setAnalisesRecentes(recentes.map(r => ({
          id: r.id,
          nome: r.nome_pf || r.razao_social || 'N/A',
          tipo: r.tipo,
          status: r.status,
          data: new Date(r.created_at).toLocaleDateString('pt-BR'),
        })));
      }
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'aprovado':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Aprovado</Badge>;
      case 'reprovado':
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Reprovado</Badge>;
      case 'em_analise':
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Em Análise</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">Pendente</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'aprovado':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'reprovado':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'em_analise':
        return <Clock className="w-5 h-5 text-blue-500" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#008080] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">T</span>
              </div>
              <div>
                <h1 className="font-semibold text-gray-900">Compliance - Grupo Travessia</h1>
                <p className="text-sm text-gray-500">Dashboard de Investidores</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total de Investidores</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {isLoading ? '-' : stats.totalInvestidores}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Pendentes de Análise</p>
                  <p className="text-3xl font-bold text-yellow-600 mt-1">
                    {isLoading ? '-' : stats.pendentesAnalise}
                  </p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Aprovados Hoje</p>
                  <p className="text-3xl font-bold text-green-600 mt-1">
                    {isLoading ? '-' : stats.aprovadosHoje}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Taxa de Aprovação</p>
                  <p className="text-3xl font-bold text-[#008080] mt-1">
                    {isLoading ? '-' : 
                      stats.totalInvestidores > 0 
                        ? Math.round(((stats.totalInvestidores - stats.pendentesAnalise - stats.reprovados) / stats.totalInvestidores) * 100) + '%'
                        : '0%'
                    }
                  </p>
                </div>
                <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-[#008080]" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Análises Recentes */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#008080]" />
                Análises Recentes
              </CardTitle>
              <Button variant="outline" size="sm" onClick={loadDashboardData}>
                Atualizar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-gray-500">
                Carregando...
              </div>
            ) : analisesRecentes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Nenhuma análise encontrada
              </div>
            ) : (
              <div className="space-y-4">
                {analisesRecentes.map((analise) => (
                  <div
                    key={analise.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      {getStatusIcon(analise.status)}
                      <div>
                        <p className="font-medium text-gray-900">{analise.nome}</p>
                        <p className="text-sm text-gray-500">
                          {analise.tipo === 'PF' && 'Pessoa Física'}
                          {analise.tipo === 'PJ' && 'Pessoa Jurídica'}
                          {analise.tipo === 'INSTITUCIONAL' && 'Institucional'}
                          {' • '}
                          {analise.data}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {getStatusBadge(analise.status)}
                      <Button variant="ghost" size="sm">
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
