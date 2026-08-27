import React, { createContext, useContext, useState, useEffect } from 'react';
import { syncManager } from '../services/syncManager';
import {
  ViewMode,
  Transaction,
  AccountItem,
  Employee,
  Category,
  BankAccount,
  UserProfile,
  SystemNotification,
  Quote,
  QuoteCatalogItem,
  LetterheadSettings,
  QuoteStatus,
  QuoteConversionOptions
} from '../types';
import {
  INITIAL_USER,
  INITIAL_TRANSACTIONS,
  INITIAL_ACCOUNTS,
  INITIAL_EMPLOYEES,
  INITIAL_CATEGORIES,
  INITIAL_BANK_ACCOUNTS,
  INITIAL_NOTIFICATIONS,
  INITIAL_QUOTES,
  INITIAL_QUOTE_CATALOG,
  INITIAL_LETTERHEAD_SETTINGS
} from '../data/initialData';

interface AppContextType {
  isAuthenticated: boolean;
  user: UserProfile;
  login: (email: string, pass: string) => boolean;
  logout: () => void;
  currentView: ViewMode;
  setCurrentView: (view: ViewMode) => void;
  
  // Data State
  transactions: Transaction[];
  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt'>) => void;
  deleteTransaction: (id: string) => void;
  
  accounts: AccountItem[];
  addAccount: (acc: Omit<AccountItem, 'id'>) => void;
  toggleAccountPaidStatus: (id: string) => void;
  deleteAccount: (id: string) => void;
  
  employees: Employee[];
  addEmployee: (emp: Omit<Employee, 'id' | 'avatarInitials'>) => void;
  updateEmployee: (id: string, emp: Partial<Employee>) => void;
  toggleEmployeeStatus: (id: string) => void;
  deleteEmployee: (id: string) => void;
  
  categories: Category[];
  bankAccounts: BankAccount[];
  notifications: SystemNotification[];
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;

  // Quotes & Letterhead
  quotes: Quote[];
  addQuote: (quote: Omit<Quote, 'id' | 'createdAt'>) => void;
  updateQuote: (id: string, quote: Partial<Quote>) => void;
  deleteQuote: (id: string) => void;
  duplicateQuote: (id: string) => void;
  updateQuoteStatus: (id: string, status: QuoteStatus) => void;
  convertQuoteToRevenue: (quoteId: string, options: QuoteConversionOptions) => void;

  quoteCatalog: QuoteCatalogItem[];
  addCatalogItem: (item: Omit<QuoteCatalogItem, 'id'>) => void;
  updateCatalogItem: (id: string, item: Partial<QuoteCatalogItem>) => void;
  deleteCatalogItem: (id: string) => void;

  letterheadSettings: LetterheadSettings;
  updateLetterheadSettings: (settings: Partial<LetterheadSettings>) => void;

  // Global UI Modals & Drawers
  isNovoLancamentoOpen: boolean;
  setIsNovoLancamentoOpen: (open: boolean) => void;
  novoLancamentoInitialTab: 'entrada' | 'saida';
  openNovoLancamentoWithTab: (tab: 'entrada' | 'saida') => void;
  
  isNovoFuncionarioOpen: boolean;
  setIsNovoFuncionarioOpen: (open: boolean) => void;
  editingEmployee: Employee | null;
  setEditingEmployee: (emp: Employee | null) => void;

  isNovaContaOpen: boolean;
  setIsNovaContaOpen: (open: boolean) => void;

  isNovoOrcamentoOpen: boolean;
  setIsNovoOrcamentoOpen: (open: boolean) => void;
  editingQuote: Quote | null;
  setEditingQuote: (quote: Quote | null) => void;
  viewingQuoteA4: Quote | null;
  setViewingQuoteA4: (quote: Quote | null) => void;
  convertingQuote: Quote | null;
  setConvertingQuote: (quote: Quote | null) => void;
  
