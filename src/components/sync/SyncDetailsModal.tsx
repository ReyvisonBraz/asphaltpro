import React, { useState, useSyncExternalStore } from 'react';
import { syncManager, IntegrityCheckReport } from '../../services/syncManager';
import { Modal, Button } from '../common';
import { useApp } from '../../context/AppContext';
import { FirebaseProjectConfig } from '../../types';

interface SyncDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SyncDetailsModal: React.FC<SyncDetailsModalProps> = ({ isOpen, onClose }) => {
  const { exportFullBackup, showToast } = useApp();

  const networkState = useSyncExternalStore(
    (cb) => syncManager.subscribe(cb),
    () => syncManager.getNetworkState()
  );
  const pendingCount = useSyncExternalStore(
    (cb) => syncManager.subscribe(cb),
    () => syncManager.getPendingCount()
  );
  const lastSyncTime = useSyncExternalStore(
    (cb) => syncManager.subscribe(cb),
    () => syncManager.getLastSyncTime()
  );
  const queue = useSyncExternalStore(
    (cb) => syncManager.subscribe(cb),
    () => syncManager.getQueue()
  );
  const logs = useSyncExternalStore(
    (cb) => syncManager.subscribe(cb),
    () => syncManager.getLogs()
  );
  const isSimulating = useSyncExternalStore(
    (cb) => syncManager.subscribe(cb),
    () => syncManager.isSimulatingOffline()
  );
  const cachedReadsSaved = useSyncExternalStore(
    (cb) => syncManager.subscribe(cb),
    () => syncManager.getCachedReadsSaved()
  );
  const batchedWritesSaved = useSyncExternalStore(
    (cb) => syncManager.subscribe(cb),
    () => syncManager.getBatchedWritesSaved()
  );

