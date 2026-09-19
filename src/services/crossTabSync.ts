/**
 * Cross-Tab / Cross-Window Synchronization Helper
 * Uses standard BroadcastChannel API for 0ms same-origin synchronization across open tabs and windows.
 */

export interface SyncBroadcastMessage {
  entityType: string;
  action: 'create' | 'update' | 'delete';
  ids: string[];
  payload?: any;
  timestamp: number;
}

let channel: BroadcastChannel | null = null;

try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    channel = new BroadcastChannel('asphaltpro_crosstab_sync');
  }
} catch (e) {
  channel = null;
}

export const broadcastEntityMutation = (
  entityType: string,
  action: 'create' | 'update' | 'delete',
  ids: string[],
  payload?: any
) => {
  if (!channel) return;
  try {
    channel.postMessage({
      entityType,
      action,
      ids,
      payload,
      timestamp: Date.now()
    } as SyncBroadcastMessage);
  } catch (e) {
    // Ignore postMessage errors
  }
};

export const subscribeCrossTabSync = (
  callback: (message: SyncBroadcastMessage) => void
): (() => void) => {
  if (!channel) return () => {};

  const handler = (event: MessageEvent) => {
    if (event.data && event.data.entityType) {
      callback(event.data as SyncBroadcastMessage);
    }
  };

  channel.addEventListener('message', handler);
  return () => {
    channel?.removeEventListener('message', handler);
  };
};
