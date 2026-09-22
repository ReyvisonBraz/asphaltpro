import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { 
  getFirestore, 
  enableIndexedDbPersistence, 
  enableMultiTabIndexedDbPersistence, 
  doc, 
  setDoc, 
  deleteDoc, 
  collection, 
  getDocs, 
  onSnapshot, 
  writeBatch,
  Firestore, 
  serverTimestamp 
} from 'firebase/firestore';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  setPersistence,
  browserLocalPersistence,
  onAuthStateChanged,
  signOut as firebaseSignOut, 
  Auth, 
  User as FirebaseUser 
} from 'firebase/auth';
import { FirebaseProjectConfig } from '../types';

const FIREBASE_CONFIG_STORAGE_KEY = 'asphaltpro_firebase_config';

let firebaseAppInstance: FirebaseApp | null = null;
let firestoreInstance: Firestore | null = null;
let authInstance: Auth | null = null;

export const getSavedFirebaseConfig = (): FirebaseProjectConfig | null => {
  // 1. Check if environment variables are injected via Vercel / Vite build
  try {
    const envProjectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
    const envApiKey = import.meta.env.VITE_FIREBASE_API_KEY;

    if (envProjectId && envApiKey) {
      const envAuthDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
      const envStorageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET;
      const envAppId = import.meta.env.VITE_FIREBASE_APP_ID;

      return {
        projectId: String(envProjectId).trim(),
        apiKey: String(envApiKey).trim(),
        authDomain: envAuthDomain ? String(envAuthDomain).trim() : `${String(envProjectId).trim()}.firebaseapp.com`,
        storageBucket: envStorageBucket ? String(envStorageBucket).trim() : `${String(envProjectId).trim()}.appspot.com`,
        appId: envAppId ? String(envAppId).trim() : '',
        isActive: true,
        isEnvManaged: true
      };
    }
  } catch (e) {
    // ignore in environments without import.meta.env
  }

  // 1.5 Check if URL has quick-connect parameters (e.g. opened from WhatsApp/email on mobile)
  if (typeof window !== 'undefined') {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const qpProjectId = urlParams.get('fb_project') || urlParams.get('projectId');
      const qpApiKey = urlParams.get('fb_key') || urlParams.get('apiKey');
      if (qpProjectId && qpApiKey) {
        const qpAuthDomain = urlParams.get('fb_authDomain') || `${qpProjectId.trim()}.firebaseapp.com`;
        const qpStorageBucket = urlParams.get('fb_storageBucket') || `${qpProjectId.trim()}.appspot.com`;
        const qpAppId = urlParams.get('fb_appId') || '';
        const quickConfig: FirebaseProjectConfig = {
          projectId: qpProjectId.trim(),
          apiKey: qpApiKey.trim(),
          authDomain: qpAuthDomain.trim(),
          storageBucket: qpStorageBucket.trim(),
          appId: qpAppId.trim(),
          isActive: true
        };
        localStorage.setItem(FIREBASE_CONFIG_STORAGE_KEY, JSON.stringify(quickConfig));
        // Clean URL parameter without reloading page
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
        return quickConfig;
      }
    } catch (e) {
      console.error('Erro ao ler parâmetros de conexão rápida do Firebase:', e);
    }
  }

  // 2. Fallback to localStorage configured by user in the UI
  if (typeof window === 'undefined') return null;
  try {
    const saved = localStorage.getItem(FIREBASE_CONFIG_STORAGE_KEY);
    if (!saved) return null;
    const parsed = JSON.parse(saved);
    if (parsed && parsed.projectId && parsed.apiKey) {
      return parsed;
    }
  } catch (e) {
    console.error('Erro ao ler configuração do Firebase:', e);
  }
  return null;
};

let persistencePromise: Promise<void> | null = null;
let persistenceStatus: 'idle' | 'enabling' | 'enabled' | 'failed' = 'idle';

