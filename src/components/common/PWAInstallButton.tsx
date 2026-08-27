import React from 'react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

export const PWAInstallButton: React.FC<{ variant?: 'header' | 'sidebar' }> = ({ variant = 'header' }) => {
  const { isInstallable, isInstalled, promptInstall } = usePWAInstall();

  if (isInstalled || !isInstallable) return null;

  if (variant === 'sidebar') {
    return (
      <div className="p-3 mx-2 my-2 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200/80 text-xs">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="material-symbols-outlined text-amber-800 text-[18px]">
            download_for_offline
          </span>
          <span className="font-bold text-amber-950">Instalar Aplicativo</span>
        </div>
        <p className="text-[11px] text-amber-900/80 mb-2 leading-relaxed">
          Instale o Asphalt Pro no seu computador ou celular para acesso instantâneo offline.
        </p>
        <button
          type="button"
          onClick={promptInstall}
          className="w-full py-1.5 px-2.5 bg-[#835400] hover:bg-[#684300] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-xs"
        >
          Instalar Agora
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={promptInstall}
      className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-[#835400] rounded-lg border border-amber-500/30 text-xs font-bold transition-all cursor-pointer select-none"
      title="Instalar Asphalt Pro como aplicativo no computador ou celular"
    >
      <span className="material-symbols-outlined text-[16px]">install_desktop</span>
      <span>Instalar App</span>
    </button>
  );
};
