import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, doc, setDoc, deleteDoc, getDoc, Firestore, serverTimestamp } from 'firebase/firestore';
import { FirebaseProjectConfig } from '../types';

const FIREBASE_CONFIG_STORAGE_KEY = 'asphaltpro_firebase_config';

let firebaseAppInstance: FirebaseApp | null = null;
let firestoreInstance: Firestore | null = null;

export const getSavedFirebaseConfig = (): FirebaseProjectConfig | null => {
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
  } catch (e) {
    console.error('Erro ao remover configuração do Firebase:', e);
  }
};

export const getFirestoreDb = (): Firestore | null => {
  const config = getSavedFirebaseConfig();
  if (!config || !config.isActive || !config.projectId || !config.apiKey) {
    return null;
  }

  try {
    if (!firebaseAppInstance) {
      const appName = 'asphaltpro-app';
      const existingApps = getApps();
      const existing = existingApps.find(app => app.name === appName);
      
      firebaseAppInstance = existing || initializeApp({
        apiKey: config.apiKey.trim(),
        authDomain: config.authDomain ? config.authDomain.trim() : `${config.projectId}.firebaseapp.com`,
        projectId: config.projectId.trim(),
        storageBucket: config.storageBucket ? config.storageBucket.trim() : `${config.projectId}.appspot.com`,
        messagingSenderId: config.messagingSenderId?.trim(),
        appId: config.appId?.trim()
      }, appName);
    }

    if (!firestoreInstance && firebaseAppInstance) {
      firestoreInstance = getFirestore(firebaseAppInstance);
    }

    return firestoreInstance;
  } catch (e) {
    console.error('Falha ao inicializar SDK Firebase:', e);
    return null;
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