/**
 * Ativa a persistência offline via IndexedDB no Firestore.
 * Garante que operações de CRUD (deleções, edições, criações) sejam enfileiradas e persistidas
 * localmente no navegador, sincronizando automaticamente mesmo em conexões instáveis ou offline.
 */
export const enableFirestoreIndexedDbPersistence = async (db: Firestore): Promise<void> => {
  if (persistenceStatus === 'enabled') return;
  if (persistencePromise) return persistencePromise;
  if (typeof window === 'undefined' || typeof indexedDB === 'undefined') return;

  persistenceStatus = 'enabling';

  persistencePromise = (async () => {
    // 1. Tenta persistência multi-aba primeiro para suportar múltiplas abas concorrentes
    try {
      if (typeof enableMultiTabIndexedDbPersistence === 'function') {
        await enableMultiTabIndexedDbPersistence(db);
        persistenceStatus = 'enabled';
        console.log('[Firestore] Persistência Multi-Tab IndexedDB ativada com sucesso.');
        return;
      }
    } catch (multiErr: any) {
      if (multiErr.code !== 'failed-precondition') {
        console.warn('[Firestore] Persistência multi-aba indisponível, tentando persistência padrão:', multiErr?.code || multiErr?.message);
      }
    }

    // 2. Fallback para enableIndexedDbPersistence padrão conforme solicitado
    try {
      await enableIndexedDbPersistence(db);
      persistenceStatus = 'enabled';
      console.log('[Firestore] enableIndexedDbPersistence ativado com sucesso.');
    } catch (err: any) {
      if (err.code === 'failed-precondition') {
        console.warn('[Firestore] Múltiplas abas abertas simultaneamente; persistência IndexedDB vinculada à aba principal.');
        persistenceStatus = 'failed';
      } else if (err.code === 'unimplemented') {
        console.warn('[Firestore] O navegador atual não suporta IndexedDB persistence.');
        persistenceStatus = 'failed';
      } else {
        console.warn('[Firestore] Aviso ao configurar enableIndexedDbPersistence:', err);
        persistenceStatus = 'failed';
      }
    }
  })();

  return persistencePromise;
};

export const isFirestorePersistenceEnabled = (): boolean => {
  return persistenceStatus === 'enabled';
};

type FirebaseConfigListener = (config: FirebaseProjectConfig | null) => void;
const configChangeListeners = new Set<FirebaseConfigListener>();

export const subscribeToFirebaseConfigChange = (listener: FirebaseConfigListener): (() => void) => {
  configChangeListeners.add(listener);
  return () => {
    configChangeListeners.delete(listener);
  };
};

export const notifyFirebaseConfigChange = () => {
  const current = getSavedFirebaseConfig();
  configChangeListeners.forEach((listener) => {
    try {
      listener(current);
    } catch (e) {
      console.warn('Erro no listener de configuração do Firebase:', e);
    }
  });
};

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === FIREBASE_CONFIG_STORAGE_KEY) {
      notifyFirebaseConfigChange();
    }
  });
}

export const saveFirebaseConfig = (config: FirebaseProjectConfig): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    localStorage.setItem(FIREBASE_CONFIG_STORAGE_KEY, JSON.stringify(config));
    // Reset cached instances to force re-initialization with new credentials
    firebaseAppInstance = null;
    firestoreInstance = null;
    persistencePromise = null;
    persistenceStatus = 'idle';
    notifyFirebaseConfigChange();
    return true;
  } catch (e) {
    console.error('Erro ao salvar configuração do Firebase:', e);
    return false;
  }
};

export const removeFirebaseConfig = () => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(FIREBASE_CONFIG_STORAGE_KEY);
    firebaseAppInstance = null;
    firestoreInstance = null;
    authInstance = null;
    persistencePromise = null;
    persistenceStatus = 'idle';
    notifyFirebaseConfigChange();
  } catch (e) {
    console.error('Erro ao remover configuração do Firebase:', e);
  }
};

