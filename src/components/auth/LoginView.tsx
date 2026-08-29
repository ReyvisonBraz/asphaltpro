import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Button, Input, Modal } from '../common';
import { UserRole } from '../../types';

export const LoginView: React.FC = () => {
  const { login, user, systemUsers, showToast } = useApp();
  const [email, setEmail] = useState('marcelo@asphaltpro.com.br');
  const [password, setPassword] = useState('••••••••');
  const [rememberMe, setRememberMe] = useState(true);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      login(email, password);
      setIsLoading(false);
      showToast('Login realizado com sucesso!', 'success');
    }, 300);
  };

  const handleQuickRoleLogin = (userEmail: string, role: UserRole) => {
    setEmail(userEmail);
    setIsLoading(true);
    setTimeout(() => {
      login(userEmail, 'senha123', role);
      setIsLoading(false);
      showToast(`Acesso concedido como perfil ${role.toUpperCase()}.`, 'info');
    }, 250);
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
        <div className="bg-[#010102] p-6 sm:p-8 text-center flex flex-col items-center border-b border-[#1c1c1e]">
          <div className="w-14 h-14 rounded-2xl bg-[#141D24] border-2 border-[#835400] flex items-center justify-center mb-3 shadow-md">
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

        {/* Form Container */}
        <div className="p-6 sm:p-8 space-y-5">
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <Input
              label="E-mail Corporativo"
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

            <div className="flex items-center justify-between text-xs pt-1">
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
              isLoading={isLoading}
              icon="login"
            >
              Entrar no Sistema
            </Button>
          </form>

          {/* Fast Role Simulator / Quick Login */}
          <div className="pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                Simular Acesso Rápido por Perfil (RBAC)
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
