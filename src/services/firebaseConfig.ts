import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, doc, setDoc, deleteDoc, collection, getDocs, Firestore, serverTimestamp } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut, Auth, User as FirebaseUser } from 'firebase/auth';
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

export const saveFirebaseConfig = (config: FirebaseProjectConfig): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    localStorage.setItem(FIREBASE_CONFIG_STORAGE_KEY, JSON.stringify(config));
    // Reset cached instances to force re-initialization with new credentials
    firebaseAppInstance = null;
    firestoreInstance = null;
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
