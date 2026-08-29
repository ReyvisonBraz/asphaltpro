export type ViewMode = 'dashboard' | 'lancamentos' | 'contas' | 'orcamentos' | 'cadastros' | 'relatorios' | 'configuracoes';

export type TransactionType = 'entrada' | 'saida';

export type PaymentMethod = 
  | 'Boleto Bancário'
  | 'Transferência'
  | 'Transferência Bancária (PIX)'
  | 'PIX'
  | 'Cartão de Crédito'
  | 'Cartão Corporativo'
  | 'Dinheiro'
  | 'Cheque'
  | string;

export type AccountStatus = 'atrasado' | 'pendente' | 'pago';

export type AccountType = 'pagar' | 'receber';

export type QuoteStatus = 'rascunho' | 'enviado' | 'aprovado' | 'convertido' | 'recusado' | 'expirado';

export interface QuoteItem {
  id: string;
  nome: string;
  descricao?: string;
  modalidade: 'com_aplicacao' | 'sem_aplicacao' | 'transporte' | 'material' | 'locacao';
  quantidade: number;
  unidade: string; // ton, m², m³, viagem, hora, diária, un
  valorUnitario: number;
  valorTotal: number;
}

export interface QuoteCatalogItem {
  id: string;
  nome: string;
  descricao?: string;
  modalidade: 'com_aplicacao' | 'sem_aplicacao' | 'transporte' | 'material' | 'locacao';
  unidadePadrao: string;
  valorUnitarioPadrao: number;
}

export interface QuoteClient {
  nome: string;
  documento?: string; // CNPJ / CPF
  contato?: string;
  telefone?: string;
  email?: string;
  enderecoObra?: string;
  cidadeUf?: string;
}

export type PartnerType = 'cliente' | 'fornecedor' | 'ambos';

export interface BusinessPartner {
  id: string;
  nome: string;
  nomeFantasia?: string;
  tipo: PartnerType;
  documento?: string; // CNPJ ou CPF
  inscricaoEstadual?: string;
  contato?: string;
  telefone?: string;
  email?: string;
  cidadeUf?: string;
  endereco?: string;
  ramoAtividade?: string; // Ex: Insumos (CAP/Brita), Pavimentação, Órgão Público
  categoriaPadrao?: string; // Categoria contábil sugerida
  status?: 'ativo' | 'inativo';
}

export interface Quote {
  id: string;
  numero: string; // ex: ORC-2024-001
  dataEmissao: string; // DD/MM/YYYY
  dataValidade: string; // DD/MM/YYYY
  diasValidade: number;
  status: QuoteStatus;
  
  // Cliente
  cliente: QuoteClient;
  
  // Responsável da Usina
  responsavelNome: string;
  responsavelCargo: string;
  responsavelTelefone?: string;
  
  // Textos
  textoIntroducao: string;
  itens: QuoteItem[];
  
  // Totais
  subtotal: number;
  desconto: number; // em R$
  acrescimoFrete: number; // em R$
  valorTotal: number;
  
  // Condições e Rodapé
  condicoesPagamento: string;
  prazoEntrega: string;
  textoObservacoes: string;
  
  // Histórico de Conversão
  convertidoEmReceita?: boolean;
  dataConversao?: string;
  detalhesConversao?: string;

  createdAt: string;
}

export interface QuoteConversionOptions {
  tipoConversao: 'a_vista' | 'parcelado' | 'misto';
  valorEntradaAVista?: number;
  numeroParcelas: number;
  intervaloDiasParcelas: number; // e.g. 30
  dataPrimeiroVencimento: string; // DD/MM/YYYY
  formaPagamento: PaymentMethod;
  contaBancaria: string;
  categoriaFinanceira: string;
  gerarEntradaHoje: boolean; // se true gera Transaction imediata pro valor à vista
  observacaoConversao?: string;
}

export interface LetterheadSettings {
  backgroundImageUrl: string; // Custom uploaded A4 letterhead image (dataUrl or url)
  usarTimbradoPersonalizado: boolean;
  nomeEmpresa: string;
  cnpj: string;
  inscricaoEstadual?: string;
  enderecoUsina: string;
  telefone: string;
  emailComercial: string;
  siteUrl?: string;
  textoPadraoIntroducao: string;
  textoPadraoCondicoes: string;
  validadeDiasPadrao: number;
  diasValidadePadrao?: number;
  responsavelPadraoNome: string;
  responsavelTecnicoPadrao?: string;
  responsavelPadraoCargo: string;
  cargoResponsavelPadrao?: string;
  margemTopoMm: number;
  margemBaseMm: number;
  margemLateralMm: number;
}

export interface Transaction {
  id: string;
  data: string; // ISO or DD/MM/YYYY
  descricao: string;
  categoria: string;
  responsavel: string;
  formaPagamento: PaymentMethod;
  valor: number; // positive number, type defines whether it's incoming or outgoing
  tipo: TransactionType;
  clienteFornecedor?: string;
  contaFinanceira?: string;
  observacao?: string;
  comprovanteNome?: string;
  createdAt: string;
}

