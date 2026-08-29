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
  BusinessPartner
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
    id: 'user-admin-1',
    name: 'Carlos Oliveira',
    email: 'carlos.diretoria@asphaltpro.com.br',
    role: 'admin',
    roleTitle: 'Diretor de Operações & Sócio',
    department: 'Diretoria Executiva',
    avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB7LkHlJKY7QjurPQFmQAzY7wrUoQvzbkf96mcEvjVg4yWEewc9S01rdk5-KwEfqKsLoY_Ui6xuWB3CJxdksTsQsmZhoXuFwLBuRIGqnG9nvnagE4qFD2RBIaHW3ub0GXDb_0xHACM5AkJKCEQYF7ksj-FlERm_EH2mzPxoalt1JfT364i_D3AEKOgsj7oic4VGcn6Gzw92ljQdO41U8AwbhqqSugM464BKj51SwUv_pd0kM9lCg7cpOw',
    status: 'ativo',
    phone: '(11) 98765-4321',
    createdAt: '2024-01-10T08:00:00.000Z',
    lastLogin: 'Hoje às 09:15'
  },
  {
    id: 'user-fin-2',
    name: 'Mariana Santos',
    email: 'mariana.financeiro@asphaltpro.com.br',
    role: 'financeiro',
    roleTitle: 'Gerente Financeira & Controladoria',
    department: 'Controladoria & Finanças',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    status: 'ativo',
    phone: '(11) 97654-3210',
    createdAt: '2024-02-01T09:00:00.000Z',
    lastLogin: 'Hoje às 08:42'
  },
  {
    id: 'user-com-3',
    name: 'Eng. Roberto Mendes',
    email: 'roberto.comercial@asphaltpro.com.br',
    role: 'comercial',
    roleTitle: 'Engenheiro de Vendas & Orçamentos',
    department: 'Comercial & Pavimentação',
    avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80',
    status: 'ativo',
    phone: '(11) 96543-2109',
    createdAt: '2024-03-15T10:30:00.000Z',
    lastLogin: 'Ontem às 17:10'
  },
  {
    id: 'user-op-4',
    name: 'Valdir Martins',
    email: 'valdir.balanca@asphaltpro.com.br',
    role: 'operador',
    roleTitle: 'Operador Chefe de Balança & Usina',
    department: 'Operações de Pista & Balança',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    status: 'ativo',
    phone: '(11) 95432-1098',
    createdAt: '2024-04-05T07:00:00.000Z',
    lastLogin: 'Hoje às 06:50'
  }
];

