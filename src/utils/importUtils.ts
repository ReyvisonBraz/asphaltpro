import {
  Transaction,
  AccountItem,
  BusinessPartner,
  Employee,
  QuoteCatalogItem,
} from '../types';
import { downloadFile } from './exportUtils';
import {
  transactionImportZodSchema,
  accountImportZodSchema,
  partnerImportZodSchema,
  employeeImportZodSchema,
  catalogImportZodSchema,
  normalizeDateToISO,
  normalizeDateToBR,
  parseCurrencyValue,
} from '../schemas/validationSchemas';

export type ImportEntityType =
  | 'transacoes'
  | 'contas'
  | 'parceiros'
  | 'colaboradores'
  | 'catalogo';

export interface FieldDefinition {
  key: string;
  label: string;
  required: boolean;
  example: string;
  description: string;
}

export interface EntityImportSchema {
  title: string;
  description: string;
  entityName: string;
  fields: FieldDefinition[];
  templateRows: string[][];
}

export const IMPORT_SCHEMAS: Record<ImportEntityType, EntityImportSchema> = {
  transacoes: {
    title: 'Lançamentos (Livro Caixa)',
    entityName: 'Lançamentos Financeiros',
    description:
      'Importe movimentações financeiras de entrada e saída. Certifique-se de preencher a data no formato DD/MM/AAAA e o tipo como entrada ou saida.',
    fields: [
      { key: 'data', label: 'Data', required: true, example: '15/05/2026', description: 'Data da movimentação (DD/MM/AAAA ou AAAA-MM-DD)' },
      { key: 'tipo', label: 'Tipo', required: true, example: 'saida', description: 'Tipo da movimentação: "entrada" ou "saida"' },
      { key: 'descricao', label: 'Descrição', required: true, example: 'Aquisição de Emulsão Asfáltica RL-1C', description: 'Descrição da despesa ou receita' },
      { key: 'valor', label: 'Valor (R$)', required: true, example: '4500,00', description: 'Valor numérico em reais (ex: 4500,00 ou 4500.00)' },
      { key: 'categoria', label: 'Categoria', required: true, example: 'Matéria-Prima / Insumos', description: 'Categoria financeira do plano de contas' },
      { key: 'responsavel', label: 'Responsável', required: false, example: 'Eng. Roberto Silva', description: 'Nome do responsável pelo lançamento' },
      { key: 'formaPagamento', label: 'Forma de Pagamento', required: false, example: 'PIX', description: 'PIX, Boleto, Cartão, Transferência ou Dinheiro' },
      { key: 'clienteFornecedor', label: 'Cliente/Fornecedor', required: false, example: 'Distribuidora Petrobras S/A', description: 'Nome da empresa parceira ou favorecido' },
      { key: 'contaFinanceira', label: 'Conta Bancária', required: false, example: 'Banco do Brasil - Usina Principal', description: 'Conta financeira movimentada' },
      { key: 'observacao', label: 'Observação', required: false, example: 'NF-e nº 45892 lote 12B', description: 'Notas ou observações adicionais' },
    ],
    templateRows: [
      [
        '05/05/2026',
        'entrada',
        'Recebimento Pavimentação Av. Central - Medição 01',
        '28500,00',
        'Serviços de Pavimentação',
        'Carlos Mendes',
        'Transferência Bancária',
        'Construtora Horizonte Ltda',
        'Banco do Brasil - Usina Principal',
        'Medição aprovada conforme contrato 2026/04',
      ],
      [
        '10/05/2026',
        'saida',
        'Abastecimento Caminhão Espargidor e Pá Carregadeira',
        '3420,50',
        'Combustíveis & Lubrificantes',
        'Marcos Oliveira',
        'PIX',
        'Posto Rota do Sol',
        'Caixa Usina',
        'Diesel S10 para maquinário de campo',
      ],
      [
        '12/05/2026',
        'saida',
        'Manutenção Preventiva Usina CBUQ - Correias e Rolamentos',
        '1850,00',
        'Manutenção de Máquinas',
        'Eng. Roberto Silva',
        'Boleto',
        'Peças & Usinagem Mecânica',
        'Banco Bradesco',
        'Ordem de serviço nº 308',
      ],
    ],
  },
  contas: {
    title: 'Contas a Pagar e Receber',
    entityName: 'Títulos e Contas',
    description:
      'Importe contas a pagar ou a receber com data de vencimento, valor e identificação do fornecedor/cliente.',
    fields: [
      { key: 'tipo', label: 'Tipo da Conta', required: true, example: 'pagar', description: '"pagar" (Despesa futura) ou "receber" (Receita futura)' },
      { key: 'descricao', label: 'Descrição do Título', required: true, example: 'Fornecimento CAP 50/70 - Carga 30 Toneladas', description: 'Identificação do título' },
      { key: 'fornecedorCliente', label: 'Fornecedor ou Cliente', required: true, example: 'Refinaria Nacional Asfaltos', description: 'Nome da contraparte' },
      { key: 'vencimento', label: 'Vencimento', required: true, example: '25/05/2026', description: 'Data limite para pagamento (DD/MM/AAAA)' },
      { key: 'valor', label: 'Valor (R$)', required: true, example: '12400,00', description: 'Valor total do título a liquidar' },
      { key: 'categoria', label: 'Categoria', required: false, example: 'Matéria-Prima / Insumos', description: 'Classificação contábil' },
      { key: 'parcela', label: 'Parcela', required: false, example: '1/3', description: 'Identificador de parcelamento (ex: 1/1, 1/3, 2/3)' },
      { key: 'status', label: 'Status', required: false, example: 'pendente', description: '"pendente", "pago" ou "atrasado"' },
    ],
    templateRows: [
      [
        'pagar',
        'Fatura de Energia Elétrica Usina Alta Tensão',
        'Companhia Estadual de Energia',
        '20/05/2026',
        '6850,00',
        'Energia & Água',
        '1/1',
        'pendente',
      ],
      [
        'receber',
        'Venda 80 Toneladas CBUQ Faixa C Usinado',
        'Prefeitura Municipal de Santa Rita',
        '30/05/2026',
        '38400,00',
        'Venda de Asfalto (CBUQ)',
        '1/2',
        'pendente',
      ],
      [
        'pagar',
        'Locação de Rolo Compactador Tandem',
        'Locações Pesadas Equipamentos',
        '18/05/2026',
        '4200,00',
        'Locação de Equipamentos',
        '1/1',
        'pendente',
      ],
    ],
  },
  parceiros: {
    title: 'Clientes e Fornecedores',
    entityName: 'Parceiros Comerciais',
    description:
      'Cadastre sua carteira de clientes, empreiteiras, prefeituras e fornecedores de brita, CAP e peças.',
    fields: [
      { key: 'nome', label: 'Razão Social / Nome', required: true, example: 'Construtora Pav Solo Engenharia Ltda', description: 'Nome completo ou Razão Social' },
      { key: 'tipo', label: 'Tipo de Parceiro', required: true, example: 'cliente', description: '"cliente", "fornecedor" ou "ambos"' },
      { key: 'nomeFantasia', label: 'Nome Fantasia', required: false, example: 'Pav Solo Obras', description: 'Nome comercial' },
      { key: 'documento', label: 'CNPJ ou CPF', required: false, example: '12.345.678/0001-90', description: 'Inscrição federal' },
      { key: 'contato', label: 'Pessoa de Contato', required: false, example: 'Eng. Fernando Souza', description: 'Nome do gestor ou comprador' },
      { key: 'telefone', label: 'Telefone / WhatsApp', required: false, example: '(11) 98765-4321', description: 'Telefone para contato' },
      { key: 'email', label: 'E-mail Comercial', required: false, example: 'contato@pavsolo.com.br', description: 'E-mail de compras/financeiro' },
      { key: 'cidadeUf', label: 'Cidade/UF', required: false, example: 'Campinas/SP', description: 'Município e Estado' },
      { key: 'endereco', label: 'Endereço', required: false, example: 'Av. das Indústrias, 1500 - Galpão 04', description: 'Logradouro completo' },
      { key: 'ramoAtividade', label: 'Ramo de Atividade', required: false, example: 'Pavimentação e Terraplenagem', description: 'Segmento da empresa' },
    ],
    templateRows: [
      [
        'Mineração Pedra Branca Ltda',
        'fornecedor',
        'Britagem Pedra Branca',
        '23.456.789/0001-12',
        'Eduardo Rocha (Vendas)',
        '(19) 99123-4567',
        'comercial@pedrabranca.com.br',
        'Limeira/SP',
        'Rodovia SP-147, Km 22',
        'Pedreira e Agregados / Brita 0, 1 e Pó',
      ],
      [
        'Via Rápida Infraestrutura Viária EIRELI',
        'cliente',
        'Via Rápida Engenharia',
        '34.567.890/0001-34',
        'Dra. Cláudia Fontes',
        '(11) 98234-5678',
        'obras@viarapida.com.br',
        'Sorocaba/SP',
        'Rua dos Construtores, 450',
        'Obras Viárias e Condomínios Fechados',
      ],
    ],
  },
  colaboradores: {
    title: 'Colaboradores e Motoristas',
    entityName: 'Equipe da Usina',
    description:
      'Cadastre operadores de usina, motoristas de caçamba/espargidor, encarregados e equipe de pista.',
    fields: [
      { key: 'nome', label: 'Nome Completo', required: true, example: 'Antônio José dos Santos', description: 'Nome do colaborador' },
      { key: 'cargo', label: 'Função / Cargo', required: true, example: 'Operador de Usina de Asfalto', description: 'Cargo ou especialidade' },
      { key: 'documento', label: 'CPF', required: false, example: '123.456.789-00', description: 'CPF do colaborador' },
      { key: 'telefone', label: 'Telefone Celular', required: false, example: '(19) 98765-1122', description: 'Contato do colaborador' },
      { key: 'email', label: 'E-mail', required: false, example: 'antonio.operador@usina.com', description: 'E-mail funcional ou pessoal' },
      { key: 'isMotorista', label: 'É Motorista?', required: false, example: 'NAO', description: '"SIM" se dirige veículos/caminhões ou "NAO"' },
    ],
    templateRows: [
      [
        'Geraldo Pereira Lima',
        'Motorista de Caminhão Basculante Traçado',
        '234.567.890-11',
        '(19) 99876-5432',
        'geraldo.transporte@usina.com',
        'SIM',
      ],
      [
        'Marcos Vinícius Silva',
        'Operador de Vibroacabadora de Asfalto',
        '345.678.901-22',
        '(19) 98765-4321',
        'marcos.operador@usina.com',
        'NAO',
      ],
    ],
  },
  catalogo: {
    title: 'Catálogo de Preços e Insumos',
    entityName: 'Itens do Catálogo',
    description:
      'Tabela de preços de produtos (CBUQ, Emulsão, Britas) e serviços (Imprimação, Fresagem, Aplicação).',
    fields: [
      { key: 'nome', label: 'Nome do Item', required: true, example: 'CBUQ - Concreto Betuminoso Usinado a Quente Faixa C', description: 'Nome do produto ou serviço' },
      { key: 'categoria', label: 'Categoria', required: true, example: 'massa_asfaltica', description: '"massa_asfaltica", "emulsao", "servico_aplicacao", "equipamento" ou "agregado"' },
      { key: 'unidade', label: 'Unidade de Medida', required: true, example: 'ton', description: '"ton", "m2", "m3", "litro", "hora", "diaria" ou "un"' },
      { key: 'precoUnitario', label: 'Preço Unitário (R$)', required: true, example: '420,00', description: 'Valor de tabela do item' },
      { key: 'descricao', label: 'Descrição Detalhada', required: false, example: 'Massa asfáltica padrão DER/DNIT para capa de rolamento', description: 'Especificações técnicas' },
    ],
    templateRows: [
      [
        'CBUQ Faixa C (Capa de Rolamento)',
        'massa_asfaltica',
        'ton',
        '435,00',
        'Massa asfáltica usinada a quente para revestimento final de pavimentos',
      ],
      [
        'Emulsão Asfáltica de Imprimação EAI',
        'emulsao',
        'ton',
        '5200,00',
        'Emulsão betuminosa para imprimação e pintura de ligação',
      ],
      [
        'Serviço de Aplicação e Compactação com Acabadora',
        'servico_aplicacao',
        'm2',
        '14,50',
        'Mão de obra e maquinário para espalhamento e compactação de CBUQ',
      ],
    ],
  },
};

