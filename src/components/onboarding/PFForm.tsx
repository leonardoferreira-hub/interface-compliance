import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { z } from 'zod';
import type { DadosPF, CivilStatus } from '../../types/onboarding';

interface PFFormProps {
  initialData?: DadosPF;
  onSubmit: (data: DadosPF) => void;
}

const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{11}$/;
const cnpjRegex = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$|^\d{14}$/;
const cepRegex = /^\d{5}-?\d{3}$/;
const telefoneRegex = /^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/;
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const enderecoSchema = z.object({
  cep: z.string().min(1, 'CEP é obrigatório').regex(cepRegex, 'CEP inválido'),
  logradouro: z.string().min(1, 'Logradouro é obrigatório'),
  numero: z.string().min(1, 'Número é obrigatório'),
  complemento: z.string().optional(),
  bairro: z.string().min(1, 'Bairro é obrigatório'),
  cidade: z.string().min(1, 'Cidade é obrigatória'),
  estado: z.string().min(2, 'Estado é obrigatório'),
});

const dadosPFSchema = z.object({
  nome: z.string().min(3, 'Nome completo é obrigatório'),
  dataNascimento: z.string().min(1, 'Data de nascimento é obrigatória'),
  naturalidade: z.string().min(1, 'Naturalidade é obrigatória'),
  nacionalidade: z.string().min(1, 'Nacionalidade é obrigatória'),
  estadoCivil: z.enum(['SOLTEIRO', 'CASADO', 'DIVORCIADO', 'VIUVO', 'SEPARADO', 'UNIAO_ESTAVEL']),
  nomeMae: z.string().min(3, 'Nome da mãe é obrigatório'),
  rg: z.string().min(1, 'RG é obrigatório'),
  orgaoEmissor: z.string().min(1, 'Órgão emissor é obrigatório'),
  cpf: z.string().min(1, 'CPF é obrigatório').regex(cpfRegex, 'CPF inválido'),
  nomeConjuge: z.string().optional(),
  cpfConjuge: z.string().regex(cpfRegex, 'CPF inválido').optional().or(z.literal('')),
  endereco: enderecoSchema,
  telefone: z.string().min(1, 'Telefone é obrigatório').regex(telefoneRegex, 'Telefone inválido'),
  email: z.string().min(1, 'E-mail é obrigatório').regex(emailRegex, 'E-mail inválido'),
  ocupacao: z.string().min(1, 'Ocupação é obrigatória'),
  empresa: z.string().optional(),
  cnpjEmpresa: z.string().regex(cnpjRegex, 'CNPJ inválido').optional().or(z.literal('')),
  rendimentosAnuais: z.number().min(0, 'Rendimentos não podem ser negativos'),
  patrimonio: z.number().min(0, 'Patrimônio não pode ser negativo'),
  isPEP: z.boolean(),
  cargoPEP: z.string().optional(),
}).refine((data) => {
  if (data.isPEP && !data.cargoPEP) {
    return false;
  }
  return true;
}, {
  message: 'Informe o cargo/função PEP',
  path: ['cargoPEP'],
});

type DadosPFFormData = z.infer<typeof dadosPFSchema>;

const civilStatusOptions: { value: CivilStatus; label: string }[] = [
  { value: 'SOLTEIRO', label: 'Solteiro(a)' },
  { value: 'CASADO', label: 'Casado(a)' },
  { value: 'DIVORCIADO', label: 'Divorciado(a)' },
  { value: 'VIUVO', label: 'Viúvo(a)' },
  { value: 'SEPARADO', label: 'Separado(a)' },
  { value: 'UNIAO_ESTAVEL', label: 'União Estável' },
];

const estados = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

// Funções de máscara
function maskCPF(value: string): string {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

function maskCEP(value: string): string {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{5})(\d)/, '$1-$2');
}

function maskTelefone(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 10) {
    return digits
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  }
  return digits
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2');
}

function maskCNPJ(value: string): string {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
}

