import React, { useState, useEffect } from 'react';
import { syncManager } from '../../services/syncManager';
import { NetworkState } from '../../types';

interface SyncStatusBadgeProps {
  onClick?: () => void;
}

export const SyncStatusBadge: React.FC<SyncStatusBadgeProps> = ({ onClick }) => {
  const [networkState, setNetworkState] = useState<NetworkState>(syncManager.getNetworkState());
  const [pendingCount, setPendingCount] = useState<number>(syncManager.getPendingCount());

  useEffect(() => {
    const unsubscribe = syncManager.subscribe((state) => {
      setNetworkState(state.networkState);
      setPendingCount(state.pendingCount);
    });
    return unsubscribe;
  }, []);

  const getBadgeConfig = () => {
    switch (networkState) {
      case 'syncing':
        return {
          bg: 'bg-amber-50 border-amber-200 text-amber-800',
          dot: 'bg-amber-500 animate-pulse',
          icon: 'sync',
          label: 'Sincronizando...',
          animateIcon: 'animate-spin',
        };
      case 'offline':
        return {
          bg: 'bg-orange-50 border-orange-200 text-orange-800',
          dot: 'bg-orange-500',
          icon: 'cloud_off',
          label: pendingCount > 0 ? `Offline (${pendingCount} pendentes)` : 'Modo Offline',
          animateIcon: '',
        };
      case 'error':
        return {
          bg: 'bg-red-50 border-red-200 text-red-700',
          dot: 'bg-red-500',
          icon: 'error_outline',
          label: 'Erro de Sincronia',
          animateIcon: '',
        };
      case 'online':
      default:
        return {
          bg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
          dot: 'bg-emerald-500',
          icon: 'cloud_done',
          label: 'Nuvem Conectada',
          animateIcon: '',
        };
    }
  };

  const config = getBadgeConfig();

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all hover:opacity-90 active:scale-95 cursor-pointer select-none ${config.bg}`}
      title="Clique para ver detalhes de sincronização e auditoria"
    >
      <span className={`w-2 h-2 rounded-full ${config.dot}`} />
      <span className={`material-symbols-outlined text-[15px] ${config.animateIcon}`}>
        {config.icon}
      </span>
      <span className="hidden sm:inline">{config.label}</span>
    </button>
  );
};
