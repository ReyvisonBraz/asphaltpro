import {
  Transaction,
  AccountItem,
  Employee,
  BusinessPartner,
  Quote,
  QuoteCatalogItem,
  Category,
  BankAccount,
  LetterheadSettings,
  SystemUser,
} from '../types';

export interface FullBackupPayload {
  version: string;
  signature: string;
  exportedAt: string;
  systemName: string;
  metadata: {
    totalTransactions: number;
    totalAccounts: number;
    totalEmployees: number;
    totalPartners: number;
    totalQuotes: number;
    totalCatalogItems: number;
  };
  transactions: Transaction[];
  accounts: AccountItem[];
  employees: Employee[];
  partners: BusinessPartner[];
  quotes: Quote[];
  quoteCatalog: QuoteCatalogItem[];
  categories: Category[];
  bankAccounts: BankAccount[];
  letterheadSettings: LetterheadSettings;
  systemUsers: SystemUser[];
}

/**
 * Triggers native browser download for text/blob content
 */
export function downloadFile(content: string, filename: string, mimeType: string = 'text/plain') {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.setAttribute('href', url);
  anchor.setAttribute('download', filename);
  anchor.style.visibility = 'hidden';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

/**
 * Escapes CSV fields to prevent formatting issues and handle commas/quotes/newlines
 */
function escapeCsvCell(value: any): string {
  if (value === null || value === undefined) return '""';
  const str = String(value).replace(/"/g, '""');
  return `"${str}"`;
}

/**
 * Generates CSV string with UTF-8 BOM so Excel and Google Sheets render Portuguese accents seamlessly
 */
function buildCsv(headers: string[], rows: (string | number | boolean | null | undefined)[][]): string {
  const BOM = '\uFEFF';
  const headerLine = headers.map(escapeCsvCell).join(';');
  const dataLines = rows.map((row) => row.map(escapeCsvCell).join(';'));
  return BOM + [headerLine, ...dataLines].join('\r\n');
}

/**
 * Export full system JSON backup
 */
export function exportSystemJsonBackup(data: {
  transactions: Transaction[];
  accounts: AccountItem[];
  employees: Employee[];
  partners: BusinessPartner[];
  quotes: Quote[];
  quoteCatalog: QuoteCatalogItem[];
  categories: Category[];
  bankAccounts: BankAccount[];
  letterheadSettings: LetterheadSettings;
  systemUsers: SystemUser[];
}): { success: boolean; filename: string } {
  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = `asphalt_pro_backup_${dateStr}.json`;

  const payload: FullBackupPayload = {
    version: '1.2.0',
    signature: 'ASPHALT_PRO_BACKUP_VERIFIED',
    exportedAt: new Date().toISOString(),
    systemName: 'Asphalt Pro - Gestão Financeira e Usina de Asfalto',
    metadata: {
      totalTransactions: data.transactions.length,
      totalAccounts: data.accounts.length,
      totalEmployees: data.employees.length,
      totalPartners: data.partners.length,
      totalQuotes: data.quotes.length,
      totalCatalogItems: data.quoteCatalog.length,
    },
    transactions: data.transactions,
    accounts: data.accounts,
    employees: data.employees,
    partners: data.partners,
    quotes: data.quotes,
    quoteCatalog: data.quoteCatalog,
    categories: data.categories,
    bankAccounts: data.bankAccounts,
    letterheadSettings: data.letterheadSettings,
    systemUsers: data.systemUsers,
  };

  const jsonContent = JSON.stringify(payload, null, 2);
  downloadFile(jsonContent, filename, 'application/json');

  return { success: true, filename };
}

/**
 * Export Transactions (Livro Caixa) to CSV
 */
export function exportTransactionsCsv(transactions: Transaction[]) {
  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = `asphalt_pro_transacoes_${dateStr}.csv`;

  const headers = [
    'ID',
    'Data',
    'Tipo (Entrada/Saída)',
    'Descrição / Favorecido',
    'Categoria',
    'Valor (R$)',
    'Responsável',
    'Forma de Pagamento',
    'Cliente/Fornecedor',
    'Conta Financeira',
    'Observação',
  ];

  const rows = transactions.map((t) => [
    t.id,
    t.data,
    t.tipo === 'entrada' ? 'Entrada (+)' : 'Saída (-)',
    t.descricao,
    t.categoria,
    t.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    t.responsavel || '',
    t.formaPagamento || '',
    t.clienteFornecedor || '',
    t.contaFinanceira || '',
    t.observacao || '',
  ]);

  const csv = buildCsv(headers, rows);
  downloadFile(csv, filename, 'text/csv');
  return filename;
}

/**
 * Export Accounts Payable/Receivable (Contas a Pagar e Receber) to CSV
 */
export function exportAccountsCsv(accounts: AccountItem[]) {
  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = `asphalt_pro_contas_${dateStr}.csv`;

  const headers = [
    'ID',
    'Tipo',
    'Descrição',
    'Fornecedor / Cliente',
    'Categoria',
    'Parcela',
    'Vencimento',
    'Valor (R$)',
    'Status',
    'Data Pagamento',
  ];

  const rows = accounts.map((a) => [
    a.id,
    a.tipo === 'pagar' ? 'A Pagar' : 'A Receber',
    a.descricao,
    a.fornecedorCliente,
    a.categoria || '',
    a.parcela || '1/1',
    a.vencimento,
    a.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    a.status === 'pago' ? 'Liquidado / Pago' : a.status === 'atrasado' ? 'Em Atraso' : 'Pendente',
    a.dataPagamento || '',
  ]);

  const csv = buildCsv(headers, rows);
  downloadFile(csv, filename, 'text/csv');
  return filename;
}

/**
 * Export Quotes (Orçamentos de Asfalto e Serviços) to CSV
 */
export function exportQuotesCsv(quotes: Quote[]) {
  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = `asphalt_pro_orcamentos_${dateStr}.csv`;

  const headers = [
    'Número',
    'Cliente',
    'Documento Cliente',
    'Endereço da Obra',
    'Data Emissão',
    'Validade',
    'Status',
    'Qtd Itens',
    'Resumo dos Itens',
    'Subtotal (R$)',
    'Desconto (R$)',
    'Frete/Acréscimo (R$)',
    'Valor Total (R$)',
    'Condições de Pagamento',
    'Responsável Técnico / Comercial',
    'Faturado em Receita',
  ];

  const rows = quotes.map((q) => [
    q.numero,
    q.cliente.nome,
    q.cliente.documento || '',
    q.cliente.enderecoObra || '',
    q.dataEmissao,
    q.dataValidade,
    q.status.toUpperCase(),
    q.itens.length,
    q.itens.map((i) => `${i.quantidade}${i.unidade} ${i.nome}`).join(' | '),
    q.subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    q.desconto.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    (q.acrescimoFrete || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    q.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    q.condicoesPagamento || '',
    q.responsavelNome || '',
    q.convertidoEmReceita ? 'SIM' : 'NÃO',
  ]);

  const csv = buildCsv(headers, rows);
  downloadFile(csv, filename, 'text/csv');
  return filename;
}

/**
 * Export Business Partners (Clientes e Fornecedores) to CSV
 */
export function exportPartnersCsv(partners: BusinessPartner[]) {
  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = `asphalt_pro_parceiros_${dateStr}.csv`;

  const headers = [
    'ID',
    'Tipo',
    'Razão Social / Nome',
    'Nome Fantasia',
    'CNPJ / CPF',
    'Contato',
    'Telefone',
    'E-mail',
    'Cidade / UF',
    'Endereço',
    'Ramo de Atividade',
    'Status',
  ];

  const rows = partners.map((p) => [
    p.id,
    p.tipo === 'cliente' ? 'Cliente' : p.tipo === 'fornecedor' ? 'Fornecedor' : 'Cliente/Fornecedor',
    p.nome,
    p.nomeFantasia || '',
    p.documento || '',
    p.contato || '',
    p.telefone || '',
    p.email || '',
    p.cidadeUf || '',
    p.endereco || '',
    p.ramoAtividade || '',
    p.status || 'ativo',
  ]);

  const csv = buildCsv(headers, rows);
  downloadFile(csv, filename, 'text/csv');
  return filename;
}

/**
 * Export Employees (Colaboradores e Motoristas) to CSV
 */
export function exportEmployeesCsv(employees: Employee[]) {
  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = `asphalt_pro_colaboradores_${dateStr}.csv`;

  const headers = [
    'ID',
    'Nome Completo',
    'Função / Cargo',
    'Documento (CPF/CNPJ)',
    'Telefone',
    'E-mail',
    'Motorista',
    'Status',
  ];

  const rows = employees.map((e) => [
    e.id,
    e.nome,
    e.cargo,
    e.documento || '',
    e.telefone || '',
    e.email || '',
    e.isMotorista ? 'SIM' : 'NÃO',
    e.status === 'ativo' ? 'Ativo' : 'Inativo',
  ]);

  const csv = buildCsv(headers, rows);
  downloadFile(csv, filename, 'text/csv');
  return filename;
}
