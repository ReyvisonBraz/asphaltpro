import React, { useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { Quote } from '../../types';

interface OrcamentoA4VisualizerModalProps {
  quote: Quote | null;
  onClose: () => void;
  onEdit?: (quote: Quote) => void;
  onConvert?: (quote: Quote) => void;
}

export const OrcamentoA4VisualizerModal: React.FC<OrcamentoA4VisualizerModalProps> = ({
  quote,
  onClose,
  onEdit,
  onConvert
}) => {
  const { letterheadSettings, showToast, updateQuoteStatus } = useApp();

  const modalIdRef = useRef(`a4-modal-${Math.random().toString(36).slice(2, 9)}`);
  const pushedHistoryRef = useRef(false);

  useEffect(() => {
    if (!quote) {
      if (pushedHistoryRef.current) {
        pushedHistoryRef.current = false;
        if (window.history.state?.modalId === modalIdRef.current) {
          window.history.back();
        }
      }
      return;
    }

    pushedHistoryRef.current = true;
    window.history.pushState(
      { isModal: true, modalId: modalIdRef.current },
      ''
    );

    const handlePopState = () => {
      if (pushedHistoryRef.current) {
        pushedHistoryRef.current = false;
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('keydown', handleKeyDown);
      if (pushedHistoryRef.current) {
        pushedHistoryRef.current = false;
        if (window.history.state?.modalId === modalIdRef.current) {
          window.history.back();
        }
      }
    };
  }, [quote, onClose]);

  if (!quote) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    const textLines = [
      `*PROPOSTA COMERCIAL - ${letterheadSettings.nomeEmpresa.toUpperCase()}*`,
      `📄 *Orçamento Nº:* ${quote.numero}`,
      `📅 *Emissão:* ${quote.dataEmissao} | *Validade:* ${quote.dataValidade} (${quote.diasValidade} dias)`,
      `👤 *Cliente:* ${quote.cliente.nome}`,
      quote.cliente.enderecoObra ? `📍 *Obra / Local:* ${quote.cliente.enderecoObra}` : '',
      `---------------------------------`,
      `*ITENS COTADOS:*`,
      ...quote.itens.map((it, idx) => `${idx + 1}. ${it.nome} (${it.quantidade} ${it.unidade}) = R$ ${it.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`),
      `---------------------------------`,
      quote.desconto > 0 ? `🔻 Desconto: R$ ${quote.desconto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '',
      `💰 *VALOR TOTAL: R$ ${quote.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}*`,
      `💳 *Condições de Pagamento:* ${quote.condicoesPagamento || 'A combinar'}`,
      `⏱️ *Prazo de Execução:* ${quote.prazoEntrega || 'A combinar'}`,
      `---------------------------------`,
      `Responsável: ${quote.responsavelNome} (${quote.responsavelCargo})`
    ].filter(Boolean).join('\n');

    const encoded = encodeURIComponent(textLines);
    const phone = quote.cliente.telefone ? quote.cliente.telefone.replace(/\D/g, '') : '';
    const whatsappUrl = phone ? `https://wa.me/55${phone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleCopySummary = () => {
    const textLines = [
      `PROPOSTA COMERCIAL - ${letterheadSettings.nomeEmpresa}`,
      `Orçamento Nº: ${quote.numero}`,
      `Cliente: ${quote.cliente.nome}`,
      `Data: ${quote.dataEmissao} (Válido até ${quote.dataValidade})`,
      `Valor Total: R$ ${quote.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      `Condições: ${quote.condicoesPagamento}`,
      `Prazo: ${quote.prazoEntrega}`
    ].join('\n');

    navigator.clipboard.writeText(textLines);
    showToast('Resumo da proposta copiado para a área de transferência!', 'success');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 lg:p-6 print:p-0 print:bg-white">
      {/* Container with control bar and A4 sheet */}
      <div className="flex flex-col items-center w-full max-w-5xl my-auto animate-in fade-in zoom-in-95 duration-150 print:m-0 print:max-w-none print:w-full">
        
        {/* Floating Top Control Bar (Hidden when printing) */}
        <div className="w-full bg-[#010102] text-white px-4 py-3 rounded-xl mb-4 flex flex-wrap items-center justify-between gap-3 shadow-xl print:hidden">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[#F2A93B] text-[22px]">description</span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-white">{quote.numero}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  quote.status === 'aprovado' ? 'bg-[#2F9E44] text-white' :
                  quote.status === 'convertido' ? 'bg-[#1971C2] text-white' :
                  quote.status === 'enviado' ? 'bg-[#F2A93B] text-[#010102]' :
                  quote.status === 'recusado' ? 'bg-[#E03131] text-white' :
                  'bg-gray-700 text-gray-200'
                }`}>
                  {quote.status}
                </span>
              </div>
              <p className="text-xs text-gray-400 truncate max-w-xs">{quote.cliente.nome}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Quick Status Changers */}
            {quote.status !== 'convertido' && (
              <select
                value={quote.status}
                onChange={(e) => updateQuoteStatus(quote.id, e.target.value as any)}
                className="bg-[#1C1C1E] border border-gray-700 text-gray-200 text-xs px-2.5 py-1.5 rounded-lg outline-none cursor-pointer"
              >
                <option value="rascunho">Status: Rascunho</option>
                <option value="enviado">Status: Enviado</option>
                <option value="aprovado">Status: Aprovado</option>
                <option value="recusado">Status: Recusado</option>
              </select>
            )}

            {/* Convert to Revenue Button */}
            {onConvert && !quote.convertidoEmReceita && (
              <button
                onClick={() => {
                  onClose();
                  onConvert(quote);
                }}
                className="px-3 py-1.5 bg-[#2F9E44] hover:bg-[#288239] text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-sm transition-all"
              >
                <span className="material-symbols-outlined text-[16px]">price_check</span>
                Converter em Receita
              </button>
            )}

            {/* Print / PDF Button */}
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-[#F2A93B] hover:bg-[#d99632] text-[#010102] font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-sm transition-all"
            >
              <span className="material-symbols-outlined text-[16px]">print</span>
              Imprimir / PDF A4
            </button>

            {/* WhatsApp Share */}
            <button
              onClick={handleShareWhatsApp}
              className="px-3 py-1.5 bg-[#25D366] hover:bg-[#20b858] text-white font-bold text-xs rounded-lg flex items-center gap-1.5 transition-all"
              title="Compartilhar pelo WhatsApp"
            >
              <span className="material-symbols-outlined text-[16px]">chat</span>
              WhatsApp
            </button>

            {/* Copy Summary */}
            <button
              onClick={handleCopySummary}
              className="p-1.5 text-gray-300 hover:text-white hover:bg-[#1C1C1E] rounded-lg transition-colors"
              title="Copiar texto"
            >
              <span className="material-symbols-outlined text-[20px]">content_copy</span>
            </button>

            {/* Edit */}
            {onEdit && (
              <button
                onClick={() => {
                  onClose();
                  onEdit(quote);
                }}
                className="p-1.5 text-gray-300 hover:text-white hover:bg-[#1C1C1E] rounded-lg transition-colors"
                title="Editar Orçamento"
              >
                <span className="material-symbols-outlined text-[20px]">edit</span>
              </button>
            )}

            {/* Close Button */}
            <button
              onClick={onClose}
              className="flex items-center gap-1 px-3 py-1.5 bg-red-600/90 hover:bg-red-600 text-white text-xs font-bold rounded-lg transition-colors ml-2 cursor-pointer shadow-xs"
              title="Fechar visualização A4 (Esc ou Voltar)"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
              <span>Fechar</span>
            </button>
          </div>
        </div>

        {/* 
          ==========================================================
          THE A4 SHEET (210mm x 297mm @ 96dpi ≈ 794px x 1123px)
          Designed to fit cleanly on ONE SINGLE PAGE without overflow.
          ==========================================================
        */}
        <div 
          id="orcamento-a4-sheet"
          className="relative bg-white text-[#010102] w-full max-w-[794px] min-h-[1123px] max-h-[1123px] shadow-2xl p-8 sm:p-10 flex flex-col justify-between overflow-hidden print:shadow-none print:m-0 print:p-8 print:max-h-none print:min-h-0 print:w-full"
          style={{
            backgroundImage: letterheadSettings.backgroundImageUrl ? `url(${letterheadSettings.backgroundImageUrl})` : undefined,
            backgroundSize: '100% 100%',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        >
          {/* Top Header Section (If no background letterhead image is uploaded, render clean industrial header) */}
          <div className="space-y-4">
            {!letterheadSettings.backgroundImageUrl && (
              <div className="flex items-start justify-between border-b-2 border-[#010102] pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#010102] text-[#F2A93B] rounded flex items-center justify-center font-black text-xl tracking-tighter">
                    AP
                  </div>
                  <div>
                    <h1 className="text-base font-black text-[#010102] uppercase tracking-wide">
                      {letterheadSettings.nomeEmpresa}
                    </h1>
                    <p className="text-[10px] text-gray-600 font-mono">
                      CNPJ: {letterheadSettings.cnpj} {letterheadSettings.inscricaoEstadual ? `| IE: ${letterheadSettings.inscricaoEstadual}` : ''}
                    </p>
                    <p className="text-[10px] text-gray-500">
                      {letterheadSettings.enderecoUsina}
                    </p>
                    <p className="text-[10px] text-gray-500">
                      Tel: {letterheadSettings.telefone} • {letterheadSettings.emailComercial}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="inline-block px-3 py-1 bg-[#835400] text-white text-xs font-bold uppercase tracking-wider rounded">
                    PROPOSTA TÉCNICA & COMERCIAL
                  </div>
                  <div className="text-base font-extrabold text-[#010102] font-mono mt-1">
                    {quote.numero}
                  </div>
                  <div className="text-[10px] text-gray-500">
                    Emissão: <strong className="text-gray-800">{quote.dataEmissao}</strong>
                  </div>
                  <div className="text-[10px] text-gray-500">
                    Validade: <strong className="text-gray-800">{quote.dataValidade} ({quote.diasValidade} dias)</strong>
                  </div>
                </div>
              </div>
            )}

            {/* Custom Background Image Fallback Header Spacer if background timbrado exists */}
            {letterheadSettings.backgroundImageUrl && (
              <div className="h-20 flex justify-between items-center border-b border-gray-300 pb-2">
                <div className="text-xs font-bold text-gray-500 uppercase">
                  Proposta Comercial • {quote.numero}
                </div>
                <div className="text-xs text-gray-500">
                  Data: <span className="font-semibold text-black">{quote.dataEmissao}</span> | Validade: <span className="font-semibold text-black">{quote.dataValidade}</span>
                </div>
              </div>
            )}

            {/* Client Info Block */}
            <div className="bg-[#F8F9FA] border border-[#DEE2E6] rounded-lg p-3.5 text-xs grid grid-cols-2 gap-x-4 gap-y-1.5">
              <div>
                <span className="text-[10px] uppercase font-bold text-gray-500 block">Cliente / Razão Social:</span>
                <span className="font-bold text-[#010102] text-xs">{quote.cliente.nome}</span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-gray-500 block">CNPJ / CPF:</span>
                <span className="font-mono text-gray-800 text-xs">{quote.cliente.documento || 'Não informado'}</span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-gray-500 block">Contato / Responsável da Obra:</span>
                <span className="text-gray-800 text-xs">{quote.cliente.contato || 'Setor de Compras'} {quote.cliente.telefone ? `(${quote.cliente.telefone})` : ''}</span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-gray-500 block">E-mail:</span>
                <span className="text-gray-800 text-xs">{quote.cliente.email || 'N/A'}</span>
              </div>

              {quote.cliente.enderecoObra && (
                <div className="col-span-2 pt-1 border-t border-gray-200 mt-1 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-500">Local da Obra / Entrega: </span>
                    <span className="text-gray-800 font-medium text-xs">{quote.cliente.enderecoObra}</span>
                  </div>
                  {quote.cliente.cidadeUf && (
                    <span className="text-gray-600 font-semibold text-xs">{quote.cliente.cidadeUf}</span>
                  )}
                </div>
              )}
            </div>

            {/* Introduction Text */}
            {quote.textoIntroducao && (
              <div className="text-[11px] text-gray-700 leading-relaxed italic bg-white px-1">
                "{quote.textoIntroducao}"
              </div>
            )}

            {/* Items Table (Planilha do Orçamento) */}
            <div className="overflow-hidden border border-[#010102] rounded-lg">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#010102] text-white text-[10px] uppercase tracking-wider font-semibold">
                    <th className="py-2 px-3 w-8 text-center">Item</th>
                    <th className="py-2 px-3">Descrição dos Serviços / Materiais</th>
                    <th className="py-2 px-2 text-center w-20">Modalidade</th>
                    <th className="py-2 px-2 text-right w-16">Qtd.</th>
                    <th className="py-2 px-2 text-center w-14">Unid.</th>
                    <th className="py-2 px-3 text-right w-24">Unitário</th>
                    <th className="py-2 px-3 text-right w-28">Total (R$)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {quote.itens.map((item, index) => (
                    <tr key={item.id || index} className={index % 2 === 0 ? 'bg-white' : 'bg-[#FDFDFD]'}>
                      <td className="py-2 px-3 text-center text-gray-500 font-bold text-[11px]">
                        {String(index + 1).padStart(2, '0')}
                      </td>
                      <td className="py-2 px-3">
                        <div className="font-bold text-[#010102] text-xs">{item.nome}</div>
                        {item.descricao && (
                          <div className="text-[10px] text-gray-500 leading-tight">{item.descricao}</div>
                        )}
                      </td>
                      <td className="py-2 px-2 text-center">
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold ${
                          item.modalidade === 'com_aplicacao' ? 'bg-green-100 text-green-800' :
                          item.modalidade === 'sem_aplicacao' ? 'bg-amber-100 text-amber-800' :
                          item.modalidade === 'transporte' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {item.modalidade === 'com_aplicacao' ? 'C/ Aplicação' :
                           item.modalidade === 'sem_aplicacao' ? 'FOB Usina' :
                           item.modalidade === 'transporte' ? 'Frete' : 'Locação/Material'}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-right font-mono font-semibold text-xs">
                        {item.quantidade.toLocaleString('pt-BR')}
                      </td>
                      <td className="py-2 px-2 text-center text-gray-600 text-[11px]">
                        {item.unidade}
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-gray-700 text-xs">
                        R$ {item.valorUnitario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-[#010102] text-xs">
                        R$ {item.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals Summary Footer */}
              <div className="bg-[#F8F9FA] border-t border-[#010102] p-3 flex justify-end">
                <div className="w-64 space-y-1 text-xs">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal dos Itens:</span>
                    <span className="font-mono">R$ {quote.subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>

                  {quote.desconto > 0 && (
                    <div className="flex justify-between text-green-700 font-medium">
                      <span>Desconto Concedido:</span>
                      <span className="font-mono">- R$ {quote.desconto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}

                  {quote.acrescimoFrete > 0 && (
                    <div className="flex justify-between text-blue-700 font-medium">
                      <span>Frete / Acréscimo:</span>
                      <span className="font-mono">+ R$ {quote.acrescimoFrete.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-2 border-t-2 border-[#010102] text-sm font-black text-[#010102]">
                    <span>TOTAL DA PROPOSTA:</span>
                    <span className="font-mono text-base text-[#835400]">
                      R$ {quote.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Commercial Conditions & Technical Notes */}
            <div className="grid grid-cols-2 gap-3 text-[11px]">
              <div className="bg-[#F8F9FA] p-3 rounded-lg border border-gray-200">
                <h4 className="font-bold text-[#010102] uppercase text-[10px] mb-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px] text-[#835400]">credit_card</span>
                  Condições de Pagamento & Prazos
                </h4>
                <p className="text-gray-700 leading-snug">
                  <strong>Pagamento:</strong> {quote.condicoesPagamento || 'Conforme acordado previamente.'}
                </p>
                <p className="text-gray-700 leading-snug mt-1">
                  <strong>Prazo de Execução/Entrega:</strong> {quote.prazoEntrega || 'A combinar conforme cronograma.'}
                </p>
              </div>

              <div className="bg-[#F8F9FA] p-3 rounded-lg border border-gray-200">
                <h4 className="font-bold text-[#010102] uppercase text-[10px] mb-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px] text-[#835400]">verified</span>
                  Observações Técnicas & Normas
                </h4>
                <p className="text-gray-600 leading-snug whitespace-pre-line">
                  {quote.textoObservacoes || letterheadSettings.textoPadraoCondicoes || 'Massa asfáltica em conformidade com normas DNIT/DER.'}
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Signatures and Letterhead Footer */}
          <div className="pt-4 mt-auto">
            <div className="grid grid-cols-2 gap-8 pt-4 border-t border-gray-300">
              <div className="text-center">
                <div className="w-48 mx-auto border-b border-gray-400 pb-1 mb-1">
                  <span className="font-bold text-xs text-[#010102] block">{quote.responsavelNome}</span>
                  <span className="text-[10px] text-gray-500 block">{quote.responsavelCargo}</span>
                </div>
                <span className="text-[9px] text-gray-400 uppercase tracking-widest">{letterheadSettings.nomeEmpresa}</span>
              </div>

              <div className="text-center">
                <div className="w-48 mx-auto border-b border-dashed border-gray-400 pb-1 mb-1">
                  <span className="text-xs text-gray-400 italic block">De Acordo / Aceite do Cliente</span>
                  <span className="text-[10px] text-gray-400 block">Data: ____/____/________</span>
                </div>
                <span className="text-[9px] text-gray-400 uppercase tracking-widest">{quote.cliente.nome}</span>
              </div>
            </div>

            <div className="text-center text-[9px] text-gray-400 mt-4 font-mono">
              Documento gerado eletronicamente por Asphalt Pro • Usina de Asfalto • Página 1 de 1
            </div>
          </div>
        </div>
      </div>

        {/* Floating Quick Close Button (Mobile & Desktop) */}
        <button
          onClick={onClose}
          className="fixed bottom-6 right-6 z-60 bg-[#010102] hover:bg-black text-white px-4 py-2.5 rounded-full border border-gray-700 shadow-2xl flex items-center gap-2 text-xs font-bold print:hidden cursor-pointer active:scale-95 transition-all"
          title="Fechar visualização A4 (Esc ou Voltar)"
          aria-label="Fechar visualização"
        >
          <span className="material-symbols-outlined text-[18px] text-red-400">close</span>
          <span>Fechar Visualização</span>
        </button>

      {/* Print CSS Injection */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #orcamento-a4-sheet, #orcamento-a4-sheet * {
            visibility: visible;
          }
          #orcamento-a4-sheet {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            max-width: 100% !important;
            min-height: 100vh !important;
            margin: 0 !important;
            padding: 20mm !important;
            box-shadow: none !important;
            background-color: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          @page {
            size: A4 portrait;
            margin: 0;
          }
        }
      `}</style>
    </div>
  );
};
