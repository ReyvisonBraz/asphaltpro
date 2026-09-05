import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { syncManager } from '../services/syncManager';
import { errorDiagnosticsService } from '../services/errorDiagnosticsService';
import { logoutFirebaseAuth, getSavedFirebaseConfig, fetchCollectionFromFirestore } from '../services/firebaseConfig';
import {
  exportSystemJsonBackup,
  exportTransactionsCsv,
  exportAccountsCsv,
  exportQuotesCsv,
  exportPartnersCsv,
  exportEmployeesCsv,
} from '../utils/exportUtils';
import {
  ViewMode,
  ToastPosition,
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
  QuoteStatus,
  QuoteConversionOptions,
  AppErrorRecord,
  ErrorModule,
  ErrorSeverity,
  BusinessPartner,
  PartnerType,
} from '../types';
import {
  INITIAL_USER,
  INITIAL_SYSTEM_USERS,
  ROLE_PERMISSIONS_MAP,
  INITIAL_TRANSACTIONS,
  INITIAL_ACCOUNTS,
  INITIAL_EMPLOYEES,
  INITIAL_CATEGORIES,
  INITIAL_BANK_ACCOUNTS,
  INITIAL_NOTIFICATIONS,
  INITIAL_QUOTES,
  INITIAL_QUOTE_CATALOG,
  INITIAL_LETTERHEAD_SETTINGS,
  INITIAL_PARTNERS
} from '../data/initialData';

interface AppContextType {
  isAuthenticated: boolean;
  user: UserProfile;
  userRole: UserRole;
  permissions: RolePermissions;
  systemUsers: SystemUser[];
  switchUser: (userId: string) => void;
  login: (email: string, pass: string, roleOverride?: UserRole) => boolean;
  loginWithGoogleUser: (googleUser: { displayName?: string | null; email?: string | null; photoURL?: string | null; uid?: string }) => boolean;
  logout: () => void;
  currentView: ViewMode;
  setCurrentView: (view: ViewMode) => void;
  navigateBack: () => void;
  canGoBack: boolean;
  previousViewTitle: string | null;
  viewHistory: ViewMode[];
  
  // User Management
  addSystemUser: (userData: Omit<SystemUser, 'id' | 'createdAt'>) => void;
  updateSystemUser: (id: string, userData: Partial<SystemUser>) => void;
  toggleSystemUserStatus: (id: string) => void;
  deleteSystemUser: (id: string) => void;
  