/**
 * Generates and downloads an official CSV template with clear headers and required field markers (*)
 */
export function downloadTemplateCsv(entityType: ImportEntityType) {
  const schema = IMPORT_SCHEMAS[entityType];
  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = `modelo_importacao_${entityType}_${dateStr}.csv`;

  // Headers: Add (*) to required fields to make it crystal clear to the user
  const headers = schema.fields.map((f) => {
    return f.required ? `${f.label} (Obrigatório)*` : f.label;
  });

  const BOM = '\uFEFF';
  const escapeCell = (val: string) => `"${String(val || '').replace(/"/g, '""')}"`;
  const headerLine = headers.map(escapeCell).join(';');
  const sampleLines = schema.templateRows.map((row) => row.map(escapeCell).join(';'));

  const csvContent = BOM + [headerLine, ...sampleLines].join('\r\n');
  downloadFile(csvContent, filename, 'text/csv');
  return filename;
}

/**
 * Clean and parse currency string (e.g. "1.500,50", "1500.50", "R$ 1.500,00") into number
 */
export function parseCurrencyInput(value: string | number | undefined | null): number | null {
  return parseCurrencyValue(value);
}

/**
 * Standardize Date string into YYYY-MM-DD format with calendar validation
 */
export function standardizeDate(dateStr: string | undefined | null): string | null {
  return normalizeDateToISO(dateStr);
}

