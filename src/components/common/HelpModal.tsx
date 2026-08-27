import React from 'react';
import { useApp } from '../../context/AppContext';

export const HelpModal: React.FC = () => {
  const { isHelpOpen, setIsHelpOpen, openNovoLancamentoWithTab, setIsNovaContaOpen, setIsNovoFuncionarioOpen } = useApp();

  if (!isHelpOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={() => setIsHelpOpen(false)}
    >
      <div
        className="bg-white rounded-lg border border-[#DEE2E6] shadow-2xl p-6 max-w-lg w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#F2A93B]">help_outline</span>
            <h3 className="font-bold text-base text-[#010102]">Guia Rápido & Suporte da Usina</h3>
          </div>
          <button
            onClick={() => setIsHelpOpen(false)}
            className="text-gray-400 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4 text-xs text-gray-700 leading-relaxed">
          <div>
            <h4 className="font-bold text-[#010102] mb-1">Como Registrar Entradas e Saídas</h4>
            <p>
              Clique no botão <strong>+ Novo Lançamento</strong> ou <strong>Nova Entrada / Nova Saída</strong> para registrar pagamentos de medições ou compra de cimento/brita com comprovante em anexo.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-[#010102] mb-1">Contas Parceladas e Fornecedores</h4>
            <p>
              Ao cadastrar uma compra de insumos parcelada (ex: Petrobras CAP 50/70 em 3x), o sistema gera automaticamente os vencimentos e avisa quando faltarem 7 dias.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-[#010102] mb-1">Atribuição de Motoristas</h4>
            <p>
              Na tela de <strong>Cadastros &gt; Funcionários</strong>, marque a opção &quot;Motorista&quot; para vincular caminhoneiros aos romaneios e ordens de entrega de massa asfáltica.
            </p>
          </div>

          <div className="pt-2 border-t border-gray-100 flex flex-wrap gap-2">
            <button
              onClick={() => { setIsHelpOpen(false); openNovoLancamentoWithTab('entrada'); }}
              className="px-3 py-1.5 bg-green-50 text-green-700 rounded font-semibold hover:bg-green-100"
            >
              + Entrada Rápida
            </button>
            <button
              onClick={() => { setIsHelpOpen(false); setIsNovaContaOpen(true); }}
              className="px-3 py-1.5 bg-amber-50 text-amber-700 rounded font-semibold hover:bg-amber-100"
            >
              + Nova Conta
            </button>
            <button
              onClick={() => { setIsHelpOpen(false); setIsNovoFuncionarioOpen(true); }}
              className="px-3 py-1.5 bg-gray-100 text-gray-800 rounded font-semibold hover:bg-gray-200"
            >
              + Novo Funcionário
            </button>
          </div>
        </div>

        <div className="mt-6 pt-3 border-t border-gray-100 flex justify-end">
          <button
            onClick={() => setIsHelpOpen(false)}
            className="px-5 py-2 bg-[#010102] text-white text-xs font-bold rounded"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
