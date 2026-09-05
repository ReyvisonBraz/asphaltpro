import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Button, Input, Modal } from '../common';
import { UserRole } from '../../types';
import { loginWithGooglePopup, getSavedFirebaseConfig } from '../../services/firebaseConfig';
import { syncManager } from '../../services/syncManager';

export const LoginView: React.FC = () => {
  const { login, loginWithGoogleUser, user, systemUsers, showToast } = useApp();
  const [loginMode, setLoginMode] = useState<'all' | 'google' | 'offline'>('all');
  const [email, setEmail] = useState('admin@empresa.com.br');
  const [password, setPassword] = useState('admin123');
  const [rememberMe, setRememberMe] = useState(true);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const [isLoadingOffline, setIsLoadingOffline] = useState(false);
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  const firebaseConfig = getSavedFirebaseConfig();
  const isFirebaseActive = !!(firebaseConfig && firebaseConfig.projectId && firebaseConfig.apiKey && firebaseConfig.isActive);

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
    setIsLoadingOffline(true);
    setTimeout(() => {
      const success = login(email, password);
      setIsLoadingOffline(false);
      if (success) {
        showToast('Login local/offline realizado com sucesso!', 'success');
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
        'O Firebase da empresa ainda não está configurado. Entre com e-mail/senha no modo offline e acesse Configurações > Sincronização Nuvem.',
        'info'
      );
      return;
    }

    setIsLoadingGoogle(true);
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
          'Domínio da Vercel não autorizado no Firebase Auth. No console do Firebase, acesse Authentication > Settings > Authorized domains e adicione o domínio do app.',
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

  const handleQuickRoleLogin = (userEmail: string, role: UserRole) => {
    setEmail(userEmail);
    setIsLoadingOffline(true);
    setTimeout(() => {
      login(userEmail, 'senha123', role);
      setIsLoadingOffline(false);
      showToast(`Acesso concedido como perfil ${role.toUpperCase()}.`, 'info');
    }, 200);
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotSent(true);
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
                Sincronização Nuvem
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
                  Autenticando com o Google...
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
          </div>

          {/* DIVIDER */}
          <div className="relative flex items-center justify-center">
            <div className="border-t border-gray-200 w-full" />
            <span className="bg-white px-3 text-[11px] font-bold uppercase tracking-wider text-gray-400 shrink-0">
              Ou Acesso Offline / Balança
            </span>
          </div>

          {/* SECTION 2: OFFLINE / LOCAL LOGIN (EMAIL & PASSWORD) */}
          <form onSubmit={handleLoginSubmit} className="space-y-3.5">
            <div className="flex items-center justify-between text-[11px] text-gray-500">
              <span className="font-semibold flex items-center gap-1 text-gray-600">
                <span className="material-symbols-outlined text-[15px] text-amber-600">wifi_off</span>
                Acesso Local Independente de Internet
              </span>
              <span className="text-[10px] text-gray-400">Banco Local PWA</span>
            </div>

            <div className="p-2.5 rounded-lg bg-amber-50/80 border border-amber-200/80 text-[11px] text-amber-950 flex items-center justify-between">
              <div>
                <span className="font-bold block text-amber-900">Administrador Geral Padrão</span>
                <span>E-mail: <strong>admin@empresa.com.br</strong> &bull; Senha: <strong>admin123</strong></span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEmail('admin@empresa.com.br');
                  setPassword('admin123');
                }}
                className="px-2 py-1 rounded bg-amber-200/70 hover:bg-amber-200 font-bold text-amber-900 cursor-pointer text-[10px]"
              >
                Preencher
              </button>
            </div>

            <Input
              label="E-mail Cadastrado"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@asphaltpro.com.br"
              leftIcon="mail"
            />

            <Input
              label="Senha de Acesso"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Sua senha"
              leftIcon="lock"
            />

            <div className="flex items-center justify-between text-xs pt-0.5">
              <label className="flex items-center gap-2 cursor-pointer text-gray-600">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-gray-300 text-[#835400] focus:ring-[#835400] cursor-pointer"
                />
                <span>Lembrar credenciais</span>
              </label>

              <button
                type="button"
                onClick={() => setIsForgotPasswordOpen(true)}
                className="text-[#835400] font-bold hover:underline cursor-pointer"
              >
                Esqueceu a senha?
              </button>
            </div>

            <Button
              type="submit"
              variant="warning"
              size="md"
              fullWidth
              isLoading={isLoadingOffline}
              icon="login"
            >
              Entrar no Modo Offline
            </Button>
          </form>

          {/* SECTION 3: FAST ROLE SIMULATOR / QUICK LOGIN */}
          <div className="pt-3 border-t border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                Acesso Rápido por Perfil Operacional
              </span>
              <span className="text-[10px] text-gray-400">1-clique</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickRoleLogin('marcelo@asphaltpro.com.br', 'admin')}
                className="p-2.5 rounded-xl border border-amber-200 bg-amber-50/60 hover:bg-amber-100/80 text-left transition-all flex items-center gap-2 text-xs font-bold text-amber-950 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px] text-amber-700">shield_person</span>
                <div className="min-w-0">
                  <span className="block truncate">Diretor (Admin)</span>
                  <span className="text-[10px] font-normal text-amber-800/80 block">Acesso Total</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickRoleLogin('beatriz@asphaltpro.com.br', 'financeiro')}
                className="p-2.5 rounded-xl border border-blue-200 bg-blue-50/60 hover:bg-blue-100/80 text-left transition-all flex items-center gap-2 text-xs font-bold text-blue-950 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px] text-blue-700">account_balance</span>
                <div className="min-w-0">
                  <span className="block truncate">Financeiro</span>
                  <span className="text-[10px] font-normal text-blue-800/80 block">DRE & Contas</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickRoleLogin('lucas@asphaltpro.com.br', 'comercial')}
                className="p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100/80 text-left transition-all flex items-center gap-2 text-xs font-bold text-emerald-950 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px] text-emerald-700">request_quote</span>
                <div className="min-w-0">
                  <span className="block truncate">Comercial</span>
                  <span className="text-[10px] font-normal text-emerald-800/80 block">Orçamentos A4</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickRoleLogin('valdir@asphaltpro.com.br', 'operador')}
                className="p-2.5 rounded-xl border border-orange-200 bg-orange-50/60 hover:bg-orange-100/80 text-left transition-all flex items-center gap-2 text-xs font-bold text-orange-950 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px] text-orange-700">local_shipping</span>
                <div className="min-w-0">
                  <span className="block truncate">Operador Balança</span>
                  <span className="text-[10px] font-normal text-orange-800/80 block">Pista & Despesas</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="bg-[#F8F9FA] px-8 py-3.5 border-t border-[#DEE2E6] text-center text-[11px] text-gray-500">
          Asphalt Pro v2.5 • Sistema de Fluxo de Caixa para Usinas de Asfalto
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
          title="Recuperação de Senha"
          subtitle="Redefina seu acesso corporativo"
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
                  Enviar Instruções
                </Button>
              </>
            )
          }
        >
          {forgotSent ? (
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 leading-relaxed">
              Um link seguro de redefinição de acesso foi encaminhado para{' '}
              <strong>{forgotEmail || email}</strong>.
            </div>
          ) : (
            <form onSubmit={handleForgotSubmit} className="space-y-3">
              <p className="text-xs text-gray-600">
                Informe o seu e-mail cadastrado na usina para receber o link de recuperação.
              </p>
              <Input
                label="E-mail Cadastrado"
                type="email"
                required
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="seu.email@asphaltpro.com.br"
                leftIcon="mail"
              />
            </form>
          )}
        </Modal>
      )}
    </div>
  );
};
