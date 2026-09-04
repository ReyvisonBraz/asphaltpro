import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Quote, QuoteStatus } from '../../types';
import { Button } from '../common/Button';
import { SwipeableRow } from '../common/SwipeableRow';
import { ConfirmModal } from '../common/ConfirmModal';
import { formatCurrency } from '../../utils/formatters';
import { exportQuotesCsv } from '../../utils/exportUtils';
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
  const [quoteToDelete, setQuoteToDelete] = useState<Quote | null>(null);
  const [activeMenuQuoteId, setActiveMenuQuoteId] = useState<string | null>(null);
  const [a4DocumentType, setA4DocumentType] = useState<'proposta' | 'ordem_servico'>('proposta');

  const menuRef = useRef<HTMLDivElement | null>(null);

  // Close row action dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenuQuoteId(null);
      }
    };
    if (activeMenuQuoteId) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeMenuQuoteId]);

  // Computed KPIs
  const totalCotacoes = quotes.reduce((sum, q) => sum + q.valorTotal, 0);
  const totalAprovadas = quotes.filter(q => q.status === 'aprovado' || q.status === 'convertido').reduce((sum, q) => sum + q.valorTotal, 0);
  const totalConvertidas = quotes.filter(q => q.convertidoEmReceita).reduce((sum, q) => sum + q.valorTotal, 0);
  const taxaConversao = quotes.length > 0 ? ((quotes.filter(q => q.convertidoEmReceita).length / quotes.length) * 100).toFixed(1) : '0';

  // Counts for status tabs
  const countTodos = quotes.length;
  const countRascunho = quotes.filter(q => q.status === 'rascunho').length;
  const countEnviado = quotes.filter(q => q.status === 'enviado').length;
  const countAprovado = quotes.filter(q => q.status === 'aprovado').length;
  const countConvertido = quotes.filter(q => q.status === 'convertido').length;
  const countRecusado = quotes.filter(q => q.status === 'recusado').length;

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
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#EBFBEE] text-[#2F9E44] border border-[#2F9E44]/20 shadow-2xs whitespace-nowrap">
            <span className="w-2 h-2 rounded-full bg-[#2F9E44] shrink-0"></span>
            Aprovado
          </span>
        );
      case 'convertido':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#E7F5FF] text-[#1971C2] border border-[#1971C2]/20 shadow-2xs whitespace-nowrap">
            <span className="w-2 h-2 rounded-full bg-[#1971C2] shrink-0"></span>
            Convertido em Receita
          </span>
        );
      case 'enviado':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#FFF4E6] text-[#D97706] border border-[#D97706]/20 shadow-2xs whitespace-nowrap">
            <span className="w-2 h-2 rounded-full bg-[#D97706] shrink-0"></span>
            Enviado ao Cliente
          </span>
        );
      case 'rascunho':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700 border border-gray-300 shadow-2xs whitespace-nowrap">
            <span className="w-2 h-2 rounded-full bg-gray-500 shrink-0"></span>
            Rascunho
          </span>
        );
      case 'recusado':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#FFF5F5] text-[#E03131] border border-[#E03131]/20 shadow-2xs whitespace-nowrap">
            <span className="w-2 h-2 rounded-full bg-[#E03131] shrink-0"></span>
            Recusado
          </span>
        );
    }
  };

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1440px] mx-auto w-full flex flex-col gap-6 animate-in fade-in duration-200">
      
      {/* Top Header & Structured Action Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#DEE2E6] shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold text-[#010102] tracking-tight">
              Orçamentos & Propostas Comerciais
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-[#835400] border border-amber-200">
              {quotes.length} {quotes.length === 1 ? 'proposta' : 'propostas'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#858486]">
            Crie cotações técnicas de pavimentação, emita propostas em papel timbrado A4 e lance faturamentos
          </p>
        </div>

        {/* Action Group with clear visual hierarchy */}
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          {/* Export CSV */}
          <button
            type="button"
            onClick={() => exportQuotesCsv(filteredQuotes)}
            title="Exportar cotações filtradas em formato CSV"
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-200 transition-colors cursor-pointer shrink-0 shadow-2xs"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            <span className="hidden sm:inline">Exportar CSV</span>
          </button>

          {/* Catalog Drawer Trigger */}
          <button
            type="button"
            onClick={() => setIsCatalogOpen(true)}
            title="Gerenciar catálogo de produtos, serviços e tabelas de preço"
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-200 transition-colors cursor-pointer shrink-0 shadow-2xs"
          >
            <span className="material-symbols-outlined text-[18px] text-[#835400]">inventory_2</span>
            <span>Catálogo</span>
          </button>

          {/* Letterhead settings link */}
          <button
            type="button"
            onClick={() => setCurrentView('configuracoes')}
            title="Configurar logotipo, rodapé e dados do papel timbrado A4"
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-200 transition-colors cursor-pointer shrink-0 shadow-2xs"
          >
            <span className="material-symbols-outlined text-[18px]">article</span>
            <span className="hidden md:inline">Papel Timbrado</span>
          </button>

          {/* New Quote Primary CTA */}
          <button
            type="button"
            onClick={() => {
              setEditingQuote(null);
              setIsNovoOrcamentoOpen(true);
            }}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-white bg-[#835400] hover:bg-[#6b4400] shadow-sm hover:shadow transition-all cursor-pointer shrink-0 active:scale-98"
          >
            <span className="material-symbols-outlined text-[20px]">add_circle</span>
            <span>Novo Orçamento</span>
          </button>
        </div>
      </div>

      {/* KPI Cards (Clean 2x2 grid on mobile, 4 columns on desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Quotes */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#DEE2E6] shadow-xs flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-gray-600">Total Cotado</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200/60 flex items-center justify-center text-[#835400]">
              <span className="material-symbols-outlined text-[18px]">request_quote</span>
            </div>
          </div>
          <div>
            <span className="text-base sm:text-2xl font-black text-[#010102] font-mono block truncate">
              R$ {totalCotacoes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[11px] text-gray-500 font-medium truncate block mt-0.5">
              {quotes.length} {quotes.length === 1 ? 'proposta gerada' : 'propostas geradas'}
            </span>
          </div>
        </div>

        {/* Approved Quotes */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#DEE2E6] shadow-xs flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#2F9E44]">Aprovados</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200/60 flex items-center justify-center text-[#2F9E44]">
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
            </div>
          </div>
          <div>
            <span className="text-base sm:text-2xl font-black text-[#2F9E44] font-mono block truncate">
              R$ {totalAprovadas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[11px] text-gray-500 font-medium truncate block mt-0.5">
              {quotes.filter(q => q.status === 'aprovado' || q.status === 'convertido').length} propostas aceitas
            </span>
          </div>
        </div>

        {/* Converted into Revenue */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#DEE2E6] shadow-xs flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#1971C2]">Faturado Caixa</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200/60 flex items-center justify-center text-[#1971C2]">
              <span className="material-symbols-outlined text-[18px]">price_check</span>
            </div>
          </div>
          <div>
            <span className="text-base sm:text-2xl font-black text-[#1971C2] font-mono block truncate">
              R$ {totalConvertidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[11px] text-gray-500 font-medium truncate block mt-0.5">
              {quotes.filter(q => q.convertidoEmReceita).length} integrados ao financeiro
            </span>
          </div>
        </div>

        {/* Conversion Rate */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#DEE2E6] shadow-xs flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-gray-600">Taxa de Sucesso</span>
            <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-200/60 flex items-center justify-center text-[#D97706]">
              <span className="material-symbols-outlined text-[18px]">trending_up</span>
            </div>
          </div>
          <div>
            <span className="text-base sm:text-2xl font-black text-[#010102] font-mono block">
              {taxaConversao}%
            </span>
            <span className="text-[11px] text-gray-500 font-medium truncate block mt-0.5">
              Conversão em receita
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-[#DEE2E6] shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-0">
          <span className="material-symbols-outlined absolute left-3.5 top-2.5 text-gray-400 text-[18px]">
            search
          </span>
          <input
            type="text"
            placeholder="Buscar por número, cliente, CNPJ, obra ou responsável..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-9 py-2 text-xs sm:text-sm rounded-xl border border-gray-300 bg-white focus:border-[#010102] focus:ring-1 focus:ring-[#010102] outline-none transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 cursor-pointer"
              title="Limpar busca"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          )}
        </div>

        {/* Status Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none select-none px-0.5">
          {[
            { id: 'todos', label: 'Todos', count: countTodos },
            { id: 'rascunho', label: 'Rascunhos', count: countRascunho },
            { id: 'enviado', label: 'Enviados', count: countEnviado },
            { id: 'aprovado', label: 'Aprovados', count: countAprovado },
            { id: 'convertido', label: 'Convertidos', count: countConvertido },
            { id: 'recusado', label: 'Recusados', count: countRecusado }
          ].map((tab) => {
            const isSelected = selectedStatus === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedStatus(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 ${
                  isSelected
                    ? 'bg-[#010102] text-white shadow-xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Quotes List Table / Cards */}
      <div className="bg-white rounded-2xl border border-[#DEE2E6] shadow-xs overflow-hidden">
        {filteredQuotes.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center mx-auto text-[#835400]">
              <span className="material-symbols-outlined text-3xl">
                request_quote
              </span>
            </div>
            <h3 className="text-base font-bold text-[#010102]">Nenhum orçamento encontrado</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              Não há orçamentos correspondentes aos critérios de busca ou filtros selecionados.
            </p>
            <button
              type="button"
              onClick={() => {
                setEditingQuote(null);
                setIsNovoOrcamentoOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#835400] hover:bg-[#6b4400] transition-colors cursor-pointer mt-2"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Criar Novo Orçamento
            </button>
          </div>
        ) : (
          <>
            {/* Desktop / Large Screen Table (Well proportioned columns, ample spacing, zero collisions) */}
            <div className="hidden lg:block w-full overflow-x-auto scrollbar-thin">
              <table className="w-full text-left text-xs border-collapse min-w-[1040px]">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-[#DEE2E6] text-gray-500 uppercase text-[10px] tracking-wider font-semibold">
                    <th className="py-3.5 px-4 whitespace-nowrap w-36">Orçamento</th>
                    <th className="py-3.5 px-4 min-w-[220px] max-w-[300px]">Cliente & Local da Obra</th>
                    <th className="py-3.5 px-4 min-w-[200px] max-w-[260px]">Composição dos Itens</th>
                    <th className="py-3.5 px-4 whitespace-nowrap w-28">Validade</th>
                    <th className="py-3.5 px-4 text-right whitespace-nowrap w-36">Valor Total</th>
                    <th className="py-3.5 px-4 text-center whitespace-nowrap w-40">Status</th>
                    <th className="py-3.5 px-4 text-center whitespace-nowrap w-60">Ações Rápidas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredQuotes.map((quote) => (
                    <tr key={quote.id} className="hover:bg-gray-50/70 transition-colors group">
                      {/* Number & Responsibility */}
                      <td className="py-3.5 px-4 whitespace-nowrap align-middle">
                        <div className="font-mono font-bold text-xs text-[#010102]" title={quote.numero}>
                          {quote.numero}
                        </div>
                        <span className="text-[11px] text-gray-500 block break-words leading-tight mt-0.5" title={quote.responsavelNome}>
                          {quote.responsavelNome}
                        </span>
                      </td>

                      {/* Client & Obra */}
                      <td className="py-3.5 px-4 align-middle">
                        <div className="font-bold text-xs text-[#010102] break-words leading-tight" title={quote.cliente.nome}>
                          {quote.cliente.nome}
                        </div>
                        {quote.cliente.enderecoObra ? (
                          <div
                            className="text-[11px] text-gray-500 break-words leading-tight flex items-start gap-1 mt-1"
                            title={quote.cliente.enderecoObra}
                          >
                            <span className="material-symbols-outlined text-[13px] text-[#835400] shrink-0 mt-0.5">location_on</span>
                            <span>{quote.cliente.enderecoObra}</span>
                          </div>
                        ) : (
                          <div className="text-[10px] text-gray-400 mt-0.5">Local não especificado</div>
                        )}
                      </td>

                      {/* Items Summary */}
                      <td className="py-3.5 px-4 align-middle">
                        <div
                          className="text-[11px] text-gray-700 font-medium break-words leading-snug line-clamp-2"
                          title={quote.itens.map((i) => `${i.quantidade}${i.unidade} ${i.nome}`).join(' • ')}
                        >
                          {quote.itens.map((i) => `${i.quantidade}${i.unidade} ${i.nome}`).join(' • ')}
                        </div>
                        <div className="text-[10px] text-gray-400 mt-0.5">
                          {quote.itens.length} {quote.itens.length === 1 ? 'item cotado' : 'itens cotados'}
                        </div>
                      </td>

                      {/* Dates */}
                      <td className="py-3.5 px-4 whitespace-nowrap align-middle">
                        <div className="text-gray-800 text-xs font-mono">{quote.dataEmissao}</div>
                        <div className="text-[10px] text-gray-400 mt-0.5">
                          Até <strong>{quote.dataValidade}</strong>
                        </div>
                      </td>

                      {/* Total */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap align-middle">
                        <div className="font-mono font-black text-sm text-[#010102] tabular-nums">
                          R$ {quote.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                        {quote.desconto > 0 && (
                          <div className="text-[10px] text-green-700 font-semibold font-mono mt-0.5">
                            - R$ {quote.desconto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </div>
                        )}
                      </td>

                      {/* Status Selector */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap align-middle">
                        {quote.status === 'convertido' ? (
                          <div className="inline-flex flex-col items-center">
                            {getStatusBadge(quote.status)}
                          </div>
                        ) : (
                          <div className="inline-flex flex-col items-center">
                            <div className="relative inline-block">
                              <select
                                value={quote.status}
                                onChange={(e) => updateQuoteStatus(quote.id, e.target.value as any)}
                                className={`appearance-none text-[11px] font-bold pl-3 pr-7 py-1 rounded-full cursor-pointer border transition-colors outline-none text-left shadow-2xs ${
                                  quote.status === 'aprovado'
                                    ? 'bg-[#EBFBEE] text-[#2F9E44] border-[#2F9E44]/30 hover:bg-[#d3f9d8]'
                                    : quote.status === 'enviado'
                                    ? 'bg-[#FFF4E6] text-[#D97706] border-[#D97706]/30 hover:bg-[#ffe8cc]'
                                    : quote.status === 'recusado'
                                    ? 'bg-[#FFF5F5] text-[#E03131] border-[#E03131]/30 hover:bg-[#ffe3e3]'
                                    : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                                }`}
                                title="Alterar status do orçamento"
                              >
                                <option value="rascunho">● Rascunho</option>
                                <option value="enviado">● Enviado</option>
                                <option value="aprovado">● Aprovado</option>
                                <option value="recusado">● Recusado</option>
                              </select>
                              <span className="material-symbols-outlined text-[14px] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-current opacity-70">
                                expand_more
                              </span>
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Actions Group (Organized, spacious, zero collisions) */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap align-middle">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* View Timbrada A4 Button */}
                          <button
                            type="button"
                            onClick={() => {
                              setA4DocumentType('proposta');
                              setViewingQuoteA4(quote);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#010102] text-[#F2A93B] hover:bg-gray-800 text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95"
                            title="Visualizar e Imprimir Proposta Comercial em Folha Timbrada A4"
                          >
                            <span className="material-symbols-outlined text-[15px]">description</span>
                            <span>Proposta</span>
                          </button>

                          {/* Gerar O.S. (Ordem de Serviço & Carregamento) Button */}
                          <button
                            type="button"
                            onClick={() => {
                              setA4DocumentType('ordem_servico');
                              setViewingQuoteA4(quote);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95"
                            title="Gerar e Imprimir Ordem de Serviço (O.S.) & Romaneio de Balança em PDF"
                          >
                            <span className="material-symbols-outlined text-[15px]">engineering</span>
                            <span>O.S. (PDF)</span>
                          </button>

                          {/* Convert to Revenue Button */}
                          {!quote.convertidoEmReceita ? (
                            <button
                              type="button"
                              onClick={() => setConvertingQuote(quote)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#2F9E44] text-white hover:bg-[#288239] text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95"
                              title="Converter orçamento em lançamento financeiro (Livro Caixa / Receber)"
                            >
                              <span className="material-symbols-outlined text-[15px]">price_check</span>
                              <span>Faturar</span>
                            </button>
                          ) : (
                            <span className="px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200">
                              Faturado
                            </span>
                          )}

                          {/* Action Dropdown / Secondary Options */}
                          <div className="relative inline-block text-left" ref={activeMenuQuoteId === quote.id ? menuRef : undefined}>
                            <button
                              type="button"
                              onClick={() => setActiveMenuQuoteId(activeMenuQuoteId === quote.id ? null : quote.id)}
                              className="p-1.5 rounded-lg text-gray-500 hover:text-black hover:bg-gray-100 border border-gray-200 hover:border-gray-300 transition-colors cursor-pointer"
                              title="Mais opções da proposta"
                            >
                              <span className="material-symbols-outlined text-[16px] block">more_vert</span>
                            </button>

                            {/* Dropdown Menu */}
                            {activeMenuQuoteId === quote.id && (
                              <div className="absolute right-0 mt-1 w-52 bg-white rounded-xl shadow-xl border border-gray-200 py-1 z-30 animate-in fade-in zoom-in-95 duration-100">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuQuoteId(null);
                                    setA4DocumentType('proposta');
                                    setViewingQuoteA4(quote);
                                  }}
                                  className="w-full px-3 py-2 text-left text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2 cursor-pointer"
                                >
                                  <span className="material-symbols-outlined text-[16px] text-[#F2A93B]">print</span>
                                  Imprimir Proposta (PDF)
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuQuoteId(null);
                                    setA4DocumentType('ordem_servico');
                                    setViewingQuoteA4(quote);
                                  }}
                                  className="w-full px-3 py-2 text-left text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2 cursor-pointer"
                                >
                                  <span className="material-symbols-outlined text-[16px] text-amber-600">engineering</span>
                                  Imprimir Ordem de Serviço (PDF)
                                </button>

                                <div className="border-t border-gray-100 my-1"></div>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuQuoteId(null);
                                    setEditingQuote(quote);
                                    setIsNovoOrcamentoOpen(true);
                                  }}
                                  className="w-full px-3 py-2 text-left text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2 cursor-pointer"
                                >
                                  <span className="material-symbols-outlined text-[16px] text-gray-500">edit</span>
                                  Editar Orçamento
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuQuoteId(null);
                                    duplicateQuote(quote.id);
                                  }}
                                  className="w-full px-3 py-2 text-left text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2 cursor-pointer"
                                >
                                  <span className="material-symbols-outlined text-[16px] text-gray-500">content_copy</span>
                                  Duplicar Cotação
                                </button>

                                <div className="border-t border-gray-100 my-1"></div>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuQuoteId(null);
                                    setQuoteToDelete(quote);
                                  }}
                                  className="w-full px-3 py-2 text-left text-xs font-medium text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer"
                                >
                                  <span className="material-symbols-outlined text-[16px] text-red-600">delete</span>
                                  Excluir Orçamento
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile / Tablet Adaptive Cards (Clear separation, dedicated action bars, zero overlapping) */}
            <div className="lg:hidden divide-y divide-gray-100">
              <div className="bg-amber-50/80 px-4 py-2 border-b border-amber-100 text-[11px] text-amber-900 flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-medium">
                  <span className="material-symbols-outlined text-[15px] text-[#835400]">touch_app</span>
                  Toque nos botões de ação ou deslize para opções rápidas
                </span>
                <span className="text-[9px] font-mono bg-amber-200/80 text-amber-900 px-1.5 py-0.5 rounded font-bold uppercase">
                  {filteredQuotes.length} itens
                </span>
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
                      onClick: () => setQuoteToDelete(quote),
                    },
                  ]}
                >
                  <div className="p-4 sm:p-5 flex flex-col gap-3.5 hover:bg-gray-50/70 transition-colors">
                    
                    {/* Top Row: Numero + Responsavel + Status */}
                    <div className="flex items-center justify-between gap-2 border-b border-gray-100 pb-2.5">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-[#010102]">{quote.numero}</span>
                          <span className="text-[10px] text-gray-400 font-sans">
                            {quote.dataEmissao}
                          </span>
                        </div>
                        <span className="text-[11px] text-gray-500 truncate block mt-0.5">
                          {quote.responsavelNome}
                        </span>
                      </div>

                      {/* Status select or badge */}
                      <div className="shrink-0">
                        {quote.status === 'convertido' ? (
                          getStatusBadge(quote.status)
                        ) : (
                          <div className="relative inline-block">
                            <select
                              value={quote.status}
                              onChange={(e) => updateQuoteStatus(quote.id, e.target.value as any)}
                              className={`appearance-none text-[11px] font-bold pl-2.5 pr-6 py-1 rounded-full border transition-colors outline-none cursor-pointer ${
                                quote.status === 'aprovado'
                                  ? 'bg-[#EBFBEE] text-[#2F9E44] border-[#2F9E44]/30'
                                  : quote.status === 'enviado'
                                  ? 'bg-[#FFF4E6] text-[#D97706] border-[#D97706]/30'
                                  : quote.status === 'recusado'
                                  ? 'bg-[#FFF5F5] text-[#E03131] border-[#E03131]/30'
                                  : 'bg-gray-100 text-gray-700 border-gray-300'
                              }`}
                            >
                              <option value="rascunho">● Rascunho</option>
                              <option value="enviado">● Enviado</option>
                              <option value="aprovado">● Aprovado</option>
                              <option value="recusado">● Recusado</option>
                            </select>
                            <span className="material-symbols-outlined text-[14px] absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-current opacity-70">
                              expand_more
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Client & Obra Details Box */}
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-200/70 text-xs space-y-1.5">
                      <div className="font-bold text-[#010102] truncate text-xs sm:text-sm">
                        {quote.cliente.nome}
                      </div>

                      {quote.cliente.enderecoObra && (
                        <div className="text-[11px] text-gray-600 truncate flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[14px] text-[#835400] shrink-0">location_on</span>
                          <span className="truncate">{quote.cliente.enderecoObra}</span>
                        </div>
                      )}

                      <div className="text-[11px] text-gray-500 font-medium truncate pt-1 border-t border-gray-200/50">
                        {quote.itens.map(i => `${i.quantidade}${i.unidade} ${i.nome}`).join(' • ')}
                      </div>
                    </div>

                    {/* Financial Summary & Expiration */}
                    <div className="flex items-center justify-between gap-2 pt-1">
                      <div>
                        <span className="text-[10px] text-gray-400 block uppercase font-semibold">Validade</span>
                        <span className="text-xs text-gray-700 font-medium font-mono">Até {quote.dataValidade}</span>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-gray-400 block uppercase font-semibold">Valor Total</span>
                        <div className="font-mono font-black text-base sm:text-lg text-[#010102]">
                          R$ {quote.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                    </div>

                    {/* Distinct Action Button Rows (Separated, spacious, no overlap) */}
                    <div className="flex flex-col gap-2 pt-2 border-t border-gray-100">
                      
                      {/* Primary Actions: Proposta, O.S. (PDF) and Faturar */}
                      <div className="grid grid-cols-3 gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setA4DocumentType('proposta');
                            setViewingQuoteA4(quote);
                          }}
                          className="w-full flex items-center justify-center gap-1 py-2 px-2 rounded-xl bg-[#010102] hover:bg-gray-800 text-[#F2A93B] text-xs font-bold transition-colors cursor-pointer shadow-xs"
                          title="Visualizar Proposta Comercial"
                        >
                          <span className="material-symbols-outlined text-[15px]">description</span>
                          <span>Proposta</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setA4DocumentType('ordem_servico');
                            setViewingQuoteA4(quote);
                          }}
                          className="w-full flex items-center justify-center gap-1 py-2 px-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
                          title="Gerar e Imprimir Ordem de Serviço (PDF)"
                        >
                          <span className="material-symbols-outlined text-[15px]">engineering</span>
                          <span>O.S. (PDF)</span>
                        </button>

                        {!quote.convertidoEmReceita ? (
                          <button
                            type="button"
                            onClick={() => setConvertingQuote(quote)}
                            className="w-full flex items-center justify-center gap-1 py-2 px-2 rounded-xl bg-[#2F9E44] hover:bg-[#288239] text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
                          >
                            <span className="material-symbols-outlined text-[15px]">price_check</span>
                            <span>Faturar</span>
                          </button>
                        ) : (
                          <div className="w-full flex items-center justify-center py-2 px-2 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold">
                            <span className="material-symbols-outlined text-[15px] mr-0.5">check_circle</span>
                            <span>Faturado</span>
                          </div>
                        )}
                      </div>

                      {/* Secondary Actions Row (Edit, Duplicate, Delete with ample touch size) */}
                      <div className="flex items-center justify-end gap-1.5 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingQuote(quote);
                            setIsNovoOrcamentoOpen(true);
                          }}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[15px]">edit</span>
                          <span>Editar</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => duplicateQuote(quote.id)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[15px]">content_copy</span>
                          <span>Duplicar</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setQuoteToDelete(quote)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition-colors cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[15px]">delete</span>
                          <span>Excluir</span>
                        </button>
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
        initialDocumentType={a4DocumentType}
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

      {/* Confirmation Modal for Quote deletion */}
      <ConfirmModal
        isOpen={!!quoteToDelete}
        onClose={() => setQuoteToDelete(null)}
        onConfirm={() => {
          if (quoteToDelete) {
            deleteQuote(quoteToDelete.id);
            setQuoteToDelete(null);
          }
        }}
        title="Excluir Proposta de Orçamento"
        message="Deseja realmente remover esta proposta de orçamento comercial? Os dados da folha A4 e itens orçados serão excluídos permanentemente."
        confirmText="Sim, Excluir Orçamento"
        cancelText="Cancelar"
        variant="danger"
        icon="delete"
        itemDetails={
          quoteToDelete
            ? [
                { label: 'Número', value: quoteToDelete.numero },
                { label: 'Cliente', value: quoteToDelete.cliente.nome },
                { label: 'Valor Total', value: formatCurrency(quoteToDelete.valorTotal) },
                { label: 'Data', value: quoteToDelete.dataEmissao },
              ]
            : []
        }
      />
    </div>
  );
};
