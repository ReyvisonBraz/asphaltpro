import React, { useState, useEffect } from 'react';
import { syncManager } from '../../services/syncManager';
import { NetworkState, SyncQueueItem, SyncAuditLog } from '../../types';
import { Modal, Button } from '../common';

interface SyncDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SyncDetailsModal: React.FC<SyncDetailsModalProps> = ({ isOpen, onClose }) => {
  const [networkState, setNetworkState] = useState<NetworkState>(syncManager.getNetworkState());
  const [pendingCount, setPendingCount] = useState<number>(syncManager.getPendingCount());
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(syncManager.getLastSyncTime());
  const [queue, setQueue] = useState<SyncQueueItem[]>(syncManager.getQueue());
  const [logs, setLogs] = useState<SyncAuditLog[]>(syncManager.getLogs());
  const [isSimulating, setIsSimulating] = useState<boolean>(syncManager.isSimulatingOffline());
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const unsubscribe = syncManager.subscribe((state) => {
      setNetworkState(state.networkState);
      setPendingCount(state.pendingCount);
      setLastSyncTime(state.lastSyncTime);
      setQueue(state.queue);
      setLogs(state.logs);
      setIsSimulating(syncManager.isSimulatingOffline());
    });
    return unsubscribe;
  }, []);

  if (!isOpen) return null;

  const handleForceSync = async () => {
    setIsSyncing(true);
    await syncManager.processQueue();
    setIsSyncing(false);
  };

  const handleToggleSimulation = () => {
    const newState = syncManager.toggleSimulatedOffline();
    setIsSimulating(newState);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-[#835400] flex items-center justify-center">
            <span className="material-symbols-outlined text-[22px]">sync_saved_locally</span>
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-[#010102]">
              Sincronização & Persistência Híbrida
            </h3>
            <p className="text-xs text-gray-500">
              Arquitetura Offline-First com espelhamento contínuo na Nuvem.
            </p>
          </div>
        </div>
      }
      size="lg"
      footer={
        <div className="flex flex-wrap items-center justify-between w-full gap-2">
          <div className="flex items-center gap-2">
            <Button
              variant={isSimulating ? 'danger' : 'secondary'}
              size="xs"
              icon={isSimulating ? 'wifi' : 'wifi_off'}
              onClick={handleToggleSimulation}
            >
              {isSimulating ? 'Desativar Simulação Offline' : 'Testar Modo Offline'}
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={onClose}>
              Fechar
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon="sync"
              loading={isSyncing || networkState === 'syncing'}
              disabled={networkState === 'offline' && isSimulating}
              onClick={handleForceSync}
            >
              Forçar Sincronização Agora
            </Button>
          </div>
        </div>
      }
    >
      <div className="flex flex-col gap-5">
        {/* Status Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl border border-[#DEE2E6] bg-gray-50/50">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
              Estado da Conexão
            </span>
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  networkState === 'online'
                    ? 'bg-emerald-500'
                    : networkState === 'syncing'
                    ? 'bg-amber-500 animate-pulse'
                    : 'bg-orange-500'
                }`}
              />
              <span className="text-sm font-bold text-[#010102] capitalize">
                {networkState === 'online'
                  ? 'Nuvem Conectada'
                  : networkState === 'syncing'
                  ? 'Sincronizando'
                  : 'Modo Offline (Usina)'}
              </span>
            </div>
            {isSimulating && (
              <span className="text-[10px] text-amber-700 font-bold block mt-1">
                (Simulação Ativa)
              </span>
            )}
          </div>

          <div className="p-3.5 rounded-xl border border-[#DEE2E6] bg-gray-50/50">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
              Itens na Fila de Envio
            </span>
            <span className="text-xl font-black text-[#010102] tabular-nums">
              {pendingCount}
            </span>
            <span className="text-[11px] text-gray-500 block">
              {pendingCount === 0 ? 'Tudo sincronizado' : 'Aguardando despacho'}
            </span>
          </div>

          <div className="p-3.5 rounded-xl border border-[#DEE2E6] bg-gray-50/50">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
              Última Sincronização
            </span>
            <span className="text-sm font-bold text-[#010102]">
              {lastSyncTime || 'Sessão atual'}
            </span>
            <span className="text-[11px] text-gray-500 block">Confirmação de integridade</span>
          </div>
        </div>

        {/* Anti-Duplicity Guarantee Explanation */}
        <div className="p-3.5 bg-blue-50/60 border border-blue-200/80 rounded-xl flex items-start gap-3">
          <span className="material-symbols-outlined text-blue-600 text-[20px] mt-0.5 shrink-0">
            verified_user
          </span>
          <div className="text-xs text-blue-900 leading-relaxed">
            <strong>Proteção contra Duplicidades (Idempotência Ativa):</strong> Cada transação ou orçamento recebe um identificador único universal (UUID). Mesmo que a conexão da usina oscile e envie a mesma operação múltiplas vezes, a Nuvem aceita apenas uma gravação oficial sem duplicar saldos.
          </div>
        </div>

        {/* Sync Queue / Logs Section */}
        <div className="border border-[#DEE2E6] rounded-xl overflow-hidden bg-white">
          <div className="bg-[#F8F9FA] px-4 py-2.5 border-b border-[#DEE2E6] flex items-center justify-between">
            <h4 className="text-xs font-bold text-[#010102] uppercase tracking-wider">
              Histórico de Auditoria & Fila
            </h4>
            <span className="text-[11px] text-gray-500">
              {logs.length} eventos registrados
            </span>
          </div>

          <div className="max-h-56 overflow-y-auto divide-y divide-gray-100 text-xs">
            {logs.length === 0 ? (
              <div className="p-4 text-center text-gray-400">Nenhum evento registrado ainda.</div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="p-3 flex items-center justify-between gap-3 hover:bg-gray-50">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        log.type === 'success'
                          ? 'bg-emerald-500'
                          : log.type === 'warning'
                          ? 'bg-amber-500'
                          : log.type === 'error'
                          ? 'bg-red-500'
                          : 'bg-blue-500'
                      }`}
                    />
                    <span className="text-gray-800 truncate font-medium">{log.description}</span>
                  </div>
                  <span className="text-[11px] text-gray-400 font-mono shrink-0 whitespace-nowrap">
                    {log.timestamp}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};