export const INITIAL_USER: UserProfile = {
  id: 'user-admin-1',
  name: 'Carlos Oliveira',
  role: 'Diretor de Operações',
  userRole: 'admin',
  email: 'carlos.diretoria@asphaltpro.com.br',
  avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB7LkHlJKY7QjurPQFmQAzY7wrUoQvzbkf96mcEvjVg4yWEewc9S01rdk5-KwEfqKsLoY_Ui6xuWB3CJxdksTsQsmZhoXuFwLBuRIGqnG9nvnagE4qFD2RBIaHW3ub0GXDb_0xHACM5AkJKCEQYF7ksj-FlERm_EH2mzPxoalt1JfT364i_D3AEKOgsj7oic4VGcn6Gzw92ljQdO41U8AwbhqqSugM464BKj51SwUv_pd0kM9lCg7cpOw',
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

export const INITIAL_LETTERHEAD_SETTINGS: LetterheadSettings = {
  backgroundImageUrl: '',
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
  textoPadraoCondicoes: '1. Preços com impostos inclusos (FOB usina ou CIF obra conforme especificado nos itens).\n2. Pagamento: Conforme medições aprovadas ou parcelamento formalizado no aceite.\n3. Massa produzida com controle tecnológico rigoroso em laboratório próprio.\n4. Condições climáticas desfavoráveis (chuvas intensas) prorrogam os prazos de entrega acordados.'
};

export const INITIAL_QUOTES: Quote[] = [
  {
    id: 'orc-1',
    numero: 'ORC-2023-089',
    dataEmissao: '20/11/2023',
    dataValidade: '05/12/2023',
    diasValidade: 15,
    status: 'aprovado',
    cliente: {
      nome: 'Construtora Alpha Ltda.',
      documento: '45.678.901/0001-23',
      contato: 'Dr. Roberto Meireles',
      telefone: '(11) 98765-1122',
      email: 'compras@construtoraalpha.com.br',
      enderecoObra: 'Avenida das Indústrias, 1500 - Distrito Norte',
      cidadeUf: 'Campinas - SP'
    },
    responsavelNome: 'Eng. Carlos Oliveira',
    responsavelCargo: 'Gerente Comercial & Técnico',
    responsavelTelefone: '(19) 99876-5432',
    textoIntroducao: 'Temos a satisfação de apresentar nossa proposta técnica e comercial para pavimentação asfáltica do pátio logístico da Construtora Alpha Ltda.',
    itens: [
      {
        id: 'item-1',
        nome: 'Pintura de Ligação (Emulsão RR-2C)',
        descricao: 'Aplicação mecânica com caminhão espargidor taxa 0,8 l/m²',
        modalidade: 'com_aplicacao',
        quantidade: 4500,
        unidade: 'm²',
        valorUnitario: 4.50,
        valorTotal: 20250.00
      },
      {
        id: 'item-2',
        nome: 'CBUQ Faixa C (CAP 50/70) - Com Aplicação',
        descricao: 'Fornecimento, espalhamento mecânico e compactação (espessura 5cm compactada)',
        modalidade: 'com_aplicacao',
        quantidade: 520,
        unidade: 'ton',
        valorUnitario: 480.00,
        valorTotal: 249600.00
      },
      {
        id: 'item-3',
        nome: 'Transporte Basculante Térmico',
        descricao: 'Frete térmico usina -> obra (18 viagens)',
        modalidade: 'transporte',
        quantidade: 18,
        unidade: 'viagem',
        valorUnitario: 650.00,
        valorTotal: 11700.00
      }
    ],
    subtotal: 281550.00,
    desconto: 6550.00,
    acrescimoFrete: 0,
    valorTotal: 275000.00,
    condicoesPagamento: 'Entrada de 30% no aceite + 3 parcelas de R$ 64.166,67 (30, 60 e 90 dias)',
    prazoEntrega: 'Início em até 5 dias úteis após assinatura do contrato e aprovação de crédito',
    textoObservacoes: 'Massa asfáltica produzida conforme norma DNIT-ES 031/2006. Ensaio Marshall e laudos laboratoriais inclusos.',
    createdAt: '2023-11-20T10:00:00Z'
  },
  {
    id: 'orc-2',
    numero: 'ORC-2023-094',
    dataEmissao: '23/11/2023',
    dataValidade: '08/12/2023',
    diasValidade: 15,
    status: 'enviado',
    cliente: {
      nome: 'Pavimentadora Rápida Eireli',
      documento: '18.902.345/0001-88',
      contato: 'Marcos Vinícius (Operações)',
      telefone: '(19) 97123-4455',
      email: 'operacional@pavimentadorarapida.com.br',
      enderecoObra: 'Retirada Direta na Usina (FOB)',
      cidadeUf: 'Limeira - SP'
    },
    responsavelNome: 'Eng. Carlos Oliveira',
    responsavelCargo: 'Gerente Comercial & Técnico',
    responsavelTelefone: '(19) 99876-5432',
    textoIntroducao: 'Segue cotação para fornecimento de massa asfáltica CBUQ Faixa C para retirada na portaria da nossa unidade fabril.',
    itens: [
      {
        id: 'item-2-1',
        nome: 'CBUQ Faixa C (CAP 50/70) - Retirada FOB',
        descricao: 'Carregamento na balança rodoviária da usina, temperatura 155°C',
        modalidade: 'sem_aplicacao',
        quantidade: 220,
        unidade: 'ton',
        valorUnitario: 380.00,
        valorTotal: 83600.00
      }
    ],
    subtotal: 83600.00,
    desconto: 1600.00,
    acrescimoFrete: 0,
    valorTotal: 82000.00,
    condicoesPagamento: 'Boleto Bancário 28 DDL com aprovação cadastral prévia',
    prazoEntrega: 'Disponibilidade diária de 200 ton com agendamento prévio de 24h',
    textoObservacoes: 'Caminhões devem possuir lona adequada para transporte térmico de asfalto.',
    createdAt: '2023-11-23T11:30:00Z'
  },
  {
    id: 'orc-3',
    numero: 'ORC-2023-095',
    dataEmissao: '24/11/2023',
    dataValidade: '04/12/2023',
    diasValidade: 10,
    status: 'rascunho',
    cliente: {
      nome: 'Residencial Terras do Vale',
      documento: '33.444.555/0001-11',
      contato: 'Eng. Guilherme Santos',
      telefone: '(11) 99344-8899',
      email: 'obras@terrasdovale.com.br',
      enderecoObra: 'Estrada Municipal KM 12 - Portaria 2',
      cidadeUf: 'Piracicaba - SP'
    },
    responsavelNome: 'Eng. Carlos Oliveira',
    responsavelCargo: 'Gerente Comercial & Técnico',
    responsavelTelefone: '(19) 99876-5432',
    textoIntroducao: 'Proposta preliminar para recapeamento asfáltico das vias 04, 05 e rotatória central do loteamento.',
    itens: [
      {
        id: 'item-3-1',
        nome: 'Fresagem e Regularização de Pavimento',
        descricao: 'Fresagem a frio espessura média 3cm',
        modalidade: 'com_aplicacao',
        quantidade: 2800,
        unidade: 'm²',
        valorUnitario: 18.50,
        valorTotal: 51800.00
      },
      {
        id: 'item-3-2',
        nome: 'Pintura de Ligação com Emulsão RR-2C',
        descricao: 'Aplicação mecânica',
        modalidade: 'com_aplicacao',
        quantidade: 2800,
        unidade: 'm²',
        valorUnitario: 4.50,
        valorTotal: 12600.00
      },
      {
        id: 'item-3-3',
        nome: 'CBUQ Faixa C (CAP 50/70) - Com Aplicação',
        descricao: 'CBUQ aplicado com vibroacabadora e compactação',
        modalidade: 'com_aplicacao',
        quantidade: 340,
        unidade: 'ton',
        valorUnitario: 480.00,
        valorTotal: 163200.00
      }
    ],
    subtotal: 227600.00,
    desconto: 2600.00,
    acrescimoFrete: 0,
    valorTotal: 225000.00,
    condicoesPagamento: '40% Entrada + 30 dias + 60 dias (3x)',
    prazoEntrega: 'Prazo de execução estimado em 4 dias de trabalho ininterruptos',
    textoObservacoes: 'Liberação do tráfego leve em 2 horas após a compactação final da massa.',
    createdAt: '2023-11-24T09:00:00Z'
  }
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx-1',
    data: '24/11/2023',
    descricao: 'Fornecimento Brita A',
    categoria: 'Matéria Prima',
    responsavel: 'João Carlos Silva',
    formaPagamento: 'Boleto Bancário',
    valor: 45000,
    tipo: 'saida',
    clienteFornecedor: 'Pedreira São Jorge Ltda',
    contaFinanceira: 'Banco do Brasil - CC 1234-5',
    observacao: 'Carga de 120 toneladas de brita graduada para usinagem da rodovia SP-330.',
    createdAt: '2023-11-24T10:30:00Z'
  },
  {
    id: 'tx-2',
    data: '23/11/2023',
    descricao: 'Pagamento Lote 42 - Pref.',
    categoria: 'Receita',
    responsavel: 'Maria Pereira',
    formaPagamento: 'Transferência',
    valor: 120000,
    tipo: 'entrada',
    clienteFornecedor: 'Prefeitura Municipal',
    contaFinanceira: 'Banco Itaú - CC 8920-1',
    observacao: 'Medição referente ao recapeamento asfáltico do anel viário sul.',
    createdAt: '2023-11-23T14:15:00Z'
  },
  {
    id: 'tx-3',
    data: '22/11/2023',
    descricao: 'Manutenção Usina Base',
    categoria: 'Manutenção',
    responsavel: 'Carlos Silva (Frota)',
    formaPagamento: 'Boleto Bancário',
    valor: 12500,
    tipo: 'saida',
    clienteFornecedor: 'Mecânica Industrial Alpha',
    contaFinanceira: 'Caixa Principal',
    observacao: 'Substituição de correias e rolamentos do misturador contínuo.',
    createdAt: '2023-11-22T09:00:00Z'
  },
  {
    id: 'tx-4',
    data: '21/11/2023',
    descricao: 'Energia Elétrica Usina',
    categoria: 'Operacional',
    responsavel: 'Ana Oliveira (Adm)',
    formaPagamento: 'Transferência Bancária (PIX)',
    valor: 8900,
    tipo: 'saida',
    clienteFornecedor: 'Concessionária de Energia Local',
    contaFinanceira: 'Banco Itaú - CC 8920-1',
    observacao: 'Fatura de energia de alta tensão referente ao ciclo de outubro.',
    createdAt: '2023-11-21T16:45:00Z'
  },
  {
    id: 'tx-5',
    data: '20/11/2023',
    descricao: 'Venda Avulsa Asfalto Frio',
    categoria: 'Venda Direta',
    responsavel: 'Maria Pereira',
    formaPagamento: 'Transferência Bancária (PIX)',
    valor: 34000,
    tipo: 'entrada',
    clienteFornecedor: 'Pavimentadora Rápida Eireli',
    contaFinanceira: 'Caixa Principal',
    observacao: 'Fornecimento de 85 toneladas de CBUQ para tapa-buracos emergencial.',
    createdAt: '2023-11-20T11:20:00Z'
  },
  {
    id: 'tx-6',
    data: '15/10/2023',
    descricao: 'Compra de Cimento (50 sacos)',
    categoria: 'Materiais',
    responsavel: 'João Silva',
    formaPagamento: 'Boleto Bancário',
    valor: 1500,
    tipo: 'saida',
    clienteFornecedor: 'Votorantim Cimentos',
    contaFinanceira: 'Caixa Principal',
    observacao: 'Cimento CP II para base e fixação de guias.',
    createdAt: '2023-10-15T08:10:00Z'
  },
  {
    id: 'tx-7',
    data: '14/10/2023',
    descricao: 'Medição Obra Centro (Adiantamento)',
    categoria: 'Receita',
    responsavel: 'Maria Costa',
    formaPagamento: 'Transferência',
    valor: 15000,
    tipo: 'entrada',
    clienteFornecedor: 'Construtora Alpha Ltda.',
    contaFinanceira: 'Banco do Brasil - CC 1234-5',
    observacao: 'Primeira parcela do contrato de recapeamento Avenida Central.',
    createdAt: '2023-10-14T15:30:00Z'
  },
  {
    id: 'tx-8',
    data: '12/10/2023',
    descricao: 'Locação Retroescavadeira',
    categoria: 'Equipamentos',
    responsavel: 'Carlos Mendes',
    formaPagamento: 'Cartão Corporativo',
    valor: 850,
    tipo: 'saida',
    clienteFornecedor: 'Rental Máquinas Pesadas',
    contaFinanceira: 'Banco Itaú - CC 8920-1',
    observacao: 'Diária adicional com operador para limpeza de canaleta.',
    createdAt: '2023-10-12T17:00:00Z'
  },
  {
    id: 'tx-9',
    data: '10/10/2023',
    descricao: 'Fornecimento CAP 50/70 (Petrobras)',
    categoria: 'Matéria Prima',
    responsavel: 'Roberto Souza',
    formaPagamento: 'Transferência',
    valor: 210000,
    tipo: 'saida',
    clienteFornecedor: 'Petrobras Distribuidora S.A.',
    contaFinanceira: 'Banco do Brasil - CC 1234-5',
    observacao: 'Carreta térmica de 30 mil litros de ligante asfáltico.',
    createdAt: '2023-10-10T10:00:00Z'
  },
  {
    id: 'tx-10',
    data: '08/10/2023',
    descricao: 'Contrato de Pavimentação Condomínio',
    categoria: 'Receita de Serviços',
    responsavel: 'Maria Pereira',
    formaPagamento: 'Boleto Bancário',
    valor: 350000,
    tipo: 'entrada',
    clienteFornecedor: 'Residencial Terras do Vale',
    contaFinanceira: 'Banco Itaú - CC 8920-1',
    observacao: 'Faturamento total das vias internas quadras A, B e C.',
    createdAt: '2023-10-08T11:45:00Z'
  }
];

