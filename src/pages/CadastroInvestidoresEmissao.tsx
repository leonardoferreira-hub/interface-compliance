import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Building2, Users, Plus, Trash2, CheckCircle, 
  AlertCircle, ChevronRight, ChevronLeft, Loader2, 
  ExternalLink, Copy, Check
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Função para gerar UUID (fallback para browsers que não suportam crypto.randomUUID)
const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback usando crypto.getRandomValues
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (crypto.getRandomValues(new Uint8Array(1))[0] & 15) >> (c === 'x' ? 0 : 3);
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
};

interface InvestidorForm {
  id: string;
  tipo: 'pessoa_fisica' | 'pessoa_juridica' | 'institucional';
  cnpj_cpf: string;
  
  // Status do check na base
  status_check: 'idle' | 'loading' | 'compliance_ok' | 'compliance_expirado' | 'novo';
  investidor_existente_id?: string;
  nome_existente?: string;
  link_onboarding?: string;
  token_onboarding?: string;
}

const ONBOARDING_BASE_URL = 'http://100.91.53.76:8084/onboarding';

export default function CadastroInvestidoresEmissaoPage() {
  const { emissaoId } = useParams<{ emissaoId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [emissao, setEmissao] = useState<any>(null);
  const [investidores, setInvestidores] = useState<InvestidorForm[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (emissaoId) {
      buscarEmissao();
    }
  }, [emissaoId]);

  const buscarEmissao = async () => {
    try {
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
      status_check: 'idle',
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

  const atualizarInvestidor = (id: string, campo: string, valor: any) => {
    setInvestidores(prev => prev.map(i => 
      i.id === id ? { ...i, [campo]: valor } : i
    ));
  };

  const formatarCpfCnpj = (valor: string) => {
    const numeros = valor.replace(/\D/g, '');
    if (numeros.length <= 11) {
      // CPF: 000.000.000-00
      return numeros
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    } else {
      // CNPJ: 00.000.000/0000-00
      return numeros
        .replace(/(\d{2})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1/$2')
        .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
    }
  };

  const verificarCompliance = async (id: string, cnpjCpf: string) => {
    const numeros = cnpjCpf.replace(/\D/g, '');
    if (numeros.length < 11) return;
    
    atualizarInvestidor(id, 'status_check', 'loading');

    try {
      // Verificar se investidor existe na base
      const { data: investidor, error } = await supabase
        .from('investidores')
        .select('id, nome, status_onboarding, atualizado_em')
        .eq('cpf_cnpj', numeros)
        .maybeSingle();
      
      if (error) throw error;
      
      if (investidor) {
        // Verificar se compliance está válido (menos de 1 ano)
        const ultimaAtualizacao = new Date(investidor.atualizado_em);
        const umAnoAtras = new Date();
        umAnoAtras.setFullYear(umAnoAtras.getFullYear() - 1);
        
        const complianceValido = investidor.status_onboarding === 'completo' && 
                                  ultimaAtualizacao > umAnoAtras;
        
        setInvestidores(prev => prev.map(i => 
          i.id === id ? { 
            ...i, 
            status_check: complianceValido ? 'compliance_ok' : 'compliance_expirado',
            investidor_existente_id: investidor.id,
            nome_existente: investidor.nome,
          } : i
        ));
        
        if (complianceValido) {
          toast.success('✓ Compliance válido encontrado!');
        } else {
          toast.warning('Compliance expirado. Investidor precisará atualizar.');
        }
      } else {
        setInvestidores(prev => prev.map(i => 
          i.id === id ? { 
            ...i, 
            status_check: 'novo',
          } : i
        ));
        toast.info('Novo investidor. Precisará preencher compliance.');
      }
    } catch (err) {
      console.error('Erro ao verificar compliance:', err);
      atualizarInvestidor(id, 'status_check', 'idle');
      toast.error('Erro ao verificar compliance');
    }
  };

  const gerarLinkOnboarding = (investidorFormId: string, tipo: string, cnpjCpf: string) => {
    const token = generateUUID();
    const tipoParam = tipo === 'pessoa_fisica' ? 'pf' : tipo === 'pessoa_juridica' ? 'pj' : 'institucional';
    const link = `${ONBOARDING_BASE_URL}/${token}?tipo=${tipoParam}&cpf_cnpj=${cnpjCpf.replace(/\D/g, '')}&emissao=${emissaoId}`;
    
    setInvestidores(prev => prev.map(i => 
      i.id === investidorFormId ? { 
        ...i, 
        link_onboarding: link,
        token_onboarding: token,
      } : i
    ));
    
    return { link, token };
  };

  const copiarLink = async (id: string, link: string) => {
    await navigator.clipboard.writeText(link);
    setCopiedId(id);
    toast.success('Link copiado!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    
    try {
      // Gerar links para quem precisa de compliance
      const investidoresComLink = investidores.map(inv => {
        if (inv.status_check === 'compliance_ok') {
          return inv; // Não precisa de link
        }
        
        const { link, token } = gerarLinkOnboarding(inv.id, inv.tipo, inv.cnpj_cpf);
        return { ...inv, link_onboarding: link, token_onboarding: token };
      });

      // Criar vínculos na base
      for (const inv of investidoresComLink) {
        const cnpjLimpo = inv.cnpj_cpf.replace(/\D/g, '');
        
        // Criar registro de vínculo investidor-emissão
        const { error } = await supabase
          .from('investidor_emissao')
          .insert({
            emissao_id: emissaoId,
            cnpj_cpf: cnpjLimpo,
            tipo: inv.tipo,
            status: inv.status_check === 'compliance_ok' ? 'compliance_ok' : 'aguardando_compliance',
            token_onboarding: inv.token_onboarding,
          });
        
        if (error) {
          console.error('Erro ao criar vínculo:', error);
        }
      }

      setInvestidores(investidoresComLink);
      setCurrentStep(2); // Vai pro step de confirmação com os links
      toast.success('Investidores vinculados à emissão!');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao processar');
    } finally {
      setSubmitting(false);
    }
  };

  const canProceed = () => {
    return investidores.every(inv => 
      inv.cnpj_cpf.replace(/\D/g, '').length >= 11 && 
      inv.status_check !== 'idle' &&
      inv.status_check !== 'loading'
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
      <div className="max-w-3xl mx-auto">
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
            {['Quantidade', 'CPF/CNPJ', 'Confirmação'].map((step, index) => (
              <div key={step} className="flex items-center">
                <div className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${
                  index === currentStep ? 'bg-blue-600 text-white' : 
                  index < currentStep ? 'bg-green-100 text-green-700' : 
                  'bg-slate-200 text-slate-500'
                }`}>
                  {index < currentStep ? <CheckCircle className="h-4 w-4" /> : null}
                  <span className="text-sm font-medium">{step}</span>
                </div>
                {index < 2 && <div className="w-8 h-0.5 bg-slate-300 mx-2" />}
              </div>
            ))}
          </div>
        </div>

        {/* Conteúdo */}
        <AnimatePresence mode="wait">
          {/* Step 0: Quantidade */}
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
                    {[1, 2, 3].map(qtd => (
                      <Button 
                        key={qtd}
                        variant="outline" 
                        size="lg"
                        onClick={() => {
                          setInvestidores([]);
                          for (let i = 0; i < qtd; i++) adicionarInvestidor();
                        }}
                        className={investidores.length === qtd ? 'border-blue-500 bg-blue-50' : ''}
                      >
                        <Users className="h-5 w-5 mr-2" />
                        {qtd} Investidor{qtd > 1 ? 'es' : ''}
                      </Button>
                    ))}
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

          {/* Step 1: CPF/CNPJ de cada investidor */}
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
                          className="text-red-500 hover:text-red-700"
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

                    {/* CPF/CNPJ */}
                    <div className="space-y-2">
                      <Label>CPF/CNPJ *</Label>
                      <div className="flex gap-2">
                        <Input 
                          value={inv.cnpj_cpf} 
                          onChange={(e) => {
                            const formatted = formatarCpfCnpj(e.target.value);
                            atualizarInvestidor(inv.id, 'cnpj_cpf', formatted);
                            atualizarInvestidor(inv.id, 'status_check', 'idle');
                          }}
                          onBlur={() => verificarCompliance(inv.id, inv.cnpj_cpf)}
                          placeholder={inv.tipo === 'pessoa_fisica' ? '000.000.000-00' : '00.000.000/0000-00'}
                          className={
                            inv.status_check === 'compliance_ok' ? 'border-green-500 bg-green-50' :
                            inv.status_check === 'compliance_expirado' ? 'border-amber-500 bg-amber-50' :
                            inv.status_check === 'novo' ? 'border-blue-500 bg-blue-50' : ''
                          }
                          maxLength={18}
                        />
                        {inv.status_check === 'loading' && (
                          <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                        )}
                      </div>
                      
                      {/* Status do compliance */}
                      {inv.status_check === 'compliance_ok' && (
                        <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-2 rounded">
                          <CheckCircle className="h-4 w-4" />
                          <span>Compliance válido! {inv.nome_existente && `(${inv.nome_existente})`}</span>
                        </div>
                      )}
                      {inv.status_check === 'compliance_expirado' && (
                        <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 p-2 rounded">
                          <AlertCircle className="h-4 w-4" />
                          <span>Compliance expirado. Investidor precisará atualizar os dados.</span>
                        </div>
                      )}
                      {inv.status_check === 'novo' && (
                        <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 p-2 rounded">
                          <User className="h-4 w-4" />
                          <span>Novo investidor. Será gerado um link para preenchimento do compliance.</span>
                        </div>
                      )}
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

          {/* Step 2: Confirmação com links */}
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
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Investidores Vinculados
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {investidores.map((inv, index) => (
                    <div 
                      key={inv.id} 
                      className={`p-4 rounded-lg border ${
                        inv.status_check === 'compliance_ok' 
                          ? 'bg-green-50 border-green-200' 
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Investidor {index + 1}</span>
                          <Badge variant={inv.status_check === 'compliance_ok' ? 'default' : 'secondary'}>
                            {inv.tipo === 'pessoa_fisica' ? 'PF' : inv.tipo === 'pessoa_juridica' ? 'PJ' : 'Institucional'}
                          </Badge>
                        </div>
                        <Badge 
                          variant={inv.status_check === 'compliance_ok' ? 'default' : 'outline'}
                          className={inv.status_check === 'compliance_ok' ? 'bg-green-600' : ''}
                        >
                          {inv.status_check === 'compliance_ok' ? '✓ Compliance OK' : 'Aguardando Compliance'}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-slate-600 font-mono">{inv.cnpj_cpf}</p>
                      {inv.nome_existente && (
                        <p className="text-sm text-slate-500">{inv.nome_existente}</p>
                      )}
                      
                      {/* Link de onboarding */}
                      {inv.link_onboarding && (
                        <div className="mt-3 p-3 bg-white rounded border">
                          <Label className="text-xs text-slate-500 mb-1 block">Link para Compliance:</Label>
                          <div className="flex items-center gap-2">
                            <Input 
                              value={inv.link_onboarding} 
                              readOnly 
                              className="text-xs font-mono flex-1"
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copiarLink(inv.id, inv.link_onboarding!)}
                            >
                              {copiedId === inv.id ? (
                                <Check className="h-4 w-4 text-green-600" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(inv.link_onboarding, '_blank')}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </div>
                          <p className="text-xs text-slate-400 mt-1">
                            Envie este link para o investidor preencher os formulários de compliance.
                          </p>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Resumo */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                    <p className="font-medium text-blue-800">Próximos passos:</p>
                    <ul className="text-sm text-blue-700 mt-2 space-y-1">
                      <li>• Investidores com compliance válido já estão prontos para a emissão.</li>
                      <li>• Para os demais, envie o link de compliance para preenchimento.</li>
                      <li>• O time de compliance analisará e aprovará antes da integralização.</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-center mt-6">
                <Button onClick={() => navigate('/')} className="bg-green-600 hover:bg-green-700">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Concluir
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navegação */}
        {currentStep < 2 && (
          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Anterior
            </Button>

            {currentStep === 0 ? (
              <Button
                onClick={() => setCurrentStep(1)}
                disabled={investidores.length === 0}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Próximo
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!canProceed() || submitting}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    Confirmar
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
