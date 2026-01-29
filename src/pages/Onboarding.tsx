import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  User, Building2, FileText, Upload, CheckCircle, 
  ChevronRight, ChevronLeft, AlertCircle, Loader2 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface InvestidorData {
  id: string;
  nome: string;
  cpf_cnpj: string;
  email: string;
  telefone: string;
  tipo: 'pessoa_fisica' | 'pessoa_juridica' | 'institucional';
  tipo_investidor: string;
}

const steps = [
  { id: 'dados', label: 'Dados Cadastrais', icon: User },
  { id: 'kyc', label: 'KYC', icon: FileText },
  { id: 'suitability', label: 'Suitability', icon: CheckCircle },
  { id: 'documentos', label: 'Documentos', icon: Upload },
];

export default function OnboardingPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [investidor, setInvestidor] = useState<InvestidorData | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Form states
  const [dadosForm, setDadosForm] = useState({
    nome: '',
    cpf_cnpj: '',
    email: '',
    telefone: '',
    tipo: 'pessoa_fisica' as const,
    tipo_investidor: 'varejo',
  });
  
  const [kycForm, setKycForm] = useState({
    nacionalidade: 'brasileira',
    estado_civil: 'solteiro',
    profissao: '',
    renda_mensal: '',
    patrimonio: '',
    endereco: {
      cep: '',
      logradouro: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      estado: '',
    },
  });
  
  const [suitabilityForm, setSuitabilityForm] = useState({
    experiencia_investimentos: 'nenhuma',
    tempo_investimento: 'menos_1_ano',
    percentual_renda: 'ate_10',
    tolerancia_risco: 'conservador',
    objetivo_investimento: 'preservacao',
    conhecimento_derivativos: false,
    conhecimento_cambio: false,
    conhecimento_renda_fixa: false,
    conhecimento_renda_variavel: false,
  });
  
  const [documentos, setDocumentos] = useState<{
    rg_cpf?: File;
    comprovante_residencia?: File;
    kyc_assinado?: File;
    suitability_assinado?: File;
    ficha_cadastral?: File;
  }>({});

  useEffect(() => {
    if (token) {
      buscarInvestidor();
    }
  }, [token]);

  const buscarInvestidor = async () => {
    try {
      const { data, error } = await supabase
        .rpc('validar_token_onboarding', { p_token: token });
      
      if (error || !data) {
        toast.error('Link inválido ou expirado');
        navigate('/');
        return;
      }
      
      setInvestidor(data);
      setDadosForm({
        nome: data.nome || '',
        cpf_cnpj: data.cpf_cnpj || '',
        email: data.email || '',
        telefone: data.telefone || '',
        tipo: data.tipo || 'pessoa_fisica',
        tipo_investidor: data.tipo_investidor || 'varejo',
      });
    } catch (err) {
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (tipo: string, file: File | null) => {
    setDocumentos(prev => ({ ...prev, [tipo]: file || undefined }));
  };

  const fazerUploadDocumento = async (tipo: string, file: File) => {
    const fileName = `${investidor?.id}/${tipo}_${Date.now()}.${file.name.split('.').pop()}`;
    
    const { error: uploadError } = await supabase.storage
      .from('documentos-investidores')
      .upload(fileName, file);
    
    if (uploadError) throw uploadError;
    
    const { data: urlData } = supabase.storage
      .from('documentos-investidores')
      .getPublicUrl(fileName);
    
    await supabase.rpc('adicionar_documento_investidor', {
      p_investidor_id: investidor?.id,
      p_tipo_documento: tipo,
      p_nome_arquivo: file.name,
      p_url_arquivo: urlData.publicUrl,
      p_mime_type: file.type,
      p_tamanho_bytes: file.size,
    });
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    
    try {
      // Salvar KYC e Suitability
      await supabase.rpc('salvar_onboarding', {
        p_id: investidor?.id,
        p_kyc_json: kycForm,
        p_suitability_json: suitabilityForm,
        p_perfil_risco: calcularPerfilRisco(),
      });
      
      // Upload documentos
      for (const [tipo, file] of Object.entries(documentos)) {
        if (file) {
          await fazerUploadDocumento(tipo, file);
        }
      }
      
      // Finalizar onboarding
      await supabase.rpc('finalizar_onboarding', {
        p_id: investidor?.id,
      });
      
      toast.success('Cadastro enviado com sucesso!');
      navigate('/obrigado');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao enviar cadastro');
    } finally {
      setSubmitting(false);
    }
  };

  const calcularPerfilRisco = () => {
    // Lógica simples baseada no suitability
    if (suitabilityForm.tolerancia_risco === 'arrojado') return 'agressivo';
    if (suitabilityForm.tolerancia_risco === 'moderado') return 'moderado';
    return 'conservador';
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return dadosForm.nome && dadosForm.cpf_cnpj && dadosForm.email && dadosForm.telefone;
      case 1:
        return kycForm.profissao && kycForm.renda_mensal && kycForm.endereco.cep;
      case 2:
        return suitabilityForm.experiencia_investimentos && suitabilityForm.tolerancia_risco;
      case 3:
        return documentos.rg_cpf && documentos.comprovante_residencia;
      default:
        return true;
    }
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
          <h1 className="text-3xl font-bold text-slate-900">Cadastro de Investidor</h1>
          <p className="text-slate-500 mt-2">Preencha seus dados para completar o onboarding</p>
        </motion.div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === currentStep;
              const isCompleted = index < currentStep;
              
              return (
                <div key={step.id} className="flex items-center">
                  <div className={`flex flex-col items-center ${isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-slate-400'}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                      isActive ? 'border-blue-600 bg-blue-50' : 
                      isCompleted ? 'border-green-600 bg-green-50' : 
                      'border-slate-300 bg-white'
                    }`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-xs mt-1 font-medium">{step.label}</span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-full h-0.5 mx-2 ${isCompleted ? 'bg-green-500' : 'bg-slate-200'}`} style={{ width: '60px' }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Form Content */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
        >
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {currentStep === 0 && <User className="h-5 w-5" />}
                {currentStep === 1 && <FileText className="h-5 w-5" />}
                {currentStep === 2 && <CheckCircle className="h-5 w-5" />}
                {currentStep === 3 && <Upload className="h-5 w-5" />}
                {steps[currentStep].label}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Step 0: Dados Cadastrais */}
              {currentStep === 0 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Tipo de Investidor *</Label>
                      <Select 
                        value={dadosForm.tipo} 
                        onValueChange={(v) => setDadosForm({ ...dadosForm, tipo: v as any })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pessoa_fisica">Pessoa Física</SelectItem>
                          <SelectItem value="pessoa_juridica">Pessoa Jurídica</SelectItem>
                          <SelectItem value="institucional">Institucional</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Perfil *</Label>
                      <Select 
                        value={dadosForm.tipo_investidor} 
                        onValueChange={(v) => setDadosForm({ ...dadosForm, tipo_investidor: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="varejo">Varejo</SelectItem>
                          <SelectItem value="qualificado">Qualificado</SelectItem>
                          <SelectItem value="profissional">Profissional</SelectItem>
                          <SelectItem value="institucional">Institucional</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Nome Completo / Razão Social *</Label>
                    <Input 
                      value={dadosForm.nome} 
                      onChange={(e) => setDadosForm({ ...dadosForm, nome: e.target.value })}
                      placeholder="Digite o nome completo"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>CPF/CNPJ *</Label>
                    <Input 
                      value={dadosForm.cpf_cnpj} 
                      onChange={(e) => setDadosForm({ ...dadosForm, cpf_cnpj: e.target.value })}
                      placeholder="000.000.000-00 ou 00.000.000/0000-00"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Email *</Label>
                      <Input 
                        type="email"
                        value={dadosForm.email} 
                        onChange={(e) => setDadosForm({ ...dadosForm, email: e.target.value })}
                        placeholder="email@exemplo.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Telefone *</Label>
                      <Input 
                        value={dadosForm.telefone} 
                        onChange={(e) => setDadosForm({ ...dadosForm, telefone: e.target.value })}
                        placeholder="(00) 00000-0000"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 1: KYC */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nacionalidade</Label>
                      <Select 
                        value={kycForm.nacionalidade} 
                        onValueChange={(v) => setKycForm({ ...kycForm, nacionalidade: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="brasileira">Brasileira</SelectItem>
                          <SelectItem value="estrangeira">Estrangeira</SelectItem>
                          <SelectItem value="dual">Dupla Cidadania</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Estado Civil</Label>
                      <Select 
                        value={kycForm.estado_civil} 
                        onValueChange={(v) => setKycForm({ ...kycForm, estado_civil: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="solteiro">Solteiro(a)</SelectItem>
                          <SelectItem value="casado">Casado(a)</SelectItem>
                          <SelectItem value="divorciado">Divorciado(a)</SelectItem>
                          <SelectItem value="viuvo">Viúvo(a)</SelectItem>
                          <SelectItem value="uniao_estavel">União Estável</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Profissão *</Label>
                    <Input 
                      value={kycForm.profissao} 
                      onChange={(e) => setKycForm({ ...kycForm, profissao: e.target.value })}
                      placeholder="Ex: Engenheiro, Advogado, Empresário..."
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Renda Mensal Aproximada *</Label>
                      <Select 
                        value={kycForm.renda_mensal} 
                        onValueChange={(v) => setKycForm({ ...kycForm, renda_mensal: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
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
                      <Label>Patrimônio Aproximado</Label>
                      <Select 
                        value={kycForm.patrimonio} 
                        onValueChange={(v) => setKycForm({ ...kycForm, patrimonio: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ate_100k">Até R$ 100.000</SelectItem>
                          <SelectItem value="100k_500k">R$ 100.000 a R$ 500.000</SelectItem>
                          <SelectItem value="500k_1m">R$ 500.000 a R$ 1.000.000</SelectItem>
                          <SelectItem value="1m_5m">R$ 1.000.000 a R$ 5.000.000</SelectItem>
                          <SelectItem value="acima_5m">Acima de R$ 5.000.000</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="border-t pt-4 mt-4">
                    <Label className="text-lg font-medium mb-3 block">Endereço</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>CEP *</Label>
                        <Input 
                          value={kycForm.endereco.cep} 
                          onChange={(e) => setKycForm({ 
                            ...kycForm, 
                            endereco: { ...kycForm.endereco, cep: e.target.value }
                          })}
                          placeholder="00000-000"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Estado</Label>
                        <Input 
                          value={kycForm.endereco.estado} 
                          onChange={(e) => setKycForm({ 
                            ...kycForm, 
                            endereco: { ...kycForm.endereco, estado: e.target.value }
                          })}
                          placeholder="SP"
                        />
                      </div>
                    </div>
                    <div className="space-y-2 mt-3">
                      <Label>Logradouro</Label>
                      <Input 
                        value={kycForm.endereco.logradouro} 
                        onChange={(e) => setKycForm({ 
                          ...kycForm, 
                          endereco: { ...kycForm.endereco, logradouro: e.target.value }
                        })}
                        placeholder="Rua, Avenida, etc."
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-4 mt-3">
                      <div className="space-y-2">
                        <Label>Número</Label>
                        <Input 
                          value={kycForm.endereco.numero} 
                          onChange={(e) => setKycForm({ 
                            ...kycForm, 
                            endereco: { ...kycForm.endereco, numero: e.target.value }
                          })}
                        />
                      </div>
                      <div className="space-y-2 col-span-2">
                        <Label>Complemento</Label>
                        <Input 
                          value={kycForm.endereco.complemento} 
                          onChange={(e) => setKycForm({ 
                            ...kycForm, 
                            endereco: { ...kycForm.endereco, complemento: e.target.value }
                          })}
                          placeholder="Apto, Sala, etc."
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-3">
                      <div className="space-y-2">
                        <Label>Bairro</Label>
                        <Input 
                          value={kycForm.endereco.bairro} 
                          onChange={(e) => setKycForm({ 
                            ...kycForm, 
                            endereco: { ...kycForm.endereco, bairro: e.target.value }
                          })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Cidade</Label>
                        <Input 
                          value={kycForm.endereco.cidade} 
                          onChange={(e) => setKycForm({ 
                            ...kycForm, 
                            endereco: { ...kycForm.endereco, cidade: e.target.value }
                          })}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Suitability */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="space-y-3">
                    <Label>Qual sua experiência com investimentos? *</Label>
                    <RadioGroup 
                      value={suitabilityForm.experiencia_investimentos}
                      onValueChange={(v) => setSuitabilityForm({ ...suitabilityForm, experiencia_investimentos: v })}
                    >
                      <div className="space-y-2">
                        {[
                          { value: 'nenhuma', label: 'Nenhuma - Nunca investi' },
                          { value: 'basica', label: 'Básica - Poupança e CDB' },
                          { value: 'intermediaria', label: 'Intermediária - Fundos, Ações' },
                          { value: 'avancada', label: 'Avançada - Derivativos, Cambio' },
                        ].map((opt) => (
                          <div key={opt.value} className="flex items-center space-x-2">
                            <RadioGroupItem value={opt.value} id={opt.value} />
                            <Label htmlFor={opt.value} className="cursor-pointer">{opt.label}</Label>
                          </div>
                        ))}
                      </div>
                    </RadioGroup>
                  </div>
                  
                  <div className="space-y-3">
                    <Label>Por quanto tempo pretende manter seus investimentos? *</Label>
                    <RadioGroup 
                      value={suitabilityForm.tempo_investimento}
                      onValueChange={(v) => setSuitabilityForm({ ...suitabilityForm, tempo_investimento: v })}
                    >
                      <div className="space-y-2">
                        {[
                          { value: 'menos_1_ano', label: 'Menos de 1 ano' },
                          { value: '1_3_anos', label: '1 a 3 anos' },
                          { value: '3_5_anos', label: '3 a 5 anos' },
                          { value: 'mais_5_anos', label: 'Mais de 5 anos' },
                        ].map((opt) => (
                          <div key={opt.value} className="flex items-center space-x-2">
                            <RadioGroupItem value={opt.value} id={opt.value} />
                            <Label htmlFor={opt.value} className="cursor-pointer">{opt.label}</Label>
                          </div>
                        ))}
                      </div>
                    </RadioGroup>
                  </div>
                  
                  <div className="space-y-3">
                    <Label>Qual percentual da sua renda mensal você destina a investimentos? *</Label>
                    <RadioGroup 
                      value={suitabilityForm.percentual_renda}
                      onValueChange={(v) => setSuitabilityForm({ ...suitabilityForm, percentual_renda: v })}
                    >
                      <div className="space-y-2">
                        {[
                          { value: 'ate_10', label: 'Até 10%' },
                          { value: '10_25', label: '10% a 25%' },
                          { value: '25_50', label: '25% a 50%' },
                          { value: 'acima_50', label: 'Acima de 50%' },
                        ].map((opt) => (
                          <div key={opt.value} className="flex items-center space-x-2">
                            <RadioGroupItem value={opt.value} id={opt.value} />
                            <Label htmlFor={opt.value} className="cursor-pointer">{opt.label}</Label>
                          </div>
                        ))}
                      </div>
                    </RadioGroup>
                  </div>
                  
                  <div className="space-y-3">
                    <Label>Qual sua tolerância ao risco? *</Label>
                    <RadioGroup 
                      value={suitabilityForm.tolerancia_risco}
                      onValueChange={(v) => setSuitabilityForm({ ...suitabilityForm, tolerancia_risco: v })}
                    >
                      <div className="space-y-2">
                        {[
                          { value: 'conservador', label: 'Conservador - Preservar capital, aceito retornos menores' },
                          { value: 'moderado', label: 'Moderado - Equilíbrio entre risco e retorno' },
                          { value: 'arrojado', label: 'Arrojado - Busco maiores retornos, aceito volatilidade' },
                        ].map((opt) => (
                          <div key={opt.value} className="flex items-center space-x-2">
                            <RadioGroupItem value={opt.value} id={opt.value} />
                            <Label htmlFor={opt.value} className="cursor-pointer">{opt.label}</Label>
                          </div>
                        ))}
                      </div>
                    </RadioGroup>
                  </div>
                  
                  <div className="space-y-3">
                    <Label>Qual seu objetivo principal com os investimentos? *</Label>
                    <RadioGroup 
                      value={suitabilityForm.objetivo_investimento}
                      onValueChange={(v) => setSuitabilityForm({ ...suitabilityForm, objetivo_investimento: v })}
                    >
                      <div className="space-y-2">
                        {[
                          { value: 'preservacao', label: 'Preservação do capital' },
                          { value: 'renda', label: 'Geração de renda' },
                          { value: 'crescimento', label: 'Crescimento do patrimônio' },
                          { value: 'especulacao', label: 'Especulação' },
                        ].map((opt) => (
                          <div key={opt.value} className="flex items-center space-x-2">
                            <RadioGroupItem value={opt.value} id={opt.value} />
                            <Label htmlFor={opt.value} className="cursor-pointer">{opt.label}</Label>
                          </div>
                        ))}
                      </div>
                    </RadioGroup>
                  </div>
                  
                  <div className="border-t pt-4">
                    <Label className="mb-3 block">Conhecimento em:</Label>
                    <div className="space-y-2">
                      {[
                        { key: 'conhecimento_renda_fixa', label: 'Renda Fixa' },
                        { key: 'conhecimento_renda_variavel', label: 'Renda Variável (Ações)' },
                        { key: 'conhecimento_derivativos', label: 'Derivativos (Opções, Futuros)' },
                        { key: 'conhecimento_cambio', label: 'Mercado de Câmbio' },
                      ].map((item) => (
                        <div key={item.key} className="flex items-center space-x-2">
                          <Checkbox 
                            id={item.key}
                            checked={suitabilityForm[item.key as keyof typeof suitabilityForm] as boolean}
                            onCheckedChange={(checked) => 
                              setSuitabilityForm({ ...suitabilityForm, [item.key]: checked })
                            }
                          />
                          <Label htmlFor={item.key} className="cursor-pointer">{item.label}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Documentos */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-amber-800">Documentos obrigatórios</p>
                        <p className="text-sm text-amber-700">
                          Envie os documentos abaixo para completar seu cadastro. 
                          Arquivos aceitos: PDF, JPG, PNG (máx. 10MB cada).
                        </p>
                      </div>
                    </div>
                  </div>

                  {[
                    { key: 'rg_cpf', label: 'RG e CPF (frente e verso)', required: true },
                    { key: 'comprovante_residencia', label: 'Comprovante de Residência (últimos 3 meses)', required: true },
                    { key: 'kyc_assinado', label: 'Formulário KYC Assinado', required: false },
                    { key: 'suitability_assinado', label: 'Formulário Suitability Assinado', required: false },
                    { key: 'ficha_cadastral', label: 'Ficha Cadastral Assinada', required: false },
                  ].map((doc) => (
                    <div key={doc.key} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="font-medium">
                            {doc.label}
                            {doc.required && <span className="text-red-500 ml-1">*</span>}
                          </Label>
                          <p className="text-sm text-slate-500">
                            {documentos[doc.key as keyof typeof documentos]?.name || 'Nenhum arquivo selecionado'}
                          </p>
                        </div>
                        <div>
                          <Input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            className="hidden"
                            id={`file-${doc.key}`}
                            onChange={(e) => handleFileChange(doc.key, e.target.files?.[0] || null)}
                          />
                          <Label htmlFor={`file-${doc.key}`}>
                            <Button type="button" variant="outline" className="cursor-pointer" asChild>
                              <span>
                                <Upload className="h-4 w-4 mr-2" />
                                {documentos[doc.key as keyof typeof documentos] ? 'Trocar' : 'Selecionar'}
                              </span>
                            </Button>
                          </Label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-6 border-t">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                  disabled={currentStep === 0}
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Anterior
                </Button>
                
                {currentStep < steps.length - 1 ? (
                  <Button
                    onClick={() => setCurrentStep(currentStep + 1)}
                    disabled={!canProceed()}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Próximo
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={!canProceed() || submitting}
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
                        Finalizar Cadastro
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
