import { useFieldArray, useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Plus, Trash2 } from 'lucide-react';
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
import type { DadosPJ } from '../../types/onboarding';

interface PJFormProps {
  initialData?: DadosPJ;
  onSubmit: (data: DadosPJ) => void;
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

const controladorSchema = z.object({
  nome: z.string().min(3, 'Nome é obrigatório'),
  cpf: z.string().min(1, 'CPF é obrigatório').regex(cpfRegex, 'CPF inválido'),
  isPEP: z.boolean(),
  cargoPEP: z.string().optional(),
});

const administradorSchema = z.object({
  nome: z.string().min(3, 'Nome é obrigatório'),
  cpf: z.string().min(1, 'CPF é obrigatório').regex(cpfRegex, 'CPF inválido'),
  cargo: z.string().min(1, 'Cargo é obrigatório'),
});

const procuradorSchema = z.object({
  nome: z.string().min(3, 'Nome é obrigatório'),
  cpf: z.string().min(1, 'CPF é obrigatório').regex(cpfRegex, 'CPF inválido'),
  poderes: z.string().min(1, 'Descrição dos poderes é obrigatória'),
});

const empresaRelacionadaSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  cnpj: z.string().min(1, 'CNPJ é obrigatório').regex(cnpjRegex, 'CNPJ inválido'),
  tipoRelacao: z.enum(['CONTROLADORA', 'CONTROLADA', 'COLIGADA']),
});

const dadosPJSchema = z.object({
  denominacaoSocial: z.string().min(3, 'Denominação social é obrigatória'),
  cnpj: z.string().min(1, 'CNPJ é obrigatório').regex(cnpjRegex, 'CNPJ inválido'),
  controladores: z.array(controladorSchema).min(1, 'Informe pelo menos um controlador'),
  administradores: z.array(administradorSchema).min(1, 'Informe pelo menos um administrador'),
  procuradores: z.array(procuradorSchema).default([]),
  endereco: enderecoSchema,
  telefone: z.string().min(1, 'Telefone é obrigatório').regex(telefoneRegex, 'Telefone inválido'),
  email: z.string().min(1, 'E-mail é obrigatório').regex(emailRegex, 'E-mail inválido'),
  faturamentoMedioMensal: z.number().min(0, 'Faturamento não pode ser negativo'),
  patrimonio: z.number().min(0, 'Patrimônio não pode ser negativo'),
  empresasRelacionadas: z.array(empresaRelacionadaSchema).default([]),
});

type DadosPJFormData = z.infer<typeof dadosPJSchema>;

const estados = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

const tiposRelacao = [
  { value: 'CONTROLADORA', label: 'Controladora' },
  { value: 'CONTROLADA', label: 'Controlada' },
  { value: 'COLIGADA', label: 'Coligada' },
];

// Funções de máscara
function maskCNPJ(value: string): string {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
}

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

