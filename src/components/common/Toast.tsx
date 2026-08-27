import React from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

export const Toast: React.FC = () => {
  const { toastMessage } = useApp();

  if (!toastMessage) return null;

  const bgColors = {
    success: 'bg-[#010102] text-white border-l-4 border-[#2F9E44]',
    error: 'bg-[#010102] text-white border-l-4 border-[#E03131]',
    info: 'bg-[#010102] text-white border-l-4 border-[#F2A93B]'
  };

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-[#2F9E44] shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-[#E03131] shrink-0" />,
    info: <Info className="w-5 h-5 text-[#F2A93B] shrink-0" />
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-bounce-short shadow-2xl">
      <div className={`flex items-center gap-3 px-4 py-3 rounded shadow-lg ${bgColors[toastMessage.type]} border border-[#474649]`}>
        {icons[toastMessage.type]}
        <span className="text-sm font-medium text-white">{toastMessage.text}</span>
      </div>
    </div>
  );
};