export const getFirebaseAppInstance = (): FirebaseApp | null => {
  const config = getSavedFirebaseConfig();
  if (!config || !config.isActive || !config.projectId || !config.apiKey) {
    return null;
  }

  try {
    if (!firebaseAppInstance) {
      const appName = 'asphaltpro-app';
      const existingApps = getApps();
      const existing = existingApps.find((app) => app.name === appName);

      firebaseAppInstance =
        existing ||
        initializeApp(
          {
            apiKey: config.apiKey.trim(),
            authDomain: config.authDomain
              ? config.authDomain.trim()
              : `${config.projectId.trim()}.firebaseapp.com`,
            projectId: config.projectId.trim(),
            storageBucket: config.storageBucket
              ? config.storageBucket.trim()
              : `${config.projectId.trim()}.appspot.com`,
            messagingSenderId: config.messagingSenderId?.trim(),
            appId: config.appId?.trim()
          },
          appName
        );
    }
    return firebaseAppInstance;
  } catch (e) {
    console.error('Falha ao inicializar SDK Firebase:', e);
    return null;
  }
};

export const getFirestoreDb = (): Firestore | null => {
  const app = getFirebaseAppInstance();
  if (!app) return null;

  try {
    if (!firestoreInstance) {
      firestoreInstance = getFirestore(app);
      // Ativação imediata de enableIndexedDbPersistence antes de quaisquer leituras ou escritas
      if (typeof window !== 'undefined' && typeof indexedDB !== 'undefined') {
        enableFirestoreIndexedDbPersistence(firestoreInstance).catch((err) => {
          console.warn('[Firestore] Inicialização offline com IndexedDB em andamento:', err);
        });
      }
    }
    return firestoreInstance;
  } catch (e) {
    console.error('Falha ao obter instância do Firestore:', e);
    return null;
  }
};

export const getFirebaseAuth = (): Auth | null => {
  const app = getFirebaseAppInstance();
  if (!app) return null;

  try {
    if (!authInstance) {
      authInstance = getAuth(app);
      // Ativa persistência local persistente de sessão no navegador
      if (typeof window !== 'undefined') {
        setPersistence(authInstance, browserLocalPersistence).catch((err) => {
          console.warn('[Firebase Auth] Persistência local de sessão:', err);
        });
      }
    }
    return authInstance;
  } catch (e) {
    console.error('Falha ao inicializar Firebase Auth:', e);
    return null;
  }
};

export const loginWithGooglePopup = async (): Promise<FirebaseUser> => {
  const auth = getFirebaseAuth();
  if (!auth) {
    throw new Error('O Firebase não está configurado. Conecte o Project ID e API Key nas configurações de sincronização.');
  }

  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const result = await signInWithPopup(auth, provider);
  return result.user;
};

export const loginWithEmailPassword = async (email: string, pass: string): Promise<FirebaseUser> => {
  const auth = getFirebaseAuth();
  if (!auth) {
    throw new Error('O Firebase não está configurado. Conecte o Project ID e API Key nas configurações de sincronização.');
  }
  const result = await signInWithEmailAndPassword(auth, email.trim(), pass);
  return result.user;
};

export const registerWithEmailPassword = async (email: string, pass: string): Promise<FirebaseUser> => {
  const auth = getFirebaseAuth();
  if (!auth) {
    throw new Error('O Firebase não está configurado. Conecte o Project ID e API Key nas configurações de sincronização.');
  }
  const result = await createUserWithEmailAndPassword(auth, email.trim(), pass);
  return result.user;
};

export const sendResetPassword = async (email: string): Promise<void> => {
  const auth = getFirebaseAuth();
  if (!auth) {
    throw new Error('O Firebase não está configurado. Conecte o Project ID e API Key nas configurações de sincronização.');
  }
  await sendPasswordResetEmail(auth, email.trim());
};

export const logoutFirebaseAuth = async (): Promise<void> => {
  try {
    const auth = getFirebaseAuth();
    if (auth && auth.currentUser) {
      await firebaseSignOut(auth);
    }
  } catch (e) {
    console.error('Erro ao encerrar sessão Firebase Auth:', e);
  }
};

