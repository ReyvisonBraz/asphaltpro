import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Button, Input, Modal } from '../common';
import { loginWithGooglePopup, getSavedFirebaseConfig } from '../../services/firebaseConfig';
import { securityRateLimitService } from '../../services/securityRateLimitService';
import { syncManager } from '../../services/syncManager';

export const LoginView: React.FC = () => {
  const { login, loginWithGoogleUser, showToast, pullFromCloud } = useApp();
  
  // Safe credential state (no exposed defaults)
  const [email, setEmail] = useState(() => {
    try {
      return localStorage.getItem('asphalt_remembered_email') || '';
    } catch {
      return '';
    }
  });
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Security Rate Limiting & Lockout
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);
  const [failedMessage, setFailedMessage] = useState<string | null>(null);

  // Modals & Loaders
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const [isLoadingOffline, setIsLoadingOffline] = useState(false);
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  // Quick Firebase connection modal state
  const [isFirebaseSetupOpen, setIsFirebaseSetupOpen] = useState(false);
  const [fbProjectId, setFbProjectId] = useState('');
  const [fbApiKey, setFbApiKey] = useState('');
  const [fbAuthDomain, setFbAuthDomain] = useState('');
  const [isConnectingFb, setIsConnectingFb] = useState(false);

  const [firebaseConfigState, setFirebaseConfigState] = useState(() => getSavedFirebaseConfig());
  const isFirebaseActive = !!(firebaseConfigState && firebaseConfigState.projectId && firebaseConfigState.apiKey && firebaseConfigState.isActive);

  // Check initial rate limit status
  useEffect(() => {
    const status = securityRateLimitService.checkRateLimit(email || 'global');
    if (status.isLocked) {
      setIsLocked(true);
      setLockoutSeconds(status.remainingSeconds);
    }
  }, [email]);

  // Lockout countdown timer
  useEffect(() => {
    if (!isLocked || lockoutSeconds <= 0) {
      if (isLocked && lockoutSeconds <= 0) {
        setIsLocked(false);
        setFailedMessage(null);
      }
      return;
    }

    const interval = setInterval(() => {
      setLockoutSeconds((prev) => {
        if (prev <= 1) {
          setIsLocked(false);
          setFailedMessage(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isLocked, lockoutSeconds]);

  // Online / Offline monitor
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) {
      showToast(`Acesso temporariamente bloqueado. Aguarde ${lockoutSeconds}s.`, 'error');
      return;
    }

    if (!email.trim() || !password.trim()) {
      showToast('Por favor, informe seu e-mail e senha de acesso.', 'info');
      return;
    }

    setIsLoadingOffline(true);
    setFailedMessage(null);

    setTimeout(() => {
      const res = login(email, password);
      setIsLoadingOffline(false);

      if (res.success) {
        if (rememberMe) {
          try {
            localStorage.setItem('asphalt_remembered_email', email.trim());
          } catch {}
        } else {
          try {
            localStorage.removeItem('asphalt_remembered_email');
          } catch {}
        }
      } else {
        if (res.isLocked) {
          setIsLocked(true);
          setLockoutSeconds(res.remainingSeconds || 60);
          setFailedMessage(res.message);
        } else {
          setFailedMessage(res.message);
        }
      }
    }, 250);
  };

  const handleGoogleLogin = async () => {
    if (!isOnline) {
      showToast('Dispositivo sem conexão com a internet. Utilize o acesso offline com e-mail e senha abaixo.', 'info');
      return;
    }

    if (!isFirebaseActive) {
      showToast(
        'O Firebase da empresa ainda não foi configurado. Entre com seu e-mail/senha no modo offline e acesse Configurações > Sincronização Nuvem.',
        'info'
      );
      return;
    }

    setIsLoadingGoogle(true);
    setFailedMessage(null);

    try {
      const googleUser = await loginWithGooglePopup();
      if (googleUser) {
        loginWithGoogleUser({
          displayName: googleUser.displayName,
          email: googleUser.email,
          photoURL: googleUser.photoURL,
          uid: googleUser.uid
        });
      }
    } catch (err: any) {
      console.error('Erro na autenticação Google:', err);
      if (err?.code === 'auth/popup-closed-by-user') {
        showToast('Janela de login do Google foi fechada.', 'info');
      } else if (err?.code === 'auth/unauthorized-domain') {
        showToast(
          'Domínio do app não autorizado no Firebase Auth. No console do Firebase, acesse Authentication > Settings > Authorized domains.',
          'error'
        );
      } else if (err?.code === 'auth/operation-not-allowed') {
        showToast(
          'O provedor Google não está ativado no Firebase Console. Acesse Authentication > Sign-in method e ative o Google.',
          'error'
        );
      } else {
        showToast(`Falha no login com Google: ${err?.message || 'Erro inesperado'}`, 'error');
      }
    } finally {
      setIsLoadingGoogle(false);
    }
  };

  const handleQuickRoleLogin = (userEmail: string, userPassword: string) => {
    if (isLocked) {
      showToast(`Acesso temporariamente bloqueado. Aguarde ${lockoutSeconds}s.`, 'error');
      return;
    }
    setEmail(userEmail);
    setPassword(userPassword);
    setFailedMessage(null);
    setIsLoadingOffline(true);
    setTimeout(() => {
      const res = login(userEmail, userPassword);
      setIsLoadingOffline(false);
      if (res.success) {
        showToast(`Acesso concedido: ${userEmail}`, 'success');
      } else {
        if (res.isLocked) {
          setIsLocked(true);
          setLockoutSeconds(res.remainingSeconds || 60);
          setFailedMessage(res.message);
        } else {
          setFailedMessage(res.message);
        }
      }
    }, 200);
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotSent(true);
  };

  const handleConnectFirebase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fbProjectId.trim() || !fbApiKey.trim()) {
      showToast('Informe pelo menos o Project ID e a Web API Key do Firebase.', 'info');
      return;
    }

    setIsConnectingFb(true);
    try {
      const newConfig = {
        projectId: fbProjectId.trim(),
        apiKey: fbApiKey.trim(),
        authDomain: fbAuthDomain.trim() || `${fbProjectId.trim()}.firebaseapp.com`,
        storageBucket: `${fbProjectId.trim()}.appspot.com`,
        appId: '',
        isActive: true
      };
      syncManager.saveFirebaseConfig(newConfig);
      setFirebaseConfigState(newConfig);

      const testReport = await syncManager.checkSyncIntegrity();
      if (testReport.isFirebaseConnected) {
        showToast('Firebase conectado com sucesso! Sincronizando dados...', 'success');
        await pullFromCloud(false);
        setIsFirebaseSetupOpen(false);
      } else {
        showToast(
          `Salvo, mas o teste retornou: ${testReport.remoteMessage || testReport.statusText}. Verifique as regras do Firestore ou chaves.`,
          'info'
        );
        setIsFirebaseSetupOpen(false);
      }
    } catch (err: any) {
      showToast(`Erro ao conectar Firebase: ${err?.message || 'Falha inesperada'}`, 'error');
    } finally {
      setIsConnectingFb(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col justify-center items-center p-4 relative select-none">
      {/* Background industrial pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#C7C6CA_1px,transparent_1px)] [background-size:24px_24px] opacity-30 pointer-events-none" />

      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-[#DEE2E6] overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Top Brand Banner */}
        <div className="bg-[#010102] p-6 sm:p-7 text-center flex flex-col items-center border-b border-[#1c1c1e] relative">
          {/* Real-time Status Badge */}
          <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wide border shadow-xs">
            {isOnline ? (
              isFirebaseActive ? (
                <span className="bg-emerald-950/80 text-emerald-400 border-emerald-800/80 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Nuvem Conectada
                </span>
              ) : (
                <span className="bg-amber-950/80 text-amber-300 border-amber-800/80 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  Online • Firebase Pendente
                </span>
              )
            ) : (
              <span className="bg-orange-950/80 text-orange-300 border-orange-800/80 px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                Modo Usina Offline
              </span>
            )}
          </div>

          <div className="w-13 h-13 rounded-2xl bg-[#141D24] border-2 border-[#835400] flex items-center justify-center mb-2.5 shadow-md">
            <span className="material-symbols-outlined text-3xl text-[#F2A93B]">
              factory
            </span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Asphalt Pro
          </h1>
          <p className="text-xs font-bold text-[#F2A93B] uppercase tracking-widest mt-1">
            Cash Flow Control & Gestão de Usina
          </p>
        </div>

        {/* Content Container */}
        <div className="p-6 sm:p-7 space-y-5">
          {/* SECTION 1: GOOGLE ONLINE SIGN-IN */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-gray-500">
                Acesso Online Corporativo
              </span>
              <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                Whitelist Ativa
              </span>
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoadingGoogle}
              className="w-full h-11 px-4 rounded-xl border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 text-gray-800 font-semibold text-sm transition-all shadow-xs flex items-center justify-center gap-3 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed group active:scale-[0.99]"
            >
              {isLoadingGoogle ? (
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                  Autenticando com Google...
                </div>
              ) : (
                <>
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24Z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15Z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98Z"
                    />
                  </svg>
                  <span className="text-gray-800 font-bold group-hover:text-black">
                    Entrar com Conta Google
                  </span>
                </>
              )}
            </button>
            <p className="text-[10px] text-gray-400 text-center">
              Restrito a e-mails cadastrados previamente pela administração.
            </p>

            {!isFirebaseActive && (
              <div className="p-3 bg-amber-50/90 border border-amber-200 rounded-xl space-y-2 text-xs text-amber-950 animate-in fade-in">
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-amber-700 text-[18px] shrink-0 mt-0.5">
                    cloud_off
                  </span>
                  <div className="flex-1">
                    <span className="font-bold block text-amber-900">
                      Nuvem da Usina Desconectada neste Dispositivo
                    </span>
                    <span className="text-amber-800 text-[11px] leading-relaxed block mt-0.5">
                      Para sincronizar dados da usina, logo e login Google neste celular ou notebook, conecte o Firebase corporativo:
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setFbProjectId(firebaseConfigState?.projectId || '');
                      setFbApiKey(firebaseConfigState?.apiKey || '');
                      setFbAuthDomain(firebaseConfigState?.authDomain || '');
                      setIsFirebaseSetupOpen(true);
                    }}
                    className="px-3 py-1.5 bg-[#835400] hover:bg-[#6c4500] text-white font-bold text-[11px] rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[15px]">settings_remote</span>
                    Conectar Firebase Agora
                  </button>
                  <span className="text-[10px] text-amber-700">ou use o Acesso Offline abaixo</span>
                </div>
              </div>
            )}
          </div>

          {/* DIVIDER */}
          <div className="relative flex items-center justify-center">
            <div className="border-t border-gray-200 w-full" />
            <span className="bg-white px-3 text-[11px] font-bold uppercase tracking-wider text-gray-400 shrink-0">
              Ou Acesso Offline com Credenciais
            </span>
          </div>

          {/* SECURITY WARNING / LOCKOUT BANNER */}
          {isLocked && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-900 animate-in fade-in">
              <span className="material-symbols-outlined text-red-600 text-[20px] shrink-0 animate-pulse mt-0.5">
                lock_clock
              </span>
              <div className="flex-1">
                <span className="font-bold block text-red-950">Acesso Bloqueado Temporariamente</span>
                <span className="text-red-800 text-[11px] leading-relaxed block mt-0.5">
                  Muitas tentativas consecutivas incorretas. Por segurança, aguarde{' '}
                  <strong className="text-red-950 underline font-black">{lockoutSeconds} segundos</strong>{' '}
                  para tentar novamente.
                </span>
              </div>
            </div>
          )}

          {failedMessage && !isLocked && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2.5 text-xs text-amber-900 animate-in fade-in">
              <span className="material-symbols-outlined text-amber-600 text-[18px] shrink-0">
                warning
              </span>
              <span className="flex-1 text-[11px] font-medium leading-tight">
                {failedMessage}
              </span>
            </div>
          )}

          {/* SECTION 2: OFFLINE / LOCAL LOGIN (EMAIL & PASSWORD) */}
          <form onSubmit={handleLoginSubmit} className="space-y-3.5">
            <div className="flex items-center justify-between text-[11px] text-gray-500">
              <span className="font-semibold flex items-center gap-1 text-gray-600">
                <span className="material-symbols-outlined text-[15px] text-amber-600">wifi_off</span>
                Acesso Local Independente de Internet
              </span>
              <span className="text-[10px] text-gray-400">Pista / Balança</span>
            </div>

            <Input
              label="E-mail Cadastrado"
              type="email"
              required
              disabled={isLocked}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setFailedMessage(null);
              }}
              placeholder="seu.email@empresa.com.br"
              leftIcon="mail"
            />

            <div>
              <Input
                label="Senha de Acesso"
                type={showPassword ? 'text' : 'password'}
                required
                disabled={isLocked}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setFailedMessage(null);
                }}
                placeholder="Digite sua senha"
                leftIcon="lock"
                rightIcon={showPassword ? 'visibility_off' : 'visibility'}
                onRightIconClick={() => setShowPassword(!showPassword)}
              />
            </div>

            <div className="flex items-center justify-between text-xs pt-0.5">
              <label className="flex items-center gap-2 cursor-pointer text-gray-600">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-gray-300 text-[#835400] focus:ring-[#835400] cursor-pointer"
                />
                <span className="text-[11px]">Lembrar e-mail</span>
              </label>

              <button
                type="button"
                onClick={() => setIsForgotPasswordOpen(true)}
                className="text-[#835400] font-bold hover:underline cursor-pointer text-[11px]"
              >
                Esqueceu a senha?
              </button>
            </div>

            <Button
              type="submit"
              variant="warning"
              size="md"
              fullWidth
              disabled={isLocked}
              isLoading={isLoadingOffline}
              icon={isLocked ? 'lock' : 'login'}
            >
              {isLocked ? `Bloqueado (${lockoutSeconds}s)` : 'Entrar no Modo Offline'}
            </Button>
          </form>

          {/* SECTION 3: FAST ROLE / QUICK LOGIN (1-CLIQUE) */}
          <div className="pt-3 border-t border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                Acesso Rápido por Perfil (1-Clique)
              </span>
              <span className="text-[10px] text-gray-400 font-medium">Preenchimento Automático</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickRoleLogin('admin@empresa.com.br', 'admin123')}
                className="p-2.5 rounded-xl border border-amber-200 bg-amber-50/60 hover:bg-amber-100/80 text-left transition-all flex items-center gap-2 text-xs font-bold text-amber-950 cursor-pointer active:scale-[0.98]"
              >
                <span className="material-symbols-outlined text-[18px] text-amber-700">shield_person</span>
                <div className="min-w-0">
                  <span className="block truncate">Diretor (Admin)</span>
                  <span className="text-[10px] font-normal text-amber-800/80 block">admin@empresa...</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickRoleLogin('beatriz@asphaltpro.com.br', 'fin123')}
                className="p-2.5 rounded-xl border border-blue-200 bg-blue-50/60 hover:bg-blue-100/80 text-left transition-all flex items-center gap-2 text-xs font-bold text-blue-950 cursor-pointer active:scale-[0.98]"
              >
                <span className="material-symbols-outlined text-[18px] text-blue-700">account_balance</span>
                <div className="min-w-0">
                  <span className="block truncate">Financeiro</span>
                  <span className="text-[10px] font-normal text-blue-800/80 block">DRE & Contas</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickRoleLogin('lucas@asphaltpro.com.br', 'com123')}
                className="p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100/80 text-left transition-all flex items-center gap-2 text-xs font-bold text-emerald-950 cursor-pointer active:scale-[0.98]"
              >
                <span className="material-symbols-outlined text-[18px] text-emerald-700">request_quote</span>
                <div className="min-w-0">
                  <span className="block truncate">Comercial</span>
                  <span className="text-[10px] font-normal text-emerald-800/80 block">Orçamentos A4</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickRoleLogin('valdir@asphaltpro.com.br', 'op123')}
                className="p-2.5 rounded-xl border border-orange-200 bg-orange-50/60 hover:bg-orange-100/80 text-left transition-all flex items-center gap-2 text-xs font-bold text-orange-950 cursor-pointer active:scale-[0.98]"
              >
                <span className="material-symbols-outlined text-[18px] text-orange-700">local_shipping</span>
                <div className="min-w-0">
                  <span className="block truncate">Operador Balança</span>
                  <span className="text-[10px] font-normal text-orange-800/80 block">Pista & Despesas</span>
                </div>
              </button>
            </div>
          </div>

          {/* Security Information Footer */}
          <div className="pt-2 flex items-center justify-center gap-1.5 text-[10px] text-gray-400 text-center">
            <span className="material-symbols-outlined text-[14px] text-emerald-600">shield</span>
            <span>Proteção contra força bruta ativa &bull; Máx 5 tentativas &bull; Rate Limit</span>
          </div>
        </div>

        {/* Footer info */}
        <div className="bg-[#F8F9FA] px-8 py-3 border-t border-[#DEE2E6] text-center text-[11px] text-gray-500">
          Asphalt Pro v2.5 &bull; Gestão Operacional e Financeira de Usina
        </div>
      </div>

      {/* Forgot Password Modal */}
      {isForgotPasswordOpen && (
        <Modal
          isOpen={true}
          onClose={() => {
            setIsForgotPasswordOpen(false);
            setForgotSent(false);
          }}
          title="Recuperação de Acesso"
          subtitle="Redefinição de senha com a administração"
          size="sm"
          footer={
            forgotSent ? (
              <Button
                variant="primary"
                size="sm"
                fullWidth
                onClick={() => {
                  setIsForgotPasswordOpen(false);
                  setForgotSent(false);
                }}
              >
                Voltar ao Login
              </Button>
            ) : (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsForgotPasswordOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleForgotSubmit}
                >
                  Solicitar Redefinição
                </Button>
              </>
            )
          }
        >
          {forgotSent ? (
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 leading-relaxed">
              Solicitação registrada. Se o e-mail <strong>{forgotEmail || email}</strong> estiver cadastrado na equipe, o Administrador Geral poderá redefinir sua senha offline em <strong>Configurações &gt; Usuários &amp; Permissões</strong>.
            </div>
          ) : (
            <form onSubmit={handleForgotSubmit} className="space-y-3">
              <p className="text-xs text-gray-600 leading-relaxed">
                Por segurança operacional da usina, a redefinição de senhas offline é gerenciada pela Diretoria/Administração em Configurações.
              </p>
              <Input
                label="E-mail Cadastrado"
                type="email"
                required
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="seu.email@empresa.com.br"
                leftIcon="mail"
              />
            </form>
          )}
        </Modal>
      )}

      {/* Quick Firebase Cloud Setup Modal */}
      {isFirebaseSetupOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsFirebaseSetupOpen(false)}
          title="Conectar Firebase da Usina"
          subtitle="Sincronização em tempo real e Login Google neste dispositivo"
          size="md"
          footer={
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsFirebaseSetupOpen(false)}
                disabled={isConnectingFb}
              >
                Fechar
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon="cloud_done"
                isLoading={isConnectingFb}
                onClick={handleConnectFirebase}
              >
                Salvar & Conectar Agora
              </Button>
            </>
          }
        >
          <form onSubmit={handleConnectFirebase} className="space-y-3.5 text-xs">
            <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl text-sky-950 space-y-1.5 leading-relaxed">
              <div className="flex items-center gap-2 font-bold text-sky-900">
                <span className="material-symbols-outlined text-sky-700 text-[18px]">public</span>
                Dica Definitiva para Vercel:
              </div>
              <p className="text-[11px]">
                Para conectar todos os celulares e computadores automaticamente sem precisar digitar chaves em cada um, cadastre no painel da Vercel (<em>Settings &gt; Environment Variables</em>):
                <br />
                <code className="font-mono bg-sky-100/80 px-1 py-0.5 rounded font-bold">VITE_FIREBASE_PROJECT_ID</code> e{' '}
                <code className="font-mono bg-sky-100/80 px-1 py-0.5 rounded font-bold">VITE_FIREBASE_API_KEY</code>.
              </p>
            </div>

            <div className="space-y-3 pt-1">
              <Input
                label="Project ID do Firebase (Obrigatório)"
                type="text"
                required
                value={fbProjectId}
                onChange={(e) => setFbProjectId(e.target.value)}
                placeholder="ex: usina-asfalto-erp-prod"
                leftIcon="badge"
              />

              <Input
                label="Web API Key (apiKey) (Obrigatório)"
                type="text"
                required
                value={fbApiKey}
                onChange={(e) => setFbApiKey(e.target.value)}
                placeholder="ex: AIzaSy..."
                leftIcon="key"
              />

              <Input
                label="Auth Domain (Opcional)"
                type="text"
                value={fbAuthDomain}
                onChange={(e) => setFbAuthDomain(e.target.value)}
                placeholder={fbProjectId ? `${fbProjectId.trim()}.firebaseapp.com` : 'ex: usina-asfalto.firebaseapp.com'}
                leftIcon="domain"
              />
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-950 text-[11px] leading-relaxed">
              <strong>Importante para o Login Google na Vercel:</strong> No console do Firebase (<em>Authentication &gt; Settings &gt; Authorized domains</em>), lembre-se de adicionar o domínio do seu app na Vercel (ex: <code>seu-app.vercel.app</code>) para autorizar o login popup.
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