/**
 * Robust CSV parser that splits lines and handles quotes and delimiter detection (; or ,)
 */
export function parseRawCsvText(csvText: string): { headers: string[]; rows: string[][] } {
  // Strip BOM if present
  let cleanText = csvText.replace(/^\uFEFF/, '').trim();
  if (!cleanText) return { headers: [], rows: [] };

  // Parse lines respecting quotes that might contain newlines
  const lines: string[] = [];
  let currentLine = '';
  let inQuotes = false;

  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];
    if (char === '"') {
      inQuotes = !inQuotes;
      currentLine += char;
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && cleanText[i + 1] === '\n') {
        i++; // skip \n in CRLF
      }
      if (currentLine.trim()) {
        lines.push(currentLine);
      }
      currentLine = '';
    } else {
      currentLine += char;
    }
  }
  if (currentLine.trim()) {
    lines.push(currentLine);
  }

  if (lines.length === 0) return { headers: [], rows: [] };

  // Detect delimiter (; or ,) based on the first line
  const firstLine = lines[0];
  const countSemi = (firstLine.match(/;/g) || []).length;
  const countComma = (firstLine.match(/,/g) || []).length;
  const delimiter = countSemi >= countComma ? ';' : ',';

  // Helper to split a line by delimiter respecting quotes
  const splitLine = (line: string): string[] => {
    const cells: string[] = [];
    let currentCell = '';
    let insideQuote = false;

    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        if (insideQuote && line[i + 1] === '"') {
          currentCell += '"';
          i++; // skip escaped quote
        } else {
          insideQuote = !insideQuote;
        }
      } else if (c === delimiter && !insideQuote) {
        cells.push(currentCell.trim());
        currentCell = '';
      } else {
        currentCell += c;
      }
    }
    cells.push(currentCell.trim());
    return cells;
  };

  const rawHeaders = splitLine(lines[0]);
  const dataRows = lines.slice(1).map(splitLine).filter((r) => r.some((c) => c !== ''));

  return { headers: rawHeaders, rows: dataRows };
}

