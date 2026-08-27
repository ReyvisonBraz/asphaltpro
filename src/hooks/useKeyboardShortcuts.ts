import { useEffect } from 'react';
import { useApp } from '../context/AppContext';

export function useKeyboardShortcuts() {
  const {
    isAuthenticated,
    openNovoLancamentoWithTab,
    setIsNovoOrcamentoOpen,
    setIsHelpOpen,
    isNovoLancamentoOpen,
    isNovoOrcamentoOpen,
    isNovoFuncionarioOpen,
    isNovaContaOpen,
    isHelpOpen,
    setIsNovoLancamentoOpen,
    setIsNovoFuncionarioOpen,
    setIsNovaContaOpen,
  } = useApp();

  useEffect(() => {
    if (!isAuthenticated) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is currently typing in an input, textarea, or select
      const activeTag = (document.activeElement?.tagName || '').toLowerCase();
      const isInputActive = activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select';

      // ESC key closes any open modal
      if (e.key === 'Escape') {
        if (isNovoLancamentoOpen) setIsNovoLancamentoOpen(false);
        if (isNovoOrcamentoOpen) setIsNovoOrcamentoOpen(false);
        if (isNovoFuncionarioOpen) setIsNovoFuncionarioOpen(false);
        if (isNovaContaOpen) setIsNovaContaOpen(false);
        if (isHelpOpen) setIsHelpOpen(false);
        return;
      }

      if (isInputActive || e.ctrlKey || e.metaKey || e.altKey) return;

      // N -> Novo Lançamento
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        openNovoLancamentoWithTab('saida');
      }

      // E -> Nova Entrada
      if (e.key === 'e' || e.key === 'E') {
        e.preventDefault();
        openNovoLancamentoWithTab('entrada');
      }

      // O -> Novo Orçamento
      if (e.key === 'o' || e.key === 'O') {
        e.preventDefault();
        setIsNovoOrcamentoOpen(true);
      }

      // ? ou H -> Ajuda / Atalhos
      if (e.key === '?' || e.key === 'h' || e.key === 'H') {
        e.preventDefault();
        setIsHelpOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isAuthenticated,
    isNovoLancamentoOpen,
    isNovoOrcamentoOpen,
    isNovoFuncionarioOpen,
    isNovaContaOpen,
    isHelpOpen,
  ]);
}
