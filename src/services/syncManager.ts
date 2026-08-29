import { SyncQueueItem, SyncAuditLog, NetworkState } from '../types';

const SYNC_QUEUE_KEY = 'asphaltpro_sync_queue';
const SYNC_LOGS_KEY = 'asphaltpro_sync_logs';
const SIMULATED_OFFLINE_KEY = 'asphaltpro_simulated_offline';

type SyncListener = () => void;

class SyncManager {
  private queue: SyncQueueItem[] = [];
  private logs: SyncAuditLog[] = [];
  private listeners: Set<SyncListener> = new Set();
  private networkState: NetworkState = typeof navigator !== 'undefined' && navigator.onLine ? 'online' : 'offline';
  private lastSyncTime: string | null = null;
  private isProcessing = false;
  private simulatedOffline = false;

  constructor() {
    this.subscribe = this.subscribe.bind(this);
    this.getNetworkState = this.getNetworkState.bind(this);
    this.getQueue = this.getQueue.bind(this);
    this.getLogs = this.getLogs.bind(this);
    this.getPendingCount = this.getPendingCount.bind(this);
    this.getLastSyncTime = this.getLastSyncTime.bind(this);
    this.isOnline = this.isOnline.bind(this);
    this.isSimulatingOffline = this.isSimulatingOffline.bind(this);
    this.toggleSimulatedOffline = this.toggleSimulatedOffline.bind(this);
    this.enqueue = this.enqueue.bind(this);
    this.processQueue = this.processQueue.bind(this);
    this.clearQueue = this.clearQueue.bind(this);
    this.loadFromStorage();
    this.initNetworkListeners();
    // Try initial sync if queue has items and we are online
    if (this.isOnline() && this.queue.length > 0) {
      setTimeout(() => this.processQueue(), 1000);
    }
  }

