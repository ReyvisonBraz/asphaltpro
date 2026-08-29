import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../utils/formatters';
import { AccountType, AccountStatus } from '../../types';
import {
  Button,
  StatCard,
  StatusBadge,
  Pagination,
  EmptyState,
  SwipeableRow,
} from '../common';

export const ContasView: React.FC = () => {
  const {
    accounts,
    toggleAccountPaidStatus,
    deleteAccount,
    setIsNovaContaOpen,
    globalSearch,
    contasVencendoSemana,
    contasEmAtraso,
    totalPendentePagar,
    totalPendenteReceber,
  } = useApp();

  const [activeTab, setActiveTab] = useState<AccountType>('pagar');
  const [selectedStatus, setSelectedStatus] = useState<'todos' | AccountStatus>('todos');
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const filteredAccounts = useMemo(() => {
    return accounts.filter((acc) => {
      if (acc.tipo !== activeTab) return false;
      if (selectedStatus !== 'todos' && acc.status !== selectedStatus) return false;

      const q = (globalSearch || searchTerm).toLowerCase();
      if (q) {
        return (
          acc.descricao.toLowerCase().includes(q) ||
          acc.fornecedorCliente.toLowerCase().includes(q) ||
          (acc.categoria && acc.categoria.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [accounts, activeTab, selectedStatus, globalSearch, searchTerm]);

  const totalPages = Math.ceil(filteredAccounts.length / itemsPerPage) || 1;
  const paginatedAccounts = filteredAccounts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1440px] mx-auto w-full flex flex-col gap-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#010102] tracking-tight">
            Contas a Pagar e Receber
          </h2>
          <p className="text-xs sm:text-sm text-[#46464A] mt-1">
            Controle de compromissos operacionais, compras de insumos, vencimentos e parcelamentos.
          </p>
        </div>

        <Button
          variant="primary"
          icon="add_card"
          onClick={() => setIsNovaContaOpen(true)}
        >
          Nova Conta / Título
        </Button>
      </div>

      {/* Primary Tabs */}
      <div className="flex flex-wrap border-b border-[#DEE2E6] gap-2 pb-0.5">
        <button
          onClick={() => {
            setActiveTab('pagar');
            setCurrentPage(1);
          }}
          className={`pb-3 px-4 font-bold text-sm transition-all flex items-center gap-2 border-b-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'pagar'
              ? 'border-[#E03131] text-[#E03131]'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">outbox</span>
          Contas a Pagar (Despesas)
        </button>

        <button
          onClick={() => {
            setActiveTab('receber');
            setCurrentPage(1);
          }}
          className={`pb-3 px-4 font-bold text-sm transition-all flex items-center gap-2 border-b-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'receber'
              ? 'border-[#2F9E44] text-[#2F9E44]'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">move_to_inbox</span>
          Contas a Receber (Clientes)
        </button>
      </div>

      {/* 3 Summary Indicator Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard
          title="Vencendo Esta Semana"
          value={`${contasVencendoSemana} títulos`}
          icon="schedule"
          variant="warning"
          subtitle="Atenção aos prazos imediatos"
        />

        <StatCard
          title="Títulos em Atraso"
          value={`${contasEmAtraso} títulos`}
          icon="warning"
          variant={contasEmAtraso > 0 ? 'danger' : 'default'}
          subtitle={contasEmAtraso > 0 ? 'Requer regularização' : 'Sem atrasos pendentes'}
        />

        <StatCard
          title={`Total Pendente (${activeTab === 'pagar' ? 'A Pagar' : 'A Receber'})`}
          value={formatCurrency(activeTab === 'pagar' ? totalPendentePagar : totalPendenteReceber)}
          icon="payments"
          variant={activeTab === 'pagar' ? 'primary' : 'success'}
          subtitle="Soma das parcelas em aberto"
        />
      </div>

      {/* Filter / Status Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#DEE2E6] shadow-xs flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none select-none">
          {(['todos', 'atrasado', 'pendente', 'pago'] as const).map((st) => {
            const labels = {
              todos: 'Todos',
              atrasado: 'Em Atraso',
              pendente: 'Pendentes',
              pago: activeTab === 'pagar' ? 'Pagos' : 'Recebidos',
            };
            return (
              <button
                key={st}
                onClick={() => {
                  setSelectedStatus(st);
                  setCurrentPage(1);
                }}
                className={`px-3.5 py-2 text-xs font-bold rounded-xl capitalize transition-all whitespace-nowrap cursor-pointer active:scale-95 ${
                  selectedStatus === st
                    ? 'bg-[#010102] text-white shadow-xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {labels[st]}
              </button>
            );
          })}
        </div>

        <div className="relative w-full sm:w-72 min-w-0 flex items-center">
          <span className="material-symbols-outlined absolute left-3 text-gray-400 text-[18px] pointer-events-none">
            search
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Buscar por descrição ou nome..."
            className="w-full pl-9 pr-8 py-2 rounded-xl border border-[#DEE2E6] text-xs text-[#010102] bg-white focus:border-[#835400] focus:ring-1 focus:ring-[#835400]/20 focus:outline-none"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 text-xs text-gray-400 hover:text-black"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-2xl border border-[#DEE2E6] overflow-hidden flex flex-col shadow-xs min-w-0">
        {paginatedAccounts.length === 0 ? (
          <EmptyState
            icon="receipt_long"
            title={`Nenhuma conta a ${activeTab === 'pagar' ? 'pagar' : 'receber'} encontrada`}
            description="Não há títulos registrados para o filtro selecionado."
            actionLabel="Cadastrar Nova Conta"
            actionIcon="add"
            onAction={() => setIsNovaContaOpen(true)}
          />
        ) : (
          <>
            {/* Desktop / Tablet View: Fluid Table with zero horizontal scrolling */}
            <div className="hidden md:block w-full">
              <table className="w-full text-left border-collapse table-fixed">
                <thead className="bg-gray-50/80 border-b border-[#DEE2E6] text-xs font-bold text-gray-500">
                  <tr>
                    <th className="py-3 px-4">Descrição</th>
                    <th className="py-3 px-3 w-44">{activeTab === 'pagar' ? 'Fornecedor' : 'Cliente'}</th>
                    <th className="py-3 px-2 w-20 text-center whitespace-nowrap">Parcela</th>
                    <th className="py-3 px-3 w-28 whitespace-nowrap">Vencimento</th>
                    <th className="py-3 px-3 w-32 text-right whitespace-nowrap">Valor</th>
                    <th className="py-3 px-2 w-28 text-center whitespace-nowrap">Status</th>
                    <th className="py-3 px-3 w-36 text-center whitespace-nowrap">Ações</th>
                  </tr>
                </thead>
                <tbody className="text-xs divide-y divide-[#DEE2E6]">
                  {paginatedAccounts.map((acc) => {
                    const isPaid = acc.status === 'pago';

                    return (
                      <tr key={acc.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="py-3 px-4 min-w-0">
                          <span className="font-bold text-[#010102] block truncate" title={acc.descricao}>
                            {acc.descricao}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-gray-700 font-medium">
                          <span className="block truncate" title={acc.fornecedorCliente}>
                            {acc.fornecedorCliente}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-center whitespace-nowrap">
                          <span className="bg-gray-100 px-2 py-0.5 rounded text-[11px] font-bold text-gray-700">
                            {acc.parcela}
                          </span>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap font-mono text-[11px]">
                          <span
                            className={`font-bold ${
                              acc.status === 'atrasado'
                                ? 'text-[#E03131] bg-red-50 px-2 py-0.5 rounded-md'
                                : 'text-gray-700'
                            }`}
                          >
                            {acc.vencimento}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-extrabold whitespace-nowrap text-[#010102] text-right tabular-nums">
                          {formatCurrency(acc.valor)}
                        </td>
                        <td className="py-3 px-2 text-center whitespace-nowrap">
                          <StatusBadge status={acc.status} size="xs" />
                        </td>
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            <Button
                              variant={isPaid ? 'secondary' : 'success'}
                              size="xs"
                              icon={isPaid ? 'undo' : 'check'}
                              onClick={() => toggleAccountPaidStatus(acc.id)}
                            >
                              {isPaid ? 'Reabrir' : activeTab === 'pagar' ? 'Pagar' : 'Receber'}
                            </Button>

                            <Button
                              variant="ghost"
                              size="xs"
                              icon="delete"
                              className="text-gray-400 hover:text-red-600 hover:bg-red-50"
                              title="Excluir Conta"
                              onClick={() => {
                                if (confirm(`Deseja excluir "${acc.descricao}"?`)) {
                                  deleteAccount(acc.id);
                                }
                              }}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile View: High-density card items with zero horizontal scroll & swipe actions */}
            <div className="md:hidden divide-y divide-gray-100">
              <div className="bg-amber-50/60 px-4 py-1.5 border-b border-amber-100 text-[10px] text-amber-800 flex items-center justify-between">
                <span className="flex items-center gap-1 font-medium">
                  <span className="material-symbols-outlined text-[13px]">swipe_left</span>
                  Deslize para liquidar ou excluir rapidamente
                </span>
                <span className="text-[9px] font-mono text-amber-600 font-bold uppercase tracking-wider">Touch</span>
              </div>

              {paginatedAccounts.map((acc) => {
                const isPaid = acc.status === 'pago';
                const isAtrasado = acc.status === 'atrasado';

                return (
                  <SwipeableRow
                    key={acc.id}
                    actions={[
                      {
                        label: isPaid ? 'Reabrir' : activeTab === 'pagar' ? 'Pagar' : 'Receber',
                        icon: isPaid ? 'undo' : 'check_circle',
                        colorClass: isPaid ? 'bg-gray-700 text-white' : 'bg-emerald-600 text-white',
                        onClick: () => toggleAccountPaidStatus(acc.id),
                      },
                      {
                        label: 'Excluir',
                        icon: 'delete',
                        colorClass: 'bg-red-600 text-white',
                        onClick: () => {
                          if (confirm(`Deseja excluir "${acc.descricao}"?`)) {
                            deleteAccount(acc.id);
                          }
                        },
                      },
                    ]}
                  >
                    <div
                      className={`p-4 flex flex-col gap-2.5 transition-colors ${
                        isAtrasado ? 'bg-red-50/20' : 'hover:bg-gray-50/70'
                      }`}
                    >
                      {/* Header: Descrição + Status */}
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs font-bold text-[#010102] leading-snug">
                          {acc.descricao}
                        </h4>
                        <StatusBadge status={acc.status} size="xs" />
                      </div>

                      {/* Middle: Fornecedor/Cliente + Parcela + Vencimento */}
                      <div className="flex items-center justify-between text-[11px] text-gray-600 gap-2 flex-wrap">
                        <span className="font-semibold text-gray-800 truncate max-w-[180px]">
                          {acc.fornecedorCliente}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="bg-gray-100 px-1.5 py-0.5 rounded text-[10px] font-bold text-gray-600">
                            Parc. {acc.parcela}
                          </span>
                          <span className={`font-mono ${isAtrasado ? 'text-[#E03131] font-bold' : 'text-gray-500'}`}>
                            Venc: {acc.vencimento}
                          </span>
                        </div>
                      </div>

                      {/* Footer: Valor + Actions */}
                      <div className="flex items-center justify-between pt-1.5 border-t border-gray-100 gap-2 mt-0.5">
                        <span className="text-sm font-black text-[#010102] tabular-nums">
                          {formatCurrency(acc.valor)}
                        </span>

                        <div className="flex items-center gap-1.5">
                          <Button
                            variant={isPaid ? 'secondary' : 'success'}
                            size="xs"
                            icon={isPaid ? 'undo' : 'check'}
                            onClick={() => toggleAccountPaidStatus(acc.id)}
                          >
                            {isPaid ? 'Reabrir' : activeTab === 'pagar' ? 'Pagar' : 'Receber'}
                          </Button>

                          <Button
                            variant="ghost"
                            size="xs"
                            icon="delete"
                            className="text-gray-400 hover:text-red-600 hover:bg-red-50"
                            title="Excluir Conta"
                            onClick={() => {
                              if (confirm(`Deseja excluir "${acc.descricao}"?`)) {
                                deleteAccount(acc.id);
                              }
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </SwipeableRow>
                );
              })}
            </div>
          </>
        )}

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredAccounts.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
};
