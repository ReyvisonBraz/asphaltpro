import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../utils/formatters';
import { Transaction } from '../../types';
import {
  Button,
  StatCard,
  StatusBadge,
  Pagination,
  EmptyState,
  Modal,
} from '../common';

export const LancamentosView: React.FC = () => {
  const {
    transactions,
    deleteTransaction,
    openNovoLancamentoWithTab,
    categories,
    employees,
    globalSearch,
    showToast,
    permissions,
  } = useApp();

  // Filters
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState('Todas as Categorias');
  const [selectedResponsavel, setSelectedResponsavel] = useState('Todos os Responsáveis');
  const [selectedTipo, setSelectedTipo] = useState<'todos' | 'entrada' | 'saida'>('todos');
  const [localSearch, setLocalSearch] = useState('');
  const [selectedTxForDetail, setSelectedTxForDetail] = useState<Transaction | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
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

      return matchGlobal && matchLocal && matchCat && matchResp && matchTipo;
    });
  }, [
    transactions,
    globalSearch,
    localSearch,
    selectedCategoria,
    selectedResponsavel,
    selectedTipo,
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
    const headers = ['Data', 'Tipo', 'Descrição', 'Categoria', 'Responsável', 'Forma de Pagamento', 'Valor'];
    const rows = filteredTransactions.map((t) => [
      t.data,
      t.tipo.toUpperCase(),
      `"${t.descricao}"`,
      `"${t.categoria}"`,
      `"${t.responsavel}"`,
      `"${t.formaPagamento}"`,
      t.valor,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(';'), ...rows.map((e) => e.join(';'))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `lancamentos_asphaltpro_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
    <div className="flex-1 p-6 lg:p-10 max-w-[1440px] mx-auto w-full flex flex-col gap-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
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
            variant="secondary"
            icon="download"
            size="sm"
            onClick={handleExportCSV}
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

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#DEE2E6] shadow-xs flex flex-col gap-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 items-end">
          {/* Tipo */}
          <div className="flex flex-col gap-1 min-w-0">
            <label className="text-xs font-bold text-[#010102]">Tipo</label>
            <select
              value={selectedTipo}
              onChange={(e) => {
                setSelectedTipo(e.target.value as any);
                setCurrentPage(1);
              }}
              className="w-full p-2 rounded-xl border border-[#DEE2E6] text-xs text-[#010102] bg-white focus:border-[#835400] focus:ring-1 focus:ring-[#835400]/20 focus:outline-none"
            >
              <option value="todos">Todos os Tipos</option>
              <option value="entrada">Apenas Entradas</option>
              <option value="saida">Apenas Saídas</option>
            </select>
          </div>

          {/* Categoria */}
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

          {/* Busca Texto */}
          <div className="flex flex-col gap-1 min-w-0 sm:col-span-2 md:col-span-3 lg:col-span-2">
            <label className="text-xs font-bold text-[#010102]">Buscar Descrição / Fornecedor</label>
            <div className="relative w-full flex items-center">
              <span className="material-symbols-outlined absolute left-3 text-gray-400 text-[18px] pointer-events-none">
                search
              </span>
              <input
                type="text"
                value={localSearch}
                onChange={(e) => {
                  setLocalSearch(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Ex: CBUQ, CAP 50/70, Petrobras..."
                className="w-full pl-9 pr-8 py-2 rounded-xl border border-[#DEE2E6] text-xs text-[#010102] bg-white focus:border-[#835400] focus:ring-1 focus:ring-[#835400]/20 focus:outline-none"
              />
              {localSearch && (
                <button
                  type="button"
                  onClick={() => setLocalSearch('')}
                  className="absolute right-3 text-xs text-gray-400 hover:text-black"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {(localSearch ||
          selectedCategoria !== 'Todas as Categorias' ||
          selectedResponsavel !== 'Todos os Responsáveis' ||
          selectedTipo !== 'todos') && (
          <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs text-gray-500">
            <span>Filtros ativos aplicados</span>
            <button
              onClick={handleResetFilters}
              className="text-[#835400] hover:underline font-bold"
            >
              Limpar todos os filtros
            </button>
          </div>
        )}
      </div>

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
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse min-w-[760px]">
              <thead className="bg-gray-50/80 border-b border-[#DEE2E6] text-xs font-bold text-gray-500">
                <tr>
                  <th className="py-3 px-4 whitespace-nowrap">Data</th>
                  <th className="py-3 px-4 whitespace-nowrap">Tipo</th>
                  <th className="py-3 px-4">Descrição / Favorecido</th>
                  <th className="py-3 px-4 whitespace-nowrap">Categoria</th>
                  <th className="py-3 px-4 whitespace-nowrap">Responsável</th>
                  <th className="py-3 px-4 whitespace-nowrap">Pagamento</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">Valor</th>
                  <th className="py-3 px-4 text-center whitespace-nowrap">Ações</th>
                </tr>
              </thead>
              <tbody className="text-xs divide-y divide-[#DEE2E6]">
                {paginatedTransactions.map((tx) => (
                  <tr
                    key={tx.id}
                    className="hover:bg-gray-50/80 transition-colors cursor-pointer group"
                    onClick={() => setSelectedTxForDetail(tx)}
                  >
                    <td className="py-3 px-4 whitespace-nowrap text-gray-500 font-mono text-[11px]">
                      {tx.data}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <StatusBadge status={tx.tipo} size="xs" />
                    </td>
                    <td className="py-3 px-4 font-bold text-[#010102] max-w-[220px]">
                      <div className="truncate" title={tx.descricao}>
                        {tx.descricao}
                      </div>
                      {tx.clienteFornecedor && (
                        <div
                          className="text-[11px] text-gray-500 font-normal truncate"
                          title={tx.clienteFornecedor}
                        >
                          {tx.clienteFornecedor}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-700 text-[10px] font-bold uppercase tracking-wider border border-gray-200 inline-block truncate max-w-[130px]">
                        {tx.categoria}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-gray-600 font-medium">
                      {tx.responsavel}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-gray-500 text-[11px]">
                      {tx.formaPagamento}
                    </td>
                    <td
                      className={`py-3 px-4 text-right font-extrabold whitespace-nowrap tabular-nums ${
                        tx.tipo === 'entrada' ? 'text-[#2F9E44]' : 'text-[#E03131]'
                      }`}
                    >
                      {tx.tipo === 'entrada' ? '+' : '-'} {formatCurrency(tx.valor)}
                    </td>
                    <td
                      className="py-3 px-4 text-center whitespace-nowrap"
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
                          icon="delete"
                          className="text-gray-400 hover:text-red-600 hover:bg-red-50"
                          title="Excluir lançamento"
                          onClick={() => {
                            if (confirm(`Excluir lançamento "${tx.descricao}" no valor de ${formatCurrency(tx.valor)}?`)) {
                              deleteTransaction(tx.id);
                            }
                          }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
                variant="danger"
                size="sm"
                icon="delete"
                onClick={() => {
                  if (confirm('Deseja excluir este lançamento? O saldo em caixa será recalculado.')) {
                    deleteTransaction(selectedTxForDetail.id);
                    setSelectedTxForDetail(null);
                  }
                }}
              >
                Excluir Lançamento
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
    </div>
  );
};
