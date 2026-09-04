import {
  Transaction,
  AccountItem,
  Employee,
  Category,
  BankAccount,
  UserProfile,
  SystemUser,
  UserRole,
  RolePermissions,
  SystemNotification,
  Quote,
  QuoteCatalogItem,
  LetterheadSettings,
  BusinessPartner,
  TextoRapidoPreset
} from '../types';

export const ROLE_PERMISSIONS_MAP: Record<UserRole, RolePermissions> = {
  admin: {
    canViewDashboard: true,
    canViewBalances: true,
    canManageTransactions: true,
    canManageAccounts: true,
    canManageQuotes: true,
    canManageCadastros: true,
    canViewReports: true,
    canManageSettings: true,
    canManageUsers: true,
  },
  financeiro: {
    canViewDashboard: true,
    canViewBalances: true,
    canManageTransactions: true,
    canManageAccounts: true,
    canManageQuotes: true,
    canManageCadastros: true,
    canViewReports: true,
    canManageSettings: false,
    canManageUsers: false,
  },
  comercial: {
    canViewDashboard: true,
    canViewBalances: false,
    canManageTransactions: false,
    canManageAccounts: false,
    canManageQuotes: true,
    canManageCadastros: true,
    canViewReports: false,
    canManageSettings: false,
    canManageUsers: false,
  },
  operador: {
    canViewDashboard: true,
    canViewBalances: false,
    canManageTransactions: true, // Apenas despesas operacionais rápidas de pista / diárias
    canManageAccounts: false,
    canManageQuotes: false,
    canManageCadastros: true, // Visualizar motoristas e equipes
    canViewReports: false,
    canManageSettings: false,
    canManageUsers: false,
  }
};

export const INITIAL_SYSTEM_USERS: SystemUser[] = [
  {
    id: 'user-admin-principal',
    name: 'Administrador Principal',
    email: 'admin@empresa.com.br',
    role: 'admin',
    roleTitle: 'Administrador Geral & Gestor',
    department: 'Diretoria / Gestão',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    status: 'ativo',
    phone: '(00) 00000-0000',
    createdAt: '2024-01-01T08:00:00.000Z',
    lastLogin: 'Agora'
  }
];

export const INITIAL_USER: UserProfile = {
  id: 'user-admin-principal',
  name: 'Administrador Principal',
  role: 'Administrador Geral',
  userRole: 'admin',
  email: 'admin@empresa.com.br',
  avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
  status: 'Active'
};

export const INITIAL_QUOTE_CATALOG: QuoteCatalogItem[] = [
  {
    id: 'cat-item-1',
    nome: 'CBUQ Faixa C (CAP 50/70) - Com Aplicação',
    descricao: 'Concreto Betuminoso Usinado a Quente incluindo espalhamento mecanizado, nivelamento e compactação com rolos liso e pneumático.',
    modalidade: 'com_aplicacao',
    unidadePadrao: 'ton',
    valorUnitarioPadrao: 480.00
  },
  {
    id: 'cat-item-2',
    nome: 'CBUQ Faixa C (CAP 50/70) - Retirada na Usina (FOB)',
    descricao: 'Massa asfáltica a quente carregada no caminhão do cliente na usina à temperatura padrão (150°C a 165°C). Sem aplicação.',
    modalidade: 'sem_aplicacao',
    unidadePadrao: 'ton',
    valorUnitarioPadrao: 380.00
  },
  {
    id: 'cat-item-3',
    nome: 'CBUQ Faixa B (Binder / Camada de Ligação)',
    descricao: 'Mistura asfáltica grossa para camada de base/binder estrutural. Alta resistência.',
    modalidade: 'sem_aplicacao',
    unidadePadrao: 'ton',
    valorUnitarioPadrao: 365.00
  },
  {
    id: 'cat-item-4',
    nome: 'Pintura de Ligação (Emulsão Asfáltica RR-2C)',
    descricao: 'Aplicação mecânica de emulsão asfáltica com caminhão espargidor com taxa controlada (0,8 a 1,0 l/m²).',
    modalidade: 'com_aplicacao',
    unidadePadrao: 'm²',
    valorUnitarioPadrao: 4.50
  },
  {
    id: 'cat-item-5',
    nome: 'Transporte Basculante Térmico com Lona Térmica',
    descricao: 'Frete em caminhão traçado com caçamba isolada e lona antichamas para conservação da temperatura.',
    modalidade: 'transporte',
    unidadePadrao: 'viagem',
    valorUnitarioPadrao: 650.00
  },
  {
    id: 'cat-item-6',
    nome: 'Locação Vibroacabadora de Asfalto com Equipe',
    descricao: 'Diária de vibroacabadora de esteira com operador especializado e nivelamento laser.',
    modalidade: 'locacao',
    unidadePadrao: 'diária',
    valorUnitarioPadrao: 3200.00
  },
  {
    id: 'cat-item-7',
    nome: 'Asfalto Frio para Tapa-Buraco (Pronto Uso)',
    descricao: 'Mistura asfáltica modificada com polímero aplicada a frio em sacos valvulados.',
    modalidade: 'material',
    unidadePadrao: 'saco 25kg',
    valorUnitarioPadrao: 38.00
  },
  {
    id: 'cat-item-8',
    nome: 'Fresagem a Frio de Pavimento Asfáltico (e = 3 a 5 cm)',
    descricao: 'Corte e desbaste do pavimento antigo com fresadora de 1,00m ou 2,00m com descarte.',
    modalidade: 'com_aplicacao',
    unidadePadrao: 'm²',
    valorUnitarioPadrao: 18.50
  }
];