export const INITIAL_ACCOUNTS: AccountItem[] = [
  {
    id: 'acc-1',
    descricao: 'Cimento CP II (Lote A)',
    fornecedorCliente: 'Votorantim Cimentos',
    parcela: '1/3',
    vencimento: '12/10/2023',
    valor: 12500,
    status: 'atrasado',
    tipo: 'pagar',
    categoria: 'Matéria Prima'
  },
  {
    id: 'acc-2',
    descricao: 'Locação de Escavadeira',
    fornecedorCliente: 'Rental Máquinas Pesadas',
    parcela: 'Única',
    vencimento: '25/10/2023',
    valor: 8200,
    status: 'pendente',
    tipo: 'pagar',
    categoria: 'Equipamentos'
  },
  {
    id: 'acc-3',
    descricao: 'Serviços de Topografia',
    fornecedorCliente: 'GeoEngenharia Ltda',
    parcela: '2/2',
    vencimento: '10/10/2023',
    valor: 4500,
    status: 'pago',
    tipo: 'pagar',
    categoria: 'Serviços Técnicos',
    dataPagamento: '10/10/2023'
  },
  {
    id: 'acc-4',
    descricao: 'Aço CA50 10mm',
    fornecedorCliente: 'Gerdau S.A.',
    parcela: '3/5',
    vencimento: '30/10/2023',
    valor: 21000,
    status: 'pendente',
    tipo: 'pagar',
    categoria: 'Matéria Prima'
  },
  {
    id: 'acc-5',
    descricao: 'Faturas de Energia Obras',
    fornecedorCliente: 'Concessionária Local',
    parcela: 'Única',
    vencimento: '15/10/2023',
    valor: 1250,
    status: 'atrasado',
    tipo: 'pagar',
    categoria: 'Operacional'
  },
  {
    id: 'acc-6',
    descricao: 'Impostos (INSS/FGTS)',
    fornecedorCliente: 'Receita Federal / Caixa',
    parcela: 'Única',
    vencimento: 'Hoje',
    valor: 56000,
    status: 'atrasado',
    tipo: 'pagar',
    categoria: 'Impostos e Folha'
  },
  {
    id: 'acc-7',
    descricao: 'Fornecedor CAP (Petrobras)',
    fornecedorCliente: 'Petrobras S.A.',
    parcela: '2/4',
    vencimento: 'Em 2 dias',
    valor: 210000,
    status: 'pendente',
    tipo: 'pagar',
    categoria: 'Matéria Prima'
  },
  {
    id: 'acc-8',
    descricao: 'Aluguel Máquinas Linha Amarela',
    fornecedorCliente: 'Caterpillar Locações',
    parcela: 'Única',
    vencimento: 'Em 5 dias',
    valor: 85500,
    status: 'pendente',
    tipo: 'pagar',
    categoria: 'Equipamentos'
  },
  {
    id: 'acc-9',
    descricao: 'Folha de Pagamento',
    fornecedorCliente: 'Colaboradores Usina & Frota',
    parcela: 'Mensal',
    vencimento: 'Em 7 dias',
    valor: 145000,
    status: 'pendente',
    tipo: 'pagar',
    categoria: 'Folha de Pagamento'
  },
  // Contas a Receber
  {
    id: 'acc-10',
    descricao: 'Medição 03 - Rodovia Estadual KM 48',
    fornecedorCliente: 'DER - Departamento de Estradas',
    parcela: '3/6',
    vencimento: '28/10/2023',
    valor: 340000,
    status: 'pendente',
    tipo: 'receber',
    categoria: 'Receita de Serviços'
  },
  {
    id: 'acc-11',
    descricao: 'Asfalto Quente CBUQ - Lote B',
    fornecedorCliente: 'Construtora Alpha Ltda.',
    parcela: '1/2',
    vencimento: '20/10/2023',
    valor: 185000,
    status: 'pago',
    tipo: 'receber',
    categoria: 'Venda de Material',
    dataPagamento: '19/10/2023'
  },
  {
    id: 'acc-12',
    descricao: 'Fornecimento Pavimentação Industrial',
    fornecedorCliente: 'Logística Sudeste S.A.',
    parcela: 'Única',
    vencimento: '05/11/2023',
    valor: 155900,
    status: 'pendente',
    tipo: 'receber',
    categoria: 'Receita de Serviços'
  }
];

