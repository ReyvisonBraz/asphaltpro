import { z } from 'zod';

/**
 * Validates a date string and verifies it represents a real calendar date.
 * Supports formats: 'DD/MM/YYYY', 'YYYY-MM-DD', 'DD-MM-YYYY'.
 */
function isValidCalendarDate(day: number, month: number, year: number): boolean {
  if (year < 1900 || year > 2100) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1) return false;

  const daysInMonth = new Date(year, month, 0).getDate();
  return day <= daysInMonth;
}

/**
 * Normalizes any valid date string into standardized 'YYYY-MM-DD'.
 */
export function normalizeDateToISO(val: unknown): string | null {
  if (!val) return null;
  if (val instanceof Date && !isNaN(val.getTime())) {
    const yyyy = val.getFullYear();
    const mm = String(val.getMonth() + 1).padStart(2, '0');
    const dd = String(val.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  const str = String(val).trim();
  if (!str) return null;

  // DD/MM/YYYY or DD-MM-YYYY
  if (str.includes('/') || (str.includes('-') && str.split('-')[0].length <= 2)) {
    const parts = str.split(/[/-]/);
    if (parts.length === 3) {
      const d = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      const rawYear = parts[2].trim();
      const y = parseInt(rawYear.length === 2 ? `20${rawYear}` : rawYear, 10);

      if (isValidCalendarDate(d, m, y)) {
        return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      }
    }
  }

  // YYYY-MM-DD
  if (str.includes('-') && str.split('-')[0].length === 4) {
    const parts = str.split('-');
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      const d = parseInt(parts[2], 10);

      if (isValidCalendarDate(d, m, y)) {
        return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      }
    }
  }

  // Fallback parse attempt
  const timestamp = Date.parse(str);
  if (!isNaN(timestamp)) {
    const date = new Date(timestamp);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    if (isValidCalendarDate(parseInt(dd, 10), parseInt(mm, 10), yyyy)) {
      return `${yyyy}-${mm}-${dd}`;
    }
  }

  return null;
}

/**
 * Normalizes any valid date string into Brazilian 'DD/MM/YYYY'.
 */
export function normalizeDateToBR(val: unknown): string | null {
  const iso = normalizeDateToISO(val);
  if (!iso) return null;
  const [yyyy, mm, dd] = iso.split('-');
  return `${dd}/${mm}/${yyyy}`;
}

/**
 * Parses and validates currency values from numeric, formatted strings (e.g. "R$ 1.500,50", "1500.50").
 */
export function parseCurrencyValue(val: unknown): number | null {
  if (val === undefined || val === null || val === '') return null;
  if (typeof val === 'number') {
    return isNaN(val) || !isFinite(val) ? null : Math.round(val * 100) / 100;
  }

  const cleanStr = String(val)
    .replace(/R\$/gi, '')
    .replace(/\s+/g, '')
    .trim();

  if (!cleanStr) return null;

  // Brazilian format: 1.500,50 or 1500,50
  if (cleanStr.includes(',')) {
    const standardized = cleanStr.replace(/\./g, '').replace(',', '.');
    const num = parseFloat(standardized);
    return isNaN(num) || !isFinite(num) ? null : Math.round(num * 100) / 100;
  }

  // Standard format: 1500.50
  const num = parseFloat(cleanStr);
  return isNaN(num) || !isFinite(num) ? null : Math.round(num * 100) / 100;
}

// -----------------------------------------------------------------------------
// REUSABLE ZOD CUSTOM FIELD VALIDATORS
// -----------------------------------------------------------------------------

/**
 * Zod schema for Currency fields that must be strictly positive (valor > 0).
 */
export const currencyPositiveSchema = (fieldName = 'Valor') =>
  z.preprocess(
    parseCurrencyValue,
    z
      .number({
        message: `${fieldName} deve ser um valor numérico válido (ex: 1500,00).`,
      })
      .gt(0, { message: `${fieldName} deve ser maior que zero (R$ 0,01+).` })
  );

/**
 * Zod schema for Currency fields that can be zero or positive (valor >= 0, e.g. discounts, freights, balances).
 */
export const currencyNonNegativeSchema = (fieldName = 'Valor') =>
  z.preprocess(
    (val) => {
      if (val === '' || val === undefined || val === null) return 0;
      return parseCurrencyValue(val);
    },
    z
      .number({
        message: `${fieldName} deve ser um valor numérico válido.`,
      })
      .min(0, { message: `${fieldName} não pode ser negativo.` })
  );

/**
 * Zod schema for Optional Currency fields.
 */
export const optionalCurrencySchema = (fieldName = 'Valor') =>
  z.preprocess(
    (val) => {
      if (val === '' || val === undefined || val === null) return undefined;
      return parseCurrencyValue(val);
    },
    z
      .number({
        message: `${fieldName} deve ser um valor numérico válido.`,
      })
      .min(0, { message: `${fieldName} não pode ser negativo.` })
      .optional()
  );

/**
 * Zod schema for Brazilian Date format (DD/MM/AAAA) with strict calendar validation.
 */
export const dateBRSchema = (fieldName = 'Data') =>
  z.preprocess(
    (val) => {
      if (!val) return '';
      const formatted = normalizeDateToBR(val);
      return formatted || val;
    },
    z
      .string({
        message: `${fieldName} é obrigatória.`,
      })
      .min(1, { message: `${fieldName} é obrigatória.` })
      .refine(
        (val) => {
          const formatted = normalizeDateToBR(val);
          return formatted !== null;
        },
        {
          message: `${fieldName} inválida. Use o formato DD/MM/AAAA (ex: 15/05/2026).`,
        }
      )
  );

/**
 * Zod schema for ISO Date format (YYYY-MM-DD) with strict calendar validation.
 */
export const dateISOSchema = (fieldName = 'Data') =>
  z.preprocess(
    (val) => {
      if (!val) return '';
      const formatted = normalizeDateToISO(val);
      return formatted || val;
    },
    z
      .string({
        message: `${fieldName} é obrigatória.`,
      })
      .min(1, { message: `${fieldName} é obrigatória.` })
      .refine(
        (val) => {
          const formatted = normalizeDateToISO(val);
          return formatted !== null;
        },
        {
          message: `${fieldName} inválida. Formato esperado: DD/MM/AAAA ou AAAA-MM-DD.`,
        }
      )
  );

/**
 * Zod schema for Optional Brazilian Date.
 */
export const optionalDateBRSchema = (fieldName = 'Data') =>
  z.preprocess(
    (val) => {
      if (!val) return undefined;
      const formatted = normalizeDateToBR(val);
      return formatted || val;
    },
    z
      .string()
      .refine(
        (val) => {
          if (!val) return true;
          return normalizeDateToBR(val) !== null;
        },
        {
          message: `${fieldName} inválida. Use o formato DD/MM/AAAA.`,
        }
      )
      .optional()
  );

// -----------------------------------------------------------------------------
// IMPORT VALIDATION SCHEMAS (CSV / SPREADSHEETS)
// -----------------------------------------------------------------------------

/**
 * Schema for validating rows of 'transacoes' (Livro Caixa) CSV imports.
 */
export const transactionImportZodSchema = z.object({
  data: z.preprocess(
    (val) => normalizeDateToISO(val) || val,
    z
      .string({ message: 'Data é obrigatória.' })
      .min(1, 'Data é obrigatória.')
      .refine((val) => normalizeDateToISO(val) !== null, {
        message: 'Data inválida. Use DD/MM/AAAA ou AAAA-MM-DD.',
      })
  ),
  tipo: z.preprocess(
    (val) => {
      const s = String(val || '').toLowerCase().trim();
      if (s.includes('entrad') || s.includes('receit')) return 'entrada';
      if (s.includes('said') || s.includes('despes')) return 'saida';
      return s;
    },
    z.enum(['entrada', 'saida'], {
      message: 'Tipo deve ser "entrada" ou "saida".',
    })
  ),
  descricao: z
    .string({ message: 'Descrição é obrigatória.' })
    .trim()
    .min(2, 'Descrição deve ter no mínimo 2 caracteres.'),
  valor: currencyPositiveSchema('Valor'),
  categoria: z
    .string()
    .trim()
    .default('Outros'),
  responsavel: z
    .string()
    .trim()
    .default('Geral'),
  formaPagamento: z
    .string()
    .trim()
    .default('Outros'),
  clienteFornecedor: z
    .string()
    .trim()
    .optional()
    .default(''),
  contaFinanceira: z
    .string()
    .trim()
    .optional()
    .default('Caixa Principal Usina'),
  observacao: z
    .string()
    .trim()
    .optional()
    .default(''),
});

/**
 * Schema for validating rows of 'contas' (Pagar/Receber) CSV imports.
 */
export const accountImportZodSchema = z.object({
  tipo: z.preprocess(
    (val) => {
      const s = String(val || '').toLowerCase().trim();
      if (s.includes('receb') || s.includes('receit')) return 'receber';
      if (s.includes('pag') || s.includes('despes')) return 'pagar';
      return s;
    },
    z.enum(['pagar', 'receber'], {
      message: 'Tipo deve ser "pagar" ou "receber".',
    })
  ),
  descricao: z
    .string({ message: 'Descrição do título é obrigatória.' })
    .trim()
    .min(2, 'Descrição deve ter no mínimo 2 caracteres.'),
  fornecedorCliente: z
    .string({ message: 'Fornecedor ou Cliente é obrigatório.' })
    .trim()
    .min(2, 'Fornecedor ou Cliente deve ter no mínimo 2 caracteres.'),
  vencimento: z.preprocess(
    (val) => normalizeDateToISO(val) || val,
    z
      .string({ message: 'Vencimento é obrigatório.' })
      .min(1, 'Vencimento é obrigatório.')
      .refine((val) => normalizeDateToISO(val) !== null, {
        message: 'Vencimento inválido. Formato esperado: DD/MM/AAAA.',
      })
  ),
  valor: currencyPositiveSchema('Valor'),
  categoria: z
    .string()
    .trim()
    .default('Geral'),
  parcela: z
    .string()
    .trim()
    .default('1/1'),
  status: z.preprocess(
    (val) => {
      const s = String(val || '').toLowerCase().trim();
      if (s.includes('pago') || s.includes('liquid')) return 'pago';
      if (s.includes('atras')) return 'atrasado';
      return 'pendente';
    },
    z.enum(['pendente', 'pago', 'atrasado']).default('pendente')
  ),
});

/**
 * Schema for validating rows of 'parceiros' (Clientes e Fornecedores) CSV imports.
 */
export const partnerImportZodSchema = z.object({
  nome: z
    .string({ message: 'Razão Social ou Nome é obrigatório.' })
    .trim()
    .min(2, 'Razão Social deve ter no mínimo 2 caracteres.'),
  tipo: z.preprocess(
    (val) => {
      const s = String(val || '').toLowerCase().trim();
      if (s.includes('fornec')) return 'fornecedor';
      if (s.includes('ambos')) return 'ambos';
      return 'cliente';
    },
    z.enum(['cliente', 'fornecedor', 'ambos']).default('cliente')
  ),
  nomeFantasia: z.string().trim().optional(),
  documento: z.string().trim().optional(),
  contato: z.string().trim().optional(),
  telefone: z.string().trim().optional(),
  email: z
    .string()
    .trim()
    .optional()
    .refine(
      (val) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
      'E-mail com formato inválido.'
    ),
  cidadeUf: z.string().trim().optional(),
  endereco: z.string().trim().optional(),
  ramoAtividade: z.string().trim().optional(),
});

/**
 * Schema for validating rows of 'colaboradores' (Equipe e Motoristas) CSV imports.
 */
export const employeeImportZodSchema = z.object({
  nome: z
    .string({ message: 'Nome do colaborador é obrigatório.' })
    .trim()
    .min(2, 'Nome deve ter no mínimo 2 caracteres.'),
  cargo: z
    .string({ message: 'Cargo / Função é obrigatório.' })
    .trim()
    .min(2, 'Cargo deve ter no mínimo 2 caracteres.'),
  documento: z.string().trim().optional().default(''),
  telefone: z.string().trim().optional().default(''),
  email: z
    .string()
    .trim()
    .optional()
    .refine(
      (val) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
      'E-mail com formato inválido.'
    ),
  isMotorista: z.preprocess((val) => {
    const s = String(val || '').toLowerCase().trim();
    return s === 'sim' || s === 'true' || s === '1' || s === 's';
  }, z.boolean().default(false)),
});

/**
 * Schema for validating rows of 'catalogo' (Itens e Preços) CSV imports.
 */
export const catalogImportZodSchema = z.object({
  nome: z
    .string({ message: 'Nome do item é obrigatório.' })
    .trim()
    .min(2, 'Nome do item deve ter no mínimo 2 caracteres.'),
  categoria: z
    .string()
    .trim()
    .default('massa_asfaltica'),
  unidade: z
    .string()
    .trim()
    .default('ton'),
  precoUnitario: currencyPositiveSchema('Preço Unitário'),
  descricao: z.string().trim().optional().default(''),
});

// -----------------------------------------------------------------------------
// MANUAL FORM ENTRY SCHEMAS (MODALS & DRAWERS)
// -----------------------------------------------------------------------------

/**
 * Manual form entry schema for Novo Lançamento (Livro Caixa).
 */
export const transactionFormSchema = z.object({
  tipo: z.enum(['entrada', 'saida'], {
    message: 'Selecione o tipo da movimentação (Entrada ou Saída).',
  }),
  data: dateBRSchema('Data do lançamento'),
  valor: currencyPositiveSchema('Valor do lançamento'),
  categoria: z
    .string({ message: 'Selecione a categoria contábil.' })
    .trim()
    .min(1, 'Selecione a categoria contábil.'),
  responsavel: z
    .string({ message: 'Informe o responsável.' })
    .trim()
    .min(1, 'Informe o responsável pelo lançamento.'),
  contaFinanceira: z
    .string({ message: 'Selecione a conta bancária/caixa.' })
    .trim()
    .min(1, 'Selecione a conta financeira.'),
  clienteFornecedor: z
    .string()
    .trim()
    .min(1, 'Informe o cliente ou fornecedor favorecido.'),
  formaPagamento: z.string().trim().min(1, 'Selecione a forma de pagamento.'),
  observacao: z.string().trim().optional(),
  comprovanteNome: z.string().optional(),
});

export type TransactionFormData = z.infer<typeof transactionFormSchema>;

/**
 * Manual form entry schema for Nova Conta (A Pagar ou A Receber).
 */
export const accountFormSchema = z.object({
  tipo: z.enum(['pagar', 'receber'], {
    message: 'Selecione se é conta a Pagar ou a Receber.',
  }),
  descricao: z
    .string({ message: 'Informe a descrição do compromisso.' })
    .trim()
    .min(2, 'A descrição deve ter no mínimo 2 caracteres.'),
  fornecedorCliente: z
    .string()
    .trim()
    .min(1, 'Informe o fornecedor ou cliente.'),
  vencimento: dateBRSchema('Data de vencimento'),
  valor: currencyPositiveSchema('Valor do título'),
  totalParcelas: z.preprocess(
    (val) => {
      const num = parseInt(String(val || '1'), 10);
      return isNaN(num) || num < 1 ? 1 : num;
    },
    z.number().int().min(1, 'O número de parcelas deve ser no mínimo 1.').max(120, 'Máximo de 120 parcelas.')
  ),
  categoria: z.string().trim().min(1, 'Selecione a categoria financeira.'),
  status: z.enum(['pendente', 'pago', 'atrasado']).default('pendente'),
});

export type AccountFormData = z.infer<typeof accountFormSchema>;

/**
 * Manual form entry schema for Business Partner (Cliente / Fornecedor).
 */
export const partnerFormSchema = z.object({
  nome: z
    .string({ message: 'Informe o nome ou razão social do parceiro.' })
    .trim()
    .min(2, 'O nome ou razão social deve ter no mínimo 2 caracteres.'),
  nomeFantasia: z.string().trim().optional(),
  tipo: z.enum(['cliente', 'fornecedor', 'ambos'], {
    message: 'Selecione o tipo de parceiro.',
  }),
  documento: z.string().trim().optional(),
  contato: z.string().trim().optional(),
  telefone: z.string().trim().optional(),
  email: z
    .string()
    .trim()
    .optional()
    .refine(
      (val) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
      'E-mail comercial em formato inválido.'
    ),
  cidadeUf: z.string().trim().optional(),
  endereco: z.string().trim().optional(),
  ramoAtividade: z.string().trim().optional(),
});

export type PartnerFormData = z.infer<typeof partnerFormSchema>;

/**
 * Manual form entry schema for Employee (Colaborador / Motorista).
 */
export const employeeFormSchema = z.object({
  nome: z
    .string({ message: 'Informe o nome completo do colaborador.' })
    .trim()
    .min(2, 'O nome deve ter no mínimo 2 caracteres.'),
  cargo: z
    .string({ message: 'Informe a função ou cargo.' })
    .trim()
    .min(2, 'Cargo deve ter no mínimo 2 caracteres.'),
  documento: z.string().trim().optional(),
  telefone: z.string().trim().optional(),
  isMotorista: z.boolean().default(false),
  status: z.enum(['ativo', 'inativo']).default('ativo'),
});

export type EmployeeFormData = z.infer<typeof employeeFormSchema>;

/**
 * Manual form entry schema for Financial Category.
 */
export const categoryFormSchema = z.object({
  nome: z
    .string({ message: 'Informe o nome da categoria.' })
    .trim()
    .min(2, 'O nome da categoria deve ter no mínimo 2 caracteres.'),
  tipo: z.enum(['receita', 'despesa'], {
    message: 'Selecione se a categoria é de Receita ou Despesa.',
  }),
  icone: z.string().trim().default('category'),
  cor: z.string().trim().default('#835400'),
});

export type CategoryFormData = z.infer<typeof categoryFormSchema>;

/**
 * Manual form entry schema for Bank Account.
 */
export const bankAccountFormSchema = z.object({
  nome: z
    .string({ message: 'Informe a identificação da conta/caixa.' })
    .trim()
    .min(2, 'Nome da conta deve ter no mínimo 2 caracteres.'),
  banco: z
    .string({ message: 'Informe a instituição bancária.' })
    .trim()
    .min(2, 'Nome do banco deve ter no mínimo 2 caracteres.'),
  agenciaConta: z.string().trim().optional(),
  saldo: currencyNonNegativeSchema('Saldo Inicial'),
});

export type BankAccountFormData = z.infer<typeof bankAccountFormSchema>;

/**
 * Manual form entry schema for Catalog Item.
 */
export const catalogItemFormSchema = z.object({
  nome: z
    .string({ message: 'Informe o nome do produto ou serviço.' })
    .trim()
    .min(2, 'O nome deve ter no mínimo 2 caracteres.'),
  descricao: z.string().trim().optional(),
  modalidade: z.enum([
    'com_aplicacao',
    'sem_aplicacao',
    'transporte',
    'locacao',
    'material',
  ]),
  unidadePadrao: z.string().trim().min(1, 'Informe a unidade de medida padrão (ex: ton, m2, un).'),
  valorUnitarioPadrao: currencyPositiveSchema('Preço Unitário Padrão'),
});

export type CatalogItemFormData = z.infer<typeof catalogItemFormSchema>;

/**
 * Schema for Quote Items inside NovoOrcamentoModal.
 */
export const quoteItemFormSchema = z.object({
  id: z.string().optional(),
  nome: z
    .string({ message: 'Nome do item é obrigatório.' })
    .trim()
    .min(2, 'Nome do item deve ter no mínimo 2 caracteres.'),
  descricao: z.string().trim().optional(),
  modalidade: z.enum([
    'com_aplicacao',
    'sem_aplicacao',
    'transporte',
    'locacao',
    'material',
  ]),
  quantidade: z.preprocess(
    (val) => {
      if (typeof val === 'number') return val;
      const parsed = parseFloat(String(val || '').replace(',', '.'));
      return isNaN(parsed) ? 0 : parsed;
    },
    z.number().gt(0, 'Quantidade deve ser maior que zero.')
  ),
  unidade: z.string().trim().min(1, 'Unidade é obrigatória.'),
  valorUnitario: currencyPositiveSchema('Valor Unitário'),
  valorTotal: z.number().optional(),
});

export type QuoteItemFormData = z.infer<typeof quoteItemFormSchema>;

/**
 * Manual form entry schema for Quotes / Propostas Comerciais.
 */
export const quoteFormSchema = z.object({
  numero: z.string().trim().min(1, 'Número da proposta é obrigatório.'),
  dataEmissao: dateBRSchema('Data de emissão'),
  diasValidade: z.preprocess(
    (val) => parseInt(String(val || '15'), 10) || 15,
    z.number().int().min(1, 'Validade deve ser de no mínimo 1 dia.')
  ),
  status: z.enum(['rascunho', 'enviado', 'aprovado', 'convertido', 'recusado', 'expirado']),
  clienteNome: z
    .string({ message: 'Nome do cliente é obrigatório.' })
    .trim()
    .min(2, 'Nome do cliente deve ter no mínimo 2 caracteres.'),
  clienteDocumento: z.string().trim().optional(),
  clienteContato: z.string().trim().optional(),
  clienteTelefone: z.string().trim().optional(),
  clienteEmail: z
    .string()
    .trim()
    .optional()
    .refine(
      (val) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
      'E-mail do cliente com formato inválido.'
    ),
  clienteEnderecoObra: z.string().trim().optional(),
  clienteCidadeUf: z.string().trim().optional(),
  textoIntroducao: z.string().trim().optional(),
  textoObservacoes: z.string().trim().optional(),
  condicoesPagamento: z.string().trim().optional(),
  prazoEntrega: z.string().trim().optional(),
  responsavelNome: z.string().trim().min(1, 'Nome do responsável é obrigatório.'),
  responsavelCargo: z.string().trim().optional(),
  desconto: currencyNonNegativeSchema('Desconto'),
  acrescimoFrete: currencyNonNegativeSchema('Frete / Adicional'),
  itens: z
    .array(quoteItemFormSchema)
    .min(1, 'A proposta comercial deve conter pelo menos 1 item.'),
});

export type QuoteFormData = z.infer<typeof quoteFormSchema>;

// -----------------------------------------------------------------------------
// GENERAL VALIDATION RUNNERS & ERROR FORMATTERS
// -----------------------------------------------------------------------------

export interface ValidationSuccess<T> {
  success: true;
  data: T;
  errors?: never;
  errorList?: never;
  firstError?: never;
}

export interface ValidationError {
  success: false;
  data?: never;
  errors: Record<string, string>;
  errorList: string[];
  firstError: string;
}

export type FormValidationResult<T> = ValidationSuccess<T> | ValidationError;

/**
 * Validates any data payload against a Zod schema and returns normalized errors.
 */
export function validateForm<T>(
  schema: z.ZodType<T>,
  data: unknown
): FormValidationResult<T> {
  const result = schema.safeParse(data);

  if (result.success) {
    return {
      success: true,
      data: result.data,
    };
  }

  const errors: Record<string, string> = {};
  const errorList: string[] = [];

  for (const issue of result.error.issues) {
    const field = issue.path.length > 0 ? issue.path.join('.') : 'root';
    if (!errors[field]) {
      errors[field] = issue.message;
    }
    errorList.push(issue.message);
  }

  return {
    success: false,
    errors,
    errorList,
    firstError: errorList[0] || 'Erro de validação dos dados informados.',
  };
}
