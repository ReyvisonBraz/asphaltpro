import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, parseAnyDateToTimestamp } from '../../utils/formatters';
import { exportTransactionsCsv } from '../../utils/exportUtils';
import { Transaction, Category } from '../../types';
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
  const [showResponsavelCol, setShowResponsavelCol] = useState<boolean>(() => {
    return localStorage.getItem('asphalt_show_responsavel_col') === 'true';
  });
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  const toggleShowResponsavelCol = () => {
    setShowResponsavelCol((prev) => {
      const next = !prev;
      localStorage.setItem('asphalt_show_responsavel_col', String(next));
      return next;
    });
  };

  const [selectedTxForDetail, setSelectedTxForDetail] = useState<Transaction | null>(null);
  const [txToDelete, setTxToDelete] = useState<Transaction | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Quick Category Filter Chips Customization State
  const [pinnedCategories, setPinnedCategories] = useState<string[]>(() => {
    const saved = localStorage.getItem('asphalt_pinned_filter_categories');
    if (saved !== null) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch {}
    }
    return [
      'Frete',
      'Venda de Asfalto (CBUQ)',
      'Insumos / Matéria Prima',
      'Combustível / Diesel',
      'Folha de Pagamento',
    ];
  });

  const [isCustomizeChipsOpen, setIsCustomizeChipsOpen] = useState(false);
  const [tempSelectedChips, setTempSelectedChips] = useState<string[]>([]);
  const [customizeSearch, setCustomizeSearch] = useState('');

  // Sync temp list when opening customization modal
  useEffect(() => {
    if (isCustomizeChipsOpen) {
      setTempSelectedChips(pinnedCategories);
      setCustomizeSearch('');
    }
  }, [isCustomizeChipsOpen, pinnedCategories]);

  // Helper to get Category metadata (color, type, icon)
  const getCategoryMeta = (catNome: string) => {
    if (!catNome) return null;
    return categories.find((c) => c.nome.trim().toLowerCase() === catNome.trim().toLowerCase()) || null;
  };

  // Visible category chips in the filter bar (strictly respects user pinned choices)
  const visibleCategoryChips = useMemo(() => {
    const categoryMap = new Map(categories.map((c) => [c.nome.trim().toLowerCase(), c]));
    const namesSet = new Set<string>();
    const list: Category[] = [];

    // 1. Add strictly the categories pinned by the user
    pinnedCategories.forEach((name) => {
      const lower = name.trim().toLowerCase();
      if (!namesSet.has(lower) && categoryMap.has(lower)) {
        list.push(categoryMap.get(lower)!);
        namesSet.add(lower);
      }
    });

    // 2. If a category is currently active that isn't in the pinned list,
    // show it so the user can easily see it's active and click to deselect
    if (selectedCategoria !== 'Todas as Categorias') {
      const lower = selectedCategoria.trim().toLowerCase();
      if (!namesSet.has(lower)) {
        const cat = categoryMap.get(lower) || {
          id: `temp-${lower}`,
          nome: selectedCategoria,
          tipo: 'despesa' as const,
          cor: '#835400',
        };
        list.unshift(cat);
        namesSet.add(lower);
      }
    }

    // Filter by selectedTipo if user selected "Entradas" or "Saídas"
    if (selectedTipo === 'entrada') {
      return list.filter((c) => c.tipo === 'receita');
    }
    if (selectedTipo === 'saida') {
      return list.filter((c) => c.tipo === 'despesa');
    }
    return list;
  }, [categories, pinnedCategories, selectedTipo, selectedCategoria]);

  const handleToggleCategoryChip = (catName: string) => {
    if (selectedCategoria.trim().toLowerCase() === catName.trim().toLowerCase()) {
      setSelectedCategoria('Todas as Categorias');
    } else {
      setSelectedCategoria(catName);
      const found = categories.find(
        (c) => c.nome.trim().toLowerCase() === catName.trim().toLowerCase()
      );
      if (found) {
        if (found.tipo === 'despesa' && selectedTipo === 'entrada') {
          setSelectedTipo('saida');
        } else if (found.tipo === 'receita' && selectedTipo === 'saida') {
          setSelectedTipo('entrada');
        }
      }
    }
    setCurrentPage(1);
  };

  const handleSaveCustomizedChips = () => {
    setPinnedCategories(tempSelectedChips);
    localStorage.setItem('asphalt_pinned_filter_categories', JSON.stringify(tempSelectedChips));
    setIsCustomizeChipsOpen(false);
    showToast('Atalhos de categorias atualizados com sucesso!', 'success');
  };

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Helper to parse date format (DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD) into timestamp
  const parseDateToTimestamp = (dateStr: string, isEndOfDay = false) => {
    return parseAnyDateToTimestamp(dateStr, isEndOfDay);
  };

  const getTransactionCreatedTimestamp = (tx: Transaction) => {
    if (tx.createdAt) {
      const t = Date.parse(tx.createdAt);
      if (!isNaN(t)) return t;
    }
    const match = tx.id?.match(/tx-(\d+)/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num)) return num;
    }
    return 0;
  };

  // Filtered and sorted transactions (most recent first by default)
  const filteredTransactions = useMemo(() => {
    const startTime = dataInicio ? parseDateToTimestamp(dataInicio, false) : null;
    const endTime = dataFim ? parseDateToTimestamp(dataFim, true) : null;

    const filtered = transactions.filter((tx) => {
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
        (Boolean(tx.categoria) && tx.categoria.trim().toLowerCase() === selectedCategoria.trim().toLowerCase());

      const matchResp =
        selectedResponsavel === 'Todos os Responsáveis' ||
        tx.responsavel.toLowerCase().includes(selectedResponsavel.toLowerCase());

      const matchTipo = selectedTipo === 'todos' || tx.tipo === selectedTipo;

      const txTime = parseDateToTimestamp(tx.data, false);
      const matchDate =
        (!startTime || (txTime !== null && txTime >= startTime)) &&
        (!endTime || (txTime !== null && txTime <= endTime));

      return matchGlobal && matchLocal && matchCat && matchResp && matchTipo && matchDate;
    });

    // Invert to show most recent transactions at the top by default (or user selected order)
    return filtered.sort((a, b) => {
      const timeA = parseDateToTimestamp(a.data, false) || 0;
      const timeB = parseDateToTimestamp(b.data, false) || 0;

      if (timeA !== timeB) {
        return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
      }

      // Tie breaker for same day: most recently recorded comes first
      const createA = getTransactionCreatedTimestamp(a);
      const createB = getTransactionCreatedTimestamp(b);
      return sortOrder === 'desc' ? createB - createA : createA - createB;
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
    sortOrder,
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

      {/* Filter Bar with Segmented Controls & Quick Category Shortcuts */}
      <div className="bg-white p-3 sm:p-3.5 rounded-2xl border border-gray-200 shadow-2xs flex flex-col gap-2.5">
        {/* Row 1: Search Input + Segmented Tipo + Advanced Filters Button */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Search Bar */}
          <div className="relative flex-1 min-w-0">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[18px] pointer-events-none">
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
              className="w-full pl-9 pr-8 py-1.5 text-xs rounded-xl border border-gray-200 text-gray-900 bg-gray-50/60 hover:bg-white focus:bg-white focus:border-[#835400] focus:ring-1 focus:ring-[#835400]/20 focus:outline-none transition-all"
            />
            {localSearch && (
              <button
                type="button"
                onClick={() => {
                  setLocalSearch('');
                  setCurrentPage(1);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 text-xs p-1"
                title="Limpar busca"
              >
                ✕
              </button>
            )}
          </div>

          {/* Controls: Segmented Tipo & Advanced Filters */}
          <div className="flex items-center gap-2 justify-between sm:justify-end shrink-0">
            {/* Segmented Control for Tipo: Todos | Entradas | Saídas */}
            <div className="inline-flex p-0.5 bg-gray-100 rounded-xl border border-gray-200/80 text-xs font-semibold select-none flex-1 sm:flex-initial">
              <button
                type="button"
                onClick={() => {
                  setSelectedTipo('todos');
                  setCurrentPage(1);
                }}
                className={`flex-1 sm:flex-initial px-3 py-1 rounded-lg transition-all text-xs cursor-pointer text-center ${
                  selectedTipo === 'todos'
                    ? 'bg-white text-gray-900 shadow-2xs font-bold'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                Todos
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedTipo('entrada');
                  setCurrentPage(1);
                }}
                className={`flex-1 sm:flex-initial px-3 py-1 rounded-lg transition-all text-xs flex items-center justify-center gap-1.5 cursor-pointer ${
                  selectedTipo === 'entrada'
                    ? 'bg-emerald-600 text-white shadow-2xs font-bold'
                    : 'text-gray-500 hover:text-emerald-700'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                Entradas
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedTipo('saida');
                  setCurrentPage(1);
                }}
                className={`flex-1 sm:flex-initial px-3 py-1 rounded-lg transition-all text-xs flex items-center justify-center gap-1.5 cursor-pointer ${
                  selectedTipo === 'saida'
                    ? 'bg-red-600 text-white shadow-2xs font-bold'
                    : 'text-gray-500 hover:text-red-700'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                Saídas
              </button>
            </div>

            {/* Toggle Advanced Filters */}
            <button
              type="button"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-xl border transition-all flex items-center gap-1 shrink-0 select-none cursor-pointer h-7.5 ${
                showAdvancedFilters ||
                selectedCategoria !== 'Todas as Categorias' ||
                selectedResponsavel !== 'Todos os Responsáveis' ||
                dataInicio ||
                dataFim
                  ? 'bg-[#835400] text-white border-[#835400] shadow-xs'
                  : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200'
              }`}
              title="Filtros avançados (Datas e Responsável)"
            >
              <span className="material-symbols-outlined text-[15px]">tune</span>
              <span className="hidden md:inline">Filtros</span>
              {(selectedResponsavel !== 'Todos os Responsáveis' || dataInicio || dataFim) && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-300" />
              )}
            </button>
          </div>
        </div>

        {/* Row 2: Category Selector Dropdown & Pinned Shortcut Chips */}
        <div className="flex items-center gap-2 pt-2 border-t border-gray-100 flex-wrap sm:flex-nowrap">
          {/* Quick Category Selector Dropdown */}
          <div className="relative shrink-0 flex items-center">
            <select
              value={selectedCategoria}
              onChange={(e) => {
                setSelectedCategoria(e.target.value);
                const found = categories.find(
                  (c) => c.nome.trim().toLowerCase() === e.target.value.trim().toLowerCase()
                );
                if (found) {
                  if (found.tipo === 'despesa' && selectedTipo === 'entrada') {
                    setSelectedTipo('saida');
                  } else if (found.tipo === 'receita' && selectedTipo === 'saida') {
                    setSelectedTipo('entrada');
                  }
                }
                setCurrentPage(1);
              }}
              className={`pl-6 pr-6 py-1 text-xs font-semibold rounded-lg border transition-all cursor-pointer appearance-none bg-white focus:outline-none focus:ring-1 focus:ring-[#835400] ${
                selectedCategoria !== 'Todas as Categorias'
                  ? 'border-[#835400] text-[#835400] bg-[#FFF4E6]/70 font-bold'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
              title="Filtrar por qualquer categoria cadastrada no sistema"
            >
              <option value="Todas as Categorias">Todas as Categorias</option>
              <optgroup label="Despesas (Saídas)">
                {categories
                  .filter((c) => c.tipo === 'despesa')
                  .map((c) => (
                    <option key={c.id} value={c.nome}>
                      {c.nome}
                    </option>
                  ))}
              </optgroup>
              <optgroup label="Receitas (Entradas)">
                {categories
                  .filter((c) => c.tipo === 'receita')
                  .map((c) => (
                    <option key={c.id} value={c.nome}>
                      {c.nome}
                    </option>
                  ))}
              </optgroup>
            </select>
            <span className="material-symbols-outlined absolute left-1.5 text-gray-400 text-[14px] pointer-events-none">
              label
            </span>
            <span className="material-symbols-outlined absolute right-1.5 text-gray-400 text-[15px] pointer-events-none">
              expand_more
            </span>
          </div>

          {/* Dynamic Category Filter Chips (Pinned by user) */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 scrollbar-thin flex-1 min-w-0">
            {visibleCategoryChips.map((cat) => {
              const isCatSelected =
                selectedCategoria.trim().toLowerCase() === cat.nome.trim().toLowerCase();
              const dotColor =
                cat.cor || (cat.tipo === 'receita' ? '#2F9E44' : '#E03131');

              return (
                <button
                  key={cat.id || cat.nome}
                  type="button"
                  onClick={() => handleToggleCategoryChip(cat.nome)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg whitespace-nowrap transition-all border flex items-center gap-1.5 cursor-pointer shrink-0 ${
                    isCatSelected
                      ? 'bg-[#835400] text-white border-[#835400] shadow-2xs'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                  }`}
                  title={`Filtrar apenas por ${cat.nome}`}
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: isCatSelected ? '#FFFFFF' : dotColor }}
                  />
                  <span>{cat.nome}</span>
                  {isCatSelected && (
                    <span className="material-symbols-outlined text-[13px] ml-0.5 hover:text-red-200">
                      close
                    </span>
                  )}
                </button>
              );
            })}

            {/* Button to Customize which category shortcuts appear */}
            <button
              type="button"
              onClick={() => setIsCustomizeChipsOpen(true)}
              className="px-2 py-1 text-[11px] text-gray-500 hover:text-[#835400] hover:bg-[#FFF4E6] rounded-lg border border-dashed border-gray-300 hover:border-[#835400] whitespace-nowrap transition-all flex items-center gap-1 shrink-0 cursor-pointer"
              title="Escolher quais categorias exibir como atalhos rápidos"
            >
              <span className="material-symbols-outlined text-[14px]">tune</span>
              <span>Atalhos</span>
            </button>
          </div>

          {/* Quick Clear Filter Button when category is active */}
          {selectedCategoria !== 'Todas as Categorias' && (
            <button
              type="button"
              onClick={() => {
                setSelectedCategoria('Todas as Categorias');
                setCurrentPage(1);
              }}
              className="text-xs text-red-600 hover:text-red-800 font-semibold px-2 py-1 rounded hover:bg-red-50 flex items-center gap-1 shrink-0 cursor-pointer transition-colors"
              title="Limpar filtro de categoria"
            >
              <span className="material-symbols-outlined text-[14px]">close</span>
              <span className="hidden sm:inline">Limpar</span>
            </button>
          )}
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
            {/* Table Sub-header with count and column visibility options */}
            <div className="px-4 py-2 bg-gray-50/70 border-b border-gray-100 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
              <span className="font-medium text-[11px]">
                Exibindo <strong className="text-gray-900">{paginatedTransactions.length}</strong> de {filteredTransactions.length} lançamento{filteredTransactions.length !== 1 ? 's' : ''}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'));
                    setCurrentPage(1);
                  }}
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer select-none ${
                    sortOrder === 'desc'
                      ? 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
                      : 'bg-blue-50 text-blue-900 border-blue-200 hover:bg-blue-100'
                  }`}
                  title="Clique para inverter a ordem cronológica dos lançamentos"
                >
                  <span className="material-symbols-outlined text-[15px]">
                    {sortOrder === 'desc' ? 'arrow_downward' : 'arrow_upward'}
                  </span>
                  <span>{sortOrder === 'desc' ? 'Mais recentes primeiro' : 'Mais antigos primeiro'}</span>
                </button>

                <button
                  type="button"
                  onClick={toggleShowResponsavelCol}
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer select-none ${
                    showResponsavelCol
                      ? 'bg-[#835400] text-white border-[#835400] shadow-2xs'
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'
                  }`}
                  title="Alternar exibição da coluna Responsável na listagem principal"
                >
                  <span className="material-symbols-outlined text-[14px]">
                    {showResponsavelCol ? 'visibility_off' : 'visibility'}
                  </span>
                  <span>{showResponsavelCol ? 'Ocultar Responsável' : 'Exibir Coluna Responsável'}</span>
                </button>
              </div>
            </div>

            {/* Desktop / Tablet View: Fluid Table with clean text wrapping */}
            <div className="hidden md:block w-full overflow-x-auto scrollbar-thin">
              <table className="w-full text-left border-collapse min-w-[880px]">
                <thead className="bg-gray-50/80 border-b border-[#DEE2E6] text-xs font-bold text-gray-500">
                  <tr>
                    <th
                      onClick={() => {
                        setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'));
                        setCurrentPage(1);
                      }}
                      className="py-3 px-3 w-28 whitespace-nowrap cursor-pointer hover:bg-gray-100 select-none group/th transition-colors"
                      title="Clique para alternar ordem das datas"
                    >
                      <div className="flex items-center gap-1 font-bold text-gray-700">
                        <span>Data</span>
                        <span className="material-symbols-outlined text-[15px] text-[#835400] group-hover/th:scale-110 transition-transform">
                          {sortOrder === 'desc' ? 'arrow_downward' : 'arrow_upward'}
                        </span>
                      </div>
                    </th>
                    <th className="py-3 px-2 w-24 text-center whitespace-nowrap">Tipo</th>
                    <th className="py-3 px-3 min-w-[180px] max-w-[280px]">Descrição / Favorecido</th>
                    <th className="py-3 px-3 min-w-[130px] max-w-[190px]">Categoria</th>
                    {showResponsavelCol && (
                      <th className="py-3 px-3 min-w-[120px] max-w-[170px] bg-amber-50/40 text-amber-900">
                        Responsável
                      </th>
                    )}
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
                        {(() => {
                          const catMeta = getCategoryMeta(tx.categoria);
                          const catColor = catMeta?.cor || (tx.tipo === 'entrada' ? '#2F9E44' : '#835400');
                          const isCatSelected =
                            selectedCategoria.trim().toLowerCase() === tx.categoria.trim().toLowerCase();

                          return (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleCategoryChip(tx.categoria);
                              }}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border inline-flex items-center gap-1.5 transition-all cursor-pointer select-none max-w-full truncate ${
                                isCatSelected
                                  ? 'bg-[#835400] text-white border-[#835400] shadow-2xs'
                                  : 'hover:opacity-85'
                              }`}
                              style={
                                isCatSelected
                                  ? undefined
                                  : {
                                      backgroundColor: `${catColor}14`,
                                      borderColor: `${catColor}35`,
                                      color: catColor,
                                    }
                              }
                              title={`Clique para filtrar apenas lançamentos de ${tx.categoria}`}
                            >
                              <span
                                className="w-1.5 h-1.5 rounded-full shrink-0"
                                style={{ backgroundColor: isCatSelected ? '#FFFFFF' : catColor }}
                              />
                              <span className="truncate">{tx.categoria}</span>
                            </button>
                          );
                        })()}
                      </td>
                      {showResponsavelCol && (
                        <td className="py-3 px-3 text-gray-700 font-medium break-words leading-tight bg-amber-50/20" title={tx.responsavel}>
                          {tx.responsavel}
                        </td>
                      )}
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
                        {(() => {
                          const catMeta = getCategoryMeta(tx.categoria);
                          const catColor = catMeta?.cor || (tx.tipo === 'entrada' ? '#2F9E44' : '#835400');
                          const isCatSelected =
                            selectedCategoria.trim().toLowerCase() === tx.categoria.trim().toLowerCase();

                          return (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleCategoryChip(tx.categoria);
                              }}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border inline-flex items-center gap-1.5 transition-all cursor-pointer select-none max-w-[150px] truncate ${
                                isCatSelected
                                  ? 'bg-[#835400] text-white border-[#835400] shadow-2xs'
                                  : 'hover:opacity-85'
                              }`}
                              style={
                                isCatSelected
                                  ? undefined
                                  : {
                                      backgroundColor: `${catColor}14`,
                                      borderColor: `${catColor}35`,
                                      color: catColor,
                                    }
                              }
                              title={`Filtrar por ${tx.categoria}`}
                            >
                              <span
                                className="w-1.5 h-1.5 rounded-full shrink-0"
                                style={{ backgroundColor: isCatSelected ? '#FFFFFF' : catColor }}
                              />
                              <span className="truncate">{tx.categoria}</span>
                            </button>
                          );
                        })()}
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
                <span className="text-gray-500 block font-medium">Registrado por (Login)</span>
                <span className="font-bold text-[#010102] flex items-center gap-1.5 mt-0.5">
                  <span className="material-symbols-outlined text-[16px] text-gray-400">account_circle</span>
                  {selectedTxForDetail.responsavel || 'Administrador'}
                </span>
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

      {/* Modal: Personalizar Atalhos de Categorias */}
      {isCustomizeChipsOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsCustomizeChipsOpen(false)}
          title={
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#835400]">tune</span>
              <span>Personalizar Atalhos de Categorias</span>
            </div>
          }
          subtitle="Escolha quais categorias contábeis devem ficar fixadas como botões rápidos na barra de filtros."
          size="lg"
          footer={
            <div className="flex items-center justify-between w-full gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => {
                    const defaultBase = [
                      'Venda de Asfalto (CBUQ)',
                      'Insumos / Matéria Prima',
                      'Combustível / Diesel',
                      'Folha de Pagamento',
                    ];
                    const customNames = categories
                      .filter(
                        (c) =>
                          !defaultBase.some(
                            (b) => b.trim().toLowerCase() === c.nome.trim().toLowerCase()
                          )
                      )
                      .map((c) => c.nome);
                    setTempSelectedChips([...defaultBase, ...customNames]);
                  }}
                  title="Restaurar lista sugerida padrão com categorias personalizadas"
                >
                  Restaurar Padrão
                </Button>
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => {
                    if (tempSelectedChips.length === categories.length) {
                      setTempSelectedChips([]);
                    } else {
                      setTempSelectedChips(categories.map((c) => c.nome));
                    }
                  }}
                >
                  {tempSelectedChips.length === categories.length ? 'Desmarcar Todas' : 'Marcar Todas'}
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsCustomizeChipsOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  className="bg-[#835400] hover:bg-[#6b4400] text-white border-none"
                  icon="check"
                  onClick={handleSaveCustomizedChips}
                >
                  Salvar Atalhos ({tempSelectedChips.length})
                </Button>
              </div>
            </div>
          }
        >
          <div className="space-y-4">
            {/* Search within categories */}
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]">
                search
              </span>
              <input
                type="text"
                placeholder="Pesquisar categoria por nome..."
                value={customizeSearch}
                onChange={(e) => setCustomizeSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#835400] bg-gray-50 focus:bg-white"
              />
            </div>

            {/* Quick stats info */}
            <div className="text-[11px] text-gray-500 flex items-center justify-between">
              <span>
                {tempSelectedChips.length} de {categories.length} categorias selecionadas como atalho rápido
              </span>
              <span className="text-gray-400 hidden sm:inline">
                Os atalhos aparecem horizontalmente abaixo da busca
              </span>
            </div>

            {/* Grouped lists: Despesas and Receitas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[380px] overflow-y-auto pr-1">
              {/* Despesas */}
              <div className="border border-red-100 rounded-xl p-3 bg-red-50/20">
                <div className="flex items-center justify-between mb-2.5 pb-1.5 border-b border-red-100">
                  <span className="text-xs font-bold text-red-900 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                    Despesas ({categories.filter((c) => c.tipo === 'despesa').length})
                  </span>
                </div>
                <div className="space-y-1.5">
                  {categories
                    .filter((c) => c.tipo === 'despesa')
                    .filter((c) =>
                      customizeSearch
                        ? c.nome.toLowerCase().includes(customizeSearch.toLowerCase())
                        : true
                    )
                    .map((cat) => {
                      const isChecked = tempSelectedChips.some(
                        (n) => n.trim().toLowerCase() === cat.nome.trim().toLowerCase()
                      );
                      const catColor = cat.cor || '#E03131';

                      return (
                        <label
                          key={cat.id || cat.nome}
                          className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition-all select-none ${
                            isChecked
                              ? 'bg-white border-amber-300 shadow-2xs'
                              : 'bg-white/60 border-transparent hover:bg-white hover:border-gray-200'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                if (isChecked) {
                                  setTempSelectedChips(
                                    tempSelectedChips.filter(
                                      (n) => n.trim().toLowerCase() !== cat.nome.trim().toLowerCase()
                                    )
                                  );
                                } else {
                                  setTempSelectedChips([...tempSelectedChips, cat.nome]);
                                }
                              }}
                              className="rounded border-gray-300 text-[#835400] focus:ring-[#835400] cursor-pointer"
                            />
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: catColor }}
                            />
                            <span className="font-semibold text-gray-800 truncate" title={cat.nome}>
                              {cat.nome}
                            </span>
                          </div>
                          {cat.icone && (
                            <span className="material-symbols-outlined text-[15px] text-gray-400 shrink-0 ml-2">
                              {cat.icone}
                            </span>
                          )}
                        </label>
                      );
                    })}
                </div>
              </div>

              {/* Receitas */}
              <div className="border border-emerald-100 rounded-xl p-3 bg-emerald-50/20">
                <div className="flex items-center justify-between mb-2.5 pb-1.5 border-b border-emerald-100">
                  <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    Receitas ({categories.filter((c) => c.tipo === 'receita').length})
                  </span>
                </div>
                <div className="space-y-1.5">
                  {categories
                    .filter((c) => c.tipo === 'receita')
                    .filter((c) =>
                      customizeSearch
                        ? c.nome.toLowerCase().includes(customizeSearch.toLowerCase())
                        : true
                    )
                    .map((cat) => {
                      const isChecked = tempSelectedChips.some(
                        (n) => n.trim().toLowerCase() === cat.nome.trim().toLowerCase()
                      );
                      const catColor = cat.cor || '#2F9E44';

                      return (
                        <label
                          key={cat.id || cat.nome}
                          className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition-all select-none ${
                            isChecked
                              ? 'bg-white border-amber-300 shadow-2xs'
                              : 'bg-white/60 border-transparent hover:bg-white hover:border-gray-200'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                if (isChecked) {
                                  setTempSelectedChips(
                                    tempSelectedChips.filter(
                                      (n) => n.trim().toLowerCase() !== cat.nome.trim().toLowerCase()
                                    )
                                  );
                                } else {
                                  setTempSelectedChips([...tempSelectedChips, cat.nome]);
                                }
                              }}
                              className="rounded border-gray-300 text-[#835400] focus:ring-[#835400] cursor-pointer"
                            />
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: catColor }}
                            />
                            <span className="font-semibold text-gray-800 truncate" title={cat.nome}>
                              {cat.nome}
                            </span>
                          </div>
                          {cat.icone && (
                            <span className="material-symbols-outlined text-[15px] text-gray-400 shrink-0 ml-2">
                              {cat.icone}
                            </span>
                          )}
                        </label>
                      );
                    })}
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