export const subscribeToFirebaseAuthState = (callback: (user: FirebaseUser | null) => void): (() => void) | null => {
  const auth = getFirebaseAuth();
  if (!auth) return null;
  return onAuthStateChanged(auth, callback);
};

export interface FirebaseConnectionTestResult {
  success: boolean;
  latencyMs: number;
  message: string;
  projectId?: string;
}

/**
 * Checks Firebase connection with minimal footprint (at most 1 single heartbeat check).
 * Never scans entire collections to prevent quota abuse.
 */
export const testFirebaseConnection = async (): Promise<FirebaseConnectionTestResult> => {
  const config = getSavedFirebaseConfig();
  if (!config || !config.projectId || !config.apiKey) {
    return {
      success: false,
      latencyMs: 0,
      message: 'Nenhum projeto Firebase configurado. O sistema está operando em Modo Local Seguro com Fila Inteligente.'
    };
  }

  const startTime = performance.now();
  const db = getFirestoreDb();
  if (!db) {
    return {
      success: false,
      latencyMs: 0,
      message: 'Falha ao inicializar o banco de dados Firebase. Verifique as credenciais da conta da empresa.'
    };
  }

  try {
    // Write or check a single tiny heartbeat document to verify authentication and read/write privileges
    const heartbeatRef = doc(db, '_system_sync', 'ping_check');
    await setDoc(heartbeatRef, {
      lastPingAt: serverTimestamp(),
      clientPlatform: 'AsphaltPro Web ERP',
      mode: 'anti-abuse-heartbeat'
    }, { merge: true });

    const latencyMs = Math.round(performance.now() - startTime);

    return {
      success: true,
      latencyMs,
      message: `Conexão bem-sucedida com o projeto "${config.projectId}" (${latencyMs}ms). 1 única operação consumida.`,
      projectId: config.projectId
    };
  } catch (err: any) {
    const latencyMs = Math.round(performance.now() - startTime);
    const errorMsg = err?.message || 'Erro desconhecido ao conectar ao Firestore.';
    return {
      success: false,
      latencyMs,
      message: `Falha na verificação com Firebase (${latencyMs}ms): ${errorMsg}`
    };
  }
};

/**
 * Recursively cleans an object to make it Firestore-compliant:
 * - Firestore strictly forbids any properties with `undefined` values.
 * - This function recursively removes `undefined` properties or converts them to `null`.
 * - Handles nested arrays, dates, and objects cleanly.
 */
export const sanitizeForFirestore = (obj: any): any => {
  if (obj === undefined) {
    return null;
  }
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  if (obj instanceof Date) {
    return obj;
  }
  // If it's a Firestore FieldValue or serverTimestamp sentinel, preserve it
  if (typeof obj === 'object' && ('_methodName' in obj || '_delegate' in obj)) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => (item === undefined ? null : sanitizeForFirestore(item)));
  }

  const cleanObj: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      cleanObj[key] = sanitizeForFirestore(value);
    }
  }
  return cleanObj;
};

/**
 * Perform a single document mutation on Firestore safely.
 */
export const syncDocToFirestore = async (
  collectionName: string,
  docId: string,
  payload: any,
  action: 'create' | 'update' | 'delete'
): Promise<boolean> => {
  const db = getFirestoreDb();
  if (!db) return false;

  try {
    const docRef = doc(db, collectionName, docId);
    if (action === 'delete') {
      await deleteDoc(docRef);
    } else {
      const sanitized = sanitizeForFirestore(payload || {});
      await setDoc(docRef, {
        ...sanitized,
        _syncedAt: serverTimestamp()
      }, { merge: true });
    }
    return true;
  } catch (err) {
    console.error(`Erro ao gravar ${collectionName}/${docId} no Firestore:`, err);
    throw err;
  }
};

/**
 * Fetches all documents from a given Firestore collection.
 * Used when a new device connects or when syncing data down from cloud.
 */
