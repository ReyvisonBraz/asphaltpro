export function formatCurrency(value: number): string {
  if (value === undefined || value === null || isNaN(value)) {
    return 'R$ 0,00';
  }
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

export function formatCurrencyParts(value: number): { whole: string; cents: string } {
  const formatted = formatCurrency(value);
  const parts = formatted.split(',');
  return {
    whole: parts[0] || 'R$ 0',
    cents: parts[1] ? `,${parts[1]}` : ',00'
  };
}

/**
 * Formats a numeric value into a Brazilian currency string without the 'R$' symbol,
 * using thousands dot and decimal comma (e.g. 1500 -> "1.500,00", 0 -> "0,00").
 */
export function formatCurrencyValue(value: number): string {
  if (value === undefined || value === null || isNaN(value)) {
    return '0,00';
  }
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

/**
 * Real-time mask for currency inputs in Brazilian Real (BRL).
 * Extracts raw digits and formats dynamically as cents move, e.g.:
 * - Typing 1 -> "0,01"
 * - Typing 10 -> "0,10"
 * - Typing 100 -> "1,00"
 * - Typing 1000 -> "10,00"
 * - Typing 10000 -> "100,00"
 * - Typing 100000 -> "1.000,00"
 * - Typing 150000 -> "1.500,00"
 */
export function maskCurrencyInput(rawInput: string): string {
  if (!rawInput) return '';
  const cleanDigits = rawInput.replace(/\D/g, '');
  if (!cleanDigits) return '';

  // Prevent excessive length overflow
  const maxDigits = cleanDigits.slice(0, 14);
  const cents = parseInt(maxDigits, 10);
  if (isNaN(cents)) return '';

  const valueNumber = cents / 100;
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(valueNumber);
}

/**
 * Parses pasted text into a formatted Brazilian currency string.
 * Handles pasted "1000", "1500", "1500.50", "1.500,00", "R$ 1.500,00", etc.
 */
export function parseAndFormatPastedCurrency(rawPasted: string): string {
  if (!rawPasted) return '';
  const clean = rawPasted.replace(/R\$/gi, '').trim();

  // If string contains comma, e.g. "1.500,50" or "1500,50"
  if (clean.includes(',')) {
    const num = parseFloat(clean.replace(/\./g, '').replace(',', '.'));
    return isNaN(num) ? maskCurrencyInput(clean) : formatCurrencyValue(num);
  }

  // If string contains dot
  if (clean.includes('.')) {
    const dotCount = (clean.match(/\./g) || []).length;
    if (dotCount > 1) {
      const num = parseFloat(clean.replace(/\./g, ''));
      return isNaN(num) ? maskCurrencyInput(clean) : formatCurrencyValue(num);
    }
    // Single dot: could be decimal (1500.50) or thousand (1.500)
    const parts = clean.split('.');
    if (parts[1] && parts[1].length === 3) {
      const num = parseFloat(clean.replace(/\./g, ''));
      return isNaN(num) ? maskCurrencyInput(clean) : formatCurrencyValue(num);
    }
    const num = parseFloat(clean);
    return isNaN(num) ? maskCurrencyInput(clean) : formatCurrencyValue(num);
  }

  // Pure integer digits: e.g. user pasted "1000" or "1500" -> treat as integer reais
  const num = parseFloat(clean);
  if (!isNaN(num)) {
    return formatCurrencyValue(num);
  }

  return maskCurrencyInput(clean);
}

export function parseCurrencyInput(input: string): number {
  if (!input) return 0;
  // Remove non-digits except comma
  const cleaned = input.replace(/[^\d,]/g, '').replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

export function maskCpfCnpj(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 11) {
    // CPF: 000.000.000-00
    return digits
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  } else {
    // CNPJ: 00.000.000/0000-00
    return digits
      .slice(0, 14)
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  }
}

export function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 10) {
    return digits
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  } else {
    return digits
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2');
  }
}

export function formatDateToBR(dateStr: string): string {
  if (!dateStr) return '';
  const trimmed = dateStr.trim();
  if (trimmed.includes('/')) return trimmed;
  if (trimmed.includes('-')) {
    const parts = trimmed.split('-');
    if (parts.length === 3) {
      // If starts with 4 digits: YYYY-MM-DD -> DD/MM/YYYY
      if (parts[0].length === 4) {
        return `${parts[2].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[0]}`;
      }
      // If starts with 1-2 digits: DD-MM-YYYY -> DD/MM/YYYY
      if (parts[2].length === 4) {
        return `${parts[0].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[2]}`;
      }
    }
  }
  return trimmed;
}

/**
 * Parses any date string (DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD, YYYY/MM/DD, ISO timestamps)
 * into a reliable timestamp integer in milliseconds.
 * Respects Brazilian date conventions (DD first when ambiguous).
 */
export function parseAnyDateToTimestamp(dateStr: string, isEndOfDay = false): number | null {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const trimmed = dateStr.trim();
  if (!trimmed) return null;

  // 1. Check DD/MM/YYYY or DD-MM-YYYY
  const brMatch = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (brMatch) {
    const d = parseInt(brMatch[1], 10);
    const m = parseInt(brMatch[2], 10) - 1;
    const y = parseInt(brMatch[3], 10);
    const dateObj = isEndOfDay
      ? new Date(y, m, d, 23, 59, 59, 999)
      : new Date(y, m, d, 0, 0, 0, 0);
    return isNaN(dateObj.getTime()) ? null : dateObj.getTime();
  }

  // 2. Check YYYY-MM-DD or YYYY/MM/DD
  const isoMatch = trimmed.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  if (isoMatch) {
    const y = parseInt(isoMatch[1], 10);
    const m = parseInt(isoMatch[2], 10) - 1;
    const d = parseInt(isoMatch[3], 10);
    const dateObj = isEndOfDay
      ? new Date(y, m, d, 23, 59, 59, 999)
      : new Date(y, m, d, 0, 0, 0, 0);
    return isNaN(dateObj.getTime()) ? null : dateObj.getTime();
  }

  // 3. Fallback to standard Date.parse
  const parsed = Date.parse(trimmed);
  return isNaN(parsed) ? null : parsed;
}

export function getTodayDateInputValue(): string {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}