  private loadFromStorage() {
    try {
      const savedQueue = localStorage.getItem(SYNC_QUEUE_KEY);
      if (savedQueue) {
        this.queue = JSON.parse(savedQueue);
      }

      const savedLogs = localStorage.getItem(SYNC_LOGS_KEY);
      if (savedLogs) {
        this.logs = JSON.parse(savedLogs);
      } else {
        const initialLog: SyncAuditLog = {
          id: 'log_init_' + Date.now(),
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          description: 'Sistema de Sincronização Inicializado',
          type: 'info',
        };
        this.logs = [initialLog];
        try {
          localStorage.setItem(SYNC_LOGS_KEY, JSON.stringify(this.logs));
        } catch {
          // ignore
        }
      }

      const sim = localStorage.getItem(SIMULATED_OFFLINE_KEY);
      this.simulatedOffline = sim === 'true';
      if (this.simulatedOffline) {
        this.networkState = 'offline';
      }
    } catch (e) {
      console.warn('Erro ao carregar fila de sincronização:', e);
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(this.queue));
      localStorage.setItem(SYNC_LOGS_KEY, JSON.stringify(this.logs.slice(0, 50)));
      localStorage.setItem(SIMULATED_OFFLINE_KEY, String(this.simulatedOffline));
    } catch (e) {
      console.warn('Erro ao salvar fila de sincronização:', e);
    }
    this.notify();
  }

  private initNetworkListeners() {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', () => {
      if (!this.simulatedOffline) {
        this.networkState = 'online';
        this.addLog('Conexão com a internet restabelecida', 'info');
        this.notify();
        this.processQueue();
      }
    });

    window.addEventListener('offline', () => {
      this.networkState = 'offline';
      this.addLog('Dispositivo entrou em modo offline (Sem Conexão)', 'warning');
      this.notify();
    });
  }

  public isOnline(): boolean {
    if (this.simulatedOffline) return false;
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  }

  public getNetworkState(): NetworkState {
    return this.networkState;
  }

  public getPendingCount(): number {
    return this.queue.filter((q) => q.status !== 'syncing').length;
  }

  public getQueue(): SyncQueueItem[] {
    return this.queue;
  }

  public getLogs(): SyncAuditLog[] {
    return this.logs;
  }

  public getLastSyncTime(): string | null {
    return this.lastSyncTime;
  }

  public isSimulatingOffline(): boolean {
    return this.simulatedOffline;
  }

  public toggleSimulatedOffline(): boolean {
    this.simulatedOffline = !this.simulatedOffline;
    if (this.simulatedOffline) {
      this.networkState = 'offline';
      this.addLog('Simulação Offline ativada manualmente para testes', 'warning');
    } else {
      this.networkState = (typeof navigator !== 'undefined' && navigator.onLine) ? 'online' : 'offline';
      this.addLog('Simulação Offline desativada - Conexão restaurada', 'info');
      if (this.networkState === 'online') {
        this.processQueue();
      }
    }
    this.saveToStorage();
    return this.simulatedOffline;
  }

  public subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    // Notify in microtask to avoid any setState-in-render during React tree reconciliations
    queueMicrotask(() => {
      this.listeners.forEach((listener) => {
        try {
          listener();
        } catch (e) {
          console.error(e);
        }
      });
    });
  }

  public addLog(description: string, type: 'info' | 'success' | 'warning' | 'error', itemCount?: number) {
    const newLog: SyncAuditLog = {
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      description,
      type,
      itemCount,
    };
    this.logs = [newLog, ...this.logs].slice(0, 50);
    this.saveToStorage();
  }

  /**
   * Enqueue a mutation. If online, attempts instant sync.
   */
  public enqueue(
    entityType: SyncQueueItem['entityType'],
    action: SyncQueueItem['action'],
    entityId: string,
    payload: any
  ) {
    // Check if an operation for this entity is already pending in the queue
    const existingIndex = this.queue.findIndex(
      (q) => q.entityId === entityId && q.entityType === entityType && q.status === 'pending'
    );

    if (existingIndex >= 0 && action === 'update') {
      const updatedQueue = [...this.queue];
      updatedQueue[existingIndex] = {
        ...updatedQueue[existingIndex],
        payload: {
          ...updatedQueue[existingIndex].payload,
          ...payload,
        },
        timestamp: new Date().toISOString(),
      };
      this.queue = updatedQueue;
    } else {
      const item: SyncQueueItem = {
        id: 'sync_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
        entityId,
        entityType,
        action,
        payload,
        timestamp: new Date().toISOString(),
        retryCount: 0,
        status: 'pending',
      };
      this.queue = [...this.queue, item];
    }

    this.saveToStorage();

    if (this.isOnline()) {
      this.processQueue();
    } else {
      this.addLog(
        `Operação gravada em fila offline (${action} ${entityType}: ${entityId})`,
        'warning'
      );
    }
  }

  /**
   * Process all pending items in the queue with idempotency
   */
  public async processQueue(): Promise<boolean> {
    if (this.isProcessing) return false;
    if (!this.isOnline()) {
      this.networkState = 'offline';
      this.notify();
      return false;
    }

    if (this.queue.length === 0) {
      this.networkState = 'online';
      this.notify();
      return true;
    }

    this.isProcessing = true;
    this.networkState = 'syncing';
    this.notify();

    const countToSync = this.queue.length;

    try {
      // Simulate remote cloud batch upsert/sync delay
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Process items (idempotent upsert simulation)
      this.queue = [];
      this.lastSyncTime = new Date().toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      });
      this.networkState = 'online';
      this.addLog(`Sincronização concluída com a Nuvem (${countToSync} itens sincronizados)`, 'success', countToSync);
      this.saveToStorage();
      this.isProcessing = false;
      return true;
    } catch (err: any) {
      this.networkState = 'error';
      this.addLog(`Falha na sincronização: ${err?.message || 'Erro de rede'}`, 'error');
      this.isProcessing = false;
      this.notify();
      return false;
    }
  }

  public clearQueue() {
    this.queue = [];
    this.saveToStorage();
    this.addLog('Fila de sincronização limpa manualmente', 'info');
  }
}

export const syncManager = new SyncManager();

