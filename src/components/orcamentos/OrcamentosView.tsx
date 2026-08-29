import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Quote, QuoteStatus } from '../../types';
import { Button } from '../common/Button';
import { SwipeableRow } from '../common/SwipeableRow';
import { NovoOrcamentoModal } from './NovoOrcamentoModal';
import { OrcamentoA4VisualizerModal } from './OrcamentoA4VisualizerModal';
import { ConverterOrcamentoModal } from './ConverterOrcamentoModal';
import { CatalogoItensDrawer } from './CatalogoItensDrawer';

export const OrcamentosView: React.FC = () => {
  const {
    quotes,
    deleteQuote,
    duplicateQuote,
    updateQuoteStatus,
    isNovoOrcamentoOpen,
    setIsNovoOrcamentoOpen,
    editingQuote,
    setEditingQuote,
    viewingQuoteA4,
    setViewingQuoteA4,
    convertingQuote,
    setConvertingQuote,
    setCurrentView
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('todos');
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);

  // Computed KPIs
  const totalCotacoes = quotes.reduce((sum, q) => sum + q.valorTotal, 0);
  const totalAprovadas = quotes.filter(q => q.status === 'aprovado' || q.status === 'convertido').reduce((sum, q) => sum + q.valorTotal, 0);
  const totalConvertidas = quotes.filter(q => q.convertidoEmReceita).reduce((sum, q) => sum + q.valorTotal, 0);
  const taxaConversao = quotes.length > 0 ? ((quotes.filter(q => q.convertidoEmReceita).length / quotes.length) * 100).toFixed(1) : '0';

  // Filtered quotes list
  const filteredQuotes = quotes.filter(q => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      q.numero.toLowerCase().includes(term) ||
      q.cliente.nome.toLowerCase().includes(term) ||
      (q.cliente.documento && q.cliente.documento.includes(term)) ||
      (q.cliente.enderecoObra && q.cliente.enderecoObra.toLowerCase().includes(term)) ||
      q.responsavelNome.toLowerCase().includes(term);

    const matchesStatus = selectedStatus === 'todos' || q.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: QuoteStatus) => {
    switch (status) {
      case 'aprovado':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#EBFBEE] text-[#2F9E44] border border-[#2F9E44]/20">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2F9E44]"></span>
            Aprovado
          </span>
        );
      case 'convertido':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#E7F5FF] text-[#1971C2] border border-[#1971C2]/20">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1971C2]"></span>
            Convertido em Receita
          </span>
        );
      case 'enviado':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#FFF4E6] text-[#D97706] border border-[#D97706]/20">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]"></span>
            Enviado ao Cliente
          </span>
        );
      case 'rascunho':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700 border border-gray-200">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-500"></span>
            Rascunho
          </span>
        );
      case 'recusado':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#FFF5F5] text-[#E03131] border border-[#E03131]/20">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E03131]"></span>
            Recusado
          </span>
        );
    }
  };

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1440px] mx-auto w-full flex flex-col gap-6 animate-in fade-in duration-200">
      
      {/* Top Header & Fast Action Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#010102] tracking-tight">
            Orçamentos & Propostas Técnicas
          </h1>
          <p className="text-xs sm:text-sm text-[#858486]">
            Crie cotações detalhadas de pavimentação, gere papel timbrado A4 e converta em faturamento
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Catalog Drawer Trigger */}
          <Button
            variant="secondary"
            icon="inventory_2"
            onClick={() => setIsCatalogOpen(true)}
          >
            Catálogo de Preços & Modelos
          </Button>

          {/* Letterhead settings link */}
          <Button
            variant="secondary"
            icon="article"
            onClick={() => setCurrentView('configuracoes')}
          >
            Papel Timbrado A4
          </Button>

          {/* New Quote Button */}
          <Button
            variant="primary"
            icon="add_circle"
            onClick={() => {
              setEditingQuote(null);
              setIsNovoOrcamentoOpen(true);
            }}
          >
            Novo Orçamento
          </Button>
        </div>
      </div>

      {/* KPI Cards (2x2 on mobile, 4 on desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Total Quotes */}
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-[#DEE2E6] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider truncate">Total Cotações</span>
            <span className="material-symbols-outlined text-[#835400] text-[18px] sm:text-[20px]">request_quote</span>
          </div>
          <div>
            <span className="text-base sm:text-2xl font-black text-[#010102] font-mono block truncate">
              R$ {totalCotacoes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] sm:text-[11px] text-gray-500 font-medium truncate block">
              {quotes.length} {quotes.length === 1 ? 'proposta' : 'propostas'}
            </span>
          </div>
        </div>

        {/* Approved Quotes */}
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-[#DEE2E6] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider truncate">Aprovados</span>
            <span className="material-symbols-outlined text-[#2F9E44] text-[18px] sm:text-[20px]">check_circle</span>
          </div>
          <div>
            <span className="text-base sm:text-2xl font-black text-[#2F9E44] font-mono block truncate">
              R$ {totalAprovadas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] sm:text-[11px] text-gray-500 font-medium truncate block">
              {quotes.filter(q => q.status === 'aprovado' || q.status === 'convertido').length} aceitas
            </span>
          </div>
        </div>

        {/* Converted into Revenue */}
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-[#DEE2E6] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider truncate">Faturado Caixa</span>
            <span className="material-symbols-outlined text-[#1971C2] text-[18px] sm:text-[20px]">price_check</span>
          </div>
          <div>
            <span className="text-base sm:text-2xl font-black text-[#1971C2] font-mono block truncate">
              R$ {totalConvertidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] sm:text-[11px] text-gray-500 font-medium truncate block">
              {quotes.filter(q => q.convertidoEmReceita).length} no financeiro
            </span>
          </div>
        </div>

        {/* Conversion Rate */}
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-[#DEE2E6] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider truncate">Conversão</span>
            <span className="material-symbols-outlined text-[#F2A93B] text-[18px] sm:text-[20px]">trending_up</span>
          </div>
          <div>
            <span className="text-base sm:text-2xl font-black text-[#010102] font-mono block">
              {taxaConversao}%
            </span>
            <span className="text-[10px] sm:text-[11px] text-gray-500 font-medium truncate block">
              Taxa de sucesso
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#DEE2E6] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-0">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-gray-400 text-[18px]">
            search
          </span>
          <input
            type="text"
            placeholder="Buscar por número, cliente, CNPJ ou obra..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-gray-300 bg-white focus:border-[#010102] outline-none"
          />
        </div>

        {/* Status Filter Chips (Scrollable) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none select-none">
          {[
            { id: 'todos', label: 'Todos' },
            { id: 'rascunho', label: 'Rascunhos' },
            { id: 'enviado', label: 'Enviados' },
            { id: 'aprovado', label: 'Aprovados' },
            { id: 'convertido', label: 'Convertidos' },
            { id: 'recusado', label: 'Recusados' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedStatus(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer active:scale-95 ${
                selectedStatus === tab.id
                  ? 'bg-[#010102] text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Quotes List Table */}
      <div className="bg-white rounded-2xl border border-[#DEE2E6] shadow-xs overflow-hidden">
        {filteredQuotes.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <span className="material-symbols-outlined text-5xl text-gray-300">
              request_quote
            </span>
            <h3 className="text-base font-bold text-[#010102]">Nenhum orçamento encontrado</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              Não há orçamentos correspondentes aos filtros selecionados. Crie uma nova proposta para sua usina.
            </p>
            <Button
              variant="primary"
              icon="add"
              className="mt-2"
              onClick={() => {
                setEditingQuote(null);
                setIsNovoOrcamentoOpen(true);
              }}
            >
              Criar Primeiro Orçamento
            </Button>
          </div>
        ) : (
          <>
            {/* Desktop / Tablet View: Fluid table without horizontal scroll */}
            <div className="hidden lg:block w-full">
              <table className="w-full text-left text-xs border-collapse table-fixed">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-[#DEE2E6] text-gray-500 uppercase text-[10px] tracking-wider font-semibold">
                    <th className="py-3 px-3 w-28">Orçamento</th>
                    <th className="py-3 px-3">Cliente & Obra</th>
                    <th className="py-3 px-3 w-48">Itens / Composição</th>
                    <th className="py-3 px-3 w-32">Emissão / Validade</th>
                    <th className="py-3 px-3 w-32 text-right">Valor Total</th>
                    <th className="py-3 px-2 w-28 text-center">Status</th>
                    <th className="py-3 px-3 w-52 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredQuotes.map((quote) => (
                    <tr key={quote.id} className="hover:bg-gray-50/60 transition-colors group">
                      {/* Number */}
                      <td className="py-3 px-3">
                        <div className="font-mono font-bold text-xs text-[#010102] truncate">{quote.numero}</div>
                        <span className="text-[10px] text-gray-400 block truncate">{quote.responsavelNome}</span>
                      </td>

                      {/* Client & Work */}
                      <td className="py-3 px-3 min-w-0">
                        <div className="font-bold text-xs text-[#010102] truncate">{quote.cliente.nome}</div>
                        {quote.cliente.enderecoObra ? (
                          <div className="text-[11px] text-gray-500 truncate flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px] text-gray-400">location_on</span>
                            {quote.cliente.enderecoObra}
                          </div>
                        ) : (
                          <div className="text-[10px] text-gray-400">Obra não informada</div>
                        )}
                      </td>

                      {/* Items Summary */}
                      <td className="py-3 px-3">
                        <div className="text-[11px] text-gray-700 font-medium truncate" title={quote.itens.map(i => `${i.quantidade}${i.unidade} ${i.nome}`).join(' • ')}>
                          {quote.itens.map(i => `${i.quantidade}${i.unidade} ${i.nome}`).join(' • ')}
                        </div>
                        <div className="text-[10px] text-gray-400">
                          {quote.itens.length} {quote.itens.length === 1 ? 'item cotado' : 'itens cotados'}
                        </div>
                      </td>

                      {/* Dates */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="text-gray-800 text-xs">{quote.dataEmissao}</div>
                        <div className="text-[10px] text-gray-400">
                          Até <strong>{quote.dataValidade}</strong> ({quote.diasValidade}d)
                        </div>
                      </td>

                      {/* Total */}
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="font-mono font-black text-sm text-[#010102]">
                          R$ {quote.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                        {quote.desconto > 0 && (
                          <div className="text-[10px] text-green-700 font-medium">
                            Desc. R$ {quote.desconto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-2 text-center whitespace-nowrap">
                        {getStatusBadge(quote.status)}
                        {quote.detalhesConversao && (
                          <div className="text-[9px] text-[#1971C2] mt-0.5 truncate max-w-[120px] mx-auto" title={quote.detalhesConversao}>
                            {quote.detalhesConversao}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          {/* View A4 Sheet */}
                          <Button
                            variant="dark"
                            size="xs"
                            icon="visibility"
                            onClick={() => setViewingQuoteA4(quote)}
                            title="Visualizar / Imprimir Folha Timbrada A4"
                          >
                            A4
                          </Button>

                          {/* Convert to Revenue */}
                          {!quote.convertidoEmReceita && (
                            <Button
                              variant="success"
                              size="xs"
                              icon="price_check"
                              onClick={() => setConvertingQuote(quote)}
                              title="Converter proposta em faturamento"
                            >
                              Faturar
                            </Button>
                          )}

                          {/* Quick Status Dropdown */}
                          {quote.status !== 'convertido' && (
                            <select
                              value={quote.status}
                              onChange={(e) => updateQuoteStatus(quote.id, e.target.value as any)}
                              className="p-1 rounded text-[11px] border border-gray-300 bg-white text-gray-700 outline-none"
                              title="Alterar status"
                            >
                              <option value="rascunho">Rascunho</option>
                              <option value="enviado">Enviado</option>
                              <option value="aprovado">Aprovado</option>
                              <option value="recusado">Recusado</option>
                            </select>
                          )}

                          {/* Edit */}
                          <Button
                            variant="ghost"
                            size="xs"
                            icon="edit"
                            onClick={() => {
                              setEditingQuote(quote);
                              setIsNovoOrcamentoOpen(true);
                            }}
                            title="Editar proposta"
                          />

                          {/* Duplicate */}
                          <Button
                            variant="ghost"
                            size="xs"
                            icon="content_copy"
                            onClick={() => duplicateQuote(quote.id)}
                            title="Duplicar proposta"
                          />

                          {/* Delete */}
                          <Button
                            variant="ghost"
                            size="xs"
                            icon="delete"
                            className="hover:text-red-600 hover:bg-red-50 text-gray-400"
                            onClick={() => {
                              if (confirm(`Deseja realmente remover o orçamento ${quote.numero}?`)) {
                                deleteQuote(quote.id);
                              }
                            }}
                            title="Excluir"
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile / Narrow View: Adaptive Quote Cards with zero horizontal scroll & swipe actions */}
            <div className="lg:hidden divide-y divide-gray-100">
              <div className="bg-amber-50/60 px-4 py-1.5 border-b border-amber-100 text-[10px] text-amber-800 flex items-center justify-between">
                <span className="flex items-center gap-1 font-medium">
                  <span className="material-symbols-outlined text-[13px]">swipe_left</span>
                  Deslize para ver Folha A4, editar ou excluir
                </span>
                <span className="text-[9px] font-mono text-amber-600 font-bold uppercase tracking-wider">Touch</span>
              </div>

              {filteredQuotes.map((quote) => (
                <SwipeableRow
                  key={quote.id}
                  actions={[
                    {
                      label: 'Ver A4',
                      icon: 'visibility',
                      colorClass: 'bg-[#010102] text-[#F2A93B]',
                      onClick: () => setViewingQuoteA4(quote),
                    },
                    {
                      label: 'Editar',
                      icon: 'edit',
                      colorClass: 'bg-[#835400] text-white',
                      onClick: () => {
                        setEditingQuote(quote);
                        setIsNovoOrcamentoOpen(true);
                      },
                    },
                    {
                      label: 'Excluir',
                      icon: 'delete',
                      colorClass: 'bg-red-600 text-white',
                      onClick: () => {
                        if (confirm(`Deseja realmente remover o orçamento ${quote.numero}?`)) {
                          deleteQuote(quote.id);
                        }
                      },
                    },
                  ]}
                >
                  <div className="p-4 flex flex-col gap-3 hover:bg-gray-50/70 transition-colors">
                    {/* Top: Numero + Status + Total */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-mono font-black text-sm text-[#010102] flex items-center gap-2">
                          {quote.numero}
                          <span className="text-[10px] font-normal text-gray-400 font-sans">
                            {quote.dataEmissao}
                          </span>
                        </div>
                        <span className="text-[11px] text-gray-500">{quote.responsavelNome}</span>
                      </div>

                      <div className="text-right">
                        <div className="font-mono font-black text-base text-[#010102]">
                          R$ {quote.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                        <div className="mt-0.5 flex justify-end">
                          {getStatusBadge(quote.status)}
                        </div>
                      </div>
                    </div>

                    {/* Client & Obra */}
                    <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100 text-xs">
                      <div className="font-bold text-[#010102] truncate">{quote.cliente.nome}</div>
                      {quote.cliente.enderecoObra && (
                        <div className="text-[11px] text-gray-500 truncate flex items-center gap-1 mt-0.5">
                          <span className="material-symbols-outlined text-[12px] text-gray-400">location_on</span>
                          {quote.cliente.enderecoObra}
                        </div>
                      )}
                      <div className="text-[11px] text-gray-600 mt-1 font-medium truncate">
                        {quote.itens.map(i => `${i.quantidade}${i.unidade} ${i.nome}`).join(' • ')}
                      </div>
                    </div>

                    {/* Actions Footer */}
                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-gray-100 flex-wrap">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Button
                          variant="dark"
                          size="xs"
                          icon="visibility"
                          onClick={() => setViewingQuoteA4(quote)}
                          title="Visualizar Folha Timbrada A4"
                        >
                          A4
                        </Button>

                        {!quote.convertidoEmReceita && (
                          <Button
                            variant="success"
                            size="xs"
                            icon="price_check"
                            onClick={() => setConvertingQuote(quote)}
                            title="Faturar"
                          >
                            Faturar
                          </Button>
                        )}

                        {quote.status !== 'convertido' && (
                          <select
                            value={quote.status}
                            onChange={(e) => updateQuoteStatus(quote.id, e.target.value as any)}
                            className="p-1 rounded text-[11px] border border-gray-300 bg-white text-gray-700 outline-none"
                          >
                            <option value="rascunho">Rascunho</option>
                            <option value="enviado">Enviado</option>
                            <option value="aprovado">Aprovado</option>
                            <option value="recusado">Recusado</option>
                          </select>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="xs"
                          icon="edit"
                          onClick={() => {
                            setEditingQuote(quote);
                            setIsNovoOrcamentoOpen(true);
                          }}
                          title="Editar"
                        />
                        <Button
                          variant="ghost"
                          size="xs"
                          icon="content_copy"
                          onClick={() => duplicateQuote(quote.id)}
                          title="Duplicar"
                        />
                        <Button
                          variant="ghost"
                          size="xs"
                          icon="delete"
                          className="hover:text-red-600 hover:bg-red-50 text-gray-400"
                          onClick={() => {
                            if (confirm(`Deseja realmente remover o orçamento ${quote.numero}?`)) {
                              deleteQuote(quote.id);
                            }
                          }}
                          title="Excluir"
                        />
                      </div>
                    </div>
                  </div>
                </SwipeableRow>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Modals & Drawers */}
      <NovoOrcamentoModal
        isOpen={isNovoOrcamentoOpen}
        onClose={() => {
          setIsNovoOrcamentoOpen(false);
          setEditingQuote(null);
        }}
        quoteToEdit={editingQuote}
        onSaveAndPreview={(savedQuote) => {
          setViewingQuoteA4(savedQuote);
        }}
      />

      <OrcamentoA4VisualizerModal
        quote={viewingQuoteA4}
        onClose={() => setViewingQuoteA4(null)}
        onEdit={(quote) => {
          setEditingQuote(quote);
          setIsNovoOrcamentoOpen(true);
        }}
        onConvert={(quote) => {
          setConvertingQuote(quote);
        }}
      />

      <ConverterOrcamentoModal
        quote={convertingQuote}
        onClose={() => setConvertingQuote(null)}
      />

      <CatalogoItensDrawer
        isOpen={isCatalogOpen}
        onClose={() => setIsCatalogOpen(false)}
      />
    </div>
  );
};