export const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: 'emp-1',
    nome: 'João Carlos Silva',
    documento: '123.456.789-00',
    cargo: 'Operador de Máquinas',
    telefone: '(11) 98765-4321',
    isMotorista: true,
    status: 'ativo',
    avatarInitials: 'JC',
    email: 'joao.silva@asphaltpro.com.br'
  },
  {
    id: 'emp-2',
    nome: 'Maria Pereira',
    documento: '987.654.321-11',
    cargo: 'Engenheira Civil',
    telefone: '(11) 91234-5678',
    isMotorista: false,
    status: 'ativo',
    avatarInitials: 'MP',
    email: 'maria.pereira@asphaltpro.com.br'
  },
  {
    id: 'emp-3',
    nome: 'Roberto Souza',
    documento: '456.789.123-44',
    cargo: 'Ajudante Geral',
    telefone: '(11) 99888-7777',
    isMotorista: false,
    status: 'inativo',
    avatarInitials: 'RS',
    email: 'roberto.souza@asphaltpro.com.br'
  },
  {
    id: 'emp-4',
    nome: 'Carlos Silva',
    documento: '321.654.987-22',
    cargo: 'Gerente de Frota',
    telefone: '(11) 97777-6655',
    isMotorista: true,
    status: 'ativo',
    avatarInitials: 'CS',
    email: 'carlos.frota@asphaltpro.com.br'
  },
  {
    id: 'emp-5',
    nome: 'Ana Oliveira',
    documento: '654.987.321-55',
    cargo: 'Coordenadora Administrativa',
    telefone: '(11) 96666-4433',
    isMotorista: false,
    status: 'ativo',
    avatarInitials: 'AO',
    email: 'ana.oliveira@asphaltpro.com.br'
  },
  {
    id: 'emp-6',
    nome: 'José Santos',
    documento: '789.123.456-99',
    cargo: 'Chefe de Manutenção',
    telefone: '(11) 95555-3322',
    isMotorista: true,
    status: 'ativo',
    avatarInitials: 'JS',
    email: 'jose.santos@asphaltpro.com.br'
  }
];

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
  { id: 'acc-b1', nome: 'Caixa Principal', banco: 'Tesouraria Interna', saldo: 150000, agenciaConta: '0001 / 001-0' },
  { id: 'acc-b2', nome: 'Banco do Brasil - CC 1234-5', banco: 'Banco do Brasil', saldo: 215000, agenciaConta: 'Ag 1234 / CC 12345-6' },
  { id: 'acc-b3', nome: 'Banco Itaú - CC 8920-1', banco: 'Itaú Unibanco', saldo: 85000, agenciaConta: 'Ag 8920 / CC 89201-3' }
];