  const [activeTab, setActiveTab] = useState<'status' | 'firebase' | 'logs'>('status');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isCheckingIntegrity, setIsCheckingIntegrity] = useState(false);
  const [integrityReport, setIntegrityReport] = useState<IntegrityCheckReport | null>(null);

  // Firebase Config Form State
  const initialConfig = syncManager.getFirebaseConfig();
  const [projectId, setProjectId] = useState(initialConfig?.projectId || '');
  const [apiKey, setApiKey] = useState(initialConfig?.apiKey || '');
  const [authDomain, setAuthDomain] = useState(initialConfig?.authDomain || '');
  const [storageBucket, setStorageBucket] = useState(initialConfig?.storageBucket || '');
  const [appId, setAppId] = useState(initialConfig?.appId || '');
  const [isTestingConfig, setIsTestingConfig] = useState(false);
  const [configTestMessage, setConfigTestMessage] = useState<{ text: string; ok: boolean } | null>(null);

  if (!isOpen) return null;

  const handleForceSync = async () => {
    setIsSyncing(true);
    await syncManager.processQueue();
    setIsSyncing(false);
  };

  const handleToggleSimulation = () => {
    syncManager.toggleSimulatedOffline();
  };

  const handleCheckIntegrity = async () => {
    setIsCheckingIntegrity(true);
    try {
      const report = await syncManager.checkSyncIntegrity();
      setIntegrityReport(report);
      showToast('Verificação de integridade concluída com sucesso!', 'success');
    } catch (e: any) {
      showToast('Erro ao verificar integridade: ' + e?.message, 'error');
    } finally {
      setIsCheckingIntegrity(false);
    }
  };

  const handleSaveFirebaseConfig = async () => {
    if (!projectId.trim() || !apiKey.trim()) {
      showToast('Informe pelo menos o Project ID e a API Key do Firebase da empresa.', 'info');
      return;
    }

    const newConfig: FirebaseProjectConfig = {
      projectId: projectId.trim(),
      apiKey: apiKey.trim(),
      authDomain: authDomain.trim() || `${projectId.trim()}.firebaseapp.com`,
      storageBucket: storageBucket.trim() || `${projectId.trim()}.appspot.com`,
      appId: appId.trim(),
      isActive: true
    };

    setIsTestingConfig(true);
    syncManager.saveFirebaseConfig(newConfig);

    // Test connection
    const testReport = await syncManager.checkSyncIntegrity();
    setIsTestingConfig(false);

    if (testReport.isFirebaseConnected) {
      setConfigTestMessage({
        text: `Conectado com sucesso ao projeto "${projectId}" (${testReport.latencyMs}ms)! Fila ativada.`,
        ok: true
      });
      showToast('Firebase corporativo configurado e validado com sucesso!', 'success');
    } else {
      const detailMsg = testReport.remoteMessage || testReport.statusText;
      setConfigTestMessage({
        text: `Configuração gravada, mas o teste retornou: ${detailMsg}. Veja o guia de permissões abaixo.`,
        ok: false
      });
    }
  };

  const handleRemoveFirebaseConfig = () => {
    syncManager.removeFirebaseConfig();
    setProjectId('');
    setApiKey('');
    setAuthDomain('');
    setStorageBucket('');
    setAppId('');
    setConfigTestMessage(null);
    showToast('Configuração do Firebase removida. Operando em Modo Local Seguro.', 'info');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-[#835400] flex items-center justify-center">
            <span className="material-symbols-outlined text-[22px]">cloud_sync</span>
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-[#010102]">
              Gerenciador de Sincronização & Proteção de Cotas
            </h3>
            <p className="text-xs text-gray-500">
              Arquitetura Cache-First: Zero leituras abusivas no Firebase e persistência garantida.
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
            <Button
              variant="secondary"
              size="xs"
              icon="download"
              onClick={() => {
                exportFullBackup();
                showToast('Backup JSON gerado com sucesso!', 'success');
              }}
            >
              Backup JSON Preventivo
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
              isLoading={isSyncing || networkState === 'syncing'}
              disabled={networkState === 'offline' && isSimulating}
              onClick={handleForceSync}
            >
              Forçar Sincronização
            </Button>
          </div>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        {/* Navigation Sub-Tabs */}
        <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('status')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'status'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">verified_user</span>
            Auditoria & Verificação
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('firebase')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'firebase'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">cloud</span>
            Conta Firebase da Empresa
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('logs')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'logs'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">history</span>
            Logs de Auditoria ({logs.length})
          </button>
        </div>

        {/* TAB 1: STATUS & INTEGRITY CHECK */}
        {activeTab === 'status' && (
          <div className="flex flex-col gap-4">
            {/* Status Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
              <div className="p-3 rounded-xl border border-gray-200 bg-gray-50">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                  Rede & Nuvem
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
                  <span className="text-xs font-bold text-gray-900">
                    {networkState === 'online'
                      ? 'Nuvem Conectada'
                      : networkState === 'syncing'
                      ? 'Sincronizando'
                      : 'Modo Offline'}
                  </span>
                </div>
                {isSimulating && (
                  <span className="text-[10px] text-amber-700 font-bold block mt-0.5">
                    (Simulação Ativa)
                  </span>
                )}
              </div>

              <div className="p-3 rounded-xl border border-gray-200 bg-gray-50">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                  Fila de Envio
                </span>
                <span className="text-lg font-black text-gray-900 tabular-nums">
                  {pendingCount}
                </span>
                <span className="text-[10px] text-gray-500 block">
                  {pendingCount === 0 ? 'Tudo gravado' : 'Aguardando lote'}
                </span>
              </div>

              <div className="p-3 rounded-xl border border-gray-200 bg-gray-50">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                  Leituras Economizadas
                </span>
                <span className="text-lg font-black text-emerald-700 tabular-nums">
                  +{cachedReadsSaved}
                </span>
                <span className="text-[10px] text-gray-500 block">Modo Cache-First</span>
              </div>

              <div className="p-3 rounded-xl border border-gray-200 bg-gray-50">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                  Gravações Agrupadas
                </span>
                <span className="text-lg font-black text-blue-700 tabular-nums">
                  +{batchedWritesSaved}
                </span>
                <span className="text-[10px] text-gray-500 block">Economia em lote</span>
              </div>
            </div>

            {/* Integrity Check Trigger Box */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50/80 to-teal-50/60 border border-emerald-200/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-700 text-[20px]">
                    shield_check
                  </span>
                  <h4 className="text-sm font-bold text-emerald-950">
                    Função de Verificação de Sincronização & Proteção Anti-Abuso
                  </h4>
                </div>
                <p className="text-xs text-emerald-800 leading-relaxed max-w-xl">
                  Testa a integridade da fila e a resposta do banco com <strong>apenas 1 ping</strong> leve, sem ler coleções completas nem gastar a sua cota do Firebase.
                </p>
              </div>

              <Button
                variant="primary"
                size="sm"
                icon="fact_check"
                isLoading={isCheckingIntegrity}
                onClick={handleCheckIntegrity}
                className="shrink-0 bg-emerald-600 hover:bg-emerald-700 border-emerald-700 text-white"
              >
                Verificar Integridade Agora
              </Button>
            </div>

            {/* Integrity Report Display (if run) */}
            {integrityReport && (
              <div className="p-4 rounded-xl border border-gray-200 bg-white shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-3 h-3 rounded-full ${
                        integrityReport.isSynced ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}
                    />
                    <span className="text-sm font-bold text-gray-900">
                      {integrityReport.statusText}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-gray-500">
                    Verificado às {integrityReport.lastChecked} • Ping: {integrityReport.latencyMs}ms
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {integrityReport.diagnosticItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded-lg bg-gray-50 border border-gray-100 flex items-start gap-2"
                    >
                      <span
                        className={`material-symbols-outlined text-[16px] mt-0.5 ${
                          item.isOk ? 'text-emerald-600' : 'text-amber-600'
                        }`}
                      >
                        {item.isOk ? 'check_circle' : 'info'}
                      </span>
                      <div className="min-w-0">
                        <span className="font-bold text-gray-700 block">{item.label}</span>
                        <span className="text-gray-500">{item.value}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
                  <span className="material-symbols-outlined text-amber-700 text-[18px] shrink-0">
                    lightbulb
                  </span>
                  <span>{integrityReport.recommendation}</span>
                </div>
              </div>
            )}

            {/* Anti-Abuse Rules Guarantee */}
            <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl flex items-start gap-3">
              <span className="material-symbols-outlined text-blue-600 text-[20px] mt-0.5 shrink-0">
                lock
              </span>
              <div className="text-xs text-blue-900 leading-relaxed">
                <strong>Garantia de Não Abuso do Firebase:</strong> Todas as filtragens, relatórios (DRE), telas de orçamentos e listas operam <strong>100% no cache local do seu navegador</strong>. O sistema só envia requisições ao Firebase quando você realmente salva ou edita um registro, e ainda agrupa edições consecutivas para economizar gravações.
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: FIREBASE COMPANY CREDENTIALS */}
        {activeTab === 'firebase' && (
          <div className="flex flex-col gap-4">
            <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl flex items-start gap-3">
              <span className="material-symbols-outlined text-amber-700 text-[20px] mt-0.5 shrink-0">
                business
              </span>
              <div className="text-xs text-amber-950 leading-relaxed">
                <strong>Conta do Firebase para a Empresa:</strong> Quando você criar a conta do Google da empresa e o projeto no Firebase Console, basta colar os parâmetros abaixo. O sistema se conectará diretamente à nuvem corporativa.
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="sm:col-span-2">
                <label className="block font-bold text-gray-700 mb-1">
                  Project ID do Firebase (Obrigatório)
                </label>
                <input
                  type="text"
                  placeholder="ex: usina-asfalto-erp-prod"
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
                <span className="text-[11px] text-gray-500">
                  Encontrado nas Configurações do Projeto no Firebase Console.
                </span>
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-gray-700 mb-1">
                  Web API Key (apiKey) (Obrigatório)
                </label>
                <input
                  type="text"
                  placeholder="ex: AIzaSy..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Auth Domain (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="ex: usina-asfalto.firebaseapp.com"
                  value={authDomain}
                  onChange={(e) => setAuthDomain(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Storage Bucket (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="ex: usina-asfalto.appspot.com"
                  value={storageBucket}
                  onChange={(e) => setStorageBucket(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-gray-700 mb-1">
                  App ID (appId) (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="ex: 1:123456789:web:abcdef"
                  value={appId}
                  onChange={(e) => setAppId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none font-mono"
                />
              </div>
            </div>

            {configTestMessage && (
              <div
                className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                  configTestMessage.ok
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                    : 'bg-amber-50 border border-amber-200 text-amber-900'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {configTestMessage.ok ? 'check_circle' : 'warning'}
                </span>
                <span>{configTestMessage.text}</span>
              </div>
            )}

            {/* Firestore Rules Help */}
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-800 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-amber-600 text-[18px]">rule</span>
                  Regras de Segurança do Firestore (Necessário Liberar no Console)
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(`rules_version = '2';\nservice cloud.firestore {\n  match /databases/{database}/documents {\n    match /{document=**} {\n      allow read, write: if true;\n    }\n  }\n}`);
                    showToast('Regra copiada para a área de transferência!', 'info');
                  }}
                  className="text-[11px] font-semibold text-amber-700 hover:text-amber-800 bg-amber-100/70 hover:bg-amber-100 px-2 py-1 rounded transition-colors"
                >
                  Copiar Regra Padrão
                </button>
              </div>
              <p className="text-gray-600 leading-relaxed text-[11px]">
                Se o teste retornar erro de permissões (<em>Missing or insufficient permissions</em>), vá no Firebase Console em <strong>Firestore Database &gt; Regras (Rules)</strong>, cole a regra abaixo e clique em <strong>Publicar (Publish)</strong>:
              </p>
              <pre className="p-2 bg-gray-900 text-emerald-400 rounded text-[11px] font-mono overflow-x-auto leading-tight">
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}`}
              </pre>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-gray-200">
              <Button
                variant="danger"
                size="sm"
                icon="delete"
                onClick={handleRemoveFirebaseConfig}
                disabled={!projectId && !apiKey}
              >
                Remover Credenciais
              </Button>

              <Button
                variant="primary"
                size="sm"
                icon="cloud_done"
                isLoading={isTestingConfig}
                onClick={handleSaveFirebaseConfig}
              >
                Salvar & Validar Conexão
              </Button>
            </div>
          </div>
        )}

        {/* TAB 3: AUDIT LOGS */}
        {activeTab === 'logs' && (
          <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
            <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200 flex items-center justify-between">
              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                Auditoria de Eventos de Sincronização
              </h4>
              <span className="text-[11px] text-gray-500">
                {logs.length} eventos registrados
              </span>
            </div>

            <div className="max-h-72 overflow-y-auto divide-y divide-gray-100 text-xs">
              {logs.length === 0 ? (
                <div className="p-4 text-center text-gray-400">Nenhum evento registrado.</div>
              ) : (
                logs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 flex items-start justify-between gap-3 hover:bg-gray-50 transition-colors select-text"
                  >
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 mt-1 ${
                          log.type === 'success'
                            ? 'bg-emerald-500'
                            : log.type === 'warning'
                            ? 'bg-amber-500'
                            : log.type === 'error'
                            ? 'bg-red-500'
                            : 'bg-blue-500'
                        }`}
                      />
                      <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                        <span className="text-gray-800 font-medium leading-relaxed break-words">
                          {log.description}
                        </span>
                        {log.itemCount !== undefined && log.itemCount > 0 && (
                          <span className="text-[10px] text-gray-500">
                            {log.itemCount} registros processados
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-[11px] text-gray-400 font-mono shrink-0 whitespace-nowrap pt-0.5">
                      {log.timestamp}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