export interface ValidationItemResult<T> {
  rowNumber: number;
  data: Partial<T>;
  rawRow: Record<string, string>;
  isValid: boolean;
  errors: string[];
}

export interface ImportValidationResult<T> {
  totalRows: number;
  validCount: number;
  invalidCount: number;
  items: ValidationItemResult<T>[];
  headers: string[];
}

/**
 * Validates parsed CSV against the selected entity schema
 */
export function validateImportData<T = any>(
  entityType: ImportEntityType,
  csvText: string
): ImportValidationResult<T> {
  const schema = IMPORT_SCHEMAS[entityType];
  const { headers, rows } = parseRawCsvText(csvText);

  if (headers.length === 0 || rows.length === 0) {
    return {
      totalRows: 0,
      validCount: 0,
      invalidCount: 0,
      items: [],
      headers: [],
    };
  }

  // Map header index to schema fields by loose name matching
  const fieldMapping: Record<number, FieldDefinition> = {};

  headers.forEach((h, colIdx) => {
    const cleanHeader = h
      .toLowerCase()
      .replace(/\(obrigatório\)/gi, '')
      .replace(/\*/g, '')
      .replace(/[_\s-]/g, '')
      .trim();

    // Find matching field
    const matchedField = schema.fields.find((f) => {
      const cleanFieldLabel = f.label.toLowerCase().replace(/[_\s-]/g, '').trim();
      const cleanFieldKey = f.key.toLowerCase().replace(/[_\s-]/g, '').trim();
      return (
        cleanHeader.includes(cleanFieldLabel) ||
        cleanFieldLabel.includes(cleanHeader) ||
        cleanHeader.includes(cleanFieldKey) ||
        cleanFieldKey.includes(cleanHeader)
      );
    });

    if (matchedField) {
      fieldMapping[colIdx] = matchedField;
    }
  });

  // If header matching didn't catch enough, default to position index
  if (Object.keys(fieldMapping).length < Math.min(schema.fields.length, headers.length) / 2) {
    schema.fields.forEach((field, idx) => {
      if (idx < headers.length) {
        fieldMapping[idx] = field;
      }
    });
  }

  const results: ValidationItemResult<T>[] = [];

  rows.forEach((row, rowIdx) => {
    const rowNumber = rowIdx + 2; // +1 for header, +1 for 1-based index
    const rawRow: Record<string, string> = {};
    const extractedData: any = {};
    const errors: string[] = [];

    // Extract columns
    row.forEach((val, colIdx) => {
      const headerName = headers[colIdx] || `Coluna ${colIdx + 1}`;
      rawRow[headerName] = val;

      const field = fieldMapping[colIdx];
      if (field) {
        extractedData[field.key] = val;
      }
    });

    // Run entity-specific Zod schema validation
    let parsedResultData: any = extractedData;

    if (entityType === 'transacoes') {
      const zodRes = transactionImportZodSchema.safeParse(extractedData);
      if (!zodRes.success) {
        zodRes.error.issues.forEach((issue) => {
          errors.push(issue.message);
        });
      } else {
        parsedResultData = {
          ...zodRes.data,
          id: `tx_imp_${Date.now()}_${rowIdx}`,
          createdAt: new Date().toISOString(),
        };
      }
    } else if (entityType === 'contas') {
      const zodRes = accountImportZodSchema.safeParse(extractedData);
      if (!zodRes.success) {
        zodRes.error.issues.forEach((issue) => {
          errors.push(issue.message);
        });
      } else {
        parsedResultData = {
          ...zodRes.data,
          id: `acc_imp_${Date.now()}_${rowIdx}`,
        };
      }
    } else if (entityType === 'parceiros') {
      const zodRes = partnerImportZodSchema.safeParse(extractedData);
      if (!zodRes.success) {
        zodRes.error.issues.forEach((issue) => {
          errors.push(issue.message);
        });
      } else {
        parsedResultData = {
          ...zodRes.data,
          id: `part_imp_${Date.now()}_${rowIdx}`,
          status: 'ativo',
        };
      }
    } else if (entityType === 'colaboradores') {
      const zodRes = employeeImportZodSchema.safeParse(extractedData);
      if (!zodRes.success) {
        zodRes.error.issues.forEach((issue) => {
          errors.push(issue.message);
        });
      } else {
        parsedResultData = {
          ...zodRes.data,
          id: `emp_imp_${Date.now()}_${rowIdx}`,
          status: 'ativo',
        };
      }
    } else if (entityType === 'catalogo') {
      const zodRes = catalogImportZodSchema.safeParse(extractedData);
      if (!zodRes.success) {
        zodRes.error.issues.forEach((issue) => {
          errors.push(issue.message);
        });
      } else {
        parsedResultData = {
          ...zodRes.data,
          id: `cat_imp_${Date.now()}_${rowIdx}`,
          ativo: true,
        };
      }
    }

    const isValid = errors.length === 0;

    results.push({
      rowNumber,
      data: isValid ? parsedResultData : extractedData,
      rawRow,
      isValid,
      errors,
    });
  });

  const validCount = results.filter((r) => r.isValid).length;
  const invalidCount = results.filter((r) => !r.isValid).length;

  return {
    totalRows: rows.length,
    validCount,
    invalidCount,
    items: results,
    headers,
  };
}
