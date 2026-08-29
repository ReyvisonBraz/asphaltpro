import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Quote, QuoteConversionOptions } from '../../types';

interface ConverterOrcamentoModalProps {
  quote: Quote | null;
  onClose: () => void;
}

export const ConverterOrcamentoModal: React.FC<ConverterOrcamentoModalProps> = ({
  quote,
  onClose
}) => {
  const { convertQuoteToRevenue, bankAccounts, categories, showToast } = useApp();

  if (!quote) return null;

  const [tipoConversao, setTipoConversao] = useState<'a_vista' | 'parcelado' | 'misto'>('parcelado');
  const [formaPagamento, setFormaPagamento] = useState('Boleto Bancário');
  const [contaBancaria, setContaBancaria] = useState(bankAccounts[0]?.nome || 'Banco do Brasil - CC 1234-5');
  const [categoriaFinanceira, setCategoriaFinanceira] = useState('Receita de Serviços');
  
  // Installments state
  const [numeroParcelas, setNumeroParcelas] = useState(3);
  const [intervaloDiasParcelas, setIntervaloDiasParcelas] = useState(30);
  
  // Format initial next month date
  const today = new Date();
  const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());
  const [dataPrimeiroVencimento, setDataPrimeiroVencimento] = useState(
    nextMonth.toLocaleDateString('pt-BR')
  );

  // Mixed mode state
  const defaultEntryVal = Math.round(quote.valorTotal * 0.3);
  const [valorEntradaAVista, setValorEntradaAVista] = useState<string>(defaultEntryVal.toFixed(2));
  const [gerarEntradaHoje, setGerarEntradaHoje] = useState(true);
  const [observacaoConversao, setObservacaoConversao] = useState(
    `Conversão comercial do orçamento ${quote.numero}. Cliente: ${quote.cliente.nome}.`
  );

  // Calculation previews
  const totalAmount = quote.valorTotal;
  const entryAmountNum = tipoConversao === 'misto' ? parseFloat(valorEntradaAVista) || 0 : 0;
  const remainingToInstallments = tipoConversao === 'misto' 
    ? Math.max(0, totalAmount - entryAmountNum)
    : totalAmount;

  const installmentValue = tipoConversao !== 'a_vista' && numeroParcelas > 0
    ? (remainingToInstallments / numeroParcelas)
    : 0;

  // Generate preview of installments
  const previewInstallments = () => {
    if (tipoConversao === 'a_vista') return [];
    
    const [d, m, y] = dataPrimeiroVencimento.split('/').map(Number);
    const baseDate = (!isNaN(d) && !isNaN(m) && !isNaN(y)) ? new Date(y, m - 1, d) : new Date();
    const list = [];
    const baseVal = parseFloat(installmentValue.toFixed(2));

    for (let i = 1; i <= numeroParcelas; i++) {
      const dueDate = new Date(baseDate.getTime() + (i - 1) * intervaloDiasParcelas * 24 * 60 * 60 * 1000);
      const val = i === numeroParcelas 
        ? remainingToInstallments - (baseVal * (numeroParcelas - 1)) 
        : baseVal;

      list.push({
        num: `${i}/${numeroParcelas}`,
        vencimento: dueDate.toLocaleDateString('pt-BR'),
        valor: val
      });
    }
    return list;
  };

  const handleConfirmConversion = (e: React.FormEvent) => {
    e.preventDefault();

    if (tipoConversao === 'misto' && entryAmountNum >= totalAmount) {
      showToast('O valor de entrada deve ser menor que o total da proposta.', 'error');
      return;
    }

    const options: QuoteConversionOptions = {
      tipoConversao,
      formaPagamento,
      contaBancaria,
      categoriaFinanceira,
      numeroParcelas: tipoConversao === 'a_vista' ? 1 : numeroParcelas,
      intervaloDiasParcelas,
      dataPrimeiroVencimento,
      valorEntradaAVista: entryAmountNum,
      gerarEntradaHoje,
      observacaoConversao
    };

    convertQuoteToRevenue(quote.id, options);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden border border-[#DEE2E6] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-[#010102] text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#2F9E44] flex items-center justify-center text-white">
              <span className="material-symbols-outlined text-[24px]">price_check</span>
            </div>
            <div>
              <h3 className="text-base font-bold">Converter Orçamento em Receita</h3>
              <p className="text-xs text-gray-400">
                {quote.numero} • {quote.cliente.nome} (R$ {quote.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleConfirmConversion} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Conversion Mode Tabs */}
          <div>
            <label className="block text-xs font-bold text-[#010102] uppercase tracking-wide mb-2">
              Qual será a estrutura de faturamento da receita? *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setTipoConversao('a_vista')}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  tipoConversao === 'a_vista'
                    ? 'border-[#2F9E44] bg-[#EBFBEE] text-[#2F9E44] font-bold shadow-sm'
                    : 'border-gray-300 bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold">100% À Vista</span>
                  <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
                </div>
                <span className="text-[11px] font-normal text-gray-600">
                  Lança entrada integral hoje no Caixa/Banco
                </span>
              </button>

              <button
                type="button"
                onClick={() => setTipoConversao('parcelado')}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  tipoConversao === 'parcelado'
                    ? 'border-[#835400] bg-[#FFF4E6] text-[#835400] font-bold shadow-sm'
                    : 'border-gray-300 bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold">Parcelado / A Prazo</span>
                  <span className="material-symbols-outlined text-[18px]">calendar_month</span>
                </div>
                <span className="text-[11px] font-normal text-gray-600">
                  Gera carnê em Contas a Receber
                </span>
              </button>

              <button
                type="button"
                onClick={() => setTipoConversao('misto')}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  tipoConversao === 'misto'
                    ? 'border-[#1971C2] bg-[#E7F5FF] text-[#1971C2] font-bold shadow-sm'
                    : 'border-gray-300 bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold">Entrada + Parcelas</span>
                  <span className="material-symbols-outlined text-[18px]">call_split</span>
                </div>
                <span className="text-[11px] font-normal text-gray-600">
                  Sinal no Caixa + Saldo a Receber
                </span>
              </button>
            </div>
          </div>

          {/* Payment & Bank Configuration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
            <div>
              <label className="block text-xs font-semibold text-[#1C1B1B] uppercase mb-1">
                Forma de Pagamento
              </label>
              <select
                value={formaPagamento}
                onChange={(e) => setFormaPagamento(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-gray-300 text-xs bg-white text-black outline-none focus:border-[#010102]"
              >
                <option value="Boleto Bancário">Boleto Bancário</option>
                <option value="Transferência Bancária (PIX)">Transferência Bancária (PIX)</option>
                <option value="Transferência TED/DOC">Transferência TED/DOC</option>
                <option value="Cartão de Crédito">Cartão de Crédito</option>
                <option value="Cheque Pré-datado">Cheque Pré-datado</option>
                <option value="Dinheiro em Espécie">Dinheiro em Espécie</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1C1B1B] uppercase mb-1">
                Conta Bancária de Destino
              </label>
              <select
                value={contaBancaria}
                onChange={(e) => setContaBancaria(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-gray-300 text-xs bg-white text-black outline-none focus:border-[#010102]"
              >
                {bankAccounts.map((b) => (
                  <option key={b.id} value={b.nome}>
                    {b.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#1C1B1B] uppercase mb-1">
                Classificação da Categoria
              </label>
              <select
                value={categoriaFinanceira}
                onChange={(e) => setCategoriaFinanceira(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-gray-300 text-xs bg-white text-black outline-none focus:border-[#010102]"
              >
                <option value="Receita de Serviços">Receita de Serviços (Pavimentação / Usinagem)</option>
                <option value="Venda de Mercadorias">Venda de Mercadorias (CBUQ FOB)</option>
                <option value="Frete e Transporte">Frete e Transporte de Massa</option>
                <option value="Locação de Equipamentos">Locação de Equipamentos</option>
                <option value="Outras Receitas Operacionais">Outras Receitas Operacionais</option>
              </select>
            </div>
          </div>

          {/* Mixed Mode Entry Options */}
          {tipoConversao === 'misto' && (
            <div className="bg-[#E7F5FF] p-4 rounded-xl border border-[#A5D8FF] space-y-3">
              <h4 className="text-xs font-bold text-[#1971C2] uppercase flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">toll</span>
                Configuração da Entrada / Sinal
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                    Valor da Entrada à Vista (R$)
                  </label>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="0"
                    max={quote.valorTotal}
                    value={valorEntradaAVista}
                    onChange={(e) => setValorEntradaAVista(e.target.value)}
                    className="w-full p-2 rounded-lg border border-gray-300 text-xs bg-white font-mono font-bold text-[#010102]"
                  />
                </div>

                <div className="flex items-center gap-2 pt-5">
                  <input
                    type="checkbox"
                    id="chkEntradaHoje"
                    checked={gerarEntradaHoje}
                    onChange={(e) => setGerarEntradaHoje(e.target.checked)}
                    className="w-4 h-4 text-[#1971C2] rounded border-gray-300"
                  />
                  <label htmlFor="chkEntradaHoje" className="text-xs text-gray-700 cursor-pointer font-medium">
                    Lançar entrada imediatamente no fluxo de hoje
                  </label>
                </div>
              </div>

              <div className="text-xs text-gray-600 flex justify-between pt-1 border-t border-blue-200">
                <span>Saldo restante a parcelar:</span>
                <strong className="font-mono text-[#1971C2]">
                  R$ {remainingToInstallments.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </strong>
              </div>
            </div>
          )}

          {/* Installment Options (For parcelado and misto) */}
          {tipoConversao !== 'a_vista' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1C1B1B] uppercase mb-1">
                    Nº de Parcelas
                  </label>
                  <select
                    value={numeroParcelas}
                    onChange={(e) => setNumeroParcelas(Number(e.target.value))}
                    className="w-full p-2.5 rounded-lg border border-gray-300 text-xs bg-white text-black outline-none"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 18, 24].map((n) => (
                      <option key={n} value={n}>
                        {n}x {n === 1 ? 'parcela única' : 'parcelas'}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1C1B1B] uppercase mb-1">
                    Intervalo (Dias)
                  </label>
                  <select
                    value={intervaloDiasParcelas}
                    onChange={(e) => setIntervaloDiasParcelas(Number(e.target.value))}
                    className="w-full p-2.5 rounded-lg border border-gray-300 text-xs bg-white text-black outline-none"
                  >
                    <option value={15}>A cada 15 dias (Quinzenal)</option>
                    <option value={30}>A cada 30 dias (Mensal)</option>
                    <option value={45}>A cada 45 dias</option>
                    <option value={60}>A cada 60 dias (Bimestral)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1C1B1B] uppercase mb-1">
                    1º Vencimento
                  </label>
                  <input
                    type="text"
                    placeholder="DD/MM/AAAA"
                    value={dataPrimeiroVencimento}
                    onChange={(e) => setDataPrimeiroVencimento(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-gray-300 text-xs bg-white text-black outline-none"
                  />
                </div>
              </div>

              {/* Installments Table Preview */}
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="bg-gray-100 px-3 py-2 text-[11px] font-bold text-gray-700 flex justify-between items-center">
                  <span>Prévia das Contas a Receber ({numeroParcelas}x)</span>
                  <span>Total: R$ {remainingToInstallments.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="max-h-36 overflow-y-auto divide-y divide-gray-100">
                  {previewInstallments().map((p, idx) => (
                    <div key={idx} className="px-3 py-2 text-xs flex justify-between items-center hover:bg-gray-50">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-gray-200 text-gray-700 text-[10px] font-bold flex items-center justify-center">
                          {p.num}
                        </span>
                        <span className="text-gray-600 text-[11px]">Vencimento: {p.vencimento}</span>
                      </div>
                      <span className="font-mono font-bold text-[#010102]">
                        R$ {p.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-[#1C1B1B] uppercase mb-1">
              Observações do Faturamento / Histórico Financeiro
            </label>
            <input
              type="text"
              value={observacaoConversao}
              onChange={(e) => setObservacaoConversao(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-gray-300 text-xs bg-white text-black outline-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="px-6 py-2.5 bg-[#2F9E44] hover:bg-[#288239] text-white font-bold text-xs rounded-lg shadow-sm flex items-center gap-2 transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
              Confirmar Conversão Financeira
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