export const INITIAL_NOTIFICATIONS: SystemNotification[] = [
  {
    id: 'notif-1',
    titulo: 'Contas a Vencer',
    mensagem: 'A fatura de Impostos (INSS/FGTS) no valor de R$ 56.000,00 vence hoje.',
    tipo: 'alerta',
    data: 'Hoje, 08:30',
    lida: false
  },
  {
    id: 'notif-2',
    titulo: 'Recebimento Confirmado',
    mensagem: 'Pagamento Lote 42 - Prefeitura compensado com sucesso (+ R$ 120.000,00).',
    tipo: 'sucesso',
    data: 'Ontem, 16:45',
    lida: false
  },
  {
    id: 'notif-3',
    titulo: 'Alerta de Insumos',
    mensagem: 'Estoque de CAP 50/70 atingiu o limite de reposição para a próxima semana.',
    tipo: 'info',
    data: '22 Nov, 11:20',
    lida: true
  }
];

export const INITIAL_PARTNERS: BusinessPartner[] = [
  {
    id: 'part-1',
    nome: 'Petrobras Distribuidora S.A.',
    nomeFantasia: 'Petrobras Asfalto',
    tipo: 'fornecedor',
    documento: '33.000.167/0001-01',
    contato: 'Gerência de Vendas Especiais',
    telefone: '(11) 3003-0200',
    email: 'vendas.asfalto@petrobras.com.br',
    cidadeUf: 'Cubatão/SP',
    endereco: 'Refinaria Presidente Bernardes - SP',
    ramoAtividade: 'Cimento Asfáltico de Petróleo (CAP 50/70, CAP 30/45)',
    categoriaPadrao: 'Matéria Prima (CAP / Brita)',
    status: 'ativo'
  },
  {
    id: 'part-2',
    nome: 'Pedreira São Jorge Ltda.',
    nomeFantasia: 'Pedreira São Jorge',
    tipo: 'fornecedor',
    documento: '45.123.789/0001-90',
    contato: 'Marcos Balancista / Suprimentos',
    telefone: '(11) 4712-3400',
    email: 'pedidos@pedreirasaojorge.com.br',
    cidadeUf: 'Mogi das Cruzes/SP',
    endereco: 'Estrada da Pedreira, Km 12',
    ramoAtividade: 'Brita 0, Brita 1, Areia Industrial e Pó de Pedra',
    categoriaPadrao: 'Matéria Prima (CAP / Brita)',
    status: 'ativo'
  },
  {
    id: 'part-3',
    nome: 'Votorantim Cimentos S.A.',
    nomeFantasia: 'Votorantim Cimentos',
    tipo: 'fornecedor',
    documento: '61.064.838/0001-44',
    contato: 'Depto. Comercial Granel',
    telefone: '(11) 3133-7000',
    email: 'comercial@votorantim.com',
    cidadeUf: 'São Paulo/SP',
    endereco: 'Praça Professor José Lannes, 40 - Brooklin',
    ramoAtividade: 'Cimento Portland Especial e Fíler Calcário',
    categoriaPadrao: 'Matéria Prima (CAP / Brita)',
    status: 'ativo'
  },
  {
    id: 'part-4',
    nome: 'Caterpillar Locações e Equipamentos S.A.',
    nomeFantasia: 'Cat Rental Store',
    tipo: 'fornecedor',
    documento: '52.124.980/0001-33',
    contato: 'Atendimento Linha Amarela',
    telefone: '(11) 4004-9800',
    email: 'locacao@caterpillar.com.br',
    cidadeUf: 'Piracicaba/SP',
    endereco: 'Rodovia SP-304, Km 158',
    ramoAtividade: 'Vibroacabadoras, Rolos Compactadores e Fresadoras',
    categoriaPadrao: 'Equipamentos',
    status: 'ativo'
  },
  {
    id: 'part-5',
    nome: 'Secretaria Municipal de Obras & Infraestrutura',
    nomeFantasia: 'Prefeitura Municipal / Sec. Obras',
    tipo: 'cliente',
    documento: '46.395.000/0001-39',
    contato: 'Eng. Roberto Santos - Fiscal de Obras',
    telefone: '(11) 3397-4000',
    email: 'obras.infra@prefeitura.sp.gov.br',
    cidadeUf: 'São Paulo/SP',
    endereco: 'Rua São Bento, 405 - Centro Histórico',
    ramoAtividade: 'Órgão Público / Recapeamento e Vias Urbanas',
    categoriaPadrao: 'Receita de Serviços',
    status: 'ativo'
  },
  {
    id: 'part-6',
    nome: 'Construtora Alpha Engenharia Ltda.',
    nomeFantasia: 'Alpha Engenharia',
    tipo: 'cliente',
    documento: '12.876.543/0001-21',
    contato: 'Carlos Eduardo Alencar (Diretor de Obras)',
    telefone: '(11) 98765-4321',
    email: 'compras@alphaengenharia.com.br',
    cidadeUf: 'Campinas/SP',
    endereco: 'Av. Eng. Carlos Stevenson, 1200 - Nova Campinas',
    ramoAtividade: 'Infraestrutura Rodoviária e Loteamentos',
    categoriaPadrao: 'Receita de Serviços',
    status: 'ativo'
  },
  {
    id: 'part-7',
    nome: 'Residencial Terras do Vale Empreendimentos',
    nomeFantasia: 'Terras do Vale Urbanismo',
    tipo: 'cliente',
    documento: '28.910.345/0001-67',
    contato: 'Juliana Mendes (Engenheira Residente)',
    telefone: '(11) 97123-8899',
    email: 'suprimentos@terrasdovale.com.br',
    cidadeUf: 'São José dos Campos/SP',
    endereco: 'Estrada Municipal Vale Verde, s/n - Gleba 4',
    ramoAtividade: 'Pavimentação de Condomínios e Acessos',
    categoriaPadrao: 'Receita de Serviços',
    status: 'ativo'
  },
  {
    id: 'part-8',
    nome: 'Logística Sudeste S.A.',
    nomeFantasia: 'Sudeste Terminais & Logística',
    tipo: 'cliente',
    documento: '09.345.678/0001-12',
    contato: 'Marcos Vinícius Prado',
    telefone: '(11) 98822-1144',
    email: 'operacoes@logisticasudeste.com.br',
    cidadeUf: 'Santos/SP',
    endereco: 'Av. Cândido Gaffrée, s/n - Porto Organizado',
    ramoAtividade: 'Pátios Industriais e Pavimentação Pesada',
    categoriaPadrao: 'Receita de Serviços',
    status: 'ativo'
  }
];

