import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../utils/formatters';
import { Button, StatCard, StatusBadge } from '../common';

export const DashboardView: React.FC = () => {
  const {
    transactions,
    accounts,
    quotes,
    userRole,
    permissions,
    setCurrentView,
    openNovoLancamentoWithTab,
    saldoAtual,
    entradasDoMes,
    saidasDoMes,
    contasEmAtraso,
    contasVencendoSemana,
  } = useApp();

  const [chartPeriod, setChartPeriod] = useState<'30' | '15' | '7'>('30');
  const [hoveredPoint, setHoveredPoint] = useState<{ day: string; value: string; x: number; y: number } | null>(null);

  // Take latest 5 transactions
  const recentTransactions = transactions.slice(0, 5);

  // Take upcoming bills (A Pagar that are not paid yet)
  const upcomingBills = accounts
    .filter((a) => a.tipo === 'pagar' && a.status !== 'pago')
    .slice(0, 4);

  // Quotes count awaiting approval
  const pendingQuotesCount = useMemo(() => {
    return quotes.filter((q) => q.status === 'enviado' || q.status === 'rascunho').length;
  }, [quotes]);

  // Dynamic Chart Points based on selected period
  const chartData = useMemo(() => {
    if (chartPeriod === '7') {
      return {
        points: [
          { day: 'Seg', val: 'R$ 720.000', x: 5, y: 70 },
          { day: 'Ter', val: 'R$ 760.000', x: 20, y: 62 },
          { day: 'Qua', val: 'R$ 690.000', x: 38, y: 75 },
          { day: 'Qui', val: 'R$ 880.000', x: 55, y: 48 },
          { day: 'Sex', val: 'R$ 1.050.000', x: 72, y: 30 },
          { day: 'Sáb', val: 'R$ 1.180.000', x: 88, y: 20 },
          { day: 'Hoje', val: formatCurrency(saldoAtual), x: 98, y: 15 },
        ],
        path: 'M 0,72 Q 20,62 38,75 T 55,48 T 72,30 T 88,20 T 100,15',
        area: 'M 0,72 Q 20,62 38,75 T 55,48 T 72,30 T 88,20 T 100,15 L 100,100 L 0,100 Z',
        labels: ['Seg', 'Qua', 'Sex', 'Hoje'],
      };
    }

    if (chartPeriod === '15') {
      return {
        points: [
          { day: 'Dia 1', val: 'R$ 540.000', x: 5, y: 80 },
          { day: 'Dia 4', val: 'R$ 610.000', x: 25, y: 68 },
          { day: 'Dia 8', val: 'R$ 490.000', x: 50, y: 84 },
          { day: 'Dia 11', val: 'R$ 820.000', x: 75, y: 42 },
          { day: 'Hoje', val: formatCurrency(saldoAtual), x: 98, y: 15 },
        ],
        path: 'M 0,82 Q 25,68 50,84 T 75,42 T 100,15',
        area: 'M 0,82 Q 25,68 50,84 T 75,42 T 100,15 L 100,100 L 0,100 Z',
        labels: ['Dia 1', 'Dia 8', 'Hoje'],
      };
    }

    // Default 30 days
    return {
      points: [
        { day: '01/Nov', val: 'R$ 410.000', x: 2, y: 78 },
        { day: '05/Nov', val: 'R$ 430.000', x: 15, y: 72 },
        { day: '10/Nov', val: 'R$ 390.000', x: 30, y: 75 },
        { day: '15/Nov', val: 'R$ 520.000', x: 45, y: 58 },
        { day: '20/Nov', val: 'R$ 340.000', x: 60, y: 88 },
        { day: '25/Nov', val: 'R$ 890.000', x: 80, y: 35 },
        { day: '30/Nov', val: formatCurrency(saldoAtual), x: 98, y: 15 },
      ],
      path: 'M 0,80 Q 15,70 30,75 T 45,58 T 60,88 T 80,35 T 100,15',
      area: 'M 0,80 Q 15,70 30,75 T 45,58 T 60,88 T 80,35 T 100,15 L 100,100 L 0,100 Z',
      labels: ['01/Nov', '15/Nov', '30/Nov'],
    };
  }, [chartPeriod, saldoAtual]);

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1440px] mx-auto w-full flex flex-col gap-6 sm:gap-8 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#010102] tracking-tight">
            Dashboard Executivo
          </h2>
          <p className="text-xs sm:text-sm text-[#46464A] mt-1">
            Visão consolidada de liquidez, fluxo de caixa e compromissos operacionais da usina.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap sm:flex-nowrap">
          <Button
            variant="success"
            icon="add_circle"
            onClick={() => openNovoLancamentoWithTab('entrada')}
          >
            Nova Entrada
          </Button>

          <Button
            variant="warning"
            icon="add"
            onClick={() => openNovoLancamentoWithTab('saida')}
          >
            Nova Saída
          </Button>

          <Button
            variant="secondary"
            icon="request_quote"
            onClick={() => setCurrentView('orcamentos')}
          >
            Orçamentos ({pendingQuotesCount})
          </Button>
        </div>
      </div>

      {/* Smart Overdue / Due Notice Banner */}
      {contasEmAtraso > 0 && (
        <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200/90 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-[22px]">warning</span>
            </div>
            <div>
              <h4 className="text-sm font-bold text-red-950">
                Atenção: {contasEmAtraso} {contasEmAtraso === 1 ? 'título a pagar vencido' : 'títulos a pagar vencidos'}
              </h4>
              <p className="text-xs text-red-800/90 mt-0.5">
                Existem contas que necessitam de quitação imediata para evitar juros e bloqueio de fornecimento de CAP/Insumos.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="danger"
              size="sm"
              icon="payments"
              onClick={() => setCurrentView('contas')}
            >
              Resolver Contas Agora
            </Button>
          </div>
        </div>
      )}

      {/* Bento Grid: 4 Metric Cards (2x2 on mobile, 4 on desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        <StatCard
          title="Saldo Atual em Caixa"
          value={permissions.canViewBalances ? formatCurrency(saldoAtual) : '•••••••• (Sigiloso)'}
          icon="account_balance_wallet"
          variant="primary"
          subtitle={permissions.canViewBalances ? 'Disponibilidade imediata' : 'Acesso restrito à Diretoria/Financeiro'}
          onClick={() => permissions.canViewTransactions && setCurrentView('lancamentos')}
        />

        <StatCard
          title="Entradas do Mês"
          value={permissions.canViewBalances ? formatCurrency(entradasDoMes) : '••••••••'}
          icon="arrow_upward"
          variant="success"
          trend={permissions.canViewBalances ? { value: '+14% vs mês anterior', isPositive: true } : undefined}
          subtitle={!permissions.canViewBalances ? 'Acesso restrito' : undefined}
          onClick={() => permissions.canViewTransactions && setCurrentView('lancamentos')}
        />

        <StatCard
          title="Saídas do Mês"
          value={permissions.canViewBalances ? formatCurrency(saidasDoMes) : '••••••••'}
          icon="arrow_downward"
          variant="danger"
          subtitle={permissions.canViewBalances ? 'Insumos, CAP e Folha' : 'Acesso restrito'}
          onClick={() => permissions.canViewTransactions && setCurrentView('lancamentos')}
        />

        <StatCard
          title="Compromissos a Vencer"
          value={permissions.canManageAccounts ? `${contasVencendoSemana} contas` : `${quotes.length} orçamentos`}
          icon={permissions.canManageAccounts ? 'event_upcoming' : 'request_quote'}
          variant={contasEmAtraso > 0 && permissions.canManageAccounts ? 'warning' : 'default'}
          subtitle={
            permissions.canManageAccounts
              ? contasEmAtraso > 0
                ? `${contasEmAtraso} em atraso`
                : 'Próximos 7 dias'
              : 'Propostas Comerciais'
          }
          onClick={() => setCurrentView(permissions.canManageAccounts ? 'contas' : 'orcamentos')}
        />
      </div>

      {/* Central Section: Interactive Chart Area */}
      <div className="bg-white rounded-2xl border border-[#DEE2E6] p-6 flex flex-col shadow-xs hover:shadow-md transition-shadow">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 border-b border-[#DEE2E6] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#F2A93B]/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px] text-[#835400]">show_chart</span>
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-[#010102] tracking-tight">
                Curva de Liquidez Financeira ({chartPeriod} Dias)
              </h3>
              <p className="text-xs text-gray-500">Evolução de saldo e projeção de disponibilidades</p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200">
              {(['7', '15', '30'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setChartPeriod(p)}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    chartPeriod === p
                      ? 'bg-white text-[#835400] shadow-xs'
                      : 'text-gray-600 hover:text-black'
                  }`}
                >
                  {p}D
                </button>
              ))}
            </div>

            <Button
              variant="ghost"
              size="xs"
              icon="analytics"
              onClick={() => setCurrentView('relatorios')}
            >
              DRE Gerencial
            </Button>
          </div>
        </div>

        {/* Decorative Responsive SVG Chart Area */}
        <div className="relative w-full h-64 sm:h-72 rounded-xl border border-[#DEE2E6] bg-gradient-to-b from-[#FDFBF7] to-white overflow-hidden flex items-end px-4 pb-4">
          {/* Grid Lines */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#e5e2e1_1px,transparent_1px),linear-gradient(to_bottom,#e5e2e1_1px,transparent_1px)] bg-[size:40px_40px] opacity-30" />

          {/* SVG Curve */}
          <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
            <defs>
              <linearGradient id="amberGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#F2A93B" stopOpacity="0.30" />
                <stop offset="100%" stopColor="#F2A93B" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Area */}
            <path d={chartData.area} fill="url(#amberGradient)" />

            {/* Line */}
            <path
              d={chartData.path}
              fill="none"
              stroke="#835400"
              strokeWidth="2.5"
              vectorEffect="non-scaling-stroke"
            />
          </svg>

          {/* Interactive Points */}
          {chartData.points.map((pt, i) => (
            <div
              key={i}
              onMouseEnter={() => setHoveredPoint({ day: pt.day, value: pt.val, x: pt.x, y: pt.y })}
              onMouseLeave={() => setHoveredPoint(null)}
              className="absolute w-3.5 h-3.5 -ml-1.5 -mb-1.5 rounded-full bg-white border-2 border-[#835400] cursor-pointer hover:scale-135 transition-transform z-20 shadow-xs"
              style={{ left: `${pt.x}%`, bottom: `${100 - pt.y}%` }}
            />
          ))}

          {/* Tooltip */}
          {hoveredPoint && (
            <div
              className={`absolute z-30 bg-[#010102] text-white text-xs px-3 py-1.5 rounded-xl shadow-xl pointer-events-none ${
                hoveredPoint.x > 80
                  ? '-translate-x-[85%] -translate-y-8'
                  : hoveredPoint.x < 20
                  ? '-translate-x-[15%] -translate-y-8'
                  : '-translate-x-1/2 -translate-y-8'
              }`}
              style={{ left: `${hoveredPoint.x}%`, bottom: `${100 - hoveredPoint.y}%` }}
            >
              <p className="font-bold text-[#F2A93B]">{hoveredPoint.day}</p>
              <p className="font-bold">{hoveredPoint.value}</p>
            </div>
          )}

          {/* Axis Labels */}
          <div className="absolute bottom-2 left-4 right-4 flex justify-between text-[11px] font-bold text-gray-400 select-none">
            {chartData.labels.map((label, idx) => (
              <span key={idx}>{label}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Section: 2 Columns */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 pb-4">
        {/* Left: Recent Transactions */}
        <div className="bg-white rounded-2xl border border-[#DEE2E6] p-5 sm:p-6 flex flex-col shadow-xs min-w-0">
          <div className="flex items-center justify-between mb-4 border-b border-[#DEE2E6] pb-3">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-[#010102]">Últimos Lançamentos</h3>
              <p className="text-xs text-gray-500">Movimentações mais recentes no Livro Caixa</p>
            </div>

            <Button
              variant="ghost"
              size="xs"
              icon="arrow_forward"
              iconPosition="right"
              onClick={() => setCurrentView('lancamentos')}
            >
              Ver Todos
            </Button>
          </div>

          {/* Desktop/Tablet View: Fluid Table without fixed min-w */}
          <div className="hidden sm:block w-full">
            <table className="w-full text-left border-collapse table-fixed">
              <thead>
                <tr className="bg-gray-50/80 border-b border-[#DEE2E6] text-xs font-bold text-gray-500">
                  <th className="py-2.5 px-3 w-24">Data</th>
                  <th className="py-2.5 px-3">Descrição</th>
                  <th className="py-2.5 px-3 w-28">Categoria</th>
                  <th className="py-2.5 px-3 w-32 text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="text-xs divide-y divide-[#DEE2E6]">
                {recentTransactions.map((tx) => (
                  <tr
                    key={tx.id}
                    onClick={() => setCurrentView('lancamentos')}
                    className="hover:bg-gray-50/80 transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-3 whitespace-nowrap text-gray-500 font-mono text-[11px]">
                      {tx.data}
                    </td>
                    <td className="py-3 px-3 font-bold text-[#010102] truncate" title={tx.descricao}>
                      {tx.descricao}
                    </td>
                    <td className="py-3 px-3">
                      <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-700 text-[10px] font-bold uppercase tracking-wider border border-gray-200 inline-block truncate max-w-full">
                        {tx.categoria}
                      </span>
                    </td>
                    <td
                      className={`py-3 px-3 text-right font-bold whitespace-nowrap tabular-nums ${
                        tx.tipo === 'entrada' ? 'text-[#2F9E44]' : 'text-[#E03131]'
                      }`}
                    >
                      {tx.tipo === 'entrada' ? '+' : '-'} {formatCurrency(tx.valor)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile View: High-density card items with zero horizontal scroll */}
          <div className="sm:hidden flex flex-col divide-y divide-gray-100">
            {recentTransactions.map((tx) => (
              <div
                key={tx.id}
                onClick={() => setCurrentView('lancamentos')}
                className="py-3 flex items-center justify-between gap-3 cursor-pointer hover:bg-gray-50 active:bg-gray-100 rounded-lg px-1 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-[#010102] truncate">{tx.descricao}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-gray-500 font-mono">{tx.data}</span>
                    <span className="text-gray-300">•</span>
                    <span className="text-[10px] text-gray-600 truncate bg-gray-100 px-1.5 py-0.5 rounded font-medium">
                      {tx.categoria}
                    </span>
                  </div>
                </div>
                <span
                  className={`text-xs font-extrabold whitespace-nowrap tabular-nums shrink-0 ${
                    tx.tipo === 'entrada' ? 'text-[#2F9E44]' : 'text-[#E03131]'
                  }`}
                >
                  {tx.tipo === 'entrada' ? '+' : '-'} {formatCurrency(tx.valor)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Upcoming Bills List */}
        <div className="bg-white rounded-2xl border border-[#DEE2E6] p-5 sm:p-6 flex flex-col shadow-xs min-w-0">
          <div className="flex items-center justify-between mb-4 border-b border-[#DEE2E6] pb-3">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-[#010102]">Contas a Pagar Próximas</h3>
              <p className="text-xs text-gray-500">Prazos e compromissos operacionais</p>
            </div>

            <StatusBadge status={contasEmAtraso > 0 ? 'atrasado' : 'pendente'} size="xs" />
          </div>

          <div className="flex flex-col gap-2.5 flex-1">
            {upcomingBills.map((bill) => {
              const isUrgent = bill.status === 'atrasado' || bill.vencimento.toLowerCase().includes('hoje');
              return (
                <div
                  key={bill.id}
                  className={`
                    flex items-center justify-between p-3 rounded-xl border transition-all gap-3 min-w-0
                    ${isUrgent ? 'bg-red-50/40 border-red-200' : 'bg-gray-50/50 border-[#DEE2E6] hover:border-gray-400'}
                  `}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                        isUrgent ? 'bg-red-100 text-red-700' : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {isUrgent ? 'warning' : 'event'}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-bold text-[#010102] leading-tight truncate" title={bill.descricao}>
                        {bill.descricao}
                      </p>
                      <p className="text-[11px] text-gray-500 mt-0.5 truncate">
                        {bill.fornecedorCliente} • Vencimento: {bill.vencimento}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-xs sm:text-sm font-extrabold whitespace-nowrap tabular-nums shrink-0 ${
                      isUrgent ? 'text-[#E03131]' : 'text-[#010102]'
                    }`}
                  >
                    {formatCurrency(bill.valor)}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-3 border-t border-[#DEE2E6] flex justify-end">
            <Button
              variant="primary"
              size="sm"
              icon="open_in_new"
              onClick={() => setCurrentView('contas')}
            >
              Gerenciar Contas & Prazos
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