export function PJForm({ initialData, onSubmit }: PJFormProps) {
  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<DadosPJFormData>({
    resolver: zodResolver(dadosPJSchema),
    defaultValues: initialData || {
      controladores: [{ nome: '', cpf: '', isPEP: false }],
      administradores: [{ nome: '', cpf: '', cargo: '' }],
      procuradores: [],
      empresasRelacionadas: [],
      endereco: { estado: 'SP' },
      faturamentoMedioMensal: 0,
      patrimonio: 0,
    },
  });

  const {
    fields: controladores,
    append: appendControlador,
    remove: removeControlador,
  } = useFieldArray({ control, name: 'controladores' });

  const {
    fields: administradores,
    append: appendAdministrador,
    remove: removeAdministrador,
  } = useFieldArray({ control, name: 'administradores' });

  const {
    fields: procuradores,
    append: appendProcurador,
    remove: removeProcurador,
  } = useFieldArray({ control, name: 'procuradores' });

  const {
    fields: empresasRelacionadas,
    append: appendEmpresa,
    remove: removeEmpresa,
  } = useFieldArray({ control, name: 'empresasRelacionadas' });

  const handleFormSubmit = async (data: DadosPJFormData) => {
    await onSubmit(data as DadosPJ);
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
            Dados Pessoa Jurídica
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8">
            {/* Dados da Empresa */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">
                Dados da Empresa
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="denominacaoSocial">Denominação Social *</Label>
                  <Input
                    id="denominacaoSocial"
                    {...register('denominacaoSocial')}
                    placeholder="Razão social completa"
                    className={errors.denominacaoSocial ? 'border-red-500' : ''}
                  />
                  {errors.denominacaoSocial && (
                    <p className="text-sm text-red-500">{errors.denominacaoSocial.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cnpj">CNPJ *</Label>
                  <Controller
                    name="cnpj"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        id="cnpj"
                        placeholder="00.000.000/0000-00"
                        maxLength={18}
                        onChange={(e) => field.onChange(maskCNPJ(e.target.value))}
                        className={errors.cnpj ? 'border-red-500' : ''}
                      />
                    )}
                  />
                  {errors.cnpj && (
                    <p className="text-sm text-red-500">{errors.cnpj.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">E-mail *</Label>
                  <Input
                    id="email"
                    type="email"
                    {...register('email')}
                    placeholder="empresa@email.com"
                    className={errors.email ? 'border-red-500' : ''}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-500">{errors.email.message}</p>
                  )}
                </div>

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
                  <Label htmlFor="faturamentoMedioMensal">Faturamento Médio Mensal (últimos 12 meses) *</Label>
                  <Input
                    id="faturamentoMedioMensal"
                    type="number"
                    {...register('faturamentoMedioMensal', { valueAsNumber: true })}
                    placeholder="0,00"
                    className={errors.faturamentoMedioMensal ? 'border-red-500' : ''}
                  />
                  {errors.faturamentoMedioMensal && (
                    <p className="text-sm text-red-500">{errors.faturamentoMedioMensal.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="patrimonio">Patrimônio (R$) *</Label>
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
                    placeholder="Sala, Andar, etc"
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

            {/* Controladores */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="text-lg font-semibold text-gray-700">
                  Controladores *
                </h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => appendControlador({ nome: '', cpf: '', isPEP: false })}
                  className="text-[#008080] border-[#008080]"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Adicionar
                </Button>
              </div>
              
              {errors.controladores && typeof errors.controladores === 'object' && 'message' in errors.controladores && (
                <p className="text-sm text-red-500">{errors.controladores.message}</p>
              )}

              <AnimatePresence>
                {controladores.map((field, index) => (
                  <motion.div
                    key={field.id}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-4 bg-gray-50 rounded-lg space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600">
                        Controlador {index + 1}
                      </span>
                      {controladores.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeControlador(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Nome Completo *</Label>
                        <Input
                          {...register(`controladores.${index}.nome`)}
                          placeholder="Nome do controlador"
                          className={errors.controladores?.[index]?.nome ? 'border-red-500' : ''}
                        />
                        {errors.controladores?.[index]?.nome && (
                          <p className="text-sm text-red-500">{errors.controladores[index]?.nome?.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label>CPF *</Label>
                        <Controller
                          name={`controladores.${index}.cpf`}
                          control={control}
                          render={({ field }) => (
                            <Input
                              {...field}
                              placeholder="000.000.000-00"
                              maxLength={14}
                              onChange={(e) => field.onChange(maskCPF(e.target.value))}
                              className={errors.controladores?.[index]?.cpf ? 'border-red-500' : ''}
                            />
                          )}
                        />
                        {errors.controladores?.[index]?.cpf && (
                          <p className="text-sm text-red-500">{errors.controladores[index]?.cpf?.message}</p>
                        )}
                      </div>

                      <div className="flex items-center space-x-3">
                        <Controller
                          name={`controladores.${index}.isPEP`}
                          control={control}
                          render={({ field }) => (
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          )}
                        />
                        <Label className="text-sm cursor-pointer">É PEP</Label>
                      </div>

                      {watch(`controladores.${index}.isPEP`) && (
                        <div className="space-y-2">
                          <Label>Cargo PEP</Label>
                          <Input
                            {...register(`controladores.${index}.cargoPEP`)}
                            placeholder="Cargo/função"
                          />
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Administradores */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="text-lg font-semibold text-gray-700">
                  Administradores *
                </h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => appendAdministrador({ nome: '', cpf: '', cargo: '' })}
                  className="text-[#008080] border-[#008080]"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Adicionar
                </Button>
              </div>
              
              {errors.administradores && typeof errors.administradores === 'object' && 'message' in errors.administradores && (
                <p className="text-sm text-red-500">{errors.administradores.message}</p>
              )}

              <AnimatePresence>
                {administradores.map((field, index) => (
                  <motion.div
                    key={field.id}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-4 bg-gray-50 rounded-lg space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600">
                        Administrador {index + 1}
                      </span>
                      {administradores.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAdministrador(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Nome Completo *</Label>
                        <Input
                          {...register(`administradores.${index}.nome`)}
                          placeholder="Nome do administrador"
                          className={errors.administradores?.[index]?.nome ? 'border-red-500' : ''}
                        />
                        {errors.administradores?.[index]?.nome && (
                          <p className="text-sm text-red-500">{errors.administradores[index]?.nome?.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label>CPF *</Label>
                        <Controller
                          name={`administradores.${index}.cpf`}
                          control={control}
                          render={({ field }) => (
                            <Input
                              {...field}
                              placeholder="000.000.000-00"
                              maxLength={14}
                              onChange={(e) => field.onChange(maskCPF(e.target.value))}
                              className={errors.administradores?.[index]?.cpf ? 'border-red-500' : ''}
                            />
                          )}
                        />
                        {errors.administradores?.[index]?.cpf && (
                          <p className="text-sm text-red-500">{errors.administradores[index]?.cpf?.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label>Cargo *</Label>
                        <Input
                          {...register(`administradores.${index}.cargo`)}
                          placeholder="Ex: Diretor, Gerente"
                          className={errors.administradores?.[index]?.cargo ? 'border-red-500' : ''}
                        />
                        {errors.administradores?.[index]?.cargo && (
                          <p className="text-sm text-red-500">{errors.administradores[index]?.cargo?.message}</p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Procuradores */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="text-lg font-semibold text-gray-700">
                  Procuradores (opcional)
                </h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => appendProcurador({ nome: '', cpf: '', poderes: '' })}
                  className="text-[#008080] border-[#008080]"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Adicionar
                </Button>
              </div>

              <AnimatePresence>
                {procuradores.map((field, index) => (
                  <motion.div
                    key={field.id}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-4 bg-gray-50 rounded-lg space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600">
                        Procurador {index + 1}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeProcurador(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Nome Completo *</Label>
                        <Input
                          {...register(`procuradores.${index}.nome`)}
                          placeholder="Nome do procurador"
                          className={errors.procuradores?.[index]?.nome ? 'border-red-500' : ''}
                        />
                        {errors.procuradores?.[index]?.nome && (
                          <p className="text-sm text-red-500">{errors.procuradores[index]?.nome?.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label>CPF *</Label>
                        <Controller
                          name={`procuradores.${index}.cpf`}
                          control={control}
                          render={({ field }) => (
                            <Input
                              {...field}
                              placeholder="000.000.000-00"
                              maxLength={14}
                              onChange={(e) => field.onChange(maskCPF(e.target.value))}
                              className={errors.procuradores?.[index]?.cpf ? 'border-red-500' : ''}
                            />
                          )}
                        />
                        {errors.procuradores?.[index]?.cpf && (
                          <p className="text-sm text-red-500">{errors.procuradores[index]?.cpf?.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label>Poderes *</Label>
                        <Input
                          {...register(`procuradores.${index}.poderes`)}
                          placeholder="Descrição dos poderes"
                          className={errors.procuradores?.[index]?.poderes ? 'border-red-500' : ''}
                        />
                        {errors.procuradores?.[index]?.poderes && (
                          <p className="text-sm text-red-500">{errors.procuradores[index]?.poderes?.message}</p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Empresas Relacionadas */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="text-lg font-semibold text-gray-700">
                  Empresas Relacionadas (opcional)
                </h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => appendEmpresa({ nome: '', cnpj: '', tipoRelacao: 'COLIGADA' })}
                  className="text-[#008080] border-[#008080]"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Adicionar
                </Button>
              </div>

              <AnimatePresence>
                {empresasRelacionadas.map((field, index) => (
                  <motion.div
                    key={field.id}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-4 bg-gray-50 rounded-lg space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600">
                        Empresa {index + 1}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeEmpresa(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Nome *</Label>
                        <Input
                          {...register(`empresasRelacionadas.${index}.nome`)}
                          placeholder="Nome da empresa"
                          className={errors.empresasRelacionadas?.[index]?.nome ? 'border-red-500' : ''}
                        />
                        {errors.empresasRelacionadas?.[index]?.nome && (
                          <p className="text-sm text-red-500">{errors.empresasRelacionadas[index]?.nome?.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label>CNPJ *</Label>
                        <Controller
                          name={`empresasRelacionadas.${index}.cnpj`}
                          control={control}
                          render={({ field }) => (
                            <Input
                              {...field}
                              placeholder="00.000.000/0000-00"
                              maxLength={18}
                              onChange={(e) => field.onChange(maskCNPJ(e.target.value))}
                              className={errors.empresasRelacionadas?.[index]?.cnpj ? 'border-red-500' : ''}
                            />
                          )}
                        />
                        {errors.empresasRelacionadas?.[index]?.cnpj && (
                          <p className="text-sm text-red-500">{errors.empresasRelacionadas[index]?.cnpj?.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label>Tipo de Relação *</Label>
                        <Controller
                          name={`empresasRelacionadas.${index}.tipoRelacao`}
                          control={control}
                          render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger className={errors.empresasRelacionadas?.[index]?.tipoRelacao ? 'border-red-500' : ''}>
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                              <SelectContent>
                                {tiposRelacao.map((tipo) => (
                                  <SelectItem key={tipo.value} value={tipo.value}>
                                    {tipo.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                        {errors.empresasRelacionadas?.[index]?.tipoRelacao && (
                          <p className="text-sm text-red-500">{errors.empresasRelacionadas[index]?.tipoRelacao?.message}</p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
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