export const DEFAULT_TEXTOS_RAPIDOS: TextoRapidoPreset[] = [
  {
    id: 'tr-1',
    label: 'CBUQ Faixa C (5cm)',
    categoria: 'item_tecnico',
    text: 'Concreto Betuminoso Usinado a Quente (CBUQ) Faixa C, espessura compactada e=5,0 cm, fornecido e aplicado com rolo liso e de pneus.'
  },
  {
    id: 'tr-2',
    label: 'Imprimação RR-1C',
    categoria: 'item_tecnico',
    text: 'Pintura de imprimação ligante com emulsão asfáltica catiônica RR-1C na taxa de 1,0 a 1,2 kg/m².'
  },
  {
    id: 'tr-3',
    label: 'Pintura de Ligação',
    categoria: 'item_tecnico',
    text: 'Pintura de ligação com emulsão RR-1C diluída na taxa de 0,5 kg/m² para aderência da capa asfáltica.'
  },
  {
    id: 'tr-4',
    label: 'Fresagem a Frio',
    categoria: 'item_tecnico',
    text: 'Fresagem mecânica a frio de pavimento asfáltico deteriorado na espessura média de 4,0 a 5,0 cm com descarte.'
  },
  {
    id: 'tr-5',
    label: 'Base BGS Compactada',
    categoria: 'item_tecnico',
    text: 'Execução de sub-base e base em Brita Graduada Simples (BGS) compactada com grau de compactação mínimo 100% PN.'
  },
  {
    id: 'tr-6',
    label: 'Transporte Basculante Térmico',
    categoria: 'item_tecnico',
    text: 'Transporte rodoviário de massa asfáltica em caminhão basculante com lona térmica para retenção de temperatura mínima de 145°C.'
  },
  {
    id: 'tr-7',
    label: 'Faturamento 30 DDL',
    categoria: 'pagamento',
    text: 'Faturamento para 30 dias direto da data de emissão (30 DDL) mediante aprovação cadastral.'
  },
  {
    id: 'tr-8',
    label: 'Entrada 30% + Saldo 30/60d',
    categoria: 'pagamento',
    text: 'Sinal de 30% no aceite e saldo restante faturado em 2 parcelas (30 e 60 dias da entrega).'
  },
  {
    id: 'tr-9',
    label: 'À Vista PIX / TED',
    categoria: 'pagamento',
    text: 'Pagamento à vista via transferência PIX ou TED com desconto comercial aplicado no fechamento.'
  },
  {
    id: 'tr-10',
    label: 'Normas DNIT / DER',
    categoria: 'condicoes_gerais',
    text: 'Fornecimento e aplicação em rigorosa conformidade com a especificação DNIT 031/2006-ES e controle tecnológico acreditado.'
  },
  {
    id: 'tr-11',
    label: 'Restrições Pluviométricas',
    categoria: 'condicoes_gerais',
    text: 'Aplicação suspensa em dias de chuva intensa ou pista molhada, prorrogando-se automaticamente o cronograma executivo.'
  }
];

