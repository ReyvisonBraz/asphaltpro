import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../utils/formatters';
import { exportTransactionsCsv } from '../../utils/exportUtils';
import { Transaction } from '../../types';
import {
  Button,
  StatCard,
  StatusBadge,
  Pagination,
  EmptyState,
  Modal,
  SwipeableRow,
  ConfirmModal,
} from '../common';
import { ImportDataModal } from '../common/ImportDataModal';

export const LancamentosView: React.FC = () => {
  const {
    transactions,
    deleteTransaction,
    openNovoLancamentoWithTab,
    openEditLancamento,
    deduplicateTransactions,
    categories,
    employees,
    globalSearch,
    showToast,
    permissions,
    letterheadSettings,
  } = useApp();

  // Compute duplicate transactions count for transparency
  const duplicateCount = useMemo(() => {
    const seen = new Set<string>();
    let count = 0;
    for (const t of transactions) {
      const key = `${t.descricao.trim().toLowerCase()}|${(t.clienteFornecedor || '').trim().toLowerCase()}|${t.data}|${Number(t.valor).toFixed(2)}|${t.tipo}`;
      if (seen.has(key)) {
        count++;
      } else {
        seen.add(key);
      }
    }
    return count;
  }, [transactions]);

  // Filters
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState('Todas as Categorias');
  const [selectedResponsavel, setSelectedResponsavel] = useState('Todos os Responsáveis');
  const [selectedTipo, setSelectedTipo] = useState<'todos' | 'entrada' | 'saida'>('todos');
  const [localSearch, setLocalSearch] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedTxForDetail, setSelectedTxForDetail] = useState<Transaction | null>(null);
  const [txToDelete, setTxToDelete] = useState<Transaction | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Helper to parse date format (DD/MM/YYYY or YYYY-MM-DD) into timestamp
  const parseDateToTimestamp = (dateStr: string) => {
    if (!dateStr) return null;
    if (dateStr.includes('/')) {
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        const d = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const y = parseInt(parts[2], 10);
        return new Date(y, m, d).getTime();
      }
    } else if (dateStr.includes('-')) {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const d = parseInt(parts[2], 10);
        return new Date(y, m, d).getTime();
      }
    }
    const timestamp = Date.parse(dateStr);
    return isNaN(timestamp) ? null : timestamp;
  };

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    const startTime = dataInicio ? parseDateToTimestamp(dataInicio) : null;
    const endTime = dataFim ? parseDateToTimestamp(dataFim) : null;

    return transactions.filter((tx) => {
      const matchGlobal = globalSearch
        ? tx.descricao.toLowerCase().includes(globalSearch.toLowerCase()) ||
          tx.categoria.toLowerCase().includes(globalSearch.toLowerCase()) ||
          tx.responsavel.toLowerCase().includes(globalSearch.toLowerCase())
        : true;

      const matchLocal = localSearch
        ? tx.descricao.toLowerCase().includes(localSearch.toLowerCase()) ||
          (tx.clienteFornecedor &&
            tx.clienteFornecedor.toLowerCase().includes(localSearch.toLowerCase()))
        : true;

      const matchCat =
        selectedCategoria === 'Todas as Categorias' ||
        tx.categoria.toLowerCase() === selectedCategoria.toLowerCase();

      const matchResp =
        selectedResponsavel === 'Todos os Responsáveis' ||
        tx.responsavel.toLowerCase().includes(selectedResponsavel.toLowerCase());

      const matchTipo = selectedTipo === 'todos' || tx.tipo === selectedTipo;

      const txTime = parseDateToTimestamp(tx.data);
      const matchDate =
        (!startTime || (txTime !== null && txTime >= startTime)) &&
        (!endTime || (txTime !== null && txTime <= endTime));

      return matchGlobal && matchLocal && matchCat && matchResp && matchTipo && matchDate;
    });
  }, [
    transactions,
    globalSearch,
    localSearch,
    selectedCategoria,
    selectedResponsavel,
    selectedTipo,
    dataInicio,
    dataFim,
  ]);

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage) || 1;
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalEntradasFiltrado = useMemo(() => {
    return filteredTransactions
      .filter((t) => t.tipo === 'entrada')
      .reduce((acc, curr) => acc + curr.valor, 0);
  }, [filteredTransactions]);

  const totalSaidasFiltrado = useMemo(() => {
    return filteredTransactions
      .filter((t) => t.tipo === 'saida')
      .reduce((acc, curr) => acc + curr.valor, 0);
  }, [filteredTransactions]);

  const saldoFiltrado = totalEntradasFiltrado - totalSaidasFiltrado;

  // Export to CSV
  const handleExportCSV = () => {
    exportTransactionsCsv(filteredTransactions);
    showToast('Lançamentos exportados em CSV com sucesso!', 'success');
  };

  const handleResetFilters = () => {
    setDataInicio('');
    setDataFim('');
    setSelectedCategoria('Todas as Categorias');
    setSelectedResponsavel('Todos os Responsáveis');
    setSelectedTipo('todos');
    setLocalSearch('');
    setCurrentPage(1);
  };

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1440px] mx-auto w-full flex flex-col gap-6 animate-in fade-in duration-200">
      {/* Official Print Header (Visible ONLY during print/PDF generation) */}
      <div className="print-only mb-6 border-b-2 border-black pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {letterheadSettings?.logoUrl ? (
              <img src={letterheadSettings.logoUrl} alt="Logo" className="h-12 max-w-[140px] object-contain" />
            ) : (
              <div className="w-10 h-10 bg-black text-[#F2A93B] rounded flex items-center justify-center font-black text-sm">
                AP
              </div>
            )}
            <div>
              <h1 className="text-base font-bold uppercase tracking-wider text-black">
                {letterheadSettings?.nomeEmpresa || 'AsphaltPro Pavimentação & Usina'}
              </h1>
              <p className="text-[11px] text-gray-700">
                CNPJ: {letterheadSettings?.cnpj || '12.345.678/0001-90'} • {letterheadSettings?.enderecoUsina || 'Distrito Industrial'}
              </p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-sm font-bold uppercase tracking-wide text-black">
              Extrato Financeiro de Caixa
            </h2>
            <p className="text-xs text-gray-700">
              Registros listados: <strong className="font-semibold">{filteredTransactions.length}</strong>
            </p>
            <p className="text-[10px] text-gray-500">
              Gerado em: {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
      </div>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#010102] tracking-tight">
            Lançamentos Financeiros (Livro Caixa)
          </h2>
          <p className="text-xs sm:text-sm text-[#46464A] mt-1">
            Histórico completo de entradas e saídas de caixa da usina de asfalto.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
          <Button
            variant="outline"
            icon="print"
            size="sm"
            onClick={() => window.print()}
            title="Imprimir extrato filtrado ou salvar em PDF"
          >
            Imprimir Extrato (PDF)
          </Button>

          <Button
            variant="outline"
            icon="upload_file"
            size="sm"
            onClick={() => setIsImportModalOpen(true)}
            title="Importar lançamentos em lote a partir de planilha CSV"
          >
            Importar CSV
          </Button>

          <Button
            variant="secondary"
            icon="download"
            size="sm"
            onClick={handleExportCSV}
            title="Exportar lançamentos filtrados para CSV"
          >
            Exportar CSV
          </Button>

          <Button
            variant="success"
            icon="add_circle"
            size="sm"
            onClick={() => openNovoLancamentoWithTab('entrada')}
          >
            Nova Entrada
          </Button>

          <Button
            variant="warning"
            icon="add"
            size="sm"
            onClick={() => openNovoLancamentoWithTab('saida')}
          >
            Nova Saída
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Entradas Filtradas"
          value={permissions.canViewBalances ? formatCurrency(totalEntradasFiltrado) : '••••••••'}
          icon="arrow_upward"
          variant="success"
          subtitle={permissions.canViewBalances ? `${filteredTransactions.filter((t) => t.tipo === 'entrada').length} lançamentos` : 'Sigiloso'}
        />

        <StatCard
          title="Saídas Filtradas"
          value={permissions.canViewBalances ? formatCurrency(totalSaidasFiltrado) : '••••••••'}
          icon="arrow_downward"
          variant="danger"
          subtitle={permissions.canViewBalances ? `${filteredTransactions.filter((t) => t.tipo === 'saida').length} lançamentos` : 'Sigiloso'}
        />

        <StatCard
          title="Resultado Líquido"
          value={permissions.canViewBalances ? formatCurrency(saldoFiltrado) : '••••••••'}
          icon="account_balance_wallet"
          variant={saldoFiltrado >= 0 ? 'primary' : 'danger'}
          subtitle={permissions.canViewBalances ? (saldoFiltrado >= 0 ? 'Superávit no período' : 'Déficit no período') : 'Acesso Restrito'}
        />
      </div>

      {/* Filter Bar with Horizontal Chips & Fast Search */}
      <div className="bg-white p-4 rounded-2xl border border-[#DEE2E6] shadow-xs flex flex-col gap-3">
        {/* Top: Search Bar + Advanced Filters Toggle */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 min-w-0">
            <span className="material-symbols-outlined absolute left-3.5 top-2.5 text-gray-400 text-[18px] pointer-events-none">
              search
            </span>
            <input
              type="text"
              value={localSearch}
              onChange={(e) => {
                setLocalSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Buscar lançamento, favorecido ou descrição..."
              className="w-full pl-10 pr-8 py-2 text-xs rounded-xl border border-[#DEE2E6] text-[#010102] bg-white focus:border-[#835400] focus:ring-1 focus:ring-[#835400]/20 focus:outline-none"
            />
            {localSearch && (
              <button
                type="button"
                onClick={() => setLocalSearch('')}
                className="absolute right-3 top-2.5 text-xs text-gray-400 hover:text-black"
              >
                ✕
              </button>
            )}
          </div>

          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`px-3 py-2 text-xs font-bold rounded-xl border transition-all flex items-center gap-1.5 shrink-0 select-none ${
              showAdvancedFilters || (selectedCategoria !== 'Todas as Categorias' || selectedResponsavel !== 'Todos os Responsáveis')
                ? 'bg-[#835400] text-white border-[#835400] shadow-xs'
                : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-[#DEE2E6]'
            }`}
            title="Filtros avançados (Datas e Responsável)"
          >
            <span className="material-symbols-outlined text-[16px]">tune</span>
            <span className="hidden sm:inline">Filtros</span>
          </button>
        </div>

        {/* Horizontal Chips Filter Bar (Scrollable on Mobile) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none select-none">
          {/* Tipo Chips */}
          <button
            onClick={() => {
              setSelectedTipo('todos');
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl whitespace-nowrap transition-all ${
              selectedTipo === 'todos'
                ? 'bg-[#010102] text-white shadow-xs'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Todos
          </button>

          <button
            onClick={() => {
              setSelectedTipo('entrada');
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl whitespace-nowrap transition-all flex items-center gap-1 ${
              selectedTipo === 'entrada'
                ? 'bg-[#2F9E44] text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Entradas
          </button>

          <button
            onClick={() => {
              setSelectedTipo('saida');
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl whitespace-nowrap transition-all flex items-center gap-1 ${
              selectedTipo === 'saida'
                ? 'bg-[#E03131] text-white shadow-xs'
                : 'bg-red-50 text-red-800 hover:bg-red-100'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
            Saídas
          </button>

          {/* Quick Category Chips */}
          {['Venda de Asfalto (CBUQ)', 'Insumos / Matéria Prima', 'Combustível / Diesel', 'Folha de Pagamento'].map((catName) => {
            const isCatSelected = selectedCategoria === catName;
            return (
              <button
                key={catName}
                onClick={() => {
                  setSelectedCategoria(isCatSelected ? 'Todas as Categorias' : catName);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-all border ${
                  isCatSelected
                    ? 'bg-[#835400] text-white border-[#835400] shadow-xs'
                    : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                }`}
              >
                {catName}
              </button>
            );
          })}
        </div>

        {/* Collapsible Advanced Filters Area */}
        {showAdvancedFilters && (
          <div className="pt-3 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 animate-in fade-in duration-150">
            {/* Categoria Completa */}
            <div className="flex flex-col gap-1 min-w-0">
              <label className="text-xs font-bold text-[#010102]">Categoria</label>
              <select
                value={selectedCategoria}
                onChange={(e) => {
                  setSelectedCategoria(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full p-2 rounded-xl border border-[#DEE2E6] text-xs text-[#010102] bg-white focus:border-[#835400] focus:ring-1 focus:ring-[#835400]/20 focus:outline-none truncate"
              >
                <option>Todas as Categorias</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.nome}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </div>

            {/* Responsável */}
            <div className="flex flex-col gap-1 min-w-0">
              <label className="text-xs font-bold text-[#010102]">Responsável</label>
              <select
                value={selectedResponsavel}
                onChange={(e) => {
                  setSelectedResponsavel(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full p-2 rounded-xl border border-[#DEE2E6] text-xs text-[#010102] bg-white focus:border-[#835400] focus:ring-1 focus:ring-[#835400]/20 focus:outline-none truncate"
              >
                <option>Todos os Responsáveis</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.nome}>
                    {e.nome}
                  </option>
                ))}
              </select>
            </div>

            {/* Data Inicial */}
            <div className="flex flex-col gap-1 min-w-0">
              <label className="text-xs font-bold text-[#010102]">Data Inicial</label>
              <input
                type="date"
                value={dataInicio}
                onChange={(e) => {
                  setDataInicio(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full p-2 rounded-xl border border-[#DEE2E6] text-xs text-[#010102] bg-white focus:border-[#835400] focus:outline-none"
              />
            </div>

            {/* Data Final */}
            <div className="flex flex-col gap-1 min-w-0">
              <label className="text-xs font-bold text-[#010102]">Data Final</label>
              <input
                type="date"
                value={dataFim}
                onChange={(e) => {
                  setDataFim(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full p-2 rounded-xl border border-[#DEE2E6] text-xs text-[#010102] bg-white focus:border-[#835400] focus:outline-none"
              />
            </div>
          </div>
        )}

        {(localSearch ||
          selectedCategoria !== 'Todas as Categorias' ||
          selectedResponsavel !== 'Todos os Responsáveis' ||
          selectedTipo !== 'todos' ||
          dataInicio ||
          dataFim) && (
          <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs text-gray-500">
            <span>Filtros ativos aplicados</span>
            <button
              onClick={handleResetFilters}
              className="text-[#835400] hover:underline font-bold cursor-pointer"
            >
              Limpar todos os filtros
            </button>
          </div>
        )}
      </div>

      {/* Duplication Warning Banner if duplicates are detected */}
      {duplicateCount > 0 && (
        <div className="bg-amber-50 border border-amber-300 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-900 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-200/70 border border-amber-300 flex items-center justify-center text-[#835400] shrink-0">
              <span className="material-symbols-outlined text-[22px]">content_copy</span>
            </div>
            <div>
              <span className="font-bold text-sm block">
                Atenção: {duplicateCount} {duplicateCount === 1 ? 'lançamento potencialmente duplicado identificado' : 'lançamentos potencialmente duplicados identificados'}
              </span>
              <span className="text-xs text-amber-800">
                Lançamentos idênticos gerados por reaberturas ou cliques repetidos. Você pode unificá-los com segurança.
              </span>
            </div>
          </div>
          <Button
            variant="primary"
            size="sm"
            icon="auto_fix_high"
            className="shrink-0 bg-[#835400] hover:bg-[#6b4400] text-white border-none"
            onClick={() => deduplicateTransactions()}
          >
            Limpar Duplicados Agora
          </Button>
        </div>
      )}

      {/* Data Table Card */}
      <div className="bg-white rounded-2xl border border-[#DEE2E6] overflow-hidden flex flex-col shadow-xs min-w-0">
        {paginatedTransactions.length === 0 ? (
          <EmptyState
            icon="receipt_long"
            title="Nenhum lançamento encontrado"
            description="Não encontramos lançamentos correspondentes aos critérios de busca ou filtros ativos."
            actionLabel="Cadastrar Novo Lançamento"
            actionIcon="add"
            onAction={() => openNovoLancamentoWithTab('saida')}
          />
        ) : (
          <>
            {/* Desktop / Tablet View: Fluid Table with clean text wrapping */}
            <div className="hidden md:block w-full overflow-x-auto scrollbar-thin">
              <table className="w-full text-left border-collapse min-w-[880px]">
                <thead className="bg-gray-50/80 border-b border-[#DEE2E6] text-xs font-bold text-gray-500">
                  <tr>
                    <th className="py-3 px-3 w-24 whitespace-nowrap">Data</th>
                    <th className="py-3 px-2 w-24 text-center whitespace-nowrap">Tipo</th>
                    <th className="py-3 px-3 min-w-[180px] max-w-[280px]">Descrição / Favorecido</th>
                    <th className="py-3 px-3 min-w-[130px] max-w-[190px]">Categoria</th>
                    <th className="py-3 px-3 min-w-[110px] max-w-[160px] hidden lg:table-cell">Responsável</th>
                    <th className="py-3 px-3 min-w-[110px] max-w-[160px] hidden xl:table-cell">Pagamento</th>
                    <th className="py-3 px-3 w-32 text-right whitespace-nowrap">Valor</th>
                    <th className="py-3 px-2 w-28 text-center whitespace-nowrap">Ações</th>
                  </tr>
                </thead>
                <tbody className="text-xs divide-y divide-[#DEE2E6]">
                  {paginatedTransactions.map((tx) => (
                    <tr
                      key={tx.id}
                      className="hover:bg-gray-50/80 transition-colors cursor-pointer group"
                      onClick={() => setSelectedTxForDetail(tx)}
                    >
                      <td className="py-3 px-3 whitespace-nowrap text-gray-500 font-mono text-[11px]">
                        {tx.data}
                      </td>
                      <td className="py-3 px-2 text-center whitespace-nowrap">
                        <StatusBadge status={tx.tipo} size="xs" />
                      </td>
                      <td className="py-3 px-3 min-w-[180px] max-w-[280px]">
                        <div className="font-bold text-[#010102] break-words leading-tight" title={tx.descricao}>
                          {tx.descricao}
                        </div>
                        {tx.clienteFornecedor && (
                          <div
                            className="text-[11px] text-gray-500 font-normal break-words leading-tight mt-0.5"
                            title={tx.clienteFornecedor}
                          >
                            {tx.clienteFornecedor}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 min-w-[130px] max-w-[190px]">
                        <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-700 text-[10px] font-bold uppercase tracking-wider border border-gray-200 inline-block break-words leading-tight">
                          {tx.categoria}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-gray-600 font-medium break-words leading-tight hidden lg:table-cell" title={tx.responsavel}>
                        {tx.responsavel}
                      </td>
                      <td className="py-3 px-3 text-gray-500 text-[11px] break-words leading-tight hidden xl:table-cell" title={tx.formaPagamento}>
                        {tx.formaPagamento}
                      </td>
                      <td
                        className={`py-3 px-3 text-right font-extrabold whitespace-nowrap tabular-nums ${
                          tx.tipo === 'entrada' ? 'text-[#2F9E44]' : 'text-[#E03131]'
                        }`}
                      >
                        {tx.tipo === 'entrada' ? '+' : '-'} {formatCurrency(tx.valor)}
                      </td>
                      <td
                        className="py-3 px-2 text-center whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="xs"
                            icon="visibility"
                            title="Ver detalhes"
                            onClick={() => setSelectedTxForDetail(tx)}
                          />
                          <Button
                            variant="ghost"
                            size="xs"
                            icon="edit"
                            className="text-gray-500 hover:text-[#835400] hover:bg-amber-50"
                            title="Editar lançamento"
                            onClick={() => openEditLancamento(tx)}
                          />
                          <Button
                            variant="ghost"
                            size="xs"
                            icon="delete"
                            className="text-gray-400 hover:text-red-600 hover:bg-red-50"
                            title="Excluir lançamento"
                            onClick={() => setTxToDelete(tx)}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile / Compact View: Adaptive Card Rows with zero horizontal drag & swipe-actions */}
            <div className="md:hidden divide-y divide-gray-100">
              <div className="bg-amber-50/60 px-4 py-1.5 border-b border-amber-100 text-[10px] text-amber-800 flex items-center justify-between">
                <span className="flex items-center gap-1 font-medium">
                  <span className="material-symbols-outlined text-[13px]">swipe_left</span>
                  Deslize o item para a esquerda para ações rápidas
                </span>
                <span className="text-[9px] font-mono text-amber-600 font-bold uppercase tracking-wider">Touch</span>
              </div>

              {paginatedTransactions.map((tx) => (
                <SwipeableRow
                  key={tx.id}
                  onClick={() => setSelectedTxForDetail(tx)}
                  actions={[
                    {
                      label: 'Detalhes',
                      icon: 'visibility',
                      colorClass: 'bg-gray-800 text-white',
                      onClick: () => setSelectedTxForDetail(tx),
                    },
                    {
                      label: 'Editar',
                      icon: 'edit',
                      colorClass: 'bg-[#835400] text-white',
                      onClick: () => openEditLancamento(tx),
                    },
                    {
                      label: 'Excluir',
                      icon: 'delete',
                      colorClass: 'bg-red-600 text-white',
                      onClick: () => setTxToDelete(tx),
                    },
                  ]}
                >
                  <div className="p-4 flex flex-col gap-2 hover:bg-gray-50/80 active:bg-gray-100 transition-colors cursor-pointer">
                    {/* Top: StatusBadge + Data + Valor */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={tx.tipo} size="xs" />
                        <span className="text-[11px] text-gray-500 font-mono">{tx.data}</span>
                      </div>
                      <span
                        className={`text-sm font-black whitespace-nowrap tabular-nums ${
                          tx.tipo === 'entrada' ? 'text-[#2F9E44]' : 'text-[#E03131]'
                        }`}
                      >
                        {tx.tipo === 'entrada' ? '+' : '-'} {formatCurrency(tx.valor)}
                      </span>
                    </div>

                    {/* Middle: Descrição + Favorecido */}
                    <div>
                      <h4 className="text-xs font-bold text-[#010102] leading-snug break-words">
                        {tx.descricao}
                      </h4>
                      {tx.clienteFornecedor && (
                        <p className="text-[11px] text-gray-600 mt-0.5 flex items-center gap-1 break-words">
                          <span className="material-symbols-outlined text-[13px] text-gray-400 shrink-0">person</span>
                          <span>{tx.clienteFornecedor}</span>
                        </p>
                      )}
                    </div>

                    {/* Bottom: Categoria + Pagamento + Actions */}
                    <div className="flex items-center justify-between pt-1 border-t border-gray-100 gap-2 mt-1">
                      <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                        <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-700 text-[10px] font-bold uppercase tracking-wider border border-gray-200">
                          {tx.categoria}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {tx.formaPagamento}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="xs"
                          icon="visibility"
                          title="Ver detalhes"
                          onClick={() => setSelectedTxForDetail(tx)}
                        />
                        <Button
                          variant="ghost"
                          size="xs"
                          icon="edit"
                          className="text-gray-500 hover:text-[#835400] hover:bg-amber-50"
                          title="Editar lançamento"
                          onClick={() => openEditLancamento(tx)}
                        />
                        <Button
                          variant="ghost"
                          size="xs"
                          icon="delete"
                          className="text-gray-400 hover:text-red-600 hover:bg-red-50"
                          title="Excluir lançamento"
                          onClick={() => setTxToDelete(tx)}
                        />
                      </div>
                    </div>
                  </div>
                </SwipeableRow>
              ))}
            </div>
          </>
        )}

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredTransactions.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Transaction Detail Modal */}
      {selectedTxForDetail && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedTxForDetail(null)}
          title={
            <div className="flex items-center gap-2">
              <StatusBadge status={selectedTxForDetail.tipo} />
              <span className="truncate">{selectedTxForDetail.descricao}</span>
            </div>
          }
          subtitle={`Código: #${selectedTxForDetail.id.slice(0, 8)} • Lançado em ${selectedTxForDetail.data}`}
          size="md"
          footer={
            <>
              <Button
                variant="outline"
                size="sm"
                icon="print"
                onClick={() => window.print()}
                title="Imprimir comprovante contábil deste lançamento"
              >
                Imprimir Recibo (PDF)
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon="edit"
                className="bg-[#835400] hover:bg-[#6b4400] text-white border-none"
                onClick={() => {
                  const tx = selectedTxForDetail;
                  setSelectedTxForDetail(null);
                  openEditLancamento(tx);
                }}
              >
                Editar Lançamento
              </Button>
              <Button
                variant="danger"
                size="sm"
                icon="delete"
                onClick={() => setTxToDelete(selectedTxForDetail)}
              >
                Excluir
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelectedTxForDetail(null)}
              >
                Fechar
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            {/* Amount Banner */}
            <div
              className={`p-4 rounded-xl border flex items-center justify-between ${
                selectedTxForDetail.tipo === 'entrada'
                  ? 'bg-emerald-50 border-emerald-200'
                  : 'bg-red-50 border-red-200'
              }`}
            >
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-gray-600 block">
                  Valor Movimentado
                </span>
                <span
                  className={`text-2xl font-black tabular-nums ${
                    selectedTxForDetail.tipo === 'entrada' ? 'text-[#2F9E44]' : 'text-[#E03131]'
                  }`}
                >
                  {selectedTxForDetail.tipo === 'entrada' ? '+' : '-'} {formatCurrency(selectedTxForDetail.valor)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs text-gray-500 block">Forma de Pagamento</span>
                <span className="text-xs font-bold text-[#010102]">{selectedTxForDetail.formaPagamento}</span>
              </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-gray-50 p-4 rounded-xl border border-gray-200">
              <div>
                <span className="text-gray-500 block font-medium">Categoria Contábil</span>
                <span className="font-bold text-[#010102]">{selectedTxForDetail.categoria}</span>
              </div>

              <div>
                <span className="text-gray-500 block font-medium">Responsável / Operador</span>
                <span className="font-bold text-[#010102]">{selectedTxForDetail.responsavel}</span>
              </div>

              <div>
                <span className="text-gray-500 block font-medium">Favorecido / Fornecedor</span>
                <span className="font-bold text-[#010102]">{selectedTxForDetail.clienteFornecedor || 'Não informado'}</span>
              </div>

              <div>
                <span className="text-gray-500 block font-medium">Conta Financeira</span>
                <span className="font-bold text-[#010102]">{selectedTxForDetail.contaFinanceira || 'Caixa Principal Usina'}</span>
              </div>
            </div>

            {selectedTxForDetail.observacao && (
              <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200 text-xs">
                <span className="font-bold text-amber-900 block mb-0.5">Observações Operacionais:</span>
                <p className="text-amber-800 leading-relaxed">{selectedTxForDetail.observacao}</p>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Confirmation Modal for deletion */}
      <ConfirmModal
        isOpen={!!txToDelete}
        onClose={() => setTxToDelete(null)}
        onConfirm={() => {
          if (txToDelete) {
            deleteTransaction(txToDelete.id);
            if (selectedTxForDetail?.id === txToDelete.id) {
              setSelectedTxForDetail(null);
            }
            setTxToDelete(null);
          }
        }}
        title="Excluir Lançamento Contábil"
        message="Tem certeza de que deseja excluir este lançamento? Esta ação recalcula automaticamente o saldo de caixa, relatórios de DRE e histórico contábil."
        confirmText="Sim, Excluir Lançamento"
        cancelText="Cancelar"
        variant="danger"
        icon="delete"
        itemDetails={
          txToDelete
            ? [
                { label: 'Descrição', value: txToDelete.descricao },
                {
                  label: 'Tipo',
                  value: txToDelete.tipo === 'entrada' ? 'Entrada / Receita (+)' : 'Saída / Despesa (-)',
                },
                { label: 'Valor', value: formatCurrency(txToDelete.valor) },
                { label: 'Data', value: txToDelete.data },
                { label: 'Categoria', value: txToDelete.categoria },
                ...(txToDelete.clienteFornecedor
                  ? [{ label: 'Favorecido', value: txToDelete.clienteFornecedor }]
                  : []),
              ]
            : []
        }
      />

      {/* Import Modal */}
      <ImportDataModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        entityType="transacoes"
      />
    </div>
  );
};