export interface AccountItem {
  id: string;
  descricao: string;
  fornecedorCliente: string;
  parcela: string; // e.g. "1/3", "Única", "3/5"
  vencimento: string; // DD/MM/YYYY
  valor: number;
  status: AccountStatus;
  tipo: AccountType; // pagar ou receber
  categoria?: string;
  dataPagamento?: string;
}

export interface Employee {
  id: string;
  nome: string;
  documento: string; // CPF or CNPJ
  cargo: string;
  telefone: string;
  isMotorista: boolean;
  status: 'ativo' | 'inativo';
  avatarInitials?: string;
  email?: string;
}

export interface Category {
  id: string;
  nome: string;
  tipo: 'despesa' | 'receita';
  cor?: string;
  icone?: string;
}

export interface BankAccount {
  id: string;
  nome: string;
  banco: string;
  saldo: number;
  agenciaConta: string;
}

export type UserRole = 'admin' | 'financeiro' | 'comercial' | 'operador';

export interface RolePermissions {
  canViewDashboard: boolean;
  canViewBalances: boolean; // Visualização de saldos reais e faturamento total
  canManageTransactions: boolean; // Lançamentos de despesas e receitas
  canViewTransactions?: boolean; // Compatibilidade de visualização de lançamentos
  canManageAccounts: boolean; // Contas a Pagar e Receber
  canManageQuotes: boolean; // Emissão de Orçamentos e Propostas
  canManageCadastros: boolean; // Gestão de Funcionários e Motoristas
  canManageEmployees?: boolean; // Compatibilidade de gestão de colaboradores
  canViewReports: boolean; // DRE, Relatórios Gerenciais e Exportações
  canManageSettings: boolean; // Configurações da Usina, Papel Timbrado e Backup
  canManageUsers: boolean; // Gestão de Usuários, Senhas e Perfis
}

export interface SystemUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  roleTitle: string; // Ex: Diretor de Operações, Gerente Financeiro, Engenheiro Comercial, Operador de Balança
  department: string; // Ex: Diretoria, Financeiro, Comercial, Usina
  avatarUrl: string;
  status: 'ativo' | 'inativo';
  createdAt: string;
  lastLogin?: string;
  phone?: string;
}

export interface UserProfile {
  id?: string;
  name: string;
  role: string;
  roleTitle?: string;
  userRole?: UserRole;
  email: string;
  avatarUrl: string;
  status: 'Active' | 'Away' | 'Offline';
}

export interface SystemNotification {
  id: string;
  titulo: string;
  mensagem: string;
  tipo: 'alerta' | 'sucesso' | 'info' | 'erro';
  data: string;
  lida: boolean;
}

// Sync & Offline Types
export type NetworkState = 'online' | 'offline' | 'syncing' | 'error';

export interface SyncQueueItem {
  id: string; // unique operation id
  entityId: string; // target record id
  entityType: 'transaction' | 'account' | 'quote' | 'employee' | 'category' | 'settings' | 'user' | 'partner';
  action: 'create' | 'update' | 'delete';
  payload: any;
  timestamp: string; // ISO string
  retryCount: number;
  status: 'pending' | 'syncing' | 'failed';
  errorMessage?: string;
}

export interface SyncAuditLog {
  id: string;
  timestamp: string;
  description: string;
  type: 'info' | 'success' | 'warning' | 'error';
  itemCount?: number;
}

// Error Diagnostics & Failure Mapping
export type ErrorSeverity = 'critico' | 'alto' | 'medio' | 'baixo';

export type ErrorModule = 
  | 'lancamentos'
  | 'contas'
  | 'orcamentos'
  | 'cadastros'
  | 'funcionarios'
  | 'usuarios'
  | 'configuracoes'
  | 'sincronizacao'
  | 'sistema_storage'
  | 'renderizacao_ui'
  | 'geral';

export interface AppErrorRecord {
  id: string;
  codigo: string;
  modulo: ErrorModule;
  acao: string;
  titulo: string;
  mensagem: string;
  detalhesTecnicos?: string;
  resolucaoSugerida: string;
  acaoRapida?: 'tentar_novamente' | 'exportar_backup' | 'limpar_cache' | 'contatar_suporte' | 'abrir_configuracoes' | 'ver_detalhes';
  payloadResumo?: Record<string, any>;
  timestamp: string;
  resolvido: boolean;
  stack?: string;
  severidade: ErrorSeverity;
}

export interface SystemHealthMetrics {
  status: 'excelente' | 'atencao' | 'critico';
  totalErros24h: number;
  errosNaoResolvidos: number;
  storageUsadoKb: number;
  storageMaxKb: number;
  storagePercentual: number;
  ultimaFalha?: string;
  versaoApp: string;
}

