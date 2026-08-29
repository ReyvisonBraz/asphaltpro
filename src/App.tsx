/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/layout/Sidebar';
import { TopHeader } from './components/layout/TopHeader';
import { DashboardView } from './components/dashboard/DashboardView';
import { LancamentosView } from './components/lancamentos/LancamentosView';
import { ContasView } from './components/contas/ContasView';
import { CadastrosView } from './components/cadastros/CadastrosView';
import { RelatoriosView } from './components/relatorios/RelatoriosView';
import { OrcamentosView } from './components/orcamentos/OrcamentosView';
import { ConfiguracoesView } from './components/configuracoes/ConfiguracoesView';
import { NovoLancamentoModal } from './components/lancamentos/NovoLancamentoModal';
import { NovoFuncionarioDrawer } from './components/cadastros/NovoFuncionarioDrawer';
import { NovaContaModal } from './components/contas/NovaContaModal';
import { HelpModal } from './components/common/HelpModal';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { ErrorDiagnosticsModal } from './components/common/ErrorDiagnosticsModal';
import { Toast } from './components/common/Toast';
import { LoginView } from './components/auth/LoginView';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

const MainLayout: React.FC = () => {
  const { isAuthenticated, currentView, isDiagnosticsOpen, setIsDiagnosticsOpen } = useApp();
  useKeyboardShortcuts();

  if (!isAuthenticated) {
    return <LoginView />;
  }

  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardView />;
      case 'lancamentos':
        return <LancamentosView />;
      case 'contas':
        return <ContasView />;
      case 'orcamentos':
        return <OrcamentosView />;
      case 'cadastros':
        return <CadastrosView />;
      case 'relatorios':
        return <RelatoriosView />;
      case 'configuracoes':
        return <ConfiguracoesView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex">
      {/* Fixed Left Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pl-0 lg:pl-64 max-w-full overflow-x-hidden transition-all">
        <TopHeader />
        <main className="flex-1 flex flex-col w-full min-w-0">
          {renderCurrentView()}
        </main>
      </div>

      {/* Global Modals & Overlays */}
      <NovoLancamentoModal />
      <NovoFuncionarioDrawer />
      <NovaContaModal />
      <HelpModal />
      <ErrorDiagnosticsModal
        isOpen={isDiagnosticsOpen}
        onClose={() => setIsDiagnosticsOpen(false)}
      />
      <Toast />
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <MainLayout />
      </AppProvider>
    </ErrorBoundary>
  );
}