  // Data State
  transactions: Transaction[];
  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt'>) => void;
  updateTransaction: (id: string, txData: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  deduplicateTransactions: () => number;
  
  accounts: AccountItem[];
  addAccount: (acc: Omit<AccountItem, 'id'>) => void;
  toggleAccountPaidStatus: (id: string) => void;
  deleteAccount: (id: string) => void;
  
  employees: Employee[];
  addEmployee: (emp: Omit<Employee, 'id' | 'avatarInitials'>) => void;
  updateEmployee: (id: string, emp: Partial<Employee>) => void;
  toggleEmployeeStatus: (id: string) => void;
  deleteEmployee: (id: string) => void;
  
  // Business Partners (Clientes e Fornecedores)
  partners: BusinessPartner[];
  addPartner: (partner: Omit<BusinessPartner, 'id'>) => void;
  updatePartner: (id: string, partner: Partial<BusinessPartner>) => void;
  deletePartner: (id: string) => void;
  getUnifiedPartners: (filterType?: 'cliente' | 'fornecedor' | 'ambos') => BusinessPartner[];

  categories: Category[];
  addCategory: (categoryData: Omit<Category, 'id'>) => void;
  updateCategory: (id: string, categoryData: Partial<Category>) => void;
  deleteCategory: (id: string) => void;

  bankAccounts: BankAccount[];
  addBankAccount: (accountData: Omit<BankAccount, 'id'>) => void;
  updateBankAccount: (id: string, accountData: Partial<BankAccount>) => void;
  deleteBankAccount: (id: string) => void;

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
  editingTransaction: Transaction | null;
  setEditingTransaction: (tx: Transaction | null) => void;
  openEditLancamento: (tx: Transaction) => void;
  
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
  
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  toggleSidebarCollapsed: () => void;
  
  globalSearch: string;
  setGlobalSearch: (search: string) => void;

  // Toast Notification & Error Diagnostics
  toastMessage: { 
    text: string; 
    type: 'success' | 'info' | 'error';
    errorCode?: string;
    resolucao?: string;
    errorId?: string;
  } | null;
  toastPosition: ToastPosition;
  setToastPosition: (pos: ToastPosition) => void;
  showToast: (
    text: string, 
    type?: 'success' | 'info' | 'error',
    options?: { errorCode?: string; resolucao?: string; errorId?: string }
  ) => void;
  hideToast: () => void;

  isDiagnosticsOpen: boolean;
  setIsDiagnosticsOpen: (open: boolean) => void;
  selectedDiagnosticErrorId: string | null;
  setSelectedDiagnosticErrorId: (id: string | null) => void;
  openDiagnosticsWithError: (id?: string) => void;
  reportSystemError: (params: {
    modulo: ErrorModule;
    acao: string;
    titulo: string;
    mensagem: string;
    codigo?: string;
    severidade?: ErrorSeverity;
    resolucaoSugerida?: string;
    errorObj?: unknown;
  }) => AppErrorRecord;

  // Computed Financial Aggregates
  saldoAtual: number;
  entradasDoMes: number;
  saidasDoMes: number;
  contasVencendoSemana: number;
  contasEmAtraso: number;
  totalPendentePagar: number;
  totalPendenteReceber: number;

  // Backup & Restore & Cloud Sync
  exportFullBackup: () => void;
  importFullBackup: (jsonContent: string) => boolean;
  exportCsvData: (type: 'transacoes' | 'contas' | 'orcamentos' | 'parceiros' | 'colaboradores' | 'todos') => void;
  pullFromCloud: (silent?: boolean) => Promise<{ success: boolean; count: number }>;
  isPullingFromCloud: boolean;

  // Reset to default data
  resetAllData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const VIEW_TITLES: Record<ViewMode, string> = {
  dashboard: 'Início',
  lancamentos: 'Caixa (Lançamentos)',
  contas: 'Contas a Pagar/Receber',
  orcamentos: 'Orçamentos & Propostas',
  cadastros: 'Cadastros Gerais',
  relatorios: 'Relatórios & DRE',
  configuracoes: 'Configurações'
};

const VALID_VIEWS: ViewMode[] = [
  'dashboard',
  'lancamentos',
  'contas',
  'orcamentos',
  'cadastros',
  'relatorios',
  'configuracoes'
];

const getInitialView = (): ViewMode => {
  if (typeof window === 'undefined') return 'dashboard';
  const hash = window.location.hash.replace(/^#\/?/, '').split('?')[0];
  if (VALID_VIEWS.includes(hash as ViewMode)) {
    return hash as ViewMode;
  }
  try {
    const saved = localStorage.getItem('asphalt_current_view');
    if (saved && VALID_VIEWS.includes(saved as ViewMode)) {
      return saved as ViewMode;
    }
  } catch {}
  return 'dashboard';
};

const getInitialViewHistory = (): ViewMode[] => {
  const initial = getInitialView();
  try {
    const saved = sessionStorage.getItem('asphalt_view_history');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0 && parsed.every(v => VALID_VIEWS.includes(v))) {
        if (parsed[parsed.length - 1] === initial) return parsed;
        return [...parsed, initial];
      }
    }
  } catch {}
  return [initial];
};

const saveViewHistory = (history: ViewMode[]) => {
  try {
    sessionStorage.setItem('asphalt_view_history', JSON.stringify(history));
  } catch {}
};

function deduplicateItems<T extends { id: string }>(items: T[], prefix: string = 'item'): T[] {
  if (!Array.isArray(items)) return [];
  const seenIds = new Set<string>();
  return items.map((item, index) => {
    let id = item.id;
    if (!id || seenIds.has(id)) {
      id = `${prefix}-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 7)}`;
    }
    seenIds.add(id);
    return { ...item, id };
  });
}

function deduplicateTransactionsList(items: Transaction[]): Transaction[] {
  if (!Array.isArray(items)) return [];
  const seen = new Set<string>();
  const cleaned: Transaction[] = [];
  for (const tx of items) {
    if (!tx || typeof tx !== 'object') continue;
    const desc = (tx.descricao || '').trim().toLowerCase();
    const cliente = (tx.clienteFornecedor || '').trim().toLowerCase();
    const data = tx.data || '';
    const valor = Number(tx.valor || 0).toFixed(2);
    const tipo = tx.tipo || 'entrada';
    const key = `${desc}|${cliente}|${data}|${valor}|${tipo}`;
    if (!seen.has(key)) {
      seen.add(key);
      cleaned.push(tx);
    }
  }
  return cleaned;
}

// Auto-sanitize on load if transitioning to clean production base requested by user
if (typeof window !== 'undefined') {
  try {
    if (localStorage.getItem('asphalt_production_clean_v1') !== 'true') {
      localStorage.removeItem('asphalt_transactions');
      localStorage.removeItem('asphalt_accounts');
      localStorage.removeItem('asphalt_employees');
      localStorage.removeItem('asphalt_partners');
      localStorage.removeItem('asphalt_quotes');
      localStorage.removeItem('asphalt_system_users');
      localStorage.removeItem('asphalt_user');
      localStorage.setItem('asphalt_production_clean_v1', 'true');
    }
  } catch (e) {
    console.warn('Erro na limpeza inicial:', e);
  }
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const saved = localStorage.getItem('asphalt_auth');
    return saved ? JSON.parse(saved) : false; // default to false: forces Login view on first visit
  });

  // System Users & Roles State
  const [systemUsers, setSystemUsers] = useState<SystemUser[]>(() => {
    const saved = localStorage.getItem('asphalt_system_users');
    return saved ? deduplicateItems(JSON.parse(saved), 'user') : INITIAL_SYSTEM_USERS;
  });

  const [user, setUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('asphalt_user');
    return saved ? JSON.parse(saved) : INITIAL_USER;
  });

  const userRole: UserRole = (user.userRole as UserRole) || 'admin';
  const permissions: RolePermissions = ROLE_PERMISSIONS_MAP[userRole] || ROLE_PERMISSIONS_MAP.admin;

  const [currentView, setCurrentViewInternal] = useState<ViewMode>(getInitialView);
  const [viewHistory, setViewHistory] = useState<ViewMode[]>(getInitialViewHistory);

  // Transactions State (with automated content-level deduplication)
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('asphalt_transactions');
    const loaded = saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
    return deduplicateTransactionsList(loaded);
  });

  // Accounts State
  const [accounts, setAccounts] = useState<AccountItem[]>(() => {
    const saved = localStorage.getItem('asphalt_accounts');
    return saved ? deduplicateItems(JSON.parse(saved), 'acc') : INITIAL_ACCOUNTS;
  });

  // Employees State
  const [employees, setEmployees] = useState<Employee[]>(() => {
    const saved = localStorage.getItem('asphalt_employees');
    return saved ? deduplicateItems(JSON.parse(saved), 'emp') : INITIAL_EMPLOYEES;
  });

  // Business Partners State (Clientes e Fornecedores)
  const [partners, setPartners] = useState<BusinessPartner[]>(() => {
    const saved = localStorage.getItem('asphalt_partners');
    return saved ? deduplicateItems(JSON.parse(saved), 'part') : INITIAL_PARTNERS;
  });

  // Quotes State
  const [quotes, setQuotes] = useState<Quote[]>(() => {
    const saved = localStorage.getItem('asphalt_quotes');
    const loaded: Quote[] = saved ? JSON.parse(saved) : INITIAL_QUOTES;
    return deduplicateItems(loaded.map(q => ({
      ...q,
      itens: deduplicateItems(q.itens || [], 'quote-item')
    })), 'quote');
  });

  // Quote Catalog State
  const [quoteCatalog, setQuoteCatalog] = useState<QuoteCatalogItem[]>(() => {
    const saved = localStorage.getItem('asphalt_quote_catalog');
    return saved ? deduplicateItems(JSON.parse(saved), 'cat-item') : INITIAL_QUOTE_CATALOG;
  });

  // Letterhead Settings State
  const [letterheadSettings, setLetterheadSettings] = useState<LetterheadSettings>(() => {
    const saved = localStorage.getItem('asphalt_letterhead_settings');
    if (!saved) return INITIAL_LETTERHEAD_SETTINGS;
    try {
      const parsed = JSON.parse(saved);
      return {
        ...INITIAL_LETTERHEAD_SETTINGS,
        ...parsed,
        textosRapidos: Array.isArray(parsed.textosRapidos) && parsed.textosRapidos.length > 0
          ? parsed.textosRapidos
          : INITIAL_LETTERHEAD_SETTINGS.textosRapidos,
        logoUrl: parsed.logoUrl !== undefined ? parsed.logoUrl : INITIAL_LETTERHEAD_SETTINGS.logoUrl
      };
    } catch {
      return INITIAL_LETTERHEAD_SETTINGS;
    }
  });

  // Categories & Bank accounts
  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem('asphalt_categories');
    return saved ? deduplicateItems(JSON.parse(saved), 'cat') : INITIAL_CATEGORIES;
  });

  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>(() => {
    const saved = localStorage.getItem('asphalt_bank_accounts');
    return saved ? deduplicateItems(JSON.parse(saved), 'bank') : INITIAL_BANK_ACCOUNTS;
  });

  // Notifications State
  const [notifications, setNotifications] = useState<SystemNotification[]>(() => {
    const saved = localStorage.getItem('asphalt_notifications');
    return saved ? deduplicateItems(JSON.parse(saved), 'notif') : INITIAL_NOTIFICATIONS;
  });

  // Modal States
  const [isNovoLancamentoOpen, setIsNovoLancamentoOpen] = useState(false);
  const [novoLancamentoInitialTab, setNovoLancamentoInitialTab] = useState<'entrada' | 'saida'>('entrada');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('asphalt_sidebar_collapsed');
      return saved === 'true';
    } catch {
      return false;
    }
  });

  const toggleSidebarCollapsed = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      try {
        localStorage.setItem('asphalt_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState(false);
  const [selectedDiagnosticErrorId, setSelectedDiagnosticErrorId] = useState<string | null>(null);
  const [globalSearch, setGlobalSearch] = useState('');
  const [toastMessage, setToastMessage] = useState<{ 
    text: string; 
    type: 'success' | 'info' | 'error';
    errorCode?: string;
    resolucao?: string;
    errorId?: string;
  } | null>(null);

  const [toastPosition, setToastPositionState] = useState<ToastPosition>(() => {
    try {
      const saved = localStorage.getItem('asphalt_pro_toast_position');
      if (saved && ['top-right', 'top-center', 'top-left', 'bottom-right', 'bottom-center', 'bottom-left'].includes(saved)) {
        return saved as ToastPosition;
      }
    } catch {}
    return 'top-right';
  });

  const setToastPosition = (pos: ToastPosition) => {
    setToastPositionState(pos);
    try {
      localStorage.setItem('asphalt_pro_toast_position', pos);
    } catch {}
  };

  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const hideToast = () => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
      toastTimeoutRef.current = null;
    }
    setToastMessage(null);
  };

  // View Navigation with History Stack
  const setCurrentView = (newView: ViewMode) => {
    if (newView === currentView) return;

    try {
      localStorage.setItem('asphalt_current_view', newView);
    } catch {}

    window.history.pushState({ isView: true, view: newView }, '', '#' + newView);

    setViewHistory((prev) => {
      let nextHistory: ViewMode[];
      if (prev[prev.length - 1] === newView) {
        nextHistory = prev;
      } else {
        nextHistory = [...prev, newView];
      }
      saveViewHistory(nextHistory);
      return nextHistory;
    });
    setCurrentViewInternal(newView);
  };

  const navigateBack = () => {
    // 1. If any global modal is open, close it first without leaving the view
    if (isNovoLancamentoOpen) { setIsNovoLancamentoOpen(false); return; }
    if (isNovaContaOpen) { setIsNovaContaOpen(false); return; }
    if (isNovoOrcamentoOpen) { setIsNovoOrcamentoOpen(false); setEditingQuote(null); return; }
    if (isNovoFuncionarioOpen) { setIsNovoFuncionarioOpen(false); setEditingEmployee(null); return; }
    if (viewingQuoteA4) { setViewingQuoteA4(null); return; }
    if (convertingQuote) { setConvertingQuote(null); return; }
    if (isHelpOpen) { setIsHelpOpen(false); return; }
    if (isDiagnosticsOpen) { setIsDiagnosticsOpen(false); return; }
    if (isMobileSidebarOpen) { setIsMobileSidebarOpen(false); return; }

    // 2. If we have previous views in history, return to the exact previous view
    if (viewHistory.length > 1) {
      const targetView = viewHistory[viewHistory.length - 2];
      const nextHistory = viewHistory.slice(0, -1);
      
      setViewHistory(nextHistory);
      saveViewHistory(nextHistory);
      setCurrentViewInternal(targetView);
      try {
        localStorage.setItem('asphalt_current_view', targetView);
      } catch {}

      window.history.pushState({ isView: true, view: targetView }, '', '#' + targetView);
    } else if (currentView !== 'dashboard') {
      const nextHistory: ViewMode[] = ['dashboard'];
      setViewHistory(nextHistory);
      saveViewHistory(nextHistory);
      setCurrentViewInternal('dashboard');
      try {
        localStorage.setItem('asphalt_current_view', 'dashboard');
      } catch {}

      window.history.pushState({ isView: true, view: 'dashboard' }, '', '#dashboard');
    }
  };

  // Sync hash on initial mount
  useEffect(() => {
    if (!window.location.hash) {
      window.history.replaceState({ isView: true, view: currentView }, '', '#' + currentView);
    }
  }, []);

  // Global popstate listener for back button (Phone Back or Browser Back/Forward)
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      // If any modal was open at the global level, close it and stay on the current view
      if (isNovoLancamentoOpen) { setIsNovoLancamentoOpen(false); return; }
      if (isNovaContaOpen) { setIsNovaContaOpen(false); return; }
      if (isNovoOrcamentoOpen) { setIsNovoOrcamentoOpen(false); setEditingQuote(null); return; }
      if (isNovoFuncionarioOpen) { setIsNovoFuncionarioOpen(false); setEditingEmployee(null); return; }
      if (viewingQuoteA4) { setViewingQuoteA4(null); return; }
      if (convertingQuote) { setConvertingQuote(null); return; }
      if (isHelpOpen) { setIsHelpOpen(false); return; }
      if (isDiagnosticsOpen) { setIsDiagnosticsOpen(false); return; }
      if (isMobileSidebarOpen) { setIsMobileSidebarOpen(false); return; }

      // Read view from state or URL hash
      const hash = window.location.hash.replace(/^#\/?/, '').split('?')[0];
      let targetView: ViewMode | null = null;

      if (e.state?.view && VALID_VIEWS.includes(e.state.view)) {
        targetView = e.state.view;
      } else if (VALID_VIEWS.includes(hash as ViewMode)) {
        targetView = hash as ViewMode;
      }

      if (targetView) {
        setCurrentViewInternal(targetView);
        try {
          localStorage.setItem('asphalt_current_view', targetView);
        } catch {}

        setViewHistory((prev) => {
          let nextHistory: ViewMode[];
          if (prev.length >= 2 && prev[prev.length - 2] === targetView) {
            nextHistory = prev.slice(0, -1);
          } else if (prev.includes(targetView)) {
            const lastIdx = prev.lastIndexOf(targetView);
            nextHistory = prev.slice(0, lastIdx + 1);
          } else {
            nextHistory = [...prev, targetView];
          }
          saveViewHistory(nextHistory);
          return nextHistory;
        });
      } else {
        // Fallback: use previous view from viewHistory stack instead of forcing dashboard
        setViewHistory((prev) => {
          if (prev.length > 1) {
            const fallbackView = prev[prev.length - 2];
            const nextHistory = prev.slice(0, -1);
            setCurrentViewInternal(fallbackView);
            try {
              localStorage.setItem('asphalt_current_view', fallbackView);
            } catch {}
            saveViewHistory(nextHistory);
            window.history.replaceState({ isView: true, view: fallbackView }, '', '#' + fallbackView);
            return nextHistory;
          } else {
            setCurrentViewInternal('dashboard');
            saveViewHistory(['dashboard']);
            window.history.replaceState({ isView: true, view: 'dashboard' }, '', '#dashboard');
            return ['dashboard'];
          }
        });
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [
    isNovoLancamentoOpen,
    isNovaContaOpen,
    isNovoOrcamentoOpen,
    isNovoFuncionarioOpen,
    viewingQuoteA4,
    convertingQuote,
    isHelpOpen,
    isDiagnosticsOpen,
    isMobileSidebarOpen
  ]);

  const canGoBack = viewHistory.length > 1 || currentView !== 'dashboard';
  const previousView: ViewMode | null = viewHistory.length > 1
    ? viewHistory[viewHistory.length - 2]
    : (currentView !== 'dashboard' ? 'dashboard' : null);
  const previousViewTitle = previousView ? VIEW_TITLES[previousView] : null;

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('asphalt_auth', JSON.stringify(isAuthenticated));
    } catch (err) {
      errorDiagnosticsService.recordError({
        modulo: 'sistema_storage',
        acao: 'Salvar Sessão de Autenticação',
        titulo: 'Erro ao persistir sessão',
        mensagem: 'Não foi possível gravar os dados de autenticação no armazenamento local.',
        codigo: 'ERR_STORAGE_AUTH',
        severidade: 'baixo',
        errorObj: err,
      });
    }
  }, [isAuthenticated]);

  useEffect(() => {
    try {
      localStorage.setItem('asphalt_user', JSON.stringify(user));
    } catch (err) {
      errorDiagnosticsService.recordError({
        modulo: 'sistema_storage',
        acao: 'Salvar Perfil do Usuário',
        titulo: 'Erro ao persistir perfil',
        mensagem: 'Não foi possível gravar o perfil ativo no armazenamento local.',
        codigo: 'ERR_STORAGE_USER',
        severidade: 'baixo',
        errorObj: err,
      });
    }
  }, [user]);

  useEffect(() => {
    try {
      localStorage.setItem('asphalt_system_users', JSON.stringify(systemUsers));
    } catch (err) {
      errorDiagnosticsService.recordError({
        modulo: 'sistema_storage',
        acao: 'Salvar Usuários do Sistema',
        titulo: 'Erro ao persistir lista de usuários',
        mensagem: 'Armazenamento local cheio ou indisponível.',
        codigo: 'ERR_STORAGE_SYSTEM_USERS',
        severidade: 'alto',
        errorObj: err,
      });
    }
  }, [systemUsers]);

  useEffect(() => {
    try {
      localStorage.setItem('asphalt_transactions', JSON.stringify(transactions));
    } catch (err) {
      errorDiagnosticsService.recordError({
        modulo: 'sistema_storage',
        acao: 'Salvar Lançamentos Financeiros',
        titulo: 'Falha ao salvar lançamentos no banco local',
        mensagem: 'A cota de armazenamento do navegador pode estar próxima do limite.',
        codigo: 'ERR_STORAGE_TRANSACTIONS',
        severidade: 'critico',
        resolucaoSugerida: 'Exporte um backup em Configurações > Backup e limpe registros antigos.',
        errorObj: err,
      });
    }
  }, [transactions]);

  useEffect(() => {
    try {
      localStorage.setItem('asphalt_accounts', JSON.stringify(accounts));
    } catch (err) {
      errorDiagnosticsService.recordError({
        modulo: 'sistema_storage',
        acao: 'Salvar Contas a Pagar/Receber',
        titulo: 'Falha ao salvar contas no banco local',
        mensagem: 'Não foi possível persistir as contas a pagar e receber.',
        codigo: 'ERR_STORAGE_ACCOUNTS',
        severidade: 'alto',
        errorObj: err,
      });
    }
  }, [accounts]);

  useEffect(() => {
    try {
      localStorage.setItem('asphalt_employees', JSON.stringify(employees));
    } catch (err) {
      errorDiagnosticsService.recordError({
        modulo: 'sistema_storage',
        acao: 'Salvar Colaboradores',
        titulo: 'Erro ao persistir colaboradores',
        mensagem: 'Falha ao gravar lista de funcionários.',
        codigo: 'ERR_STORAGE_EMPLOYEES',
        severidade: 'medio',
        errorObj: err,
      });
    }
  }, [employees]);

  useEffect(() => {
    try {
      localStorage.setItem('asphalt_partners', JSON.stringify(partners));
    } catch (err) {
      errorDiagnosticsService.recordError({
        modulo: 'sistema_storage',
        acao: 'Salvar Parceiros Comerciais',
        titulo: 'Erro ao persistir parceiros',
        mensagem: 'Falha ao gravar lista de clientes e fornecedores.',
        codigo: 'ERR_STORAGE_PARTNERS',
        severidade: 'medio',
        errorObj: err,
      });
    }
  }, [partners]);

  useEffect(() => {
    try {
      localStorage.setItem('asphalt_quotes', JSON.stringify(quotes));
    } catch (err) {
      errorDiagnosticsService.recordError({
        modulo: 'sistema_storage',
        acao: 'Salvar Orçamentos',
        titulo: 'Falha ao salvar propostas comerciais',
        mensagem: 'Não foi possível persistir os orçamentos no armazenamento local.',
        codigo: 'ERR_STORAGE_QUOTES',
        severidade: 'alto',
        errorObj: err,
      });
    }
  }, [quotes]);

  useEffect(() => {
    try {
      localStorage.setItem('asphalt_quote_catalog', JSON.stringify(quoteCatalog));
    } catch (err) {
      errorDiagnosticsService.recordError({
        modulo: 'sistema_storage',
        acao: 'Salvar Catálogo CBUQ',
        titulo: 'Erro ao persistir catálogo',
        mensagem: 'Falha ao salvar itens de produtos e serviços.',
        codigo: 'ERR_STORAGE_CATALOG',
        severidade: 'baixo',
        errorObj: err,
      });
    }
  }, [quoteCatalog]);

  useEffect(() => {
    try {
      localStorage.setItem('asphalt_letterhead_settings', JSON.stringify(letterheadSettings));
    } catch (err) {
      errorDiagnosticsService.recordError({
        modulo: 'sistema_storage',
        acao: 'Salvar Configurações A4',
        titulo: 'Erro ao persistir papel timbrado',
        mensagem: 'A imagem de papel timbrado pode ser muito grande para o LocalStorage.',
        codigo: 'ERR_STORAGE_LETTERHEAD',
        severidade: 'medio',
        resolucaoSugerida: 'Utilize uma imagem menor que 1.5MB para evitar atingir o limite do navegador.',
        errorObj: err,
      });
    }
  }, [letterheadSettings]);

  useEffect(() => {
    try {
      localStorage.setItem('asphalt_notifications', JSON.stringify(notifications));
    } catch (err) {
      // ignore
    }
  }, [notifications]);

  useEffect(() => {
    try {
      localStorage.setItem('asphalt_categories', JSON.stringify(categories));
    } catch (err) {
      // ignore
    }
  }, [categories]);

  useEffect(() => {
    try {
      localStorage.setItem('asphalt_bank_accounts', JSON.stringify(bankAccounts));
    } catch (err) {
      // ignore
    }
  }, [bankAccounts]);

  const showToast = (
    text: string, 
    type: 'success' | 'info' | 'error' = 'success',
    options?: { errorCode?: string; resolucao?: string; errorId?: string }
  ) => {
    if (!text) {
      hideToast();
      return;
    }

    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }

    setToastMessage({
      text,
      type,
      errorCode: options?.errorCode,
      resolucao: options?.resolucao,
      errorId: options?.errorId,
    });
    // Se for erro, fica visível um pouco mais de tempo (6s) para leitura; info e success 3.5s
    const duration = type === 'error' ? 6000 : 3500;
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
      toastTimeoutRef.current = null;
    }, duration);
  };

  const openDiagnosticsWithError = (id?: string) => {
    if (id) {
      setSelectedDiagnosticErrorId(id);
    }
    setIsDiagnosticsOpen(true);
  };

  const reportSystemError = (params: {
    modulo: ErrorModule;
    acao: string;
    titulo: string;
    mensagem: string;
    codigo?: string;
    severidade?: ErrorSeverity;
    resolucaoSugerida?: string;
    errorObj?: unknown;
  }): AppErrorRecord => {
    const record = errorDiagnosticsService.recordError(params);
    showToast(params.mensagem, 'error', {
      errorCode: record.codigo,
      resolucao: record.resolucaoSugerida,
      errorId: record.id,
    });
    return record;
  };

  const switchUser = (userId: string) => {
    const targetUser = systemUsers.find(u => u.id === userId);
    if (targetUser) {
      if (targetUser.status === 'inativo') {
        showToast(`O usuário ${targetUser.name} está inativo no sistema.`, 'error');
        return;
      }
      const updatedProfile: UserProfile = {
        id: targetUser.id,
        name: targetUser.name,
        role: targetUser.roleTitle,
        userRole: targetUser.role,
        email: targetUser.email,
        avatarUrl: targetUser.avatarUrl,
        status: 'Active'
      };
      setUser(updatedProfile);
      showToast(`Perfil alternado para ${targetUser.name} (${targetUser.roleTitle})`, 'info');
      syncManager.addLog(`Perfil alternado para ${targetUser.name} [Perfil: ${targetUser.role}]`, 'info');
    }
  };

  const login = (email: string, pass: string, roleOverride?: UserRole) => {
    if (!email && !pass && !roleOverride) return false;

    let matchedUser = systemUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!matchedUser && roleOverride) {
      matchedUser = systemUsers.find(u => u.role === roleOverride);
    }
    if (!matchedUser && systemUsers.length > 0) {
      matchedUser = systemUsers[0];
    }

    if (matchedUser) {
      if (matchedUser.status === 'inativo') {
        showToast('Esta conta de usuário foi inativada. Contate o Administrador.', 'error');
        return false;
      }
      const updatedProfile: UserProfile = {
        id: matchedUser.id,
        name: matchedUser.name,
        role: matchedUser.roleTitle,
        userRole: matchedUser.role,
        email: matchedUser.email,
        avatarUrl: matchedUser.avatarUrl,
        status: 'Active'
      };
      setUser(updatedProfile);
      setIsAuthenticated(true);
      showToast(`Bem-vindo(a), ${matchedUser.name}!`, 'success');
      syncManager.addLog(`Login efetuado por ${matchedUser.name} (${matchedUser.roleTitle})`, 'info');
      return true;
    }

    setIsAuthenticated(true);
    showToast('Bem-vindo ao Asphalt Pro!', 'success');
    return true;
  };

  const loginWithGoogleUser = (googleUser: {
    displayName?: string | null;
    email?: string | null;
    photoURL?: string | null;
    uid?: string;
  }) => {
    const userEmail = (googleUser.email || '').trim();
    const userName = googleUser.displayName?.trim() || userEmail.split('@')[0] || 'Usuário Google';
    const userAvatar =
      googleUser.photoURL ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=835400&color=fff`;

    // Check if user already exists in systemUsers
    const matchedUser = systemUsers.find(
      (u) => u.email.toLowerCase() === userEmail.toLowerCase()
    );

    if (matchedUser) {
      if (matchedUser.status === 'inativo') {
        showToast('Esta conta de usuário foi inativada. Contate o Administrador.', 'error');
        return false;
      }
      const updatedProfile: UserProfile = {
        id: matchedUser.id,
        name: matchedUser.name,
        role: matchedUser.roleTitle,
        userRole: matchedUser.role,
        email: matchedUser.email,
        avatarUrl: userAvatar || matchedUser.avatarUrl,
        status: 'Active'
      };
      setUser(updatedProfile);
    } else {
      // First time logging in with this Google account: register as system user (Admin by default)
      const role: UserRole = 'admin';
      const roleTitle = 'Diretor de Operações (Google)';

      const newSystemUser: SystemUser = {
        id: `user-google-${googleUser.uid || Date.now()}`,
        name: userName,
        email: userEmail,
        role,
        roleTitle,
        department: 'Diretoria / Gestão',
        avatarUrl: userAvatar,
        status: 'ativo',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      };

      setSystemUsers((prev) => [newSystemUser, ...prev]);
      syncManager.enqueue('user', 'create', newSystemUser.id, newSystemUser);

      const profile: UserProfile = {
        id: newSystemUser.id,
        name: userName,
        role: roleTitle,
        userRole: role,
        email: userEmail,
        avatarUrl: userAvatar,
        status: 'Active'
      };
      setUser(profile);
    }

    setIsAuthenticated(true);
    showToast(`Bem-vindo(a), ${userName}! (Conectado via Google)`, 'success');
    syncManager.addLog(`Login via Google Auth efetuado por ${userName} (${userEmail})`, 'info');
    return true;
  };

  const logout = () => {
    logoutFirebaseAuth().catch(() => {});
    setIsAuthenticated(false);
    showToast('Sessão encerrada com sucesso.', 'info');
  };

  const addSystemUser = (userData: Omit<SystemUser, 'id' | 'createdAt'>) => {
    const newUser: SystemUser = {
      ...userData,
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      createdAt: new Date().toISOString(),
    };
    setSystemUsers(prev => [newUser, ...prev]);
    syncManager.enqueue('user', 'create', newUser.id, newUser);
    showToast(`Usuário ${newUser.name} cadastrado com sucesso!`, 'success');
  };

  const updateSystemUser = (id: string, userData: Partial<SystemUser>) => {
    setSystemUsers(prev => prev.map(u => {
      if (u.id === id) {
        const updated = { ...u, ...userData };
        syncManager.enqueue('user', 'update', id, updated);
        if (user.id === id || user.email === u.email) {
          setUser(p => ({
            ...p,
            name: updated.name || p.name,
            role: updated.roleTitle || p.role,
            userRole: updated.role || p.userRole,
            email: updated.email || p.email,
            avatarUrl: updated.avatarUrl || p.avatarUrl,
          }));
        }
        return updated;
      }
      return u;
    }));
    showToast('Dados do usuário atualizados.', 'success');
  };

  const toggleSystemUserStatus = (id: string) => {
    setSystemUsers(prev => prev.map(u => {
      if (u.id === id) {
        const nextStatus = u.status === 'ativo' ? 'inativo' : 'ativo';
        const updated: SystemUser = { ...u, status: nextStatus };
        syncManager.enqueue('user', 'update', id, updated);
        showToast(`Usuário ${u.name} agora está ${nextStatus.toUpperCase()}.`, 'info');
        return updated;
      }
      return u;
    }));
  };

  const deleteSystemUser = (id: string) => {
    if (systemUsers.length <= 1) {
      showToast('O sistema precisa de pelo menos 1 usuário cadastrado.', 'error');
      return;
    }
    setSystemUsers(prev => prev.filter(u => u.id !== id));
    syncManager.enqueue('user', 'delete', id, { id });
    showToast('Usuário removido do sistema.', 'info');
  };

  const openNovoLancamentoWithTab = (tab: 'entrada' | 'saida') => {
    setEditingTransaction(null);
    setNovoLancamentoInitialTab(tab);
    setIsNovoLancamentoOpen(true);
  };

  const openEditLancamento = (tx: Transaction) => {
    setEditingTransaction(tx);
    setIsNovoLancamentoOpen(true);
  };

  const addTransaction = (txData: Omit<Transaction, 'id' | 'createdAt'>) => {
    try {
      if (!txData.descricao || txData.descricao.trim() === '') {
        reportSystemError({
          modulo: 'lancamentos',
          acao: 'Gravar Lançamento Financeiro',
          titulo: 'Descrição Obrigatória Ausente',
          mensagem: 'Por favor, informe a descrição do lançamento (ex: Compra de CAP, Venda de CBUQ).',
          codigo: 'ERR_LANC_MISSING_DESC',
          severidade: 'medio',
          resolucaoSugerida: 'Preencha o campo de descrição antes de salvar.',
        });
        return;
      }

      if (isNaN(txData.valor) || txData.valor <= 0) {
        reportSystemError({
          modulo: 'lancamentos',
          acao: 'Gravar Lançamento Financeiro',
          titulo: 'Valor Inválido no Lançamento',
          mensagem: 'O valor da movimentação financeira deve ser um número positivo maior que R$ 0,00.',
          codigo: 'ERR_LANC_INVALID_VALUE',
          severidade: 'medio',
          resolucaoSugerida: 'Informe um valor numérico válido positivo no campo Valor.',
        });
        return;
      }

      // Guard against rapid duplicate submission (within 3 seconds with identical content)
      const isDuplicate = transactions.some(t => 
        t.descricao.trim().toLowerCase() === txData.descricao.trim().toLowerCase() &&
        (t.clienteFornecedor || '').trim().toLowerCase() === (txData.clienteFornecedor || '').trim().toLowerCase() &&
        Math.abs(t.valor - txData.valor) < 0.01 &&
        t.tipo === txData.tipo &&
        t.data === txData.data &&
        (Date.now() - new Date(t.createdAt).getTime()) < 3000
      );

      if (isDuplicate) {
        showToast('Este lançamento já foi registrado.', 'info');
        return;
      }

      const newTx: Transaction = {
        ...txData,
        id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        createdAt: new Date().toISOString()
      };
      setTransactions(prev => [newTx, ...prev]);
      syncManager.enqueue('transaction', 'create', newTx.id, newTx);
      showToast(`Lançamento de ${txData.tipo === 'entrada' ? 'Receita' : 'Despesa'} registrado!`, 'success');
    } catch (err) {
      reportSystemError({
        modulo: 'lancamentos',
        acao: 'Salvar Lançamento',
        titulo: 'Falha Inesperada ao Gravar Lançamento',
        mensagem: 'Ocorreu um erro interno ao processar a inclusão do lançamento.',
        codigo: 'ERR_LANC_SAVE_FAILED',
        severidade: 'critico',
        resolucaoSugerida: 'Verifique se os campos estão corretos e tente novamente. Se persistir, exporte o relatório de diagnóstico.',
        errorObj: err,
      });
    }
  };

  const updateTransaction = (id: string, txData: Partial<Transaction>) => {
    try {
      setTransactions(prev => prev.map(t => {
        if (t.id === id) {
          const updated: Transaction = {
            ...t,
            ...txData,
            valor: txData.valor !== undefined ? Number(txData.valor) : t.valor,
          };
          syncManager.enqueue('transaction', 'update', id, updated);
          return updated;
        }
        return t;
      }));
      showToast('Lançamento atualizado com sucesso!', 'success');
    } catch (err) {
      reportSystemError({
        modulo: 'lancamentos',
        acao: 'Atualizar Lançamento',
        titulo: 'Erro ao atualizar lançamento',
        mensagem: 'Não foi possível salvar as alterações no lançamento.',
        codigo: 'ERR_LANC_UPDATE_FAILED',
        severidade: 'alto',
        errorObj: err,
      });
    }
  };

  const deduplicateTransactions = (): number => {
    let removedCount = 0;
    setTransactions(prev => {
      const seenKeys = new Set<string>();
      const uniqueTx: Transaction[] = [];

      for (const tx of prev) {
        const key = `${tx.descricao.trim().toLowerCase()}|${(tx.clienteFornecedor || '').trim().toLowerCase()}|${tx.data}|${Number(tx.valor).toFixed(2)}|${tx.tipo}`;
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          uniqueTx.push(tx);
        } else {
          removedCount++;
          syncManager.enqueue('transaction', 'delete', tx.id, { id: tx.id });
        }
      }

      return uniqueTx;
    });

    if (removedCount > 0) {
      showToast(`${removedCount} lançamento(s) duplicado(s) removido(s) com sucesso!`, 'success');
    } else {
      showToast('Nenhum lançamento duplicado encontrado.', 'info');
    }

    return removedCount;
  };

  const deleteTransaction = (id: string) => {
    try {
      setTransactions(prev => prev.filter(t => t.id !== id));
      syncManager.enqueue('transaction', 'delete', id, { id });
      showToast('Lançamento removido.', 'info');
    } catch (err) {
      reportSystemError({
        modulo: 'lancamentos',
        acao: 'Excluir Lançamento',
        titulo: 'Erro ao remover lançamento',
        mensagem: 'Não foi possível excluir o lançamento selecionado.',
        codigo: 'ERR_LANC_DELETE_FAILED',
        severidade: 'alto',
        errorObj: err,
      });
    }
  };

  const addAccount = (accData: Omit<AccountItem, 'id'>) => {
    try {
      if (!accData.descricao || accData.descricao.trim() === '') {
        reportSystemError({
          modulo: 'contas',
          acao: 'Cadastrar Conta a Pagar/Receber',
          titulo: 'Descrição Obrigatória Ausente',
          mensagem: 'Informe a descrição da duplicata ou conta antes de salvar.',
          codigo: 'ERR_ACC_MISSING_DESC',
          severidade: 'medio',
          resolucaoSugerida: 'Digite a identificação da conta ou número da nota fiscal.',
        });
        return;
      }

      if (isNaN(accData.valor) || accData.valor <= 0) {
        reportSystemError({
          modulo: 'contas',
          acao: 'Cadastrar Conta',
          titulo: 'Valor de Conta Inválido',
          mensagem: 'O valor da conta deve ser positivo.',
          codigo: 'ERR_ACC_INVALID_VAL',
          severidade: 'medio',
          resolucaoSugerida: 'Informe um valor numérico válido maior que R$ 0,00.',
        });
        return;
      }

      const newAcc: AccountItem = {
        ...accData,
        id: `acc-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`
      };
      setAccounts(prev => [newAcc, ...prev]);
      syncManager.enqueue('account', 'create', newAcc.id, newAcc);
      showToast('Conta cadastrada com sucesso!', 'success');
    } catch (err) {
      reportSystemError({
        modulo: 'contas',
        acao: 'Salvar Conta',
        titulo: 'Erro ao Salvar Conta a Pagar/Receber',
        mensagem: 'Falha ao incluir o registro de duplicata no sistema.',
        codigo: 'ERR_ACC_SAVE_FAILED',
        severidade: 'critico',
        errorObj: err,
      });
    }
  };

  const toggleAccountPaidStatus = (id: string) => {
    setAccounts(prev => prev.map(acc => {
      if (acc.id === id) {
        const isNowPaid = acc.status !== 'pago';
        const updatedStatus: AccountItem['status'] = isNowPaid ? 'pago' : 'pendente';
        const dataPagamento = isNowPaid ? new Date().toLocaleDateString('pt-BR') : undefined;
        
        let transacaoId = acc.transacaoId;

        // When marked as paid, auto-add as a transaction only if not already existing
        if (isNowPaid) {
          setTransactions(currentTxs => {
            const alreadyExists = currentTxs.some(t => 
              t.origemContaId === acc.id || 
              (transacaoId && t.id === transacaoId) ||
              (t.descricao === `${acc.descricao} (${acc.parcela})` && 
               t.clienteFornecedor === acc.fornecedorCliente && 
               Math.abs(t.valor - acc.valor) < 0.01 && 
               t.tipo === (acc.tipo === 'pagar' ? 'saida' : 'entrada'))
            );

            if (alreadyExists) {
              return currentTxs; // Prevents duplication
            }

            const newTxId = `tx-paid-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
            transacaoId = newTxId;
            const newTx: Transaction = {
              id: newTxId,
              data: new Date().toLocaleDateString('pt-BR'),
              descricao: `${acc.descricao} (${acc.parcela})`,
              categoria: acc.categoria || (acc.tipo === 'pagar' ? 'Operacional' : 'Receita de Serviços'),
              responsavel: 'Financeiro Usina',
              formaPagamento: 'Transferência Bancária (PIX)',
              valor: acc.valor,
              tipo: acc.tipo === 'pagar' ? 'saida' : 'entrada',
              clienteFornecedor: acc.fornecedorCliente,
              contaFinanceira: 'Caixa Principal Usina',
              observacao: `Liquidação da conta ${acc.descricao}`,
              origemContaId: acc.id,
              createdAt: new Date().toISOString()
            };
            syncManager.enqueue('transaction', 'create', newTx.id, newTx);
            return [newTx, ...currentTxs];
          });
        } else {
          // When reopened (status becomes pendente), remove the generated transaction to prevent duplicates!
          setTransactions(currentTxs => 
            currentTxs.filter(item => 
              item.origemContaId !== acc.id && 
              item.id !== acc.transacaoId && 
              item.id !== transacaoId &&
              !(item.descricao === `${acc.descricao} (${acc.parcela})` && 
                item.clienteFornecedor === acc.fornecedorCliente && 
                Math.abs(item.valor - acc.valor) < 0.01)
            )
          );
          if (transacaoId) {
            syncManager.enqueue('transaction', 'delete', transacaoId, { id: transacaoId });
          }
          transacaoId = undefined;
        }

        const updatedAccount: AccountItem = {
          ...acc,
          status: updatedStatus,
          dataPagamento,
          transacaoId
        };
        syncManager.enqueue('account', 'update', acc.id, updatedAccount);

        showToast(
          isNowPaid 
            ? `Conta "${acc.descricao}" liquidada! Lançamento gerado no Caixa.` 
            : `Status de "${acc.descricao}" alterado para Pendente. Lançamento estornado.`,
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
    try {
      if (!empData.nome || empData.nome.trim() === '') {
        reportSystemError({
          modulo: 'funcionarios',
          acao: 'Cadastrar Funcionário',
          titulo: 'Nome do Colaborador Ausente',
          mensagem: 'O nome completo do colaborador é obrigatório.',
          codigo: 'ERR_EMP_MISSING_NAME',
          severidade: 'baixo',
          resolucaoSugerida: 'Preencha o nome do colaborador antes de salvar.',
        });
        return;
      }

      const names = empData.nome.trim().split(' ');
      const initials = names.length > 1
        ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
        : names[0].slice(0, 2).toUpperCase();

      const newEmp: Employee = {
        ...empData,
        id: `emp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        avatarInitials: initials
      };
      setEmployees(prev => [newEmp, ...prev]);
      syncManager.enqueue('employee', 'create', newEmp.id, newEmp);
      showToast(`Funcionário ${empData.nome} cadastrado com sucesso!`, 'success');
    } catch (err) {
      reportSystemError({
        modulo: 'funcionarios',
        acao: 'Cadastrar Funcionário',
        titulo: 'Erro ao Salvar Colaborador',
        mensagem: 'Ocorreu um erro interno ao cadastrar o funcionário.',
        codigo: 'ERR_EMP_SAVE_FAILED',
        severidade: 'alto',
        errorObj: err,
      });
    }
  };

  const updateEmployee = (id: string, empData: Partial<Employee>) => {
    try {
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
    } catch (err) {
      reportSystemError({
        modulo: 'funcionarios',
        acao: 'Atualizar Funcionário',
        titulo: 'Erro ao Atualizar Colaborador',
        mensagem: 'Não foi possível salvar as alterações do funcionário.',
        codigo: 'ERR_EMP_UPDATE_FAILED',
        severidade: 'medio',
        errorObj: err,
      });
    }
  };

  const toggleEmployeeStatus = (id: string) => {
    setEmployees(prev => prev.map(e => {
      if (e.id === id) {
        const nextStatus: 'ativo' | 'inativo' = e.status === 'ativo' ? 'inativo' : 'ativo';
        const updated: Employee = { ...e, status: nextStatus };
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
    try {
      if (!quoteData.cliente?.nome || quoteData.cliente.nome.trim() === '') {
        reportSystemError({
          modulo: 'orcamentos',
          acao: 'Emitir Orçamento CBUQ',
          titulo: 'Nome do Cliente Ausente',
          mensagem: 'O nome da empresa ou contratante do orçamento é obrigatório.',
          codigo: 'ERR_ORC_MISSING_CLIENT',
          severidade: 'medio',
          resolucaoSugerida: 'Preencha o nome do cliente no formulário da proposta.',
        });
        return;
      }

      if (!quoteData.itens || quoteData.itens.length === 0) {
        reportSystemError({
          modulo: 'orcamentos',
          acao: 'Emitir Orçamento CBUQ',
          titulo: 'Orçamento sem Itens de Massa Asfáltica',
          mensagem: 'Adicione ao menos um item de CBUQ ou serviço para gerar a proposta.',
          codigo: 'ERR_ORC_NO_ITEMS',
          severidade: 'medio',
          resolucaoSugerida: 'Clique em "Adicionar Item" e defina a faixa, quantidade em toneladas e valor unitário.',
        });
        return;
      }

      const newQuote: Quote = {
        ...quoteData,
        id: `orc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        createdAt: new Date().toISOString()
      };
      setQuotes(prev => [newQuote, ...prev]);
      syncManager.enqueue('quote', 'create', newQuote.id, newQuote);
      showToast(`Orçamento ${newQuote.numero} gerado com sucesso!`, 'success');
    } catch (err) {
      reportSystemError({
        modulo: 'orcamentos',
        acao: 'Salvar Orçamento',
        titulo: 'Erro ao Gerar Orçamento Comercial',
        mensagem: 'Não foi possível registrar o orçamento no sistema.',
        codigo: 'ERR_ORC_SAVE_FAILED',
        severidade: 'critico',
        errorObj: err,
      });
    }
  };

  const updateQuote = (id: string, quoteData: Partial<Quote>) => {
    try {
      setQuotes(prev => prev.map(q => {
        if (q.id === id) {
          const updated = { ...q, ...quoteData };
          syncManager.enqueue('quote', 'update', id, updated);
          return updated;
        }
        return q;
      }));
      showToast('Orçamento atualizado com sucesso!', 'success');
    } catch (err) {
      reportSystemError({
        modulo: 'orcamentos',
        acao: 'Editar Orçamento',
        titulo: 'Erro ao Atualizar Orçamento',
        mensagem: 'Não foi possível salvar as alterações na proposta.',
        codigo: 'ERR_ORC_UPDATE_FAILED',
        severidade: 'alto',
        errorObj: err,
      });
    }
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
      id: `orc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
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
        id: `tx-quote-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
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
          id: `acc-quote-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`,
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
          id: `tx-quote-entry-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
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
            id: `acc-quote-mix-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`,
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
      id: `cat-item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
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

  // Partners Management logic
  const addPartner = (partnerData: Omit<BusinessPartner, 'id'>) => {
    const newPartner: BusinessPartner = {
      ...partnerData,
      id: `part-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    };
    setPartners(prev => [newPartner, ...prev]);
    syncManager.enqueue('partner', 'create', newPartner.id, newPartner);
    syncManager.addLog(`Novo parceiro "${newPartner.nome}" cadastrado com sucesso`, 'success');
    showToast(`Parceiro "${newPartner.nome}" cadastrado!`, 'success');
  };

  const updatePartner = (id: string, partnerData: Partial<BusinessPartner>) => {
    setPartners(prev => prev.map(p => p.id === id ? { ...p, ...partnerData } : p));
    syncManager.enqueue('partner', 'update', id, partnerData);
    showToast('Dados do parceiro atualizados com sucesso!', 'success');
  };

  const deletePartner = (id: string) => {
    setPartners(prev => prev.filter(p => p.id !== id));
    syncManager.enqueue('partner', 'delete', id, { id });
    showToast('Parceiro removido do cadastro.', 'info');
  };

  const getUnifiedPartners = (filterType?: 'cliente' | 'fornecedor' | 'ambos'): BusinessPartner[] => {
    const partnerMap = new Map<string, BusinessPartner>();

    // 1. Cadastrados oficiais
    partners.forEach(p => {
      if (p.nome) {
        partnerMap.set(p.nome.trim().toLowerCase(), p);
      }
    });

    // 2. Extrair clientes de orçamentos anteriores
    quotes.forEach((q, idx) => {
      if (q.cliente?.nome) {
        const key = q.cliente.nome.trim().toLowerCase();
        if (!partnerMap.has(key)) {
          partnerMap.set(key, {
            id: `quote-client-${idx}-${key.replace(/\s+/g, '-')}`,
            nome: q.cliente.nome,
            tipo: 'cliente',
            documento: q.cliente.documento,
            contato: q.cliente.contato,
            telefone: q.cliente.telefone,
            email: q.cliente.email,
            endereco: q.cliente.enderecoObra,
            cidadeUf: q.cliente.cidadeUf,
            ramoAtividade: 'Cliente de Orçamento',
            categoriaPadrao: 'Receita de Serviços',
            status: 'ativo'
          });
        }
      }
    });

    // 3. Extrair fornecedores e clientes de contas financeiras
    accounts.forEach((a, idx) => {
      if (a.fornecedorCliente && a.fornecedorCliente.trim() !== 'Não especificado') {
        const key = a.fornecedorCliente.trim().toLowerCase();
        if (!partnerMap.has(key)) {
          const inferredType: PartnerType = a.tipo === 'receber' ? 'cliente' : 'fornecedor';
          partnerMap.set(key, {
            id: `acc-party-${idx}-${key.replace(/\s+/g, '-')}`,
            nome: a.fornecedorCliente.trim(),
            tipo: inferredType,
            ramoAtividade: a.tipo === 'receber' ? 'Cliente Contratante' : 'Fornecedor Operacional',
            categoriaPadrao: a.categoria,
            status: 'ativo'
          });
        }
      }
    });

    // 4. Extrair de lançamentos do livro caixa
    transactions.forEach((t, idx) => {
      if (t.clienteFornecedor && t.clienteFornecedor.trim()) {
        const key = t.clienteFornecedor.trim().toLowerCase();
        if (!partnerMap.has(key)) {
          const inferredType: PartnerType = t.tipo === 'entrada' ? 'cliente' : 'fornecedor';
          partnerMap.set(key, {
            id: `tx-party-${idx}-${key.replace(/\s+/g, '-')}`,
            nome: t.clienteFornecedor.trim(),
            tipo: inferredType,
            ramoAtividade: t.tipo === 'entrada' ? 'Cliente Caixa' : 'Fornecedor / Favorecido',
            categoriaPadrao: t.categoria,
            status: 'ativo'
          });
        }
      }
    });

    const list = Array.from(partnerMap.values());
    if (!filterType || filterType === 'ambos') {
      return list;
    }
    return list.filter(p => p.tipo === filterType || p.tipo === 'ambos');
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

  // Categories logic
  const addCategory = (categoryData: Omit<Category, 'id'>) => {
    const newCategory: Category = {
      ...categoryData,
      id: `cat-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    };
    setCategories(prev => [newCategory, ...prev]);
    showToast(`Categoria "${newCategory.nome}" criada com sucesso!`, 'success');
  };

  const updateCategory = (id: string, categoryData: Partial<Category>) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, ...categoryData } : c));
    showToast('Categoria atualizada com sucesso!', 'success');
  };

  const deleteCategory = (id: string) => {
    const cat = categories.find(c => c.id === id);
    setCategories(prev => prev.filter(c => c.id !== id));
    showToast(`Categoria "${cat?.nome || ''}" removida com sucesso!`, 'info');
  };

  // Bank Accounts logic
  const addBankAccount = (accountData: Omit<BankAccount, 'id'>) => {
    const newAccount: BankAccount = {
      ...accountData,
      id: `bank-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    };
    setBankAccounts(prev => [...prev, newAccount]);
    showToast(`Conta "${newAccount.nome}" cadastrada com sucesso!`, 'success');
  };

  const updateBankAccount = (id: string, accountData: Partial<BankAccount>) => {
    setBankAccounts(prev => prev.map(b => b.id === id ? { ...b, ...accountData } : b));
    showToast('Conta bancária atualizada com sucesso!', 'success');
  };

  const deleteBankAccount = (id: string) => {
    const acc = bankAccounts.find(b => b.id === id);
    setBankAccounts(prev => prev.filter(b => b.id !== id));
    showToast(`Conta "${acc?.nome || ''}" removida com sucesso!`, 'info');
  };

  const exportFullBackup = () => {
    try {
      const result = exportSystemJsonBackup({
        transactions,
        accounts,
        employees,
        partners,
        quotes,
        quoteCatalog,
        categories,
        bankAccounts,
        letterheadSettings,
        systemUsers,
      });

      syncManager.addLog(`Backup do sistema exportado em ${result.filename}`, 'info');
      showToast('Cópia de segurança (JSON) baixada com sucesso!', 'success');
    } catch (e) {
      console.error(e);
      showToast('Erro ao exportar cópia de segurança.', 'error');
    }
  };

  const exportCsvData = (type: 'transacoes' | 'contas' | 'orcamentos' | 'parceiros' | 'colaboradores' | 'todos') => {
    try {
      if (type === 'transacoes') {
        const file = exportTransactionsCsv(transactions);
        showToast(`Planilha "${file}" gerada com sucesso!`, 'success');
        syncManager.addLog(`Exportação CSV de Lançamentos: ${file}`, 'info');
      } else if (type === 'contas') {
        const file = exportAccountsCsv(accounts);
        showToast(`Planilha "${file}" gerada com sucesso!`, 'success');
        syncManager.addLog(`Exportação CSV de Contas: ${file}`, 'info');
      } else if (type === 'orcamentos') {
        const file = exportQuotesCsv(quotes);
        showToast(`Planilha "${file}" gerada com sucesso!`, 'success');
        syncManager.addLog(`Exportação CSV de Orçamentos: ${file}`, 'info');
      } else if (type === 'parceiros') {
        const file = exportPartnersCsv(partners);
        showToast(`Planilha "${file}" gerada com sucesso!`, 'success');
        syncManager.addLog(`Exportação CSV de Parceiros: ${file}`, 'info');
      } else if (type === 'colaboradores') {
        const file = exportEmployeesCsv(employees);
        showToast(`Planilha "${file}" gerada com sucesso!`, 'success');
        syncManager.addLog(`Exportação CSV de Colaboradores: ${file}`, 'info');
      } else if (type === 'todos') {
        exportTransactionsCsv(transactions);
        setTimeout(() => exportAccountsCsv(accounts), 200);
        setTimeout(() => exportQuotesCsv(quotes), 400);
        setTimeout(() => exportPartnersCsv(partners), 600);
        setTimeout(() => exportEmployeesCsv(employees), 800);
        showToast('Todas as 5 planilhas CSV foram geradas para download!', 'success');
        syncManager.addLog('Exportação completa em lote de todas as planilhas CSV', 'info');
      }
    } catch (e) {
      console.error(e);
      showToast('Erro ao gerar arquivo CSV.', 'error');
    }
  };

  const importFullBackup = (jsonContent: string): boolean => {
    try {
      const data = JSON.parse(jsonContent);
      if (!data || (!data.transactions && !data.accounts)) {
        showToast('Arquivo de backup inválido ou incompatível.', 'error');
        return false;
      }

      if (Array.isArray(data.transactions)) {
        setTransactions(data.transactions);
        localStorage.setItem('asphalt_transactions', JSON.stringify(data.transactions));
      }
      if (Array.isArray(data.accounts)) {
        setAccounts(data.accounts);
        localStorage.setItem('asphalt_accounts', JSON.stringify(data.accounts));
      }
      if (Array.isArray(data.employees)) {
        setEmployees(data.employees);
        localStorage.setItem('asphalt_employees', JSON.stringify(data.employees));
      }
      if (Array.isArray(data.partners)) {
        setPartners(data.partners);
        localStorage.setItem('asphalt_partners', JSON.stringify(data.partners));
      }
      if (Array.isArray(data.quotes)) {
        setQuotes(data.quotes);
        localStorage.setItem('asphalt_quotes', JSON.stringify(data.quotes));
      }
      if (Array.isArray(data.quoteCatalog)) {
        setQuoteCatalog(data.quoteCatalog);
        localStorage.setItem('asphalt_quote_catalog', JSON.stringify(data.quoteCatalog));
      }
      if (Array.isArray(data.categories)) {
        setCategories(data.categories);
        localStorage.setItem('asphalt_categories', JSON.stringify(data.categories));
      }
      if (Array.isArray(data.bankAccounts)) {
        setBankAccounts(data.bankAccounts);
        localStorage.setItem('asphalt_bank_accounts', JSON.stringify(data.bankAccounts));
      }
      if (Array.isArray(data.systemUsers)) {
        setSystemUsers(data.systemUsers);
        localStorage.setItem('asphalt_system_users', JSON.stringify(data.systemUsers));
      }
      if (data.letterheadSettings) {
        setLetterheadSettings(data.letterheadSettings);
        localStorage.setItem('asphalt_letterhead_settings', JSON.stringify(data.letterheadSettings));
      }

      syncManager.addLog('Backup completo restaurado a partir de arquivo JSON', 'success');
      showToast('Dados restaurados com sucesso do backup!', 'success');
      return true;
    } catch (e) {
      console.error(e);
      showToast('Falha ao processar arquivo de backup.', 'error');
      return false;
    }
  };

  const resetAllData = () => {
    setTransactions(INITIAL_TRANSACTIONS);
    setAccounts(INITIAL_ACCOUNTS);
    setEmployees(INITIAL_EMPLOYEES);
    setPartners(INITIAL_PARTNERS);
    setQuotes(INITIAL_QUOTES);
    setQuoteCatalog(INITIAL_QUOTE_CATALOG);
    setCategories(INITIAL_CATEGORIES);
    setBankAccounts(INITIAL_BANK_ACCOUNTS);
    setLetterheadSettings(INITIAL_LETTERHEAD_SETTINGS);
    setNotifications(INITIAL_NOTIFICATIONS);
    setSystemUsers(INITIAL_SYSTEM_USERS);
    setUser(INITIAL_USER);
    localStorage.clear();
    showToast('Dados do sistema restaurados para o padrão de fábrica.', 'info');
  };

  const [isPullingFromCloud, setIsPullingFromCloud] = useState(false);

  const pullFromCloud = async (silent: boolean = false): Promise<{ success: boolean; count: number }> => {
    const config = getSavedFirebaseConfig();
    if (!config || !config.isActive || !config.projectId || !config.apiKey) {
      if (!silent) {
        showToast('Firebase não configurado ou inativo.', 'info');
      }
      return { success: false, count: 0 };
    }

    setIsPullingFromCloud(true);
    try {
      const [
        cloudTx,
        cloudQuotes,
        cloudAccounts,
        cloudEmployees,
        cloudPartners,
        cloudUsers
      ] = await Promise.all([
        fetchCollectionFromFirestore('transactions'),
        fetchCollectionFromFirestore('quotes'),
        fetchCollectionFromFirestore('accounts'),
        fetchCollectionFromFirestore('employees'),
        fetchCollectionFromFirestore('partners'),
        fetchCollectionFromFirestore('users')
      ]);

      let totalPulled = 0;

      if (cloudTx.length > 0) {
        setTransactions((prev) => {
          const mergedMap = new Map<string, Transaction>();
          prev.forEach((t) => mergedMap.set(t.id, t));
          cloudTx.forEach((t: any) => mergedMap.set(t.id, t as Transaction));
          const result = deduplicateTransactionsList(Array.from(mergedMap.values()));
          localStorage.setItem('asphalt_transactions', JSON.stringify(result));
          return result;
        });
        totalPulled += cloudTx.length;
      }

      if (cloudQuotes.length > 0) {
        setQuotes((prev) => {
          const mergedMap = new Map<string, Quote>();
          prev.forEach((q) => mergedMap.set(q.id, q));
          cloudQuotes.forEach((q: any) => mergedMap.set(q.id, q as Quote));
          const result = deduplicateItems(Array.from(mergedMap.values()), 'quote');
          localStorage.setItem('asphalt_quotes', JSON.stringify(result));
          return result;
        });
        totalPulled += cloudQuotes.length;
      }

      if (cloudAccounts.length > 0) {
        setAccounts((prev) => {
          const mergedMap = new Map<string, AccountItem>();
          prev.forEach((a) => mergedMap.set(a.id, a));
          cloudAccounts.forEach((a: any) => mergedMap.set(a.id, a as AccountItem));
          const result = deduplicateItems(Array.from(mergedMap.values()), 'acc');
          localStorage.setItem('asphalt_accounts', JSON.stringify(result));
          return result;
        });
        totalPulled += cloudAccounts.length;
      }

      if (cloudEmployees.length > 0) {
        setEmployees((prev) => {
          const mergedMap = new Map<string, Employee>();
          prev.forEach((e) => mergedMap.set(e.id, e));
          cloudEmployees.forEach((e: any) => mergedMap.set(e.id, e as Employee));
          const result = deduplicateItems(Array.from(mergedMap.values()), 'emp');
          localStorage.setItem('asphalt_employees', JSON.stringify(result));
          return result;
        });
        totalPulled += cloudEmployees.length;
      }

      if (cloudPartners.length > 0) {
        setPartners((prev) => {
          const mergedMap = new Map<string, BusinessPartner>();
          prev.forEach((p) => mergedMap.set(p.id, p));
          cloudPartners.forEach((p: any) => mergedMap.set(p.id, p as BusinessPartner));
          const result = deduplicateItems(Array.from(mergedMap.values()), 'part');
          localStorage.setItem('asphalt_partners', JSON.stringify(result));
          return result;
        });
        totalPulled += cloudPartners.length;
      }

      if (cloudUsers.length > 0) {
        setSystemUsers((prev) => {
          const mergedMap = new Map<string, SystemUser>();
          prev.forEach((u) => mergedMap.set(u.id, u));
          cloudUsers.forEach((u: any) => mergedMap.set(u.id, u as SystemUser));
          const result = deduplicateItems(Array.from(mergedMap.values()), 'user');
          localStorage.setItem('asphalt_system_users', JSON.stringify(result));
          return result;
        });
        totalPulled += cloudUsers.length;
      }

      syncManager.addLog(`Nuvem sincronizada: ${totalPulled} registros recebidos do Firebase`, 'success', totalPulled);
      if (!silent) {
        showToast(`${totalPulled} registro(s) sincronizados da nuvem com sucesso!`, 'success');
      }
      return { success: true, count: totalPulled };
    } catch (err: any) {
      console.error('Erro ao puxar dados da nuvem:', err);
      syncManager.addLog(`Falha ao baixar dados da nuvem: ${err?.message || err}`, 'error');
      if (!silent) {
        showToast('Falha ao baixar dados da nuvem: ' + (err?.message || 'Erro desconhecido'), 'error');
      }
      return { success: false, count: 0 };
    } finally {
      setIsPullingFromCloud(false);
    }
  };

  // Initial startup cloud auto-pull
  useEffect(() => {
    const config = getSavedFirebaseConfig();
    if (config && config.isActive && config.projectId && config.apiKey) {
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        pullFromCloud(true);
      }
    }
  }, []);

  // Financial aggregates calculation
  const entradasDoMes = transactions
    .filter(t => t.tipo === 'entrada')
    .reduce((sum, t) => sum + t.valor, 0);

  const saidasDoMes = transactions
    .filter(t => t.tipo === 'saida')
    .reduce((sum, t) => sum + t.valor, 0);

  const saldoInicialBancos = bankAccounts.reduce((sum, b) => sum + (Number(b.saldo) || 0), 0);
  const saldoAtual = saldoInicialBancos + entradasDoMes - saidasDoMes;

  const contasVencendoSemana = accounts.filter(a => a.tipo === 'pagar' && a.status !== 'pago').length;
  const contasEmAtraso = accounts.filter(a => a.tipo === 'pagar' && a.status === 'atrasado').length;
  const totalPendentePagar = accounts.filter(a => a.tipo === 'pagar' && a.status !== 'pago').reduce((s, a) => s + a.valor, 0);
  const totalPendenteReceber = accounts.filter(a => a.tipo === 'receber' && a.status !== 'pago').reduce((s, a) => s + a.valor, 0);

  return (
    <AppContext.Provider
      value={{
        isAuthenticated,
        user,
        userRole,
        permissions,
        systemUsers,
        switchUser,
        addSystemUser,
        updateSystemUser,
        toggleSystemUserStatus,
        deleteSystemUser,
        login,
        loginWithGoogleUser,
        logout,
        currentView,
        setCurrentView,
        navigateBack,
        canGoBack,
        previousViewTitle,
        viewHistory,
        transactions,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        deduplicateTransactions,
        accounts,
        addAccount,
        toggleAccountPaidStatus,
        deleteAccount,
        employees,
        addEmployee,
        updateEmployee,
        toggleEmployeeStatus,
        deleteEmployee,
        partners,
        addPartner,
        updatePartner,
        deletePartner,
        getUnifiedPartners,
        categories,
        addCategory,
        updateCategory,
        deleteCategory,
        bankAccounts,
        addBankAccount,
        updateBankAccount,
        deleteBankAccount,
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
        editingTransaction,
        setEditingTransaction,
        openEditLancamento,
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
        isSidebarCollapsed,
        setIsSidebarCollapsed,
        toggleSidebarCollapsed,
        globalSearch,
        setGlobalSearch,
        toastMessage,
        toastPosition,
        setToastPosition,
        showToast,
        hideToast,
        isDiagnosticsOpen,
        setIsDiagnosticsOpen,
        selectedDiagnosticErrorId,
        setSelectedDiagnosticErrorId,
        openDiagnosticsWithError,
        reportSystemError,
        saldoAtual,
        entradasDoMes,
        saidasDoMes,
        contasVencendoSemana,
        contasEmAtraso,
        totalPendentePagar,
        totalPendenteReceber,
        exportFullBackup,
        importFullBackup,
        exportCsvData,
        pullFromCloud,
        isPullingFromCloud,
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
