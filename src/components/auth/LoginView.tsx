import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Button, Input, Modal } from '../common';

export const LoginView: React.FC = () => {
  const { login, user, showToast } = useApp();
  const [email, setEmail] = useState('gerente@asphaltpro.com.br');
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
    }, 400);
  };

  const handleDemoLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
      login('gerente@asphaltpro.com.br', 'senha123');
      setIsLoading(false);
      showToast('Acesso corporativo concedido.', 'info');
    }, 300);
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotSent(true);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col justify-center items-center p-4 relative select-none">
      {/* Background industrial pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#C7C6CA_1px,transparent_1px)] [background-size:24px_24px] opacity-30 pointer-events-none" />

      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-[#DEE2E6] overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Top Brand Banner */}
        <div className="bg-[#010102] p-8 text-center flex flex-col items-center border-b border-[#1c1c1e]">
          <div className="w-16 h-16 rounded-2xl bg-[#141D24] border-2 border-[#835400] flex items-center justify-center mb-3 shadow-md">
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
        <div className="p-8 space-y-5">
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
              loading={isLoading}
              icon="login"
            >
              Entrar no Sistema
            </Button>
          </form>

          {/* Quick Demo Login */}
          <div className="pt-4 border-t border-gray-100 text-center">
            <Button
              variant="primary"
              size="md"
              fullWidth
              onClick={handleDemoLogin}
              icon="bolt"
            >
              Entrar como {user.name} ({user.role})
            </Button>
          </div>
        </div>

        {/* Footer info */}
        <div className="bg-[#F8F9FA] px-8 py-3.5 border-t border-[#DEE2E6] text-center text-[11px] text-gray-500">
          Asphalt Pro v2.4 • Sistema de Fluxo de Caixa para Usinas de Asfalto
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
