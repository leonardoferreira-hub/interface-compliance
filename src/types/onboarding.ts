export type InvestorType = 'PF' | 'PJ' | 'INSTITUCIONAL';

export type CivilStatus = 'SOLTEIRO' | 'CASADO' | 'DIVORCIADO' | 'VIUVO' | 'SEPARADO' | 'UNIAO_ESTAVEL';

export type PerfilInvestidor = 'CONSERVADOR' | 'MODERADO' | 'AGRESSIVO';

// Aliases para compatibilidade (definidos DEPOIS dos tipos originais)
export type TipoInvestidor = InvestorType;
export type PerfilSuitability = PerfilInvestidor;

export interface Endereco {
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
}

export interface DadosPF {
  nome: string;
  dataNascimento: string;
  naturalidade: string;
  nacionalidade: string;
  estadoCivil: CivilStatus;
  nomeMae: string;
  rg: string;
  orgaoEmissor: string;
  cpf: string;
  nomeConjuge?: string;
  cpfConjuge?: string;
  endereco: Endereco;
  telefone: string;
  email: string;
  ocupacao: string;
  empresa?: string;
  cnpjEmpresa?: string;
  rendimentosAnuais: number;
  patrimonio: number;
  isPEP: boolean;
  cargoPEP?: string;
}

export interface Controlador {
  nome: string;
  cpf: string;
  isPEP: boolean;
  cargoPEP?: string;
}

export interface Administrador {
  nome: string;
  cpf: string;
  cargo: string;
}

export interface Procurador {
  nome: string;
  cpf: string;
  poderes: string;
}

export interface EmpresaRelacionada {
  nome: string;
  cnpj: string;
  tipoRelacao: 'CONTROLADORA' | 'CONTROLADA' | 'COLIGADA';
}

export interface DadosPJ {
  denominacaoSocial: string;
  cnpj: string;
  controladores: Controlador[];
  administradores: Administrador[];
  procuradores: Procurador[];
  endereco: Endereco;
  telefone: string;
  email: string;
  faturamentoMedioMensal: number;
  patrimonio: number;
  empresasRelacionadas: EmpresaRelacionada[];
}

export interface DadosInstitucional {
  nomeInstituicao: string;
  cnpj: string;
  tipoInstituicao: string;
  administradorCarteira?: string;
  endereco: Endereco;
  telefone: string;
  email: string;
  responsavelNome: string;
  responsavelCargo: string;
  responsavelEmail: string;
}

export interface RespostaSuitability {
  perguntaId: number;
  resposta: number; // 1-4
}

export interface Suitability {
  respostas: RespostaSuitability[];
  pontuacaoTotal: number;
  perfil: PerfilInvestidor;
}

export interface Documento {
  tipo: 'RG' | 'CNH' | 'CONTRATO_SOCIAL' | 'CARTAO_CNPJ' | 'COMPROVANTE_ENDERECO' | 'COMPROVANTE_RENDA' | 'OUTROS';
  nome: string;
  file?: File;
  url?: string;
}

export interface DeclaracaoProfissional {
  isProfissional: boolean;
  possui10MilhoesInvestimentos: boolean;
  possuiConhecimentoMercado: boolean;
  declaracaoTexto: string;
  dataAssinatura?: string;
}

export interface ComplianceData {
  investorType: InvestorType;
  dadosPF?: DadosPF;
  dadosPJ?: DadosPJ;
  dadosInstitucional?: DadosInstitucional;
  suitability: Suitability;
  documentos: Documento[];
  declaracaoProfissional?: DeclaracaoProfissional;
  emissaoId?: string;
  investorId?: string;
  status: 'pending' | 'completed' | 'rejected';
  createdAt?: string;
  updatedAt?: string;
}

export type ComplianceStep = 
  | 'TIPO'
  | 'DADOS_CADASTRAIS'
  | 'SUITABILITY'
  | 'PROFISSIONAL'
  | 'DOCUMENTOS'
  | 'REVISAO'
  | 'CONFIRMACAO';

// Types específicos do onboarding
export interface ValidacaoToken {
  valido: boolean;
  emissao_id?: string;
  status?: string;
  message?: string;
}

export interface OnboardingData {
  token: string;
  emissao_id: string;
  tipo: InvestorType | null;
  dadosPF?: DadosPF;
  dadosPJ?: DadosPJ;
  dadosInstitucional?: DadosInstitucional;
  suitability?: Suitability;
  documentos: Documento[];
  declaracaoProfissional?: DeclaracaoProfissional;
  termosAceitos: boolean;
}

// Alias adicional para compatibilidade
export type RespostasSuitability = RespostaSuitability[];