export const fetchCollectionFromFirestore = async (collectionName: string): Promise<any[]> => {
  const db = getFirestoreDb();
  if (!db) return [];

  try {
    const colRef = collection(db, collectionName);
    const snap = await getDocs(colRef);
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        ...data
      };
    });
  } catch (err) {
    console.error(`Erro ao baixar documentos da coleção "${collectionName}":`, err);
    return [];
  }
};

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const auth = getFirebaseAuth();
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
      isAnonymous: auth?.currentUser?.isAnonymous,
      tenantId: auth?.currentUser?.tenantId,
      providerInfo: auth?.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  return errInfo;
}

/**
 * Perform bulk mutations in atomic batches of up to 450 items per writeBatch
 */
export const syncBatchToFirestore = async (
  operations: {
    collectionName: string;
    docId: string;
    payload?: any;
    action: 'create' | 'update' | 'delete';
  }[]
): Promise<number> => {
  const db = getFirestoreDb();
  if (!db || operations.length === 0) return 0;

  const BATCH_SIZE = 450; // Margem de segurança abaixo do limite de 500 do Firestore
  let successfulWrites = 0;

  for (let i = 0; i < operations.length; i += BATCH_SIZE) {
    const chunk = operations.slice(i, i + BATCH_SIZE);
    const batch = writeBatch(db);

    for (const op of chunk) {
      const docRef = doc(db, op.collectionName, op.docId);
      if (op.action === 'delete') {
        batch.delete(docRef);
      } else {
        const sanitized = sanitizeForFirestore(op.payload || {});
        batch.set(docRef, {
          ...sanitized,
          _syncedAt: serverTimestamp()
        }, { merge: true });
      }
    }

    try {
      await batch.commit();
      successfulWrites += chunk.length;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'batch_commit');
      throw err;
    }
  }

  return successfulWrites;
};

/**
 * Subscribes to real-time updates for a given Firestore collection.
 * Any creates, updates or DELETES from any device trigger this callback immediately.
 * Utiliza { includeMetadataChanges: false } para evitar disparos desnecessários enquanto em cache local.
 */
export const subscribeToFirestoreCollection = (
  collectionName: string,
  onData: (items: any[]) => void,
  onError?: (err: any) => void
): (() => void) | null => {
  const db = getFirestoreDb();
  if (!db) return null;

  try {
    const colRef = collection(db, collectionName);
    const unsubscribe = onSnapshot(
      colRef,
      { includeMetadataChanges: false },
      (snap) => {
        const items = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            ...data
          };
        });
        onData(items);
      },
      (err) => {
        handleFirestoreError(err, OperationType.GET, collectionName);
        console.warn(`Aviso na escuta em tempo real da coleção "${collectionName}":`, err);
        if (onError) onError(err);
      }
    );
    return unsubscribe;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, collectionName);
    console.error(`Erro ao assinar coleção em tempo real "${collectionName}":`, err);
    return null;
  }
};

/**
 * Subscribes to real-time updates for a single specific Firestore document (e.g. settings/letterhead).
 * Ensures instantaneous cross-device sync for document-level settings.
 */
export const subscribeToFirestoreDoc = (
  collectionName: string,
  docId: string,
  onData: (data: any | null) => void,
  onError?: (err: any) => void
): (() => void) | null => {
  const db = getFirestoreDb();
  if (!db) return null;

  try {
    const docRef = doc(db, collectionName, docId);
    const unsubscribe = onSnapshot(
      docRef,
      { includeMetadataChanges: false },
      (snap) => {
        if (snap.exists()) {
          onData({
            id: snap.id,
            ...snap.data()
          });
        } else {
          onData(null);
        }
      },
      (err) => {
        handleFirestoreError(err, OperationType.GET, `${collectionName}/${docId}`);
        console.warn(`Aviso na escuta em tempo real do documento "${collectionName}/${docId}":`, err);
        if (onError) onError(err);
      }
    );
    return unsubscribe;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `${collectionName}/${docId}`);
    console.error(`Erro ao assinar documento em tempo real "${collectionName}/${docId}":`, err);
    return null;
  }
};