  isHelpOpen: boolean;
  setIsHelpOpen: (open: boolean) => void;
  
  isNotificationsOpen: boolean;
  setIsNotificationsOpen: (open: boolean) => void;
  
  isMobileSidebarOpen: boolean;
  setIsMobileSidebarOpen: (open: boolean) => void;
  
  globalSearch: string;
  setGlobalSearch: (search: string) => void;

  // Toast Notification
  toastMessage: { text: string; type: 'success' | 'info' | 'error' } | null;
  showToast: (text: string, type?: 'success' | 'info' | 'error') => void;

  // Computed Financial Aggregates
  saldoAtual: number;
  entradasDoMes: number;
  saidasDoMes: number;
  contasVencendoSemana: number;
  contasEmAtraso: number;
  totalPendentePagar: number;
  totalPendenteReceber: number;

  // Reset to default data
  resetAllData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const saved = localStorage.getItem('asphalt_auth');
    return saved ? JSON.parse(saved) : true; // default logged in for immediate review
  });

  const [user, setUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('asphalt_user');
    return saved ? JSON.parse(saved) : INITIAL_USER;
  });

  const [currentView, setCurrentView] = useState<ViewMode>('dashboard');

  // Transactions State
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('asphalt_transactions');
    return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
  });

  // Accounts State
  const [accounts, setAccounts] = useState<AccountItem[]>(() => {
    const saved = localStorage.getItem('asphalt_accounts');
    return saved ? JSON.parse(saved) : INITIAL_ACCOUNTS;
  });

  // Employees State
  const [employees, setEmployees] = useState<Employee[]>(() => {
    const saved = localStorage.getItem('asphalt_employees');
    return saved ? JSON.parse(saved) : INITIAL_EMPLOYEES;
  });

  // Quotes State
  const [quotes, setQuotes] = useState<Quote[]>(() => {
    const saved = localStorage.getItem('asphalt_quotes');
    return saved ? JSON.parse(saved) : INITIAL_QUOTES;
  });

  // Quote Catalog State
  const [quoteCatalog, setQuoteCatalog] = useState<QuoteCatalogItem[]>(() => {
    const saved = localStorage.getItem('asphalt_quote_catalog');
    return saved ? JSON.parse(saved) : INITIAL_QUOTE_CATALOG;
  });

  // Letterhead Settings State
  const [letterheadSettings, setLetterheadSettings] = useState<LetterheadSettings>(() => {
    const saved = localStorage.getItem('asphalt_letterhead_settings');
    return saved ? JSON.parse(saved) : INITIAL_LETTERHEAD_SETTINGS;
  });

  // Categories & Bank accounts
  const [categories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [bankAccounts] = useState<BankAccount[]>(INITIAL_BANK_ACCOUNTS);

  // Notifications State
  const [notifications, setNotifications] = useState<SystemNotification[]>(() => {
    const saved = localStorage.getItem('asphalt_notifications');
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });

  // Modal States
  const [isNovoLancamentoOpen, setIsNovoLancamentoOpen] = useState(false);
  const [novoLancamentoInitialTab, setNovoLancamentoInitialTab] = useState<'entrada' | 'saida'>('entrada');
  const [isNovoFuncionarioOpen, setIsNovoFuncionarioOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [isNovaContaOpen, setIsNovaContaOpen] = useState(false);
  
  // Quote Modals
  const [isNovoOrcamentoOpen, setIsNovoOrcamentoOpen] = useState(false);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [viewingQuoteA4, setViewingQuoteA4] = useState<Quote | null>(null);
  const [convertingQuote, setConvertingQuote] = useState<Quote | null>(null);

  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('asphalt_auth', JSON.stringify(isAuthenticated));
  }, [isAuthenticated]);

  useEffect(() => {
    localStorage.setItem('asphalt_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('asphalt_accounts', JSON.stringify(accounts));
  }, [accounts]);

  useEffect(() => {
    localStorage.setItem('asphalt_employees', JSON.stringify(employees));
  }, [employees]);

  useEffect(() => {
    localStorage.setItem('asphalt_quotes', JSON.stringify(quotes));
  }, [quotes]);

  useEffect(() => {
    localStorage.setItem('asphalt_quote_catalog', JSON.stringify(quoteCatalog));
  }, [quoteCatalog]);

  useEffect(() => {
    localStorage.setItem('asphalt_letterhead_settings', JSON.stringify(letterheadSettings));
  }, [letterheadSettings]);

  useEffect(() => {
    localStorage.setItem('asphalt_notifications', JSON.stringify(notifications));
  }, [notifications]);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const login = (email: string, pass: string) => {
    if (email && pass) {
      setIsAuthenticated(true);
      showToast('Bem-vindo ao Asphalt Pro!', 'success');
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    showToast('Sessão encerrada com sucesso.', 'info');
  };

  const openNovoLancamentoWithTab = (tab: 'entrada' | 'saida') => {
    setNovoLancamentoInitialTab(tab);
    setIsNovoLancamentoOpen(true);
  };

  const addTransaction = (txData: Omit<Transaction, 'id' | 'createdAt'>) => {
    const newTx: Transaction = {
      ...txData,
      id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      createdAt: new Date().toISOString()
    };
    setTransactions(prev => [newTx, ...prev]);
    syncManager.enqueue('transaction', 'create', newTx.id, newTx);
    showToast(`Lançamento de ${txData.tipo === 'entrada' ? 'Receita' : 'Despesa'} registrado!`, 'success');
  };

  const deleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
    syncManager.enqueue('transaction', 'delete', id, { id });
    showToast('Lançamento removido.', 'info');
  };

  const addAccount = (accData: Omit<AccountItem, 'id'>) => {
    const newAcc: AccountItem = {
      ...accData,
      id: `acc-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`
    };
    setAccounts(prev => [newAcc, ...prev]);
    syncManager.enqueue('account', 'create', newAcc.id, newAcc);
    showToast('Conta cadastrada com sucesso!', 'success');
  };

  const toggleAccountPaidStatus = (id: string) => {
    setAccounts(prev => prev.map(acc => {
      if (acc.id === id) {
        const isNowPaid = acc.status !== 'pago';
        const updatedStatus = isNowPaid ? 'pago' : 'pendente';
        const dataPagamento = isNowPaid ? new Date().toLocaleDateString('pt-BR') : undefined;
        
        // When marked as paid, also auto-add as a transaction for consistency
        if (isNowPaid) {
          const newTx: Transaction = {
            id: `tx-paid-${Date.now()}`,
            data: new Date().toLocaleDateString('pt-BR'),
            descricao: `${acc.descricao} (${acc.parcela})`,
            categoria: acc.categoria || (acc.tipo === 'pagar' ? 'Operacional' : 'Receita'),
            responsavel: 'Financeiro Usina',
            formaPagamento: 'Transferência Bancária (PIX)',
            valor: acc.valor,
            tipo: acc.tipo === 'pagar' ? 'saida' : 'entrada',
            clienteFornecedor: acc.fornecedorCliente,
            contaFinanceira: 'Banco do Brasil - CC 1234-5',
            observacao: `Liquidação da conta ${acc.descricao}`,
            createdAt: new Date().toISOString()
          };
          setTransactions(t => [newTx, ...t]);
          syncManager.enqueue('transaction', 'create', newTx.id, newTx);
        }

        const updatedAccount = {
          ...acc,
          status: updatedStatus,
          dataPagamento
        };
        syncManager.enqueue('account', 'update', acc.id, updatedAccount);

        showToast(
          isNowPaid 
            ? `Conta "${acc.descricao}" marcada como Paga/Recebida!` 
            : `Status de "${acc.descricao}" alterado para Pendente.`,
          'success'
        );
        return updatedAccount;
      }
      return acc;
    }));
  };

  const deleteAccount = (id: string) => {
    setAccounts(prev => prev.filter(a => a.id !== id));
    syncManager.enqueue('account', 'delete', id, { id });
    showToast('Conta excluída com sucesso.', 'info');
  };

  const addEmployee = (empData: Omit<Employee, 'id' | 'avatarInitials'>) => {
    const names = empData.nome.trim().split(' ');
    const initials = names.length > 1
      ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
      : names[0].slice(0, 2).toUpperCase();

    const newEmp: Employee = {
      ...empData,
      id: `emp-${Date.now()}`,
      avatarInitials: initials
    };
    setEmployees(prev => [newEmp, ...prev]);
    syncManager.enqueue('employee', 'create', newEmp.id, newEmp);
    showToast(`Funcionário ${empData.nome} cadastrado com sucesso!`, 'success');
  };

  const updateEmployee = (id: string, empData: Partial<Employee>) => {
    setEmployees(prev => prev.map(e => {
      if (e.id === id) {
        let initials = e.avatarInitials;
        if (empData.nome) {
          const names = empData.nome.trim().split(' ');
          initials = names.length > 1
            ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
            : names[0].slice(0, 2).toUpperCase();
        }
        const updated = { ...e, ...empData, avatarInitials: initials };
        syncManager.enqueue('employee', 'update', id, updated);
        return updated;
      }
      return e;
    }));
    showToast('Dados do funcionário atualizados!', 'success');
  };

  const toggleEmployeeStatus = (id: string) => {
    setEmployees(prev => prev.map(e => {
      if (e.id === id) {
        const nextStatus = e.status === 'ativo' ? 'inativo' : 'ativo';
        const updated = { ...e, status: nextStatus };
        syncManager.enqueue('employee', 'update', id, updated);
        showToast(`Colaborador ${e.nome} agora está ${nextStatus.toUpperCase()}.`, 'info');
        return updated;
      }
      return e;
    }));
  };

  const deleteEmployee = (id: string) => {
    setEmployees(prev => prev.filter(e => e.id !== id));
    syncManager.enqueue('employee', 'delete', id, { id });
    showToast('Colaborador removido da base.', 'info');
  };

  // Quotes Logic
  const addQuote = (quoteData: Omit<Quote, 'id' | 'createdAt'>) => {
    const newQuote: Quote = {
      ...quoteData,
      id: `orc-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    setQuotes(prev => [newQuote, ...prev]);
    syncManager.enqueue('quote', 'create', newQuote.id, newQuote);
    showToast(`Orçamento ${newQuote.numero} gerado com sucesso!`, 'success');
  };

  const updateQuote = (id: string, quoteData: Partial<Quote>) => {
    setQuotes(prev => prev.map(q => {
      if (q.id === id) {
        const updated = { ...q, ...quoteData };
        syncManager.enqueue('quote', 'update', id, updated);
        return updated;
      }
      return q;
    }));
    showToast('Orçamento atualizado com sucesso!', 'success');
  };

  const deleteQuote = (id: string) => {
    setQuotes(prev => prev.filter(q => q.id !== id));
    syncManager.enqueue('quote', 'delete', id, { id });
    showToast('Orçamento removido.', 'info');
  };

  const duplicateQuote = (id: string) => {
    const quoteToClone = quotes.find(q => q.id === id);
    if (!quoteToClone) return;

    const today = new Date();
    const formattedToday = today.toLocaleDateString('pt-BR');
    const validityDate = new Date(today.getTime() + quoteToClone.diasValidade * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR');
    const newNumber = `ORC-${today.getFullYear()}-${String(quotes.length + 1).padStart(3, '0')}`;

    const cloned: Quote = {
      ...quoteToClone,
      id: `orc-${Date.now()}`,
      numero: newNumber,
      dataEmissao: formattedToday,
      dataValidade: validityDate,
      status: 'rascunho',
      convertidoEmReceita: false,
      dataConversao: undefined,
      detalhesConversao: undefined,
      createdAt: new Date().toISOString()
    };

    setQuotes(prev => [cloned, ...prev]);
    showToast(`Orçamento clonado como ${newNumber}!`, 'success');
  };

  const updateQuoteStatus = (id: string, status: QuoteStatus) => {
    setQuotes(prev => prev.map(q => q.id === id ? { ...q, status } : q));
    showToast(`Status do orçamento atualizado para "${status.toUpperCase()}".`, 'info');
  };

  const convertQuoteToRevenue = (quoteId: string, options: QuoteConversionOptions) => {
    const targetQuote = quotes.find(q => q.id === quoteId);
    if (!targetQuote) return;

    const todayFormatted = new Date().toLocaleDateString('pt-BR');
    const totalAmount = targetQuote.valorTotal;

    if (options.tipoConversao === 'a_vista') {
      // Direct instant transaction
      const newTx: Transaction = {
        id: `tx-quote-${Date.now()}`,
        data: todayFormatted,
        descricao: `Faturamento Orçamento ${targetQuote.numero} - ${targetQuote.cliente.nome}`,
        categoria: options.categoriaFinanceira || 'Receita de Serviços',
        responsavel: targetQuote.responsavelNome,
        formaPagamento: options.formaPagamento,
        valor: totalAmount,
        tipo: 'entrada',
        clienteFornecedor: targetQuote.cliente.nome,
        contaFinanceira: options.contaBancaria,
        observacao: `Faturamento integral à vista do orçamento ${targetQuote.numero}. Obra: ${targetQuote.cliente.enderecoObra || 'N/A'}. ${options.observacaoConversao || ''}`,
        createdAt: new Date().toISOString()
      };
      setTransactions(prev => [newTx, ...prev]);
    } else if (options.tipoConversao === 'parcelado') {
      // Generate multiple accounts receivable
      const parcelCount = options.numeroParcelas || 1;
      const installmentVal = parseFloat((totalAmount / parcelCount).toFixed(2));
      const newAccounts: AccountItem[] = [];

      // Parse base date
      const [d, m, y] = options.dataPrimeiroVencimento.split('/').map(Number);
      const baseDate = (!isNaN(d) && !isNaN(m) && !isNaN(y)) ? new Date(y, m - 1, d) : new Date();

      for (let i = 1; i <= parcelCount; i++) {
        const dueDate = new Date(baseDate.getTime() + (i - 1) * (options.intervaloDiasParcelas || 30) * 24 * 60 * 60 * 1000);
        newAccounts.push({
          id: `acc-quote-${Date.now()}-${i}`,
          descricao: `Orçamento ${targetQuote.numero} - ${targetQuote.cliente.nome}`,
          fornecedorCliente: targetQuote.cliente.nome,
          parcela: `${i}/${parcelCount}`,
          vencimento: dueDate.toLocaleDateString('pt-BR'),
          valor: i === parcelCount ? totalAmount - (installmentVal * (parcelCount - 1)) : installmentVal,
          status: 'pendente',
          tipo: 'receber',
          categoria: options.categoriaFinanceira || 'Receita de Serviços'
        });
      }

      setAccounts(prev => [...newAccounts, ...prev]);
    } else if (options.tipoConversao === 'misto') {
      // Entry cash + installments
      const entryVal = options.valorEntradaAVista || 0;
      const remainingVal = totalAmount - entryVal;
      const parcelCount = options.numeroParcelas || 1;

      if (entryVal > 0 && options.gerarEntradaHoje) {
        const entryTx: Transaction = {
          id: `tx-quote-entry-${Date.now()}`,
          data: todayFormatted,
          descricao: `Entrada Orçamento ${targetQuote.numero} - ${targetQuote.cliente.nome}`,
          categoria: options.categoriaFinanceira || 'Receita de Serviços',
          responsavel: targetQuote.responsavelNome,
          formaPagamento: options.formaPagamento,
          valor: entryVal,
          tipo: 'entrada',
          clienteFornecedor: targetQuote.cliente.nome,
          contaFinanceira: options.contaBancaria,
          observacao: `Sinal / Entrada do orçamento ${targetQuote.numero}.`,
          createdAt: new Date().toISOString()
        };
        setTransactions(prev => [entryTx, ...prev]);
      }

      if (remainingVal > 0) {
        const installmentVal = parseFloat((remainingVal / parcelCount).toFixed(2));
        const newAccounts: AccountItem[] = [];
        const [d, m, y] = options.dataPrimeiroVencimento.split('/').map(Number);
        const baseDate = (!isNaN(d) && !isNaN(m) && !isNaN(y)) ? new Date(y, m - 1, d) : new Date();

        for (let i = 1; i <= parcelCount; i++) {
          const dueDate = new Date(baseDate.getTime() + (i - 1) * (options.intervaloDiasParcelas || 30) * 24 * 60 * 60 * 1000);
          newAccounts.push({
            id: `acc-quote-mix-${Date.now()}-${i}`,
            descricao: `Orçamento ${targetQuote.numero} (Saldo Parcela) - ${targetQuote.cliente.nome}`,
            fornecedorCliente: targetQuote.cliente.nome,
            parcela: `${i}/${parcelCount}`,
            vencimento: dueDate.toLocaleDateString('pt-BR'),
            valor: i === parcelCount ? remainingVal - (installmentVal * (parcelCount - 1)) : installmentVal,
            status: 'pendente',
            tipo: 'receber',
            categoria: options.categoriaFinanceira || 'Receita de Serviços'
          });
        }
        setAccounts(prev => [...newAccounts, ...prev]);
      }
    }

    // Mark quote as converted
    setQuotes(prev => prev.map(q => {
      if (q.id === quoteId) {
        return {
          ...q,
          status: 'convertido' as QuoteStatus,
          convertidoEmReceita: true,
          dataConversao: todayFormatted,
          detalhesConversao: `Convertido em ${options.tipoConversao === 'a_vista' ? 'Receita à vista' : options.tipoConversao === 'parcelado' ? `${options.numeroParcelas}x parcelas em Contas a Receber` : `Entrada de R$ ${options.valorEntradaAVista?.toLocaleString('pt-BR')} + ${options.numeroParcelas}x parcelas`}`
        };
      }
      return q;
    }));

    showToast(`Orçamento ${targetQuote.numero} convertido em receita financeira com sucesso!`, 'success');
  };

  // Quote Catalog logic
  const addCatalogItem = (itemData: Omit<QuoteCatalogItem, 'id'>) => {
    const newItem: QuoteCatalogItem = {
      ...itemData,
      id: `cat-item-${Date.now()}`
    };
    setQuoteCatalog(prev => [newItem, ...prev]);
    showToast(`Item "${newItem.nome}" adicionado ao catálogo!`, 'success');
  };

  const updateCatalogItem = (id: string, itemData: Partial<QuoteCatalogItem>) => {
    setQuoteCatalog(prev => prev.map(item => item.id === id ? { ...item, ...itemData } : item));
    showToast('Item do catálogo atualizado!', 'success');
  };

  const deleteCatalogItem = (id: string) => {
    setQuoteCatalog(prev => prev.filter(item => item.id !== id));
    showToast('Item removido do catálogo.', 'info');
  };

  const updateLetterheadSettings = (settings: Partial<LetterheadSettings>) => {
    setLetterheadSettings(prev => ({ ...prev, ...settings }));
    showToast('Configurações de papel timbrado A4 salvas!', 'success');
  };

  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, lida: true } : n));
  };

  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, lida: true })));
    showToast('Todas as notificações marcadas como lidas.', 'info');
  };

  const resetAllData = () => {
    setTransactions(INITIAL_TRANSACTIONS);
    setAccounts(INITIAL_ACCOUNTS);
    setEmployees(INITIAL_EMPLOYEES);
    setQuotes(INITIAL_QUOTES);
    setQuoteCatalog(INITIAL_QUOTE_CATALOG);
    setLetterheadSettings(INITIAL_LETTERHEAD_SETTINGS);
    setNotifications(INITIAL_NOTIFICATIONS);
    localStorage.clear();
    showToast('Dados do sistema restaurados para o padrão de fábrica.', 'info');
  };

  // Financial aggregates calculation
  const entradasDoMes = transactions
    .filter(t => t.tipo === 'entrada')
    .reduce((sum, t) => sum + t.valor, 0);

  const saidasDoMes = transactions
    .filter(t => t.tipo === 'saida')
    .reduce((sum, t) => sum + t.valor, 0);

  const saldoAtual = 450000 + (entradasDoMes - INITIAL_TRANSACTIONS.filter(t => t.tipo === 'entrada').reduce((s, t) => s + t.valor, 0)) - (saidasDoMes - INITIAL_TRANSACTIONS.filter(t => t.tipo === 'saida').reduce((s, t) => s + t.valor, 0));

  const contasVencendoSemana = accounts.filter(a => a.tipo === 'pagar' && a.status !== 'pago').length;
  const contasEmAtraso = accounts.filter(a => a.tipo === 'pagar' && a.status === 'atrasado').length;
  const totalPendentePagar = accounts.filter(a => a.tipo === 'pagar' && a.status !== 'pago').reduce((s, a) => s + a.valor, 0);
  const totalPendenteReceber = accounts.filter(a => a.tipo === 'receber' && a.status !== 'pago').reduce((s, a) => s + a.valor, 0);

  return (
    <AppContext.Provider
      value={{
        isAuthenticated,
        user,
        login,
        logout,
        currentView,
        setCurrentView,
        transactions,
        addTransaction,
        deleteTransaction,
        accounts,
        addAccount,
        toggleAccountPaidStatus,
        deleteAccount,
        employees,
        addEmployee,
        updateEmployee,
        toggleEmployeeStatus,
        deleteEmployee,
        categories,
        bankAccounts,
        notifications,
        markNotificationRead,
        markAllNotificationsRead,
        quotes,
        addQuote,
        updateQuote,
        deleteQuote,
        duplicateQuote,
        updateQuoteStatus,
        convertQuoteToRevenue,
        quoteCatalog,
        addCatalogItem,
        updateCatalogItem,
        deleteCatalogItem,
        letterheadSettings,
        updateLetterheadSettings,
        isNovoLancamentoOpen,
        setIsNovoLancamentoOpen,
        novoLancamentoInitialTab,
        openNovoLancamentoWithTab,
        isNovoFuncionarioOpen,
        setIsNovoFuncionarioOpen,
        editingEmployee,
        setEditingEmployee,
        isNovaContaOpen,
        setIsNovaContaOpen,
        isNovoOrcamentoOpen,
        setIsNovoOrcamentoOpen,
        editingQuote,
        setEditingQuote,
        viewingQuoteA4,
        setViewingQuoteA4,
        convertingQuote,
        setConvertingQuote,
        isHelpOpen,
        setIsHelpOpen,
        isNotificationsOpen,
        setIsNotificationsOpen,
        isMobileSidebarOpen,
        setIsMobileSidebarOpen,
        globalSearch,
        setGlobalSearch,
        toastMessage,
        showToast,
        saldoAtual,
        entradasDoMes,
        saidasDoMes,
        contasVencendoSemana,
        contasEmAtraso,
        totalPendentePagar,
        totalPendenteReceber,
        resetAllData
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
