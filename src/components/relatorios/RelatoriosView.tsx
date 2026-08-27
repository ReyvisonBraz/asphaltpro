import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../utils/formatters';
import { Button, StatCard, Select } from '../common';

export const RelatoriosView: React.FC = () => {
  const {
    transactions,
    accounts,
    entradasDoMes,
    saidasDoMes,
    saldoAtual,
    showToast,
    setCurrentView,
  } = useApp();

  const [periodo, setPeriodo] = useState<'diario' | 'semanal' | 'mensal'>('mensal');
  const [selectedMonth, setSelectedMonth] = useState('Novembro, 2023');

  // CSV export function
  const exportToCSV = () => {
    const headers = [
      'Data',
      'Descrição',
      'Categoria',
      'Responsável',
      'Forma de Pagamento',
      'Tipo',
      'Valor',
    ];
    const rows = transactions.map((t) => [
      t.data,
      `"${t.descricao}"`,
      `"${t.categoria}"`,
      `"${t.responsavel}"`,
      `"${t.formaPagamento}"`,
      t.tipo.toUpperCase(),
      t.valor,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(';'), ...rows.map((e) => e.join(';'))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `relatorio_asphaltpro_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Relatório gerencial CSV exportado com sucesso!', 'success');
  };

  // Top 5 Expenses ranking based on transactions
  const expenseRanking = useMemo(() => {
    const expensesByCategory: Record<string, number> = {};
    transactions
      .filter((t) => t.tipo === 'saida')
      .forEach((t) => {
        expensesByCategory[t.descricao] =
          (expensesByCategory[t.descricao] || 0) + t.valor;
      });

    const sorted = Object.entries(expensesByCategory)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    const totalTop = sorted.reduce((sum, [, val]) => sum + val, 0) || 1;

    if (sorted.length === 0) {
      return [
        { name: 'Fornecimento CAP Petrobras', amount: 360000, percentage: 45 },
        { name: 'Folha Operacional Usina & Frota', amount: 200000, percentage: 25 },
        { name: 'Locação Linha Amarela / Pá Carregadeira', amount: 120000, percentage: 15 },
        { name: 'Pedreira São Jorge (Brita e Areia)', amount: 80000, percentage: 10 },
        { name: 'Manutenção Preventiva Usina', amount: 40000, percentage: 5 },
      ];
    }

    return sorted.map(([name, amount]) => ({
      name,
      amount,
      percentage: Math.round((amount / totalTop) * 100),
    }));
  }, [transactions]);

  // Category breakdown
  const categoryData = [
    { label: 'Matéria Prima (CAP / Brita)', percent: 50, color: '#835400' },
    { label: 'Folha de Pagamento', percent: 25, color: '#F2A93B' },
    { label: 'Logística & Frota CBUQ', percent: 15, color: '#2F9E44' },
    { label: 'Manutenção & Energia', percent: 10, color: '#77767B' },
  ];

  const openAccountsCount = accounts.filter(
    (a) => a.tipo === 'pagar' && a.status !== 'pago'
  ).length;
  const openAccountsTotal = accounts
    .filter((a) => a.tipo === 'pagar' && a.status !== 'pago')
    .reduce((s, a) => s + a.valor, 0);

  return (
    <div className="flex-1 p-6 lg:p-10 max-w-[1440px] mx-auto w-full flex flex-col gap-6 sm:gap-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#010102] tracking-tight">
            Relatórios Financeiros & DRE
          </h2>
          <p className="text-xs sm:text-sm text-[#46464A] mt-1">
            Demonstrativo de Resultados do Exercício, centros de custo e comparativo de liquidez.
          </p>
        </div>

        {/* Top Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Segmented period */}
          <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200">
            {(['diario', 'semanal', 'mensal'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriodo(p)}
                className={`px-3 py-1 text-xs font-bold rounded-lg capitalize transition-all cursor-pointer ${
                  periodo === p
                    ? 'bg-white text-[#835400] shadow-xs'
                    : 'text-gray-600 hover:text-black'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <div className="w-44">
            <Select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              options={[
                { value: 'Novembro, 2023', label: 'Novembro, 2023' },
                { value: 'Outubro, 2023', label: 'Outubro, 2023' },
                { value: 'Setembro, 2023', label: 'Setembro, 2023' },
                { value: 'Agosto, 2023', label: 'Agosto, 2023' },
              ]}
            />
          </div>

          <Button
            variant="primary"
            icon="download"
            size="sm"
            onClick={exportToCSV}
          >
            Exportar Relatório CSV
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard
          title="Total de Entradas"
          value={formatCurrency(entradasDoMes)}
          icon="arrow_upward"
          variant="success"
          trend={{ value: '+12% vs mês ant.', isPositive: true }}
          subtitle="Receita com fornecimento de CBUQ"
        />

        <StatCard
          title="Total de Saídas"
          value={formatCurrency(saidasDoMes)}
          icon="arrow_downward"
          variant="danger"
          trend={{ value: '-5% economia', isPositive: true }}
          subtitle="CAP, agregados, folha e energia"
        />

        <StatCard
          title="Margem de Contribuição"
          value={formatCurrency(saldoAtual)}
          icon="account_balance_wallet"
          variant="primary"
          subtitle="Margem Operacional Líquida (36%)"
        />
      </div>

      {/* Central Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Entradas vs Saídas Bar Chart (2 cols) */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-[#DEE2E6] p-6 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-center mb-6 pb-3 border-b border-[#DEE2E6]">
            <div>
              <h3 className="font-bold text-base text-[#010102]">
                Entradas vs Saídas Mensal
              </h3>
              <p className="text-xs text-gray-500">
                Comparativo de faturamento e custos operacionais da usina
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-bold">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-[#2F9E44]" />
                <span className="text-gray-700">Entradas</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-[#E03131]" />
                <span className="text-gray-700">Saídas</span>
              </div>
            </div>
          </div>

          {/* Bar Visualization */}
          <div className="h-64 flex items-end justify-between gap-4 px-2 pt-6 pb-2">
            {[
              { month: 'Jun', in: 65, out: 45 },
              { month: 'Jul', in: 78, out: 52 },
              { month: 'Ago', in: 85, out: 60 },
              { month: 'Set', in: 92, out: 68 },
              { month: 'Out', in: 110, out: 75 },
              { month: 'Nov', in: 125, out: 80 },
            ].map((col) => (
              <div
                key={col.month}
                className="flex-1 flex flex-col items-center gap-2 h-full justify-end"
              >
                <div className="w-full max-w-[48px] flex items-end justify-center gap-1.5 h-full">
                  {/* In Bar */}
                  <div
                    style={{ height: `${(col.in / 130) * 100}%` }}
                    className="w-full bg-[#2F9E44] rounded-t-lg hover:opacity-85 transition-all relative group cursor-pointer"
                  >
                    <div className="opacity-0 group-hover:opacity-100 absolute -top-7 left-1/2 -translate-x-1/2 bg-[#010102] text-white text-[10px] py-0.5 px-2 rounded-lg whitespace-nowrap z-20 pointer-events-none font-bold">
                      +{col.in * 10}k
                    </div>
                  </div>
                  {/* Out Bar */}
                  <div
                    style={{ height: `${(col.out / 130) * 100}%` }}
                    className="w-full bg-[#E03131] rounded-t-lg hover:opacity-85 transition-all relative group cursor-pointer"
                  >
                    <div className="opacity-0 group-hover:opacity-100 absolute -top-7 left-1/2 -translate-x-1/2 bg-[#010102] text-white text-[10px] py-0.5 px-2 rounded-lg whitespace-nowrap z-20 pointer-events-none font-bold">
                      -{col.out * 10}k
                    </div>
                  </div>
                </div>
                <span className="text-xs font-bold text-gray-500 mt-2">{col.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Gastos por Categoria (Donut / Segment Breakdown) */}
        <div className="bg-white rounded-2xl border border-[#DEE2E6] p-6 shadow-xs flex flex-col justify-between">
          <div className="mb-4 pb-3 border-b border-[#DEE2E6]">
            <h3 className="font-bold text-base text-[#010102]">
              Composição de Custos
            </h3>
            <p className="text-xs text-gray-500">Distribuição percentual por centro de custo</p>
          </div>

          <div className="flex flex-col items-center justify-center my-4">
            {/* SVG Donut Chart */}
            <div className="relative w-40 h-40 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  fill="transparent"
                  stroke="#835400"
                  strokeWidth="5"
                  strokeDasharray="44 56"
                  strokeDashoffset="0"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  fill="transparent"
                  stroke="#F2A93B"
                  strokeWidth="5"
                  strokeDasharray="22 78"
                  strokeDashoffset="-44"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  fill="transparent"
                  stroke="#2F9E44"
                  strokeWidth="5"
                  strokeDasharray="13 87"
                  strokeDashoffset="-66"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  fill="transparent"
                  stroke="#77767B"
                  strokeWidth="5"
                  strokeDasharray="9 91"
                  strokeDashoffset="-79"
                />
              </svg>
              <div className="absolute text-center">
                <span className="text-[11px] text-gray-400 font-bold block uppercase">
                  Total
                </span>
                <span className="text-base font-black text-[#010102]">100%</span>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="space-y-2 mt-2">
            {categoryData.map((c) => (
              <div
                key={c.label}
                className="flex justify-between items-center text-xs"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: c.color }}
                  />
                  <span className="text-gray-700 font-medium">{c.label}</span>
                </div>
                <span className="font-bold text-[#010102]">{c.percent}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 pb-4">
        {/* Top 5 Expense Ranking */}
        <div className="bg-white rounded-2xl border border-[#DEE2E6] p-5 sm:p-6 shadow-xs min-w-0">
          <div className="mb-4 pb-3 border-b border-[#DEE2E6]">
            <h3 className="font-bold text-base text-[#010102] truncate">
              Ranking de Despesas Principais
            </h3>
            <p className="text-xs text-gray-500">
              Maiores desembolsos operacionais no período
            </p>
          </div>

          <div className="space-y-4">
            {expenseRanking.map((item, index) => (
              <div key={item.name} className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-semibold gap-2">
                  <span
                    className="text-[#010102] font-bold truncate flex-1"
                    title={item.name}
                  >
                    {index + 1}. {item.name}
                  </span>
                  <span className="font-extrabold whitespace-nowrap tabular-nums shrink-0">
                    {formatCurrency(item.amount)}
                  </span>
                </div>
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-[#835400] h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(item.percentage, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Open Installments Summary */}
        <div className="bg-white rounded-2xl border border-[#DEE2E6] p-5 sm:p-6 shadow-xs flex flex-col justify-between min-w-0">
          <div>
            <div className="mb-4 pb-3 border-b border-[#DEE2E6]">
              <h3 className="font-bold text-base text-[#010102] truncate">
                Projeção de Obrigações (Próximos 30 Dias)
              </h3>
              <p className="text-xs text-gray-500">
                Compromissos contratuais de insumos e maquinários
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-4">
              <div className="p-4 rounded-xl bg-red-50/40 border border-red-200 min-w-0">
                <span className="text-[11px] text-gray-500 uppercase font-bold block mb-1 truncate">
                  Contas a Pagar
                </span>
                <span className="text-xl sm:text-2xl font-black text-[#E03131] tabular-nums">
                  {openAccountsCount}
                </span>
                <span className="text-xs text-gray-500 block mt-1 truncate">
                  títulos pendentes
                </span>
              </div>

              <div className="p-4 rounded-xl bg-gray-50 border border-[#DEE2E6] min-w-0">
                <span className="text-[11px] text-gray-500 uppercase font-bold block mb-1 truncate">
                  Montante a Liquidar
                </span>
                <span
                  className="text-lg sm:text-xl font-black text-[#010102] truncate block tabular-nums"
                  title={formatCurrency(openAccountsTotal)}
                >
                  {formatCurrency(openAccountsTotal)}
                </span>
                <span className="text-xs text-gray-500 block mt-1 truncate">
                  previsto em caixa
                </span>
              </div>
            </div>
          </div>

          <Button
            variant="primary"
            size="md"
            icon="payments"
            fullWidth
            onClick={() => setCurrentView('contas')}
          >
            Gerenciar Contas a Pagar & Receber
          </Button>
        </div>
      </div>
    </div>
  );
};