export const INITIAL_LETTERHEAD_SETTINGS: LetterheadSettings = {
  backgroundImageUrl: '',
  logoUrl: '',
  usarTimbradoPersonalizado: false,
  nomeEmpresa: 'Usina de Asfalto Paulista S.A.',
  cnpj: '12.345.678/0001-90',
  inscricaoEstadual: '112.345.678.900',
  enderecoUsina: 'Rodovia Anhanguera, KM 145 + 800m - Distrito Industrial, Limeira - SP',
  telefone: '(19) 3456-7890 / (19) 99876-5432',
  emailComercial: 'comercial@asphaltpro.com.br',
  siteUrl: 'www.asphaltpro.com.br',
  validadeDiasPadrao: 15,
  responsavelPadraoNome: 'Eng. Carlos Oliveira',
  responsavelPadraoCargo: 'Gerente Comercial & Técnico - CREA 506123456',
  margemTopoMm: 20,
  margemBaseMm: 18,
  margemLateralMm: 16,
  textoPadraoIntroducao: 'Apresentamos nossa proposta técnica e comercial para fornecimento e/ou aplicação de Concreto Betuminoso Usinado a Quente (CBUQ) com ligante CAP 50/70 e agregados selecionados, conforme normas DNIT / DER.',
  textoPadraoCondicoes: '1. Preços com impostos inclusos (FOB usina ou CIF obra conforme especificado nos itens).\n2. Pagamento: Conforme medições aprovadas ou parcelamento formalizado no aceite.\n3. Massa produzida com controle tecnológico rigoroso em laboratório próprio.\n4. Condições climáticas desfavoráveis (chuvas intensas) prorrogam os prazos de entrega acordados.',
  textosRapidos: DEFAULT_TEXTOS_RAPIDOS
};

export const INITIAL_QUOTES: Quote[] = [];

export const INITIAL_TRANSACTIONS: Transaction[] = [];

export const INITIAL_ACCOUNTS: AccountItem[] = [];

export const INITIAL_EMPLOYEES: Employee[] = [];

export const INITIAL_CATEGORIES: Category[] = [
  { id: 'cat-1', nome: 'Matéria Prima', tipo: 'despesa', cor: '#1C1C1E', icone: 'inventory_2' },
  { id: 'cat-2', nome: 'Folha de Pagamento', tipo: 'despesa', cor: '#F2A93B', icone: 'badge' },
  { id: 'cat-3', nome: 'Logística', tipo: 'despesa', cor: '#2F9E44', icone: 'local_shipping' },
  { id: 'cat-4', nome: 'Manutenção', tipo: 'despesa', cor: '#E03131', icone: 'build' },
  { id: 'cat-5', nome: 'Operacional', tipo: 'despesa', cor: '#46464A', icone: 'settings' },
  { id: 'cat-6', nome: 'Equipamentos', tipo: 'despesa', cor: '#633F00', icone: 'precision_manufacturing' },
  { id: 'cat-7', nome: 'Receita de Serviços', tipo: 'receita', cor: '#2F9E44', icone: 'trending_up' },
  { id: 'cat-8', nome: 'Venda de Material', tipo: 'receita', cor: '#2F9E44', icone: 'storefront' },
  { id: 'cat-9', nome: 'Venda Direta', tipo: 'receita', cor: '#2F9E44', icone: 'point_of_sale' }
];

export const INITIAL_BANK_ACCOUNTS: BankAccount[] = [
  { id: 'acc-b1', nome: 'Caixa Principal (Tesouraria Usina)', banco: 'Tesouraria Interna', saldo: 0, agenciaConta: '0001 / 001-0' }
];

export const INITIAL_NOTIFICATIONS: SystemNotification[] = [
  {
    id: 'notif-welcome',
    titulo: 'Base de Produção Inicializada',
    mensagem: 'Sistema pronto para operação real. Cadastre seus clientes e lance seus primeiros orçamentos e movimentações.',
    tipo: 'sucesso',
    data: 'Hoje',
    lida: false
  }
];

export const INITIAL_PARTNERS: BusinessPartner[] = [];
