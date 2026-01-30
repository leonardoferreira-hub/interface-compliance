import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Building2, Users, FileText, Upload, CheckCircle, 
  ChevronRight, ChevronLeft, AlertCircle, Loader2, ArrowLeft
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Steps do wizard
const STEPS = [
  { id: 'identificacao', label: 'Identificação', icon: User },
  { id: 'dados', label: 'Ficha Cadastral', icon: FileText },
  { id: 'suitability', label: 'Suitability', icon: CheckCircle },
  { id: 'documentos', label: 'Documentos', icon: Upload },
];

type TipoInvestidor = 'pf' | 'pj' | 'institucional';

export default function OnboardingPage() {
  const { token } = useParams<{ token: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Step 0: Identificação
  const [tipo, setTipo] = useState<TipoInvestidor>('pf');
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [checkStatus, setCheckStatus] = useState<'idle' | 'loading' | 'ok' | 'not_found' | 'expired'>('idle');
  const [investidorExistente, setInvestidorExistente] = useState<any>(null);
  
  // Step 1: Ficha Cadastral - PF
  const [dadosPF, setDadosPF] = useState({
    nome_completo: '',
    data_nascimento: '',
    nacionalidade: 'Brasileira',
    estado_civil: '',
    profissao: '',
    rg: '',
    orgao_emissor: '',
    email: '',
    telefone: '',
    // Endereço
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
    // Financeiro
    renda_mensal: '',
    patrimonio_total: '',
    origem_recursos: '',
  });
  
  // Step 1: Ficha Cadastral - PJ
  const [dadosPJ, setDadosPJ] = useState({
    razao_social: '',
    nome_fantasia: '',
    data_constituicao: '',
    inscricao_estadual: '',
    inscricao_municipal: '',
    atividade_principal: '',
    email: '',
    telefone: '',
    // Endereço
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
    // Representante Legal
    rep_nome: '',
    rep_cpf: '',
    rep_cargo: '',
    rep_email: '',
    rep_telefone: '',
    // Financeiro
    faturamento_anual: '',
    patrimonio_liquido: '',
    origem_recursos: '',
  });
  
  // Step 1: Ficha Cadastral - Institucional
  const [dadosInstitucional, setDadosInstitucional] = useState({
    razao_social: '',
    tipo_instituicao: '', // Fundo, Asset, Family Office, etc
    cnpj: '',
    cvm_registro: '',
    anbima_registro: '',
    email: '',
    telefone: '',
    // Endereço
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
    // Gestor/Administrador
    gestor_nome: '',
    gestor_cnpj: '',
    administrador_nome: '',
    administrador_cnpj: '',
    // Representante
    rep_nome: '',
    rep_cpf: '',
    rep_cargo: '',
    rep_email: '',
    // Financeiro
    patrimonio_liquido: '',
    origem_recursos: '',
  });
  
  // Step 2: Suitability
  const [suitability, setSuitability] = useState({
    q1_experiencia: '',
    q2_tempo_investindo: '',
    q3_conhecimento_rf: '',
    q4_conhecimento_rv: '',
    q5_conhecimento_derivativos: '',
    q6_percentual_patrimonio: '',
    q7_horizonte_investimento: '',
    q8_objetivo_principal: '',
    q9_tolerancia_perda: '',
    q10_reacao_queda: '',
    q11_necessidade_liquidez: '',
    q12_ja_investiu_credito_privado: '',
  });
  
  // Step 3: Documentos
  const [documentos, setDocumentos] = useState<{
    doc_identificacao?: File;
    comprovante_residencia?: File;
    comprovante_renda?: File;
    contrato_social?: File;
    procuracao?: File;
    outros?: File[];
  }>({});

  // Formatar CPF/CNPJ
  const formatarCpfCnpj = (valor: string) => {
    const numeros = valor.replace(/\D/g, '');
    if (numeros.length <= 11) {
      return numeros
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    } else {
      return numeros
        .replace(/(\d{2})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1/$2')
        .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
    }
  };

  // Verificar se investidor existe na base
  const verificarInvestidor = async () => {
    const numeros = cpfCnpj.replace(/\D/g, '');
    if (numeros.length < 11) {
      toast.error('CPF/CNPJ inválido');
      return;
    }
    
    setCheckStatus('loading');
    
    try {
      const { data, error } = await supabase
        .from('investidores')
        .select('*')
        .eq('cpf_cnpj', numeros)
        .maybeSingle();
      
      if (error) throw error;
      
      if (data) {
        // Verificar se compliance está válido (menos de 1 ano)
        const ultimaAtualizacao = new Date(data.atualizado_em || data.criado_em);
        const umAnoAtras = new Date();
        umAnoAtras.setFullYear(umAnoAtras.getFullYear() - 1);
        
        const complianceValido = data.status_onboarding === 'completo' && ultimaAtualizacao > umAnoAtras;
        
        if (complianceValido) {
          setCheckStatus('ok');
          setInvestidorExistente(data);
          toast.success('Compliance válido encontrado!');
        } else {
          setCheckStatus('expired');
          setInvestidorExistente(data);
          toast.warning('Compliance expirado. Por favor, atualize seus dados.');
        }
      } else {
        setCheckStatus('not_found');
        toast.info('Novo cadastro. Por favor, preencha seus dados.');
      }
    } catch (err) {
      console.error('Erro ao verificar:', err);
      setCheckStatus('idle');
      toast.error('Erro ao verificar. Tente novamente.');
    }
  };

  // Avançar step
  const handleNext = async () => {
    if (currentStep === 0) {
      // Verificar se precisa fazer compliance
      if (checkStatus === 'ok') {
        // Compliance OK - registrar vínculo e mostrar sucesso
        await registrarVinculoEmissao('compliance_ok');
        return;
      }
      
      if (checkStatus === 'idle' || checkStatus === 'loading') {
        toast.error('Por favor, verifique o CPF/CNPJ primeiro');
        return;
      }
    }
    
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  // Voltar step
  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Registrar vínculo com a emissão
  const registrarVinculoEmissao = async (status: string, investidorId?: string) => {
    try {
      // Pegar emissaoId do query param (com fallback para window.location)
      let emissaoId = searchParams.get('emissao');
      
      // Fallback: tentar pegar direto da URL
      if (!emissaoId) {
        const urlParams = new URLSearchParams(window.location.search);
        emissaoId = urlParams.get('emissao');
      }
      
      console.log('🔍 emissaoId capturado:', emissaoId, 'URL:', window.location.href);
      
      if (!emissaoId) {
        console.warn('⚠️ emissaoId não encontrado no query param');
        return;
      }
      
      console.log('🔗 Registrando vínculo:', { emissaoId, cpfCnpj, status, investidorId });
      
      // Usar RPC para criar vínculo
      const { data, error } = await supabase.rpc('vincular_investidor_pos_cadastro', {
        p_emissao_id: emissaoId,
        p_investidor_id: investidorId || investidorExistente?.id || null,
        p_cpf_cnpj: cpfCnpj.replace(/\D/g, ''),
      });
      
      if (error) {
        console.error('Erro no RPC vincular_investidor_pos_cadastro:', error);
      } else {
        console.log('✅ Vínculo criado:', data);
      }
      
      // Atualizar status se necessário
      if (data?.id) {
        await supabase
          .from('investidor_emissao')
          .update({ status: status })
          .eq('id', data.id);
      }
      
      if (status === 'compliance_ok') {
        toast.success('Cadastro confirmado! Compliance válido.');
        navigate('/obrigado?status=ok');
      }
    } catch (err) {
      console.error('Erro ao registrar vínculo:', err);
    }
  };

  // Submeter formulário completo
  const handleSubmit = async () => {
    setSubmitting(true);
    
    try {
      const numeros = cpfCnpj.replace(/\D/g, '');
      
      // Montar dados baseado no tipo
      let dadosCadastrais = {};
      if (tipo === 'pf') {
        dadosCadastrais = dadosPF;
      } else if (tipo === 'pj') {
        dadosCadastrais = dadosPJ;
      } else {
        dadosCadastrais = dadosInstitucional;
      }
      
      // Criar ou atualizar investidor
      const investidorData = {
        cpf_cnpj: numeros,
        tipo: tipo === 'pf' ? 'pessoa_fisica' : tipo === 'pj' ? 'pessoa_juridica' : 'institucional',
        nome: tipo === 'pf' ? dadosPF.nome_completo : tipo === 'pj' ? dadosPJ.razao_social : dadosInstitucional.razao_social,
        email: tipo === 'pf' ? dadosPF.email : tipo === 'pj' ? dadosPJ.email : dadosInstitucional.email,
        telefone: tipo === 'pf' ? dadosPF.telefone : tipo === 'pj' ? dadosPJ.telefone : dadosInstitucional.telefone,
        kyc_json: dadosCadastrais,
        suitability_json: suitability,
        status_onboarding: 'em_analise',
        token_acesso: token,
      };
      
      // Usar RPC para contornar limitação de view
      const { data: investidor, error } = await supabase
        .rpc('upsert_investidor', {
          p_cpf_cnpj: investidorData.cpf_cnpj,
          p_nome: investidorData.nome,
          p_email: investidorData.email || null,
          p_telefone: investidorData.telefone || null,
          p_tipo: investidorData.tipo,
          p_tipo_investidor: 'varejo',
          p_status_onboarding: investidorData.status_onboarding,
          p_kyc_json: investidorData.kyc_json,
          p_suitability_json: investidorData.suitability_json,
          p_perfil_risco: null,
          p_token_acesso: investidorData.token_acesso,
        });
      
      if (error) throw error;
      
      // Cast para garantir tipagem
      const investidorResult = investidor as unknown as { id: string } | null;
      
      console.log('✅ Investidor criado:', investidorResult);
      console.log('📋 Query params - emissao:', searchParams.get('emissao'));
      
      // Upload de documentos
      if (Object.keys(documentos).length > 0 && investidorResult?.id) {
        for (const [tipo, arquivo] of Object.entries(documentos)) {
          if (arquivo && arquivo instanceof File) {
            const path = `investidores/${numeros}/${tipo}_${Date.now()}`;
            await supabase.storage.from('documentos').upload(path, arquivo);
            
            // Registrar documento
            await supabase.from('investidor_documentos').insert({
              investidor_id: investidorResult!.id,
              tipo_documento: tipo,
              arquivo_path: path,
              status: 'pendente',
            });
          }
        }
      }
      
      // Registrar vínculo com emissão (passando o ID do investidor criado)
      await registrarVinculoEmissao('em_analise', investidorResult?.id);
      
      toast.success('Cadastro enviado para análise!');
      navigate('/obrigado?status=analise');
      
    } catch (err: any) {
      console.error('Erro ao submeter:', err);
      toast.error(err.message || 'Erro ao enviar cadastro');
    } finally {
      setSubmitting(false);
    }
  };

  // Render Step 0: Identificação
  const renderIdentificacao = () => (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Identificação</CardTitle>
        <CardDescription>
          Informe seu CPF ou CNPJ para verificar se já possui cadastro.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Tipo */}
        <div className="space-y-3">
          <Label>Tipo de Investidor</Label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: 'pf', label: 'Pessoa Física', icon: User },
              { value: 'pj', label: 'Pessoa Jurídica', icon: Building2 },
              { value: 'institucional', label: 'Institucional', icon: Users },
            ].map((opcao) => {
              const Icon = opcao.icon;
              return (
                <Button
                  key={opcao.value}
                  type="button"
                  variant={tipo === opcao.value ? 'default' : 'outline'}
                  className="h-auto py-4 flex-col gap-2"
                  onClick={() => {
                    setTipo(opcao.value as TipoInvestidor);
                    setCheckStatus('idle');
                  }}
                >
                  <Icon className="h-6 w-6" />
                  <span className="text-sm">{opcao.label}</span>
                </Button>
              );
            })}
          </div>
        </div>

        {/* CPF/CNPJ */}
        <div className="space-y-2">
          <Label>{tipo === 'pf' ? 'CPF' : 'CNPJ'} *</Label>
          <div className="flex gap-2">
            <Input 
              value={cpfCnpj}
              onChange={(e) => {
                setCpfCnpj(formatarCpfCnpj(e.target.value));
                setCheckStatus('idle');
              }}
              placeholder={tipo === 'pf' ? '000.000.000-00' : '00.000.000/0000-00'}
              maxLength={tipo === 'pf' ? 14 : 18}
              className={`text-lg ${
                checkStatus === 'ok' ? 'border-green-500 bg-green-50' :
                checkStatus === 'expired' ? 'border-amber-500 bg-amber-50' :
                checkStatus === 'not_found' ? 'border-blue-500 bg-blue-50' : ''
              }`}
            />
            <Button 
              onClick={verificarInvestidor}
              disabled={checkStatus === 'loading' || cpfCnpj.replace(/\D/g, '').length < 11}
            >
              {checkStatus === 'loading' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Verificar'
              )}
            </Button>
          </div>
        </div>

        {/* Status */}
        {checkStatus === 'ok' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-green-50 border border-green-200 rounded-lg"
          >
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-green-800">Compliance Válido!</p>
                <p className="text-sm text-green-700 mt-1">
                  {investidorExistente?.nome}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  Último update: {new Date(investidorExistente?.atualizado_em).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {checkStatus === 'expired' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-amber-50 border border-amber-200 rounded-lg"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <p className="font-medium text-amber-800">Compliance Expirado</p>
                <p className="text-sm text-amber-700 mt-1">
                  Seu cadastro está desatualizado (mais de 1 ano). Por favor, atualize seus dados.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {checkStatus === 'not_found' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-blue-50 border border-blue-200 rounded-lg"
          >
            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-blue-800">Novo Cadastro</p>
                <p className="text-sm text-blue-700 mt-1">
                  Não encontramos seu cadastro. Clique em "Próximo" para preencher seus dados.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );

  // Render Step 1: Ficha Cadastral PF
  const renderFichaPF = () => (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Ficha Cadastral - Pessoa Física</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Dados Pessoais */}
        <div className="space-y-4">
          <h3 className="font-medium text-slate-700 border-b pb-2">Dados Pessoais</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <Label>Nome Completo *</Label>
              <Input 
                value={dadosPF.nome_completo}
                onChange={(e) => setDadosPF({...dadosPF, nome_completo: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Data de Nascimento *</Label>
              <Input 
                type="date"
                value={dadosPF.data_nascimento}
                onChange={(e) => setDadosPF({...dadosPF, data_nascimento: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Nacionalidade</Label>
              <Input 
                value={dadosPF.nacionalidade}
                onChange={(e) => setDadosPF({...dadosPF, nacionalidade: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Estado Civil</Label>
              <Select value={dadosPF.estado_civil} onValueChange={(v) => setDadosPF({...dadosPF, estado_civil: v})}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="solteiro">Solteiro(a)</SelectItem>
                  <SelectItem value="casado">Casado(a)</SelectItem>
                  <SelectItem value="divorciado">Divorciado(a)</SelectItem>
                  <SelectItem value="viuvo">Viúvo(a)</SelectItem>
                  <SelectItem value="uniao_estavel">União Estável</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Profissão *</Label>
              <Input 
                value={dadosPF.profissao}
                onChange={(e) => setDadosPF({...dadosPF, profissao: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>RG *</Label>
              <Input 
                value={dadosPF.rg}
                onChange={(e) => setDadosPF({...dadosPF, rg: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Órgão Emissor</Label>
              <Input 
                value={dadosPF.orgao_emissor}
                onChange={(e) => setDadosPF({...dadosPF, orgao_emissor: e.target.value})}
                placeholder="SSP/SP"
              />
            </div>
          </div>
        </div>

        {/* Contato */}
        <div className="space-y-4">
          <h3 className="font-medium text-slate-700 border-b pb-2">Contato</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input 
                type="email"
                value={dadosPF.email}
                onChange={(e) => setDadosPF({...dadosPF, email: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Telefone *</Label>
              <Input 
                value={dadosPF.telefone}
                onChange={(e) => setDadosPF({...dadosPF, telefone: e.target.value})}
                placeholder="(00) 00000-0000"
              />
            </div>
          </div>
        </div>

        {/* Endereço */}
        <div className="space-y-4">
          <h3 className="font-medium text-slate-700 border-b pb-2">Endereço</h3>
          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>CEP *</Label>
              <Input 
                value={dadosPF.cep}
                onChange={(e) => setDadosPF({...dadosPF, cep: e.target.value})}
                placeholder="00000-000"
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Logradouro *</Label>
              <Input 
                value={dadosPF.logradouro}
                onChange={(e) => setDadosPF({...dadosPF, logradouro: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Número *</Label>
              <Input 
                value={dadosPF.numero}
                onChange={(e) => setDadosPF({...dadosPF, numero: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Complemento</Label>
              <Input 
                value={dadosPF.complemento}
                onChange={(e) => setDadosPF({...dadosPF, complemento: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Bairro *</Label>
              <Input 
                value={dadosPF.bairro}
                onChange={(e) => setDadosPF({...dadosPF, bairro: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Cidade *</Label>
              <Input 
                value={dadosPF.cidade}
                onChange={(e) => setDadosPF({...dadosPF, cidade: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Estado *</Label>
              <Select value={dadosPF.estado} onValueChange={(v) => setDadosPF({...dadosPF, estado: v})}>
                <SelectTrigger><SelectValue placeholder="UF" /></SelectTrigger>
                <SelectContent>
                  {['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'].map(uf => (
                    <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Informações Financeiras */}
        <div className="space-y-4">
          <h3 className="font-medium text-slate-700 border-b pb-2">Informações Financeiras</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Renda Mensal *</Label>
              <Select value={dadosPF.renda_mensal} onValueChange={(v) => setDadosPF({...dadosPF, renda_mensal: v})}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ate_5k">Até R$ 5.000</SelectItem>
                  <SelectItem value="5k_10k">R$ 5.000 a R$ 10.000</SelectItem>
                  <SelectItem value="10k_20k">R$ 10.000 a R$ 20.000</SelectItem>
                  <SelectItem value="20k_50k">R$ 20.000 a R$ 50.000</SelectItem>
                  <SelectItem value="acima_50k">Acima de R$ 50.000</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Patrimônio Total *</Label>
              <Select value={dadosPF.patrimonio_total} onValueChange={(v) => setDadosPF({...dadosPF, patrimonio_total: v})}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ate_100k">Até R$ 100.000</SelectItem>
                  <SelectItem value="100k_500k">R$ 100.000 a R$ 500.000</SelectItem>
                  <SelectItem value="500k_1m">R$ 500.000 a R$ 1.000.000</SelectItem>
                  <SelectItem value="1m_5m">R$ 1.000.000 a R$ 5.000.000</SelectItem>
                  <SelectItem value="acima_5m">Acima de R$ 5.000.000</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Origem dos Recursos *</Label>
              <Textarea 
                value={dadosPF.origem_recursos}
                onChange={(e) => setDadosPF({...dadosPF, origem_recursos: e.target.value})}
                placeholder="Descreva a origem dos recursos (salário, herança, venda de imóvel, etc.)"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Render Step 1: Ficha Cadastral PJ
  const renderFichaPJ = () => (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Ficha Cadastral - Pessoa Jurídica</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Dados da Empresa */}
        <div className="space-y-4">
          <h3 className="font-medium text-slate-700 border-b pb-2">Dados da Empresa</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <Label>Razão Social *</Label>
              <Input 
                value={dadosPJ.razao_social}
                onChange={(e) => setDadosPJ({...dadosPJ, razao_social: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Nome Fantasia</Label>
              <Input 
                value={dadosPJ.nome_fantasia}
                onChange={(e) => setDadosPJ({...dadosPJ, nome_fantasia: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Data de Constituição *</Label>
              <Input 
                type="date"
                value={dadosPJ.data_constituicao}
                onChange={(e) => setDadosPJ({...dadosPJ, data_constituicao: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Inscrição Estadual</Label>
              <Input 
                value={dadosPJ.inscricao_estadual}
                onChange={(e) => setDadosPJ({...dadosPJ, inscricao_estadual: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Inscrição Municipal</Label>
              <Input 
                value={dadosPJ.inscricao_municipal}
                onChange={(e) => setDadosPJ({...dadosPJ, inscricao_municipal: e.target.value})}
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Atividade Principal *</Label>
              <Input 
                value={dadosPJ.atividade_principal}
                onChange={(e) => setDadosPJ({...dadosPJ, atividade_principal: e.target.value})}
              />
            </div>
          </div>
        </div>

        {/* Contato */}
        <div className="space-y-4">
          <h3 className="font-medium text-slate-700 border-b pb-2">Contato</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input 
                type="email"
                value={dadosPJ.email}
                onChange={(e) => setDadosPJ({...dadosPJ, email: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Telefone *</Label>
              <Input 
                value={dadosPJ.telefone}
                onChange={(e) => setDadosPJ({...dadosPJ, telefone: e.target.value})}
              />
            </div>
          </div>
        </div>

        {/* Endereço */}
        <div className="space-y-4">
          <h3 className="font-medium text-slate-700 border-b pb-2">Endereço</h3>
          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>CEP *</Label>
              <Input 
                value={dadosPJ.cep}
                onChange={(e) => setDadosPJ({...dadosPJ, cep: e.target.value})}
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Logradouro *</Label>
              <Input 
                value={dadosPJ.logradouro}
                onChange={(e) => setDadosPJ({...dadosPJ, logradouro: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Número *</Label>
              <Input 
                value={dadosPJ.numero}
                onChange={(e) => setDadosPJ({...dadosPJ, numero: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Complemento</Label>
              <Input 
                value={dadosPJ.complemento}
                onChange={(e) => setDadosPJ({...dadosPJ, complemento: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Bairro *</Label>
              <Input 
                value={dadosPJ.bairro}
                onChange={(e) => setDadosPJ({...dadosPJ, bairro: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Cidade *</Label>
              <Input 
                value={dadosPJ.cidade}
                onChange={(e) => setDadosPJ({...dadosPJ, cidade: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Estado *</Label>
              <Select value={dadosPJ.estado} onValueChange={(v) => setDadosPJ({...dadosPJ, estado: v})}>
                <SelectTrigger><SelectValue placeholder="UF" /></SelectTrigger>
                <SelectContent>
                  {['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'].map(uf => (
                    <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Representante Legal */}
        <div className="space-y-4">
          <h3 className="font-medium text-slate-700 border-b pb-2">Representante Legal</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome Completo *</Label>
              <Input 
                value={dadosPJ.rep_nome}
                onChange={(e) => setDadosPJ({...dadosPJ, rep_nome: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>CPF *</Label>
              <Input 
                value={dadosPJ.rep_cpf}
                onChange={(e) => setDadosPJ({...dadosPJ, rep_cpf: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Cargo *</Label>
              <Input 
                value={dadosPJ.rep_cargo}
                onChange={(e) => setDadosPJ({...dadosPJ, rep_cargo: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input 
                type="email"
                value={dadosPJ.rep_email}
                onChange={(e) => setDadosPJ({...dadosPJ, rep_email: e.target.value})}
              />
            </div>
          </div>
        </div>

        {/* Informações Financeiras */}
        <div className="space-y-4">
          <h3 className="font-medium text-slate-700 border-b pb-2">Informações Financeiras</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Faturamento Anual *</Label>
              <Select value={dadosPJ.faturamento_anual} onValueChange={(v) => setDadosPJ({...dadosPJ, faturamento_anual: v})}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ate_1m">Até R$ 1.000.000</SelectItem>
                  <SelectItem value="1m_10m">R$ 1.000.000 a R$ 10.000.000</SelectItem>
                  <SelectItem value="10m_50m">R$ 10.000.000 a R$ 50.000.000</SelectItem>
                  <SelectItem value="50m_100m">R$ 50.000.000 a R$ 100.000.000</SelectItem>
                  <SelectItem value="acima_100m">Acima de R$ 100.000.000</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Patrimônio Líquido *</Label>
              <Select value={dadosPJ.patrimonio_liquido} onValueChange={(v) => setDadosPJ({...dadosPJ, patrimonio_liquido: v})}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ate_1m">Até R$ 1.000.000</SelectItem>
                  <SelectItem value="1m_10m">R$ 1.000.000 a R$ 10.000.000</SelectItem>
                  <SelectItem value="10m_50m">R$ 10.000.000 a R$ 50.000.000</SelectItem>
                  <SelectItem value="acima_50m">Acima de R$ 50.000.000</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Origem dos Recursos *</Label>
              <Textarea 
                value={dadosPJ.origem_recursos}
                onChange={(e) => setDadosPJ({...dadosPJ, origem_recursos: e.target.value})}
                placeholder="Descreva a origem dos recursos"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Render Step 1: Ficha Cadastral Institucional
  const renderFichaInstitucional = () => (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Ficha Cadastral - Investidor Institucional</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Dados da Instituição */}
        <div className="space-y-4">
          <h3 className="font-medium text-slate-700 border-b pb-2">Dados da Instituição</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <Label>Razão Social *</Label>
              <Input 
                value={dadosInstitucional.razao_social}
                onChange={(e) => setDadosInstitucional({...dadosInstitucional, razao_social: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo de Instituição *</Label>
              <Select value={dadosInstitucional.tipo_instituicao} onValueChange={(v) => setDadosInstitucional({...dadosInstitucional, tipo_instituicao: v})}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="fundo_investimento">Fundo de Investimento</SelectItem>
                  <SelectItem value="asset_management">Asset Management</SelectItem>
                  <SelectItem value="family_office">Family Office</SelectItem>
                  <SelectItem value="banco">Banco</SelectItem>
                  <SelectItem value="seguradora">Seguradora</SelectItem>
                  <SelectItem value="previdencia">Entidade de Previdência</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Registro CVM</Label>
              <Input 
                value={dadosInstitucional.cvm_registro}
                onChange={(e) => setDadosInstitucional({...dadosInstitucional, cvm_registro: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Registro ANBIMA</Label>
              <Input 
                value={dadosInstitucional.anbima_registro}
                onChange={(e) => setDadosInstitucional({...dadosInstitucional, anbima_registro: e.target.value})}
              />
            </div>
          </div>
        </div>

        {/* Contato */}
        <div className="space-y-4">
          <h3 className="font-medium text-slate-700 border-b pb-2">Contato</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input 
                type="email"
                value={dadosInstitucional.email}
                onChange={(e) => setDadosInstitucional({...dadosInstitucional, email: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Telefone *</Label>
              <Input 
                value={dadosInstitucional.telefone}
                onChange={(e) => setDadosInstitucional({...dadosInstitucional, telefone: e.target.value})}
              />
            </div>
          </div>
        </div>

        {/* Endereço */}
        <div className="space-y-4">
          <h3 className="font-medium text-slate-700 border-b pb-2">Endereço</h3>
          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>CEP *</Label>
              <Input 
                value={dadosInstitucional.cep}
                onChange={(e) => setDadosInstitucional({...dadosInstitucional, cep: e.target.value})}
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Logradouro *</Label>
              <Input 
                value={dadosInstitucional.logradouro}
                onChange={(e) => setDadosInstitucional({...dadosInstitucional, logradouro: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Número *</Label>
              <Input 
                value={dadosInstitucional.numero}
                onChange={(e) => setDadosInstitucional({...dadosInstitucional, numero: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Complemento</Label>
              <Input 
                value={dadosInstitucional.complemento}
                onChange={(e) => setDadosInstitucional({...dadosInstitucional, complemento: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Bairro *</Label>
              <Input 
                value={dadosInstitucional.bairro}
                onChange={(e) => setDadosInstitucional({...dadosInstitucional, bairro: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Cidade *</Label>
              <Input 
                value={dadosInstitucional.cidade}
                onChange={(e) => setDadosInstitucional({...dadosInstitucional, cidade: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Estado *</Label>
              <Select value={dadosInstitucional.estado} onValueChange={(v) => setDadosInstitucional({...dadosInstitucional, estado: v})}>
                <SelectTrigger><SelectValue placeholder="UF" /></SelectTrigger>
                <SelectContent>
                  {['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'].map(uf => (
                    <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Gestor/Administrador */}
        <div className="space-y-4">
          <h3 className="font-medium text-slate-700 border-b pb-2">Gestor / Administrador</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome do Gestor</Label>
              <Input 
                value={dadosInstitucional.gestor_nome}
                onChange={(e) => setDadosInstitucional({...dadosInstitucional, gestor_nome: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>CNPJ do Gestor</Label>
              <Input 
                value={dadosInstitucional.gestor_cnpj}
                onChange={(e) => setDadosInstitucional({...dadosInstitucional, gestor_cnpj: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Nome do Administrador</Label>
              <Input 
                value={dadosInstitucional.administrador_nome}
                onChange={(e) => setDadosInstitucional({...dadosInstitucional, administrador_nome: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>CNPJ do Administrador</Label>
              <Input 
                value={dadosInstitucional.administrador_cnpj}
                onChange={(e) => setDadosInstitucional({...dadosInstitucional, administrador_cnpj: e.target.value})}
              />
            </div>
          </div>
        </div>

        {/* Representante */}
        <div className="space-y-4">
          <h3 className="font-medium text-slate-700 border-b pb-2">Representante</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome Completo *</Label>
              <Input 
                value={dadosInstitucional.rep_nome}
                onChange={(e) => setDadosInstitucional({...dadosInstitucional, rep_nome: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>CPF *</Label>
              <Input 
                value={dadosInstitucional.rep_cpf}
                onChange={(e) => setDadosInstitucional({...dadosInstitucional, rep_cpf: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Cargo *</Label>
              <Input 
                value={dadosInstitucional.rep_cargo}
                onChange={(e) => setDadosInstitucional({...dadosInstitucional, rep_cargo: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input 
                type="email"
                value={dadosInstitucional.rep_email}
                onChange={(e) => setDadosInstitucional({...dadosInstitucional, rep_email: e.target.value})}
              />
            </div>
          </div>
        </div>

        {/* Informações Financeiras */}
        <div className="space-y-4">
          <h3 className="font-medium text-slate-700 border-b pb-2">Informações Financeiras</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Patrimônio Líquido *</Label>
              <Select value={dadosInstitucional.patrimonio_liquido} onValueChange={(v) => setDadosInstitucional({...dadosInstitucional, patrimonio_liquido: v})}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ate_10m">Até R$ 10.000.000</SelectItem>
                  <SelectItem value="10m_50m">R$ 10.000.000 a R$ 50.000.000</SelectItem>
                  <SelectItem value="50m_100m">R$ 50.000.000 a R$ 100.000.000</SelectItem>
                  <SelectItem value="100m_500m">R$ 100.000.000 a R$ 500.000.000</SelectItem>
                  <SelectItem value="acima_500m">Acima de R$ 500.000.000</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Origem dos Recursos *</Label>
              <Textarea 
                value={dadosInstitucional.origem_recursos}
                onChange={(e) => setDadosInstitucional({...dadosInstitucional, origem_recursos: e.target.value})}
                placeholder="Descreva a origem dos recursos"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Render Step 2: Suitability
  const renderSuitability = () => (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Análise de Perfil de Investidor (Suitability)</CardTitle>
        <CardDescription>
          Responda as perguntas abaixo para determinar seu perfil de investidor.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Q1 */}
        <div className="space-y-3">
          <Label className="text-base">1. Qual sua experiência com investimentos?</Label>
          <RadioGroup value={suitability.q1_experiencia} onValueChange={(v) => setSuitability({...suitability, q1_experiencia: v})}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="nenhuma" id="q1_a" />
              <Label htmlFor="q1_a">Nenhuma experiência</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="pouca" id="q1_b" />
              <Label htmlFor="q1_b">Pouca experiência (poupança, CDB)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="moderada" id="q1_c" />
              <Label htmlFor="q1_c">Experiência moderada (fundos, ações)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="ampla" id="q1_d" />
              <Label htmlFor="q1_d">Ampla experiência (derivativos, produtos estruturados)</Label>
            </div>
          </RadioGroup>
        </div>

        {/* Q2 */}
        <div className="space-y-3">
          <Label className="text-base">2. Há quanto tempo você investe?</Label>
          <RadioGroup value={suitability.q2_tempo_investindo} onValueChange={(v) => setSuitability({...suitability, q2_tempo_investindo: v})}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="nunca" id="q2_a" />
              <Label htmlFor="q2_a">Nunca investi</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="menos_1" id="q2_b" />
              <Label htmlFor="q2_b">Menos de 1 ano</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="1_3" id="q2_c" />
              <Label htmlFor="q2_c">Entre 1 e 3 anos</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="3_5" id="q2_d" />
              <Label htmlFor="q2_d">Entre 3 e 5 anos</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="mais_5" id="q2_e" />
              <Label htmlFor="q2_e">Mais de 5 anos</Label>
            </div>
          </RadioGroup>
        </div>

        {/* Q3 */}
        <div className="space-y-3">
          <Label className="text-base">3. Qual seu conhecimento sobre Renda Fixa?</Label>
          <RadioGroup value={suitability.q3_conhecimento_rf} onValueChange={(v) => setSuitability({...suitability, q3_conhecimento_rf: v})}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="nenhum" id="q3_a" />
              <Label htmlFor="q3_a">Nenhum</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="basico" id="q3_b" />
              <Label htmlFor="q3_b">Básico</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="intermediario" id="q3_c" />
              <Label htmlFor="q3_c">Intermediário</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="avancado" id="q3_d" />
              <Label htmlFor="q3_d">Avançado</Label>
            </div>
          </RadioGroup>
        </div>

        {/* Q4 */}
        <div className="space-y-3">
          <Label className="text-base">4. Qual seu conhecimento sobre Renda Variável?</Label>
          <RadioGroup value={suitability.q4_conhecimento_rv} onValueChange={(v) => setSuitability({...suitability, q4_conhecimento_rv: v})}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="nenhum" id="q4_a" />
              <Label htmlFor="q4_a">Nenhum</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="basico" id="q4_b" />
              <Label htmlFor="q4_b">Básico</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="intermediario" id="q4_c" />
              <Label htmlFor="q4_c">Intermediário</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="avancado" id="q4_d" />
              <Label htmlFor="q4_d">Avançado</Label>
            </div>
          </RadioGroup>
        </div>

        {/* Q5 */}
        <div className="space-y-3">
          <Label className="text-base">5. Qual seu conhecimento sobre Derivativos?</Label>
          <RadioGroup value={suitability.q5_conhecimento_derivativos} onValueChange={(v) => setSuitability({...suitability, q5_conhecimento_derivativos: v})}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="nenhum" id="q5_a" />
              <Label htmlFor="q5_a">Nenhum</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="basico" id="q5_b" />
              <Label htmlFor="q5_b">Básico</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="intermediario" id="q5_c" />
              <Label htmlFor="q5_c">Intermediário</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="avancado" id="q5_d" />
              <Label htmlFor="q5_d">Avançado</Label>
            </div>
          </RadioGroup>
        </div>

        {/* Q6 */}
        <div className="space-y-3">
          <Label className="text-base">6. Qual percentual do seu patrimônio você pretende investir?</Label>
          <RadioGroup value={suitability.q6_percentual_patrimonio} onValueChange={(v) => setSuitability({...suitability, q6_percentual_patrimonio: v})}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="ate_10" id="q6_a" />
              <Label htmlFor="q6_a">Até 10%</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="10_25" id="q6_b" />
              <Label htmlFor="q6_b">Entre 10% e 25%</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="25_50" id="q6_c" />
              <Label htmlFor="q6_c">Entre 25% e 50%</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="mais_50" id="q6_d" />
              <Label htmlFor="q6_d">Mais de 50%</Label>
            </div>
          </RadioGroup>
        </div>

        {/* Q7 */}
        <div className="space-y-3">
          <Label className="text-base">7. Qual seu horizonte de investimento?</Label>
          <RadioGroup value={suitability.q7_horizonte_investimento} onValueChange={(v) => setSuitability({...suitability, q7_horizonte_investimento: v})}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="curto" id="q7_a" />
              <Label htmlFor="q7_a">Curto prazo (até 1 ano)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="medio" id="q7_b" />
              <Label htmlFor="q7_b">Médio prazo (1 a 5 anos)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="longo" id="q7_c" />
              <Label htmlFor="q7_c">Longo prazo (mais de 5 anos)</Label>
            </div>
          </RadioGroup>
        </div>

        {/* Q8 */}
        <div className="space-y-3">
          <Label className="text-base">8. Qual seu principal objetivo ao investir?</Label>
          <RadioGroup value={suitability.q8_objetivo_principal} onValueChange={(v) => setSuitability({...suitability, q8_objetivo_principal: v})}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="preservacao" id="q8_a" />
              <Label htmlFor="q8_a">Preservação de capital</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="renda" id="q8_b" />
              <Label htmlFor="q8_b">Geração de renda</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="crescimento" id="q8_c" />
              <Label htmlFor="q8_c">Crescimento de capital</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="especulacao" id="q8_d" />
              <Label htmlFor="q8_d">Especulação</Label>
            </div>
          </RadioGroup>
        </div>

        {/* Q9 */}
        <div className="space-y-3">
          <Label className="text-base">9. Qual sua tolerância a perdas?</Label>
          <RadioGroup value={suitability.q9_tolerancia_perda} onValueChange={(v) => setSuitability({...suitability, q9_tolerancia_perda: v})}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="nenhuma" id="q9_a" />
              <Label htmlFor="q9_a">Não aceito perdas</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="baixa" id="q9_b" />
              <Label htmlFor="q9_b">Aceito perdas de até 5%</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="moderada" id="q9_c" />
              <Label htmlFor="q9_c">Aceito perdas de até 15%</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="alta" id="q9_d" />
              <Label htmlFor="q9_d">Aceito perdas de até 30%</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="muito_alta" id="q9_e" />
              <Label htmlFor="q9_e">Aceito perdas acima de 30%</Label>
            </div>
          </RadioGroup>
        </div>

        {/* Q10 */}
        <div className="space-y-3">
          <Label className="text-base">10. Como você reagiria a uma queda de 20% no valor do investimento?</Label>
          <RadioGroup value={suitability.q10_reacao_queda} onValueChange={(v) => setSuitability({...suitability, q10_reacao_queda: v})}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="venderia_tudo" id="q10_a" />
              <Label htmlFor="q10_a">Venderia tudo imediatamente</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="venderia_parte" id="q10_b" />
              <Label htmlFor="q10_b">Venderia parte para reduzir exposição</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="manteria" id="q10_c" />
              <Label htmlFor="q10_c">Manteria a posição</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="compraria_mais" id="q10_d" />
              <Label htmlFor="q10_d">Aproveitaria para comprar mais</Label>
            </div>
          </RadioGroup>
        </div>

        {/* Q11 */}
        <div className="space-y-3">
          <Label className="text-base">11. Qual sua necessidade de liquidez?</Label>
          <RadioGroup value={suitability.q11_necessidade_liquidez} onValueChange={(v) => setSuitability({...suitability, q11_necessidade_liquidez: v})}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="imediata" id="q11_a" />
              <Label htmlFor="q11_a">Preciso de liquidez imediata</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="curto" id="q11_b" />
              <Label htmlFor="q11_b">Posso aguardar até 6 meses</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="medio" id="q11_c" />
              <Label htmlFor="q11_c">Posso aguardar de 6 meses a 2 anos</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="longo" id="q11_d" />
              <Label htmlFor="q11_d">Não tenho necessidade de liquidez</Label>
            </div>
          </RadioGroup>
        </div>

        {/* Q12 */}
        <div className="space-y-3">
          <Label className="text-base">12. Você já investiu em crédito privado (CRI, CRA, Debêntures)?</Label>
          <RadioGroup value={suitability.q12_ja_investiu_credito_privado} onValueChange={(v) => setSuitability({...suitability, q12_ja_investiu_credito_privado: v})}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="nao" id="q12_a" />
              <Label htmlFor="q12_a">Não, nunca investi</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="sim_pouco" id="q12_b" />
              <Label htmlFor="q12_b">Sim, em pequena quantidade</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="sim_regular" id="q12_c" />
              <Label htmlFor="q12_c">Sim, invisto regularmente</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="sim_majoritario" id="q12_d" />
              <Label htmlFor="q12_d">Sim, é a maior parte da minha carteira</Label>
            </div>
          </RadioGroup>
        </div>
      </CardContent>
    </Card>
  );

  // Render Step 3: Documentos
  const renderDocumentos = () => (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Documentos</CardTitle>
        <CardDescription>
          Envie os documentos necessários para validação do cadastro.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Documento de Identificação */}
        <div className="space-y-2">
          <Label>Documento de Identificação (RG/CNH) *</Label>
          <Input 
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => setDocumentos({...documentos, doc_identificacao: e.target.files?.[0]})}
          />
          <p className="text-xs text-slate-500">PDF, JPG ou PNG. Máx 5MB.</p>
        </div>

        {/* Comprovante de Residência */}
        <div className="space-y-2">
          <Label>Comprovante de Residência *</Label>
          <Input 
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => setDocumentos({...documentos, comprovante_residencia: e.target.files?.[0]})}
          />
          <p className="text-xs text-slate-500">Conta de luz, água, telefone ou banco. Máx 90 dias.</p>
        </div>

        {/* Comprovante de Renda */}
        <div className="space-y-2">
          <Label>Comprovante de Renda</Label>
          <Input 
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => setDocumentos({...documentos, comprovante_renda: e.target.files?.[0]})}
          />
          <p className="text-xs text-slate-500">Holerite, IR ou extrato bancário.</p>
        </div>

        {/* PJ: Contrato Social */}
        {(tipo === 'pj' || tipo === 'institucional') && (
          <div className="space-y-2">
            <Label>Contrato Social / Estatuto *</Label>
            <Input 
              type="file"
              accept=".pdf"
              onChange={(e) => setDocumentos({...documentos, contrato_social: e.target.files?.[0]})}
            />
          </div>
        )}

        {/* PJ: Procuração */}
        {(tipo === 'pj' || tipo === 'institucional') && (
          <div className="space-y-2">
            <Label>Procuração (se aplicável)</Label>
            <Input 
              type="file"
              accept=".pdf"
              onChange={(e) => setDocumentos({...documentos, procuracao: e.target.files?.[0]})}
            />
          </div>
        )}

        {/* Aviso */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800">Importante</p>
              <p className="text-sm text-amber-700 mt-1">
                Todos os documentos serão analisados pela equipe de compliance antes da aprovação do cadastro.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-slate-900">Cadastro de Investidor</h1>
          <p className="text-slate-500 mt-2">
            Complete seu cadastro para participar da emissão
          </p>
        </motion.div>

        {/* Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === currentStep;
              const isCompleted = index < currentStep;
              const isDisabled = index > currentStep;
              
              return (
                <div key={step.id} className="flex items-center">
                  <div className={`flex flex-col items-center ${isDisabled ? 'opacity-40' : ''}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                      isActive ? 'bg-blue-600 text-white' :
                      isCompleted ? 'bg-green-500 text-white' :
                      'bg-slate-200 text-slate-500'
                    }`}>
                      {isCompleted ? <CheckCircle className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                    </div>
                    <span className={`text-xs mt-1 ${isActive ? 'text-blue-600 font-medium' : 'text-slate-500'}`}>
                      {step.label}
                    </span>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div className={`w-12 h-0.5 mx-2 ${isCompleted ? 'bg-green-500' : 'bg-slate-200'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            {currentStep === 0 && renderIdentificacao()}
            {currentStep === 1 && tipo === 'pf' && renderFichaPF()}
            {currentStep === 1 && tipo === 'pj' && renderFichaPJ()}
            {currentStep === 1 && tipo === 'institucional' && renderFichaInstitucional()}
            {currentStep === 2 && renderSuitability()}
            {currentStep === 3 && renderDocumentos()}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>

          {currentStep < STEPS.length - 1 ? (
            <Button
              onClick={handleNext}
              disabled={currentStep === 0 && (checkStatus === 'idle' || checkStatus === 'loading')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {checkStatus === 'ok' ? 'Confirmar' : 'Próximo'}
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
                  Enviar para Análise
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
