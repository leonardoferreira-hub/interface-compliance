import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Building2, Users, Plus, Trash2, CheckCircle, 
  AlertCircle, ChevronRight, ChevronLeft, Loader2, FileText
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface InvestidorForm {
  id: string;
  tipo: 'pessoa_fisica' | 'pessoa_juridica' | 'institucional';
  cnpj_cpf: string;
  nome: string;
  email: string;
  telefone: string;
  valor_integralizacao: string;
  percentual_pld: string;
  
  // Check se já existe na base
  existe_na_base?: boolean;
  cadastro_valido?: boolean;
  investidor_existente_id?: string;
  carregando_check?: boolean;
}

export default function CadastroInvestidoresEmissaoPage() {
  const { emissaoId } = useParams<{ emissaoId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [emissao, setEmissao] = useState<any>(null);
  const [investidores, setInvestidores] = useState<InvestidorForm[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (emissaoId) {
      buscarEmissao();
    }
  }, [emissaoId]);

  const buscarEmissao = async () => {
    try {
      // Buscar dados da emissão (usando a view existente)
      const { data, error } = await supabase
        .from('emissoes')
        .select('*, series(*)')
        .eq('id', emissaoId)
        .single();
      
      if (error || !data) {
        toast.error('Emissão não encontrada');
        navigate('/');
        return;
      }
      
      setEmissao(data);
      // Adicionar primeiro investidor vazio
      adicionarInvestidor();
    } catch (err) {
      toast.error('Erro ao carregar emissão');
    } finally {
      setLoading(false);
    }
  };

  const adicionarInvestidor = () => {
    const novo: InvestidorForm = {
      id: Date.now().toString(),
      tipo: 'pessoa_fisica',
      cnpj_cpf: '',
      nome: '',
      email: '',
      telefone: '',
      valor_integralizacao: '',
      percentual_pld: '',
    };
    setInvestidores(prev => [...prev, novo]);
  };

  const removerInvestidor = (id: string) => {
    if (investidores.length === 1) {
      toast.error('Adicione pelo menos um investidor');
      return;
    }
    setInvestidores(prev => prev.filter(i => i.id !== id));
  };

  const atualizarInvestidor = (id: string, campo: string, valor: string) => {
    setInvestidores(prev => prev.map(i => 
      i.id === id ? { ...i, [campo]: valor } : i
    ));
  };

  const verificarCNPJ = async (id: string, cnpj: string) => {
    if (cnpj.length < 11) return;
    
    setInvestidores(prev => prev.map(i => 
      i.id === id ? { ...i, carregando_check: true } : i
    ));

    try {
      const { data, error } = await supabase.rpc('verificar_cnpj_existente', {
        p_cnpj: cnpj.replace(/\D/g, '')
      });
      
      if (error) throw error;
      
      if (data.existe && data.valido) {
        // Pré-carregar dados
        setInvestidores(prev => prev.map(i => 
          i.id === id ? { 
            ...i, 
            cnpj_cpf: cnpj,
            nome: data.nome || i.nome,
            email: data.email || i.email,
            telefone: data.telefone || i.telefone,
            tipo: data.tipo || i.tipo,
            existe_na_base: true,
            cadastro_valido: true,
            investidor_existente_id: data.investidor_id,
            carregando_check: false
          } : i
        ));
        toast.success('CNPJ encontrado! Dados pré-carregados.');
      } else if (data.existe && !data.valido) {
        setInvestidores(prev => prev.map(i => 
          i.id === id ? { 
            ...i, 
            cnpj_cpf: cnpj,
            existe_na_base: true,
            cadastro_valido: false,
            carregando_check: false
          } : i
        ));
        toast.warning('Cadastro expirado (mais de 1 ano). Necessário atualizar.');
      } else {
        setInvestidores(prev => prev.map(i => 
          i.id === id ? { 
            ...i, 
            cnpj_cpf: cnpj,
            existe_na_base: false,
            carregando_check: false
          } : i
        ));
      }
    } catch (err) {
      setInvestidores(prev => prev.map(i => 
        i.id === id ? { ...i, carregando_check: false } : i
      ));
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    
    try {
      for (const inv of investidores) {
        const cnpjLimpo = inv.cnpj_cpf.replace(/\D/g, '');
        
        // Criar vinculação
        const { data, error } = await supabase.rpc('criar_vinculo_investidor_emissao', {
          p_emissao_id: emissaoId,
          p_numero_emissao: emissao?.numero_emissao || emissao?.numero_emissao_completo,
          p_cnpj_cpf: cnpjLimpo,
          p_tipo: inv.tipo
        });
        
        if (error) throw error;
        
        // Se não usou cadastro existente, criar investidor no compliance
        if (!data.usou_existente) {
          const { data: novoInvestidor, error: invError } = await supabase
            .from('investidores')
            .insert({
              cpf_cnpj: cnpjLimpo,
              nome: inv.nome,
              email: inv.email,
              telefone: inv.telefone,
              tipo: inv.tipo,
              tipo_investidor: inv.tipo === 'institucional' ? 'institucional' : 'varejo',
              status_onboarding: 'pendente',
              origem: 'emissao_' + emissaoId,
            })
            .select()
            .single();
          
          if (invError) throw invError;
          
          // Atualizar vinculação com o investidor_id
          await supabase
            .from('investidor_emissao')
            .update({ investidor_id: novoInvestidor.id })
            .eq('id', data.id);
        }
      }
      
      toast.success('Investidores cadastrados com sucesso!');
      navigate(`/obrigado-investidor?emissao=${emissaoId}`);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao cadastrar investidores');
    } finally {
      setSubmitting(false);
    }
  };

  const canProceed = () => {
    return investidores.every(inv => 
      inv.cnpj_cpf && inv.nome && inv.email && inv.valor_integralizacao
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-slate-900">Cadastro de Investidores</h1>
          <p className="text-slate-500 mt-2">
            Emissão: <span className="font-medium">{emissao?.numero_emissao_completo || emissao?.numero_emissao}</span>
          </p>
          <p className="text-slate-400 text-sm">
            {emissao?.nome_operacao}
          </p>
        </motion.div>

        {/* Passos */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-4">
            {['Quantidade', 'Dados dos Investidores', 'Confirmação'].map((step, index) => (
              <div key={step} className="flex items-center">
                <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${
                  index === currentStep ? 'bg-blue-600 text-white' : 
                  index < currentStep ? 'bg-green-100 text-green-700' : 
                  'bg-slate-200 text-slate-500'
                }`}>
                  {index < currentStep ? <CheckCircle className="h-4 w-4" /> : 
                   index === 0 ? <Users className="h-4 w-4" /> :
                   index === 1 ? <FileText className="h-4 w-4" /> :
                   <CheckCircle className="h-4 w-4" />}
                  <span className="text-sm font-medium">{step}</span>
                </div>
                {index < 2 && <div className="w-8 h-0.5 bg-slate-300 mx-2" />}
              </div>
            ))}
          </div>
        </div>

        {/* Conteúdo */}
        <AnimatePresence mode="wait">
          {currentStep === 0 && (
            <motion.div
              key="step0"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Quantos investidores?
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-center gap-4">
                    <Button 
                      variant="outline" 
                      size="lg"
                      onClick={() => {
                        setInvestidores([]);
                        adicionarInvestidor();
                      }}
                      className={investidores.length === 1 ? 'border-blue-500 bg-blue-50' : ''}
                    >
                      <User className="h-5 w-5 mr-2" />
                      1 Investidor
                    </Button>
                    <Button 
                      variant="outline" 
                      size="lg"
                      onClick={() => {
                        setInvestidores([]);
                        adicionarInvestidor();
                        adicionarInvestidor();
                      }}
                      className={investidores.length === 2 ? 'border-blue-500 bg-blue-50' : ''}
                    >
                      <Users className="h-5 w-5 mr-2" />
                      2 Investidores
                    </Button>
                    <Button 
                      variant="outline" 
                      size="lg"
                      onClick={() => {
                        setInvestidores([]);
                        adicionarInvestidor();
                        adicionarInvestidor();
                        adicionarInvestidor();
                      }}
                      className={investidores.length === 3 ? 'border-blue-500 bg-blue-50' : ''}
                    >
                      <Users className="h-5 w-5 mr-2" />
                      3 Investidores
                    </Button>
                  </div>
                  
                  <div className="text-center">
                    <Button
                      variant="ghost"
                      onClick={() => {
                        const qtd = parseInt(prompt('Quantos investidores? (máx 10)') || '1');
                        if (qtd > 0 && qtd <= 10) {
                          setInvestidores([]);
                          for (let i = 0; i < qtd; i++) adicionarInvestidor();
                        }
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Outra quantidade
                    </Button>
                  </div>
                  
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-center text-blue-700 font-medium">
                      {investidores.length} investidor(es) selecionado(s)
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {investidores.map((inv, index) => (
                <Card key={inv.id} className="shadow-lg">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <span className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm">
                          {index + 1}
                        </span>
                        Investidor {index + 1}
                      </CardTitle>
                      {investidores.length > 1 && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => removerInvestidor(inv.id)}
                          className="text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Tipo */}
                    <div className="flex gap-2">
                      {[
                        { value: 'pessoa_fisica', label: 'Pessoa Física', icon: User },
                        { value: 'pessoa_juridica', label: 'Pessoa Jurídica', icon: Building2 },
                        { value: 'institucional', label: 'Institucional', icon: Users },
                      ].map((tipo) => {
                        const Icon = tipo.icon;
                        return (
                          <Button
                            key={tipo.value}
                            type="button"
                            variant={inv.tipo === tipo.value ? 'default' : 'outline'}
                            className="flex-1"
                            onClick={() => atualizarInvestidor(inv.id, 'tipo', tipo.value)}
                          >
                            <Icon className="h-4 w-4 mr-2" />
                            {tipo.label}
                          </Button>
                        );
                      })}
                    </div>

                    {/* CNPJ/CPF */}
                    <div className="space-y-2">
                      <Label>CPF/CNPJ *</Label>
                      <div className="flex gap-2">
                        <Input 
                          value={inv.cnpj_cpf} 
                          onChange={(e) => atualizarInvestidor(inv.id, 'cnpj_cpf', e.target.value)}
                          onBlur={() => verificarCNPJ(inv.id, inv.cnpj_cpf)}
                          placeholder="000.000.000-00 ou 00.000.000/0000-00"
                          className={inv.existe_na_base && inv.cadastro_valido ? 'border-green-500 bg-green-50' : ''}
                        />
                        {inv.carregando_check && <Loader2 className="h-5 w-5 animate-spin" />}
                      </div>
                      {inv.existe_na_base && inv.cadastro_valido && (
                        <p className="text-sm text-green-600 flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          CNPJ já cadastrado e válido. Dados pré-carregados.
                        </p>
                      )}
                      {inv.existe_na_base && !inv.cadastro_valido && (
                        <p className="text-sm text-amber-600 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          Cadastro expirado. Será necessário atualizar dados.
                        </p>
                      )}
                    </div>

                    {/* Nome */}
                    <div className="space-y-2">
                      <Label>Nome Completo / Razão Social *</Label>
                      <Input 
                        value={inv.nome} 
                        onChange={(e) => atualizarInvestidor(inv.id, 'nome', e.target.value)}
                        placeholder="Digite o nome"
                      />
                    </div>

                    {/* Contato */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Email *</Label>
                        <Input 
                          type="email"
                          value={inv.email} 
                          onChange={(e) => atualizarInvestidor(inv.id, 'email', e.target.value)}
                          placeholder="email@exemplo.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Telefone</Label>
                        <Input 
                          value={inv.telefone} 
                          onChange={(e) => atualizarInvestidor(inv.id, 'telefone', e.target.value)}
                          placeholder="(00) 00000-0000"
                        />
                      </div>
                    </div>

                    {/* Valores */}
                    <div className="grid grid-cols-2 gap-4 border-t pt-4">
                      <div className="space-y-2">
                        <Label>Valor de Integralização (R$) *</Label>
                        <Input 
                          type="number"
                          value={inv.valor_integralizacao} 
                          onChange={(e) => atualizarInvestidor(inv.id, 'valor_integralizacao', e.target.value)}
                          placeholder="0,00"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>% PLD</Label>
                        <Input 
                          type="number"
                          value={inv.percentual_pld} 
                          onChange={(e) => atualizarInvestidor(inv.id, 'percentual_pld', e.target.value)}
                          placeholder="0%"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              <Button 
                variant="outline" 
                className="w-full"
                onClick={adicionarInvestidor}
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar outro investidor
              </Button>
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    Confirmação
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-green-800 font-medium">
                      Resumo do cadastro
                    </p>
                    <p className="text-green-600 text-sm mt-1">
                      {investidores.length} investidor(es) serão cadastrados para esta emissão.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {investidores.map((inv, index) => (
                      <div key={inv.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div>
                          <p className="font-medium">{inv.nome}</p>
                          <p className="text-sm text-slate-500">{inv.cnpj_cpf}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant={inv.existe_na_base ? 'secondary' : 'default'}>
                            {inv.existe_na_base ? 'Existente' : 'Novo'}
                          </Badge>
                          <p className="text-sm text-slate-600 mt-1">
                            R$ {parseFloat(inv.valor_integralizacao || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-amber-800">Próximos passos</p>
                        <p className="text-sm text-amber-700 mt-1">
                          Após o cadastro, cada investidor receberá um email para completar 
                          o KYC, Suitability e enviar documentos. O time de compliance 
                          analisará e aprovará antes da integralização.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navegação */}
        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Anterior
          </Button>

          {currentStep < 2 ? (
            <Button
              onClick={() => setCurrentStep(currentStep + 1)}
              disabled={currentStep === 1 && !canProceed()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Próximo
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Confirmar Cadastro
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