export function PFForm({ initialData, onSubmit }: PFFormProps) {
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<DadosPFFormData>({
    resolver: zodResolver(dadosPFSchema),
    defaultValues: initialData || {
      isPEP: false,
      endereco: { estado: 'SP' },
      rendimentosAnuais: 0,
      patrimonio: 0,
    },
  });

  const isPEP = watch('isPEP');
  const estadoCivil = watch('estadoCivil');
  const cep = watch('endereco.cep');
  const showConjuge = estadoCivil === 'CASADO' || estadoCivil === 'UNIAO_ESTAVEL';

  // Buscar endereço pelo CEP
  useEffect(() => {
    const cepLimpo = cep?.replace(/\D/g, '');
    if (cepLimpo?.length === 8) {
      fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`)
        .then((res) => res.json())
        .then((data) => {
          if (!data.erro) {
            setValue('endereco.logradouro', data.logradouro);
            setValue('endereco.bairro', data.bairro);
            setValue('endereco.cidade', data.localidade);
            setValue('endereco.estado', data.uf);
          }
        })
        .catch(() => {
          // Silently fail - usuário pode preencher manualmente
        });
    }
  }, [cep, setValue]);

  const handleFormSubmit = async (data: DadosPFFormData) => {
    await onSubmit(data as DadosPF);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl text-[#008080]">
            Dados Pessoa Física
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
            {/* Dados Pessoais */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">
                Dados Pessoais
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="nome">Nome Completo *</Label>
                  <Input
                    id="nome"
                    {...register('nome')}
                    placeholder="Digite seu nome completo"
                    className={errors.nome ? 'border-red-500' : ''}
                  />
                  {errors.nome && (
                    <p className="text-sm text-red-500">{errors.nome.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dataNascimento">Data de Nascimento *</Label>
                  <Input
                    id="dataNascimento"
                    type="date"
                    {...register('dataNascimento')}
                    className={errors.dataNascimento ? 'border-red-500' : ''}
                  />
                  {errors.dataNascimento && (
                    <p className="text-sm text-red-500">{errors.dataNascimento.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estadoCivil">Estado Civil *</Label>
                  <Controller
                    name="estadoCivil"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className={errors.estadoCivil ? 'border-red-500' : ''}>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {civilStatusOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.estadoCivil && (
                    <p className="text-sm text-red-500">{errors.estadoCivil.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="naturalidade">Naturalidade *</Label>
                  <Input
                    id="naturalidade"
                    {...register('naturalidade')}
                    placeholder="Cidade/UF de nascimento"
                    className={errors.naturalidade ? 'border-red-500' : ''}
                  />
                  {errors.naturalidade && (
                    <p className="text-sm text-red-500">{errors.naturalidade.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nacionalidade">Nacionalidade *</Label>
                  <Input
                    id="nacionalidade"
                    {...register('nacionalidade')}
                    placeholder="Ex: Brasileira"
                    className={errors.nacionalidade ? 'border-red-500' : ''}
                  />
                  {errors.nacionalidade && (
                    <p className="text-sm text-red-500">{errors.nacionalidade.message}</p>
                  )}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="nomeMae">Nome da Mãe *</Label>
                  <Input
                    id="nomeMae"
                    {...register('nomeMae')}
                    placeholder="Nome completo da mãe"
                    className={errors.nomeMae ? 'border-red-500' : ''}
                  />
                  {errors.nomeMae && (
                    <p className="text-sm text-red-500">{errors.nomeMae.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Documentos */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">
                Documentos
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF *</Label>
                  <Controller
                    name="cpf"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        id="cpf"
                        placeholder="000.000.000-00"
                        maxLength={14}
                        onChange={(e) => field.onChange(maskCPF(e.target.value))}
                        className={errors.cpf ? 'border-red-500' : ''}
                      />
                    )}
                  />
                  {errors.cpf && (
                    <p className="text-sm text-red-500">{errors.cpf.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rg">RG *</Label>
                  <Input
                    id="rg"
                    {...register('rg')}
                    placeholder="Número do RG"
                    className={errors.rg ? 'border-red-500' : ''}
                  />
                  {errors.rg && (
                    <p className="text-sm text-red-500">{errors.rg.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="orgaoEmissor">Órgão Emissor *</Label>
                  <Input
                    id="orgaoEmissor"
                    {...register('orgaoEmissor')}
                    placeholder="Ex: SSP/SP"
                    className={errors.orgaoEmissor ? 'border-red-500' : ''}
                  />
                  {errors.orgaoEmissor && (
                    <p className="text-sm text-red-500">{errors.orgaoEmissor.message}</p>
                  )}
                </div>
              </div>

              {/* Dados do Cônjuge */}
              {showConjuge && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg"
                >
                  <div className="space-y-2">
                    <Label htmlFor="nomeConjuge">Nome do Cônjuge</Label>
                    <Input
                      id="nomeConjuge"
                      {...register('nomeConjuge')}
                      placeholder="Nome completo do cônjuge"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cpfConjuge">CPF do Cônjuge</Label>
                    <Controller
                      name="cpfConjuge"
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          id="cpfConjuge"
                          placeholder="000.000.000-00"
                          maxLength={14}
                          onChange={(e) => field.onChange(maskCPF(e.target.value))}
                          className={errors.cpfConjuge ? 'border-red-500' : ''}
                        />
                      )}
                    />
                    {errors.cpfConjuge && (
                      <p className="text-sm text-red-500">{errors.cpfConjuge.message}</p>
                    )}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Endereço */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">
                Endereço
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cep">CEP *</Label>
                  <Controller
                    name="endereco.cep"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        id="cep"
                        placeholder="00000-000"
                        maxLength={9}
                        onChange={(e) => field.onChange(maskCEP(e.target.value))}
                        className={errors.endereco?.cep ? 'border-red-500' : ''}
                      />
                    )}
                  />
                  {errors.endereco?.cep && (
                    <p className="text-sm text-red-500">{errors.endereco.cep.message}</p>
                  )}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="logradouro">Logradouro *</Label>
                  <Input
                    id="logradouro"
                    {...register('endereco.logradouro')}
                    placeholder="Rua, Avenida, etc"
                    className={errors.endereco?.logradouro ? 'border-red-500' : ''}
                  />
                  {errors.endereco?.logradouro && (
                    <p className="text-sm text-red-500">{errors.endereco.logradouro.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="numero">Número *</Label>
                  <Input
                    id="numero"
                    {...register('endereco.numero')}
                    placeholder="Nº"
                    className={errors.endereco?.numero ? 'border-red-500' : ''}
                  />
                  {errors.endereco?.numero && (
                    <p className="text-sm text-red-500">{errors.endereco.numero.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="complemento">Complemento</Label>
                  <Input
                    id="complemento"
                    {...register('endereco.complemento')}
                    placeholder="Apto, Bloco, etc"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bairro">Bairro *</Label>
                  <Input
                    id="bairro"
                    {...register('endereco.bairro')}
                    placeholder="Bairro"
                    className={errors.endereco?.bairro ? 'border-red-500' : ''}
                  />
                  {errors.endereco?.bairro && (
                    <p className="text-sm text-red-500">{errors.endereco.bairro.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cidade">Cidade *</Label>
                  <Input
                    id="cidade"
                    {...register('endereco.cidade')}
                    placeholder="Cidade"
                    className={errors.endereco?.cidade ? 'border-red-500' : ''}
                  />
                  {errors.endereco?.cidade && (
                    <p className="text-sm text-red-500">{errors.endereco.cidade.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estado">Estado *</Label>
                  <Controller
                    name="endereco.estado"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className={errors.endereco?.estado ? 'border-red-500' : ''}>
                          <SelectValue placeholder="UF" />
                        </SelectTrigger>
                        <SelectContent>
                          {estados.map((uf) => (
                            <SelectItem key={uf} value={uf}>
                              {uf}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.endereco?.estado && (
                    <p className="text-sm text-red-500">{errors.endereco.estado.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Contato */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">
                Contato
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone *</Label>
                  <Controller
                    name="telefone"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        id="telefone"
                        placeholder="(00) 00000-0000"
                        maxLength={15}
                        onChange={(e) => field.onChange(maskTelefone(e.target.value))}
                        className={errors.telefone ? 'border-red-500' : ''}
                      />
                    )}
                  />
                  {errors.telefone && (
                    <p className="text-sm text-red-500">{errors.telefone.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">E-mail *</Label>
                  <Input
                    id="email"
                    type="email"
                    {...register('email')}
                    placeholder="seu@email.com"
                    className={errors.email ? 'border-red-500' : ''}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-500">{errors.email.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Dados Profissionais */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">
                Dados Profissionais
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ocupacao">Ocupação Profissional *</Label>
                  <Input
                    id="ocupacao"
                    {...register('ocupacao')}
                    placeholder="Sua profissão"
                    className={errors.ocupacao ? 'border-red-500' : ''}
                  />
                  {errors.ocupacao && (
                    <p className="text-sm text-red-500">{errors.ocupacao.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="empresa">Empresa (opcional)</Label>
                  <Input
                    id="empresa"
                    {...register('empresa')}
                    placeholder="Nome da empresa"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cnpjEmpresa">CNPJ da Empresa (opcional)</Label>
                  <Controller
                    name="cnpjEmpresa"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        id="cnpjEmpresa"
                        placeholder="00.000.000/0000-00"
                        maxLength={18}
                        onChange={(e) => field.onChange(maskCNPJ(e.target.value))}
                        className={errors.cnpjEmpresa ? 'border-red-500' : ''}
                      />
                    )}
                  />
                  {errors.cnpjEmpresa && (
                    <p className="text-sm text-red-500">{errors.cnpjEmpresa.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Patrimônio */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">
                Patrimônio e Renda
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rendimentosAnuais">Rendimentos Anuais (R$) *</Label>
                  <Input
                    id="rendimentosAnuais"
                    type="number"
                    {...register('rendimentosAnuais', { valueAsNumber: true })}
                    placeholder="0,00"
                    className={errors.rendimentosAnuais ? 'border-red-500' : ''}
                  />
                  {errors.rendimentosAnuais && (
                    <p className="text-sm text-red-500">{errors.rendimentosAnuais.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="patrimonio">Patrimônio Estimado (R$) *</Label>
                  <Input
                    id="patrimonio"
                    type="number"
                    {...register('patrimonio', { valueAsNumber: true })}
                    placeholder="0,00"
                    className={errors.patrimonio ? 'border-red-500' : ''}
                  />
                  {errors.patrimonio && (
                    <p className="text-sm text-red-500">{errors.patrimonio.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* PEP */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">
                Declaração PEP
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Controller
                    name="isPEP"
                    control={control}
                    render={({ field }) => (
                      <Checkbox
                        id="isPEP"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    )}
                  />
                  <Label htmlFor="isPEP" className="text-sm cursor-pointer">
                    Sou Pessoa Exposta Politicamente (PEP) ou parente de PEP
                  </Label>
                </div>

                {isPEP && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2"
                  >
                    <Label htmlFor="cargoPEP">Cargo/Função *</Label>
                    <Input
                      id="cargoPEP"
                      {...register('cargoPEP')}
                      placeholder="Descreva seu cargo ou função"
                      className={errors.cargoPEP ? 'border-red-500' : ''}
                    />
                    {errors.cargoPEP && (
                      <p className="text-sm text-red-500">{errors.cargoPEP.message}</p>
                    )}
                  </motion.div>
                )}
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#008080] hover:bg-[#006666] text-white"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Salvando...
                </span>
              ) : (
                'Continuar'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
