import React, { useSyncExternalStore } from 'react';
import { syncManager } from '../../services/syncManager';

interface OptimisticSyncIndicatorProps {
  entityType: string;
  entityId: string;
  className?: string;
  showText?: boolean;
}

/**
 * OptimisticSyncIndicator:
 * Displays real-time optimistic state for an individual entity.
 * While an item is being sent to Firestore in the background, this component
 * indicates that the local UI is updated and cloud synchronization is in-flight.
 */
export const OptimisticSyncIndicator: React.FC<OptimisticSyncIndicatorProps> = ({
  entityType,
  entityId,
  className = '',
  showText = false
}) => {
  const status = useSyncExternalStore(
    (cb) => syncManager.subscribe(cb),
    () => syncManager.getOptimisticStatus(entityType, entityId)
  );

  if (status === 'synced') {
    return null;
  }

  if (status === 'error') {
    return (
      <span
        className={`inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded ${className}`}
        title="Pendente na fila local para sincronização"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        {showText && <span>Fila Offline</span>}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] font-medium text-sky-700 bg-sky-50 border border-sky-200 px-1.5 py-0.5 rounded transition-all animate-pulse ${className}`}
      title="Atualização otimista: salvo localmente, sincronizando com a nuvem"
    >
      <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-ping" />
      {showText && <span>Sincronizando...</span>}
    </span>
  );
};
