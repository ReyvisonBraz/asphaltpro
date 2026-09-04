import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { Quote } from '../../types';

interface OrcamentoA4VisualizerModalProps {
  quote: Quote | null;
  onClose: () => void;
  onEdit?: (quote: Quote) => void;
  onConvert?: (quote: Quote) => void;
  initialDocumentType?: 'proposta' | 'ordem_servico';
}

export const OrcamentoA4VisualizerModal: React.FC<OrcamentoA4VisualizerModalProps> = ({
  quote,
  onClose,
  onEdit,
  onConvert,
  initialDocumentType = 'proposta'
}) => {
  const { letterheadSettings, showToast, updateQuoteStatus } = useApp();
  const [documentType, setDocumentType] = useState<'proposta' | 'ordem_servico'>(initialDocumentType);

  useEffect(() => {
    if (initialDocumentType) {
      setDocumentType(initialDocumentType);
    }
  }, [initialDocumentType, quote?.id]);

  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!quote) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCloseRef.current();
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [!!quote]);

  if (!quote) return null;

  const osNumero = quote.numero.replace(/^ORC-?|^orc-?/i, '');

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    if (documentType === 'ordem_servico') {
      const textLines = [
        `*ORDEM DE SERVIÇO & CARREGAMENTO - ${letterheadSettings.nomeEmpresa.toUpperCase()}*`,
        `🚜 *O.S. Nº:* OS-${osNumero}`,
        `📄 *Ref. Proposta:* ${quote.numero}`,
        `📅 *Data de Emissão:* ${quote.dataEmissao}`,
        `⏱️ *Previsão de Execução:* ${quote.prazoEntrega || 'A combinar'}`,
        `👤 *Cliente:* ${quote.cliente.nome}`,
        quote.cliente.enderecoObra ? `📍 *Local da Obra:* ${quote.cliente.enderecoObra}` : '',
        quote.cliente.contato ? `👷 *Contato na Obra:* ${quote.cliente.contato}` : '',
        `---------------------------------`,
        `*PROGRAMAÇÃO DE CARGA:*`,
        ...quote.itens.map((it, idx) => `${idx + 1}. ${it.nome} (${it.quantidade} ${it.unidade}) - Temp. saída: 155°C - 165°C`),
        `---------------------------------`,
        `*Responsável Usina:* ${quote.responsavelNome} (${quote.responsavelCargo})`
      ].filter(Boolean).join('\n');

      const encoded = encodeURIComponent(textLines);
      const phone = quote.cliente.telefone ? quote.cliente.telefone.replace(/\D/g, '') : '';
      const whatsappUrl = phone ? `https://wa.me/55${phone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
      window.open(whatsappUrl, '_blank');
      return;
    }

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
    if (documentType === 'ordem_servico') {
      const textLines = [
        `ORDEM DE SERVIÇO & CARREGAMENTO - ${letterheadSettings.nomeEmpresa}`,
        `O.S. Nº: OS-${osNumero} (Ref. Proposta ${quote.numero})`,
        `Cliente: ${quote.cliente.nome}`,
        `Local da Obra: ${quote.cliente.enderecoObra || 'A definir'}`,
        `Data: ${quote.dataEmissao} (Previsão: ${quote.prazoEntrega || 'Conforme programação'})`,
        `Itens: ${quote.itens.map(i => `${i.quantidade} ${i.unidade} ${i.nome}`).join(' | ')}`
      ].join('\n');

      navigator.clipboard.writeText(textLines);
      showToast('Resumo da Ordem de Serviço copiado!', 'success');
      return;
    }

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
      <div className="flex flex-col items-center w-full max-w-6xl my-auto animate-in fade-in zoom-in-95 duration-150 print:m-0 print:max-w-none print:w-full">
        
        {/* Floating Top Control Bar (Hidden when printing) */}
        <div className="w-full bg-[#010102] text-white px-4 py-3 rounded-2xl mb-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xl print:hidden">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#835400] flex items-center justify-center text-white shrink-0">
              <span className="material-symbols-outlined text-[20px] text-[#F2A93B]">
                {documentType === 'ordem_servico' ? 'engineering' : 'description'}
              </span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-white font-mono">
                  {documentType === 'ordem_servico' ? `OS-${osNumero}` : quote.numero}
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  quote.status === 'aprovado' ? 'bg-[#2F9E44] text-white' :
                  quote.status === 'convertido' ? 'bg-[#1971C2] text-white' :
                  quote.status === 'enviado' ? 'bg-[#F2A93B] text-[#010102]' :
                  quote.status === 'recusado' ? 'bg-[#E03131] text-white' :
                  'bg-gray-700 text-gray-200'
                }`}>
                  {documentType === 'ordem_servico' ? 'O.S. Operacional' : quote.status}
                </span>
              </div>
              <p className="text-xs text-gray-400 truncate max-w-sm">{quote.cliente.nome}</p>
            </div>
          </div>

          {/* Document Type Switcher */}
          <div className="flex items-center bg-gray-900 border border-gray-700 rounded-xl p-0.5 self-center">
            <button
              type="button"
              onClick={() => setDocumentType('proposta')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                documentType === 'proposta'
                  ? 'bg-[#F2A93B] text-[#010102] shadow-xs'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-[15px]">description</span>
              <span>Proposta Comercial</span>
            </button>
            <button
              type="button"
              onClick={() => setDocumentType('ordem_servico')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                documentType === 'ordem_servico'
                  ? 'bg-[#F2A93B] text-[#010102] shadow-xs'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-[15px]">engineering</span>
              <span>Ordem de Serviço (O.S.)</span>
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            {/* Quick Status Changers */}
            {quote.status !== 'convertido' && (
              <select
                value={quote.status}
                onChange={(e) => updateQuoteStatus(quote.id, e.target.value as any)}
                className="bg-[#1C1C1E] border border-gray-700 text-gray-200 text-xs px-2.5 py-2 rounded-xl outline-none cursor-pointer"
                title="Alterar status da proposta"
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
                type="button"
                onClick={() => {
                  onClose();
                  onConvert(quote);
                }}
                className="px-3 py-2 bg-[#2F9E44] hover:bg-[#288239] text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                title="Converter orçamento em faturamento no Livro Caixa"
              >
                <span className="material-symbols-outlined text-[16px]">price_check</span>
                <span>Faturar</span>
              </button>
            )}

            {/* Print / PDF Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-2 bg-[#F2A93B] hover:bg-[#d99632] text-[#010102] font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              title="Imprimir ou Salvar PDF em folha timbrada A4"
            >
              <span className="material-symbols-outlined text-[16px]">print</span>
              <span>Imprimir / PDF</span>
            </button>

            {/* WhatsApp Share */}
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="px-3 py-2 bg-[#25D366] hover:bg-[#20b858] text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
              title="Compartilhar resumo e dados pelo WhatsApp"
            >
              <span className="material-symbols-outlined text-[16px]">chat</span>
              <span className="hidden sm:inline">WhatsApp</span>
            </button>

            {/* Copy Summary */}
            <button
              type="button"
              onClick={handleCopySummary}
              className="p-2 text-gray-300 hover:text-white bg-[#1C1C1E] hover:bg-gray-800 border border-gray-700 rounded-xl transition-colors cursor-pointer"
              title="Copiar texto da proposta"
            >
              <span className="material-symbols-outlined text-[18px] block">content_copy</span>
            </button>

            {/* Edit */}
            {onEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(quote);
                }}
                className="p-2 text-gray-300 hover:text-white bg-[#1C1C1E] hover:bg-gray-800 border border-gray-700 rounded-xl transition-colors cursor-pointer"
                title="Editar dados da proposta"
              >
                <span className="material-symbols-outlined text-[18px] block">edit</span>
              </button>
            )}

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-800 hover:bg-red-600 text-gray-300 hover:text-white border border-gray-700 transition-colors cursor-pointer ml-1"
              title="Fechar visualizador (Esc)"
              aria-label="Fechar"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
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
                  {letterheadSettings.logoUrl ? (
                    <div className="h-12 max-w-[160px] flex items-center justify-start shrink-0 overflow-hidden">
                      <img
                        src={letterheadSettings.logoUrl}
                        alt={letterheadSettings.nomeEmpresa}
                        className="max-h-12 max-w-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 bg-[#010102] text-[#F2A93B] rounded flex items-center justify-center font-black text-xl tracking-tighter shrink-0">
                      AP
                    </div>
                  )}
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
                  <div className={`inline-block px-3 py-1 text-white text-xs font-bold uppercase tracking-wider rounded ${
                    documentType === 'ordem_servico' ? 'bg-[#010102] text-[#F2A93B]' : 'bg-[#835400] text-white'
                  }`}>
                    {documentType === 'ordem_servico' ? 'ORDEM DE SERVIÇO & CARREGAMENTO' : 'PROPOSTA TÉCNICA & COMERCIAL'}
                  </div>
                  <div className="text-base font-extrabold text-[#010102] font-mono mt-1">
                    {documentType === 'ordem_servico' ? `OS-${osNumero}` : quote.numero}
                  </div>
                  {documentType === 'ordem_servico' && (
                    <div className="text-[10px] text-gray-600 font-mono">
                      Ref. Proposta: <strong>{quote.numero}</strong>
                    </div>
                  )}
                  <div className="text-[10px] text-gray-500">
                    Emissão: <strong className="text-gray-800">{quote.dataEmissao}</strong>
                  </div>
                  <div className="text-[10px] text-gray-500">
                    {documentType === 'ordem_servico' ? (
                      <>Execução Prevista: <strong className="text-gray-800">{quote.prazoEntrega || 'A programar'}</strong></>
                    ) : (
                      <>Validade: <strong className="text-gray-800">{quote.dataValidade} ({quote.diasValidade} dias)</strong></>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Custom Background Image Fallback Header Spacer if background timbrado exists */}
            {letterheadSettings.backgroundImageUrl && (
              <div className="h-20 flex justify-between items-center border-b border-gray-300 pb-2">
                <div className="text-xs font-bold text-gray-500 uppercase">
                  {documentType === 'ordem_servico' ? `Ordem de Serviço • OS-${osNumero}` : `Proposta Comercial • ${quote.numero}`}
                </div>
                <div className="text-xs text-gray-500">
                  Data: <span className="font-semibold text-black">{quote.dataEmissao}</span> | {documentType === 'ordem_servico' ? 'Ref: ' + quote.numero : 'Validade: ' + quote.dataValidade}
                </div>
              </div>
            )}

            {/* Client Info Block */}
            <div className="bg-[#F8F9FA] border border-[#DEE2E6] rounded-lg p-3 text-xs grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1.5">
              <div>
                <span className="text-[9px] uppercase font-bold text-gray-500 block">Cliente / Razão Social:</span>
                <span className="font-bold text-[#010102] text-xs">{quote.cliente.nome}</span>
              </div>

              <div>
                <span className="text-[9px] uppercase font-bold text-gray-500 block">CNPJ / CPF:</span>
                <span className="font-mono text-gray-800 text-xs">{quote.cliente.documento || 'Não informado'}</span>
              </div>

              <div>
                <span className="text-[9px] uppercase font-bold text-gray-500 block">
                  {documentType === 'ordem_servico' ? 'Encarregado na Obra:' : 'Contato / Responsável:'}
                </span>
                <span className="text-gray-800 text-xs font-semibold">
                  {quote.cliente.contato || 'Encarregado de Campo'} {quote.cliente.telefone ? `(${quote.cliente.telefone})` : ''}
                </span>
              </div>

              <div className="sm:col-span-2 pt-1 border-t border-gray-200 mt-0.5">
                <span className="text-[9px] uppercase font-bold text-gray-500 block">Local da Obra / Ponto de Descarga:</span>
                <span className="text-gray-800 font-medium text-xs">
                  {quote.cliente.enderecoObra || 'A definir previamente com a usina'} {quote.cliente.cidadeUf ? `— ${quote.cliente.cidadeUf}` : ''}
                </span>
              </div>

              <div className="pt-1 border-t border-gray-200 mt-0.5">
                <span className="text-[9px] uppercase font-bold text-gray-500 block">Responsável Técnico Usina:</span>
                <span className="text-gray-800 font-medium text-xs">{quote.responsavelNome}</span>
              </div>
            </div>

            {/* Introduction Text (only for proposta) */}
            {documentType === 'proposta' && quote.textoIntroducao && (
              <div className="text-[11px] text-gray-700 leading-relaxed italic bg-white px-1">
                "{quote.textoIntroducao}"
              </div>
            )}

            {/* DOCUMENT TYPE: PROPOSTA COMERCIAL */}
            {documentType === 'proposta' && (
              <>
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
              </>
            )}

            {/* DOCUMENT TYPE: ORDEM DE SERVIÇO & CARREGAMENTO */}
            {documentType === 'ordem_servico' && (
              <>
                {/* 1. Programação de Carga e Traço Técnico */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-[#010102] uppercase text-[10px] tracking-wider flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px] text-[#835400]">inventory_2</span>
                      1. Programação de Massa Asfáltica & Insumos da Usina
                    </h4>
                    <span className="text-[10px] text-gray-500 font-mono">
                      Temperatura Saída Usina: <strong>155°C a 168°C</strong>
                    </span>
                  </div>

                  <div className="overflow-hidden border border-[#010102] rounded-lg">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-[#010102] text-white text-[9px] uppercase tracking-wider font-semibold">
                          <th className="py-1.5 px-3 w-8 text-center">Item</th>
                          <th className="py-1.5 px-3">Especificação Técnica / Traço de Massa</th>
                          <th className="py-1.5 px-2 text-center w-24">Modalidade</th>
                          <th className="py-1.5 px-2 text-right w-20">Qtd. Prog.</th>
                          <th className="py-1.5 px-2 text-center w-14">Unid.</th>
                          <th className="py-1.5 px-3 w-44">Parâmetros / Espessura</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {quote.itens.map((item, index) => (
                          <tr key={item.id || index} className={index % 2 === 0 ? 'bg-white' : 'bg-[#FDFDFD]'}>
                            <td className="py-1.5 px-3 text-center text-gray-500 font-bold text-[11px]">
                              {String(index + 1).padStart(2, '0')}
                            </td>
                            <td className="py-1.5 px-3">
                              <div className="font-bold text-[#010102] text-xs">{item.nome}</div>
                              {item.descricao && (
                                <div className="text-[10px] text-gray-500 leading-tight">{item.descricao}</div>
                              )}
                            </td>
                            <td className="py-1.5 px-2 text-center">
                              <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                item.modalidade === 'com_aplicacao' ? 'bg-green-100 text-green-800' :
                                item.modalidade === 'sem_aplicacao' ? 'bg-amber-100 text-amber-800' :
                                'bg-blue-100 text-blue-800'
                              }`}>
                                {item.modalidade === 'com_aplicacao' ? 'CIF C/ Aplicação' :
                                 item.modalidade === 'sem_aplicacao' ? 'FOB Usina' : 'Frete/Locação'}
                              </span>
                            </td>
                            <td className="py-1.5 px-2 text-right font-mono font-bold text-xs text-[#010102]">
                              {item.quantidade.toLocaleString('pt-BR')}
                            </td>
                            <td className="py-1.5 px-2 text-center text-gray-600 text-[11px]">
                              {item.unidade}
                            </td>
                            <td className="py-1.5 px-3 text-[10px] text-gray-600">
                              Compactado e rolado conforme projeto
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 2. Controle de Cargas / Romaneio de Balança (5 viagens pré-formatadas) */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-[#010102] uppercase text-[10px] tracking-wider flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px] text-[#835400]">local_shipping</span>
                      2. Controle de Expedição, Transporte & Romaneio de Balança
                    </h4>
                    <span className="text-[9px] text-gray-500">
                      Obrigatório lona térmica em todos os caminhões
                    </span>
                  </div>

                  <div className="overflow-hidden border border-gray-300 rounded-lg">
                    <table className="w-full text-left text-[10px] border-collapse">
                      <thead>
                        <tr className="bg-gray-100 text-gray-700 text-[9px] uppercase tracking-wider font-semibold border-b border-gray-300">
                          <th className="py-1.5 px-2 text-center w-12">Viagem</th>
                          <th className="py-1.5 px-2 w-20">Placa</th>
                          <th className="py-1.5 px-2">Motorista</th>
                          <th className="py-1.5 px-2 text-center w-16">Saída</th>
                          <th className="py-1.5 px-2 text-center w-20">Ticket Balança</th>
                          <th className="py-1.5 px-2 text-right w-16">Tara (kg)</th>
                          <th className="py-1.5 px-2 text-right w-16">Bruto (kg)</th>
                          <th className="py-1.5 px-2 text-right w-20">Líquido (kg)</th>
                          <th className="py-1.5 px-2 text-center w-16">Chegada (°C)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {[1, 2, 3, 4, 5].map((rowIdx) => (
                          <tr key={rowIdx} className="h-6.5 bg-white">
                            <td className="py-1 px-2 text-center font-mono font-bold text-gray-400">
                              #{String(rowIdx).padStart(2, '0')}
                            </td>
                            <td className="py-1 px-2 text-gray-300 font-mono">___-____</td>
                            <td className="py-1 px-2 text-gray-300">_________________</td>
                            <td className="py-1 px-2 text-center text-gray-300 font-mono">__:__</td>
                            <td className="py-1 px-2 text-center text-gray-300 font-mono">________</td>
                            <td className="py-1 px-2 text-right text-gray-300 font-mono">______</td>
                            <td className="py-1 px-2 text-right text-gray-300 font-mono">______</td>
                            <td className="py-1 px-2 text-right text-gray-300 font-mono font-bold">______</td>
                            <td className="py-1 px-2 text-center text-gray-300 font-mono">____°C</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 3. Normas Técnicas & Instruções de Campo */}
                <div className="grid grid-cols-2 gap-3 text-[10px]">
                  <div className="bg-[#F8F9FA] p-2.5 rounded-lg border border-gray-200">
                    <h5 className="font-bold text-[#010102] uppercase text-[9px] mb-1 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[13px] text-[#835400]">warning</span>
                      Procedimentos Operacionais & Requisitos DNIT/DER
                    </h5>
                    <ul className="text-gray-600 leading-snug space-y-0.5 list-disc pl-3">
                      <li>Caçamba limpa e lona térmica obrigatória durante todo o trajeto.</li>
                      <li>Temperatura mínima para compactação no canteiro: <strong>125°C a 130°C</strong>.</li>
                      <li>Proibida a aplicação sobre piso molhado ou sob iminência de chuva.</li>
                      <li>Anexar os tickets de pesagem da balança física para conferência.</li>
                    </ul>
                  </div>

                  <div className="bg-[#F8F9FA] p-2.5 rounded-lg border border-gray-200">
                    <h5 className="font-bold text-[#010102] uppercase text-[9px] mb-1 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[13px] text-[#835400]">assignment</span>
                      Instruções Especiais de Execução
                    </h5>
                    <p className="text-gray-600 leading-snug whitespace-pre-line">
                      {quote.textoObservacoes || 'Executar compactação mecânica imediatamente após espalhamento com rolo liso e rolo de pneus.'}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Bottom Signatures and Letterhead Footer */}
          <div className="pt-3 mt-auto">
            {documentType === 'proposta' ? (
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
            ) : (
              <div className="grid grid-cols-3 gap-4 pt-3 border-t border-gray-300">
                <div className="text-center">
                  <div className="w-36 mx-auto border-b border-gray-400 pb-1 mb-1">
                    <span className="font-bold text-[11px] text-[#010102] block truncate">{quote.responsavelNome}</span>
                    <span className="text-[9px] text-gray-500 block">Expedição / Usina</span>
                  </div>
                  <span className="text-[8px] text-gray-400 uppercase tracking-wider">{letterheadSettings.nomeEmpresa}</span>
                </div>

                <div className="text-center">
                  <div className="w-36 mx-auto border-b border-dashed border-gray-400 pb-1 mb-1">
                    <span className="text-[10px] text-gray-400 italic block">Transportador / Motorista</span>
                    <span className="text-[9px] text-gray-400 block">Data / Hora: ___/___ __:__</span>
                  </div>
                  <span className="text-[8px] text-gray-400 uppercase tracking-wider">Transporte da Carga</span>
                </div>

                <div className="text-center">
                  <div className="w-36 mx-auto border-b border-dashed border-gray-400 pb-1 mb-1">
                    <span className="text-[10px] text-gray-400 italic block">Fiscal / Encarregado da Obra</span>
                    <span className="text-[9px] text-gray-400 block">Recebido no Canteiro</span>
                  </div>
                  <span className="text-[8px] text-gray-400 uppercase tracking-wider">{quote.cliente.nome}</span>
                </div>
              </div>
            )}

            <div className="text-center text-[9px] text-gray-400 mt-3 font-mono">
              {documentType === 'ordem_servico' 
                ? `Ordem de Serviço gerada eletronicamente por Asphalt Pro • Controle de Produção e Pesagem • Página 1 de 1`
                : `Documento gerado eletronicamente por Asphalt Pro • Usina de Asfalto • Página 1 de 1`}
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
