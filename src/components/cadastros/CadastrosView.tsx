import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Employee } from '../../types';
import {
  Button,
  StatusBadge,
  Pagination,
  EmptyState,
  Modal,
  Input,
  Select,
} from '../common';

export const CadastrosView: React.FC = () => {
  const {
    employees,
    deleteEmployee,
    toggleEmployeeStatus,
    setEditingEmployee,
    setIsNovoFuncionarioOpen,
    categories,
    bankAccounts,
    globalSearch,
    showToast,
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<
    'funcionarios' | 'fornecedores' | 'categorias' | 'contas'
  >('funcionarios');

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Modal for new Category
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCatNome, setNewCatNome] = useState('');
  const [newCatTipo, setNewCatTipo] = useState<'receita' | 'despesa'>('despesa');
  const [newCatIcone, setNewCatIcone] = useState('category');

  // Filtered employees
  const filteredEmployees = useMemo(() => {
    const q = (globalSearch || searchTerm).toLowerCase();
    return employees.filter(
      (e) =>
        e.nome.toLowerCase().includes(q) ||
        e.cargo.toLowerCase().includes(q) ||
        e.documento.includes(q)
    );
  }, [employees, globalSearch, searchTerm]);

  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage) || 1;
  const paginatedEmployees = filteredEmployees.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleEdit = (emp: Employee) => {
    setEditingEmployee(emp);
    setIsNovoFuncionarioOpen(true);
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatNome.trim()) return;
    categories.push({
      id: `cat_${Date.now()}`,
      nome: newCatNome.trim(),
      tipo: newCatTipo,
      cor: newCatTipo === 'receita' ? '#2F9E44' : '#835400',
      icone: newCatIcone,
    });
    showToast(`Categoria "${newCatNome}" adicionada com sucesso!`, 'success');
    setNewCatNome('');
    setIsCategoryModalOpen(false);
  };

  return (
    <div className="flex-1 p-6 lg:p-10 max-w-[1440px] mx-auto w-full flex flex-col gap-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#010102] tracking-tight">
            Cadastros Gerais
          </h2>
          <p className="text-xs sm:text-sm text-[#46464A] mt-1">
            Gestão unificada de colaboradores da usina, fornecedores de insumos, categorias e contas bancárias.
          </p>
        </div>

        {activeSubTab === 'funcionarios' && (
          <Button
            variant="primary"
            icon="person_add"
            onClick={() => {
              setEditingEmployee(null);
              setIsNovoFuncionarioOpen(true);
            }}
          >
            Novo Colaborador
          </Button>
        )}

        {activeSubTab === 'categorias' && (
          <Button
            variant="primary"
            icon="add_circle"
            onClick={() => setIsCategoryModalOpen(true)}
          >
            Nova Categoria
          </Button>
        )}
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-[#DEE2E6] gap-2 overflow-x-auto pb-0.5">
        <button
          onClick={() => {
            setActiveSubTab('funcionarios');
            setCurrentPage(1);
          }}
          className={`pb-3 px-4 font-bold text-sm transition-all flex items-center gap-2 border-b-2 whitespace-nowrap cursor-pointer ${
            activeSubTab === 'funcionarios'
              ? 'border-[#835400] text-[#835400]'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">badge</span>
          Colaboradores ({employees.length})
        </button>

        <button
          onClick={() => setActiveSubTab('fornecedores')}
          className={`pb-3 px-4 font-bold text-sm transition-all flex items-center gap-2 border-b-2 whitespace-nowrap cursor-pointer ${
            activeSubTab === 'fornecedores'
              ? 'border-[#835400] text-[#835400]'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">domain</span>
          Fornecedores & Clientes
        </button>

        <button
          onClick={() => setActiveSubTab('categorias')}
          className={`pb-3 px-4 font-bold text-sm transition-all flex items-center gap-2 border-b-2 whitespace-nowrap cursor-pointer ${
            activeSubTab === 'categorias'
              ? 'border-[#835400] text-[#835400]'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">category</span>
          Plano de Categorias ({categories.length})
        </button>

        <button
          onClick={() => setActiveSubTab('contas')}
          className={`pb-3 px-4 font-bold text-sm transition-all flex items-center gap-2 border-b-2 whitespace-nowrap cursor-pointer ${
            activeSubTab === 'contas'
              ? 'border-[#835400] text-[#835400]'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">account_balance</span>
          Contas Bancárias ({bankAccounts.length})
        </button>
      </div>

      {/* SubTab 1: Funcionários Table */}
      {activeSubTab === 'funcionarios' && (
        <div className="flex flex-col gap-4">
          {/* Search bar */}
          <div className="bg-white p-4 rounded-2xl border border-[#DEE2E6] shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative w-full max-w-md flex items-center">
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
                placeholder="Buscar por nome, cargo ou CPF..."
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
            <span className="text-xs text-gray-500 font-bold shrink-0">
              {filteredEmployees.length} colaboradores encontrados
            </span>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-[#DEE2E6] overflow-hidden shadow-xs min-w-0">
            {paginatedEmployees.length === 0 ? (
              <EmptyState
                icon="group_off"
                title="Nenhum colaborador encontrado"
                description="Não há colaboradores que correspondam à sua pesquisa."
                actionLabel="Novo Colaborador"
                actionIcon="person_add"
                onAction={() => {
                  setEditingEmployee(null);
                  setIsNovoFuncionarioOpen(true);
                }}
              />
            ) : (
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead className="bg-gray-50/80 border-b border-[#DEE2E6] text-xs font-bold text-gray-500">
                    <tr>
                      <th className="py-3 px-4 whitespace-nowrap">Nome</th>
                      <th className="py-3 px-4 whitespace-nowrap">Documento</th>
                      <th className="py-3 px-4 whitespace-nowrap">Cargo</th>
                      <th className="py-3 px-4 whitespace-nowrap">Telefone</th>
                      <th className="py-3 px-4 whitespace-nowrap">Tags</th>
                      <th className="py-3 px-4 whitespace-nowrap">Status</th>
                      <th className="py-3 px-4 text-center whitespace-nowrap">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs divide-y divide-[#DEE2E6]">
                    {paginatedEmployees.map((emp) => (
                      <tr key={emp.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="py-3 px-4 font-bold text-[#010102] max-w-[200px]">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-[#835400] text-white flex items-center justify-center font-bold text-xs shrink-0">
                              {emp.avatarInitials || emp.nome.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="truncate" title={emp.nome}>
                                {emp.nome}
                              </div>
                              {emp.email && (
                                <div className="text-[11px] text-gray-400 font-normal truncate" title={emp.email}>
                                  {emp.email}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono text-gray-600 whitespace-nowrap text-[11px]">
                          {emp.documento}
                        </td>
                        <td className="py-3 px-4 text-gray-800 font-semibold whitespace-nowrap max-w-[150px] truncate" title={emp.cargo}>
                          {emp.cargo}
                        </td>
                        <td className="py-3 px-4 font-mono text-gray-600 whitespace-nowrap text-[11px]">
                          {emp.telefone}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          {emp.isMotorista && (
                            <span className="inline-flex items-center gap-1 bg-amber-50 text-[#835400] px-2.5 py-0.5 rounded-full text-[11px] font-bold border border-amber-200">
                              <span className="material-symbols-outlined text-[13px]">local_shipping</span>
                              Motorista
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <button
                            onClick={() => toggleEmployeeStatus(emp.id)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                              emp.status === 'ativo'
                                ? 'bg-[#D3F9D8] text-[#2B8A3E]'
                                : 'bg-gray-100 text-gray-500'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                emp.status === 'ativo' ? 'bg-[#2B8A3E]' : 'bg-gray-400'
                              }`}
                            />
                            {emp.status === 'ativo' ? 'Ativo' : 'Inativo'}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="xs"
                              icon="edit"
                              title="Editar Colaborador"
                              onClick={() => handleEdit(emp)}
                            />
                            <Button
                              variant="ghost"
                              size="xs"
                              icon="delete"
                              className="text-gray-400 hover:text-red-600 hover:bg-red-50"
                              title="Excluir Colaborador"
                              onClick={() => {
                                if (confirm(`Deseja excluir o registro de "${emp.nome}"?`)) {
                                  deleteEmployee(emp.id);
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
              totalItems={filteredEmployees.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
      )}

      {/* SubTab 2: Fornecedores & Clientes */}
      {activeSubTab === 'fornecedores' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-[#DEE2E6] shadow-xs">
            <h3 className="font-bold text-[#010102] text-base mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#E03131]">store</span>
              Principais Fornecedores de Insumos da Usina
            </h3>
            <ul className="divide-y divide-gray-100 text-xs">
              <li className="py-3.5 flex justify-between items-center">
                <div>
                  <p className="font-bold text-gray-900">Petrobras Distribuidora S.A.</p>
                  <p className="text-gray-500">Cimento Asfáltico de Petróleo (CAP 50/70)</p>
                </div>
                <span className="bg-gray-100 px-2 py-1 rounded text-gray-700 font-mono text-[11px]">
                  CNPJ: 33.000.167/0001-01
                </span>
              </li>
              <li className="py-3.5 flex justify-between items-center">
                <div>
                  <p className="font-bold text-gray-900">Pedreira São Jorge Ltda.</p>
                  <p className="text-gray-500">Brita 0, Brita 1, Areia Industrial e Pó de Pedra</p>
                </div>
                <span className="bg-gray-100 px-2 py-1 rounded text-gray-700 font-mono text-[11px]">
                  CNPJ: 45.123.789/0001-90
                </span>
              </li>
              <li className="py-3.5 flex justify-between items-center">
                <div>
                  <p className="font-bold text-gray-900">Votorantim Cimentos S.A.</p>
                  <p className="text-gray-500">Cimento Portland Especial e Fíler Calcário</p>
                </div>
                <span className="bg-gray-100 px-2 py-1 rounded text-gray-700 font-mono text-[11px]">
                  CNPJ: 61.064.838/0001-44
                </span>
              </li>
            </ul>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#DEE2E6] shadow-xs">
            <h3 className="font-bold text-[#010102] text-base mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#2F9E44]">business</span>
              Principais Clientes & Contratantes de Asfalto
            </h3>
            <ul className="divide-y divide-gray-100 text-xs">
              <li className="py-3.5 flex justify-between items-center">
                <div>
                  <p className="font-bold text-gray-900">Secretaria de Obras & Infraestrutura</p>
                  <p className="text-gray-500">Contrato Contínuo de Recapeamento Asfáltico</p>
                </div>
                <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full font-bold text-[11px]">
                  Contrato Vigente
                </span>
              </li>
              <li className="py-3.5 flex justify-between items-center">
                <div>
                  <p className="font-bold text-gray-900">Construtora Alpha Engenharia Ltda.</p>
                  <p className="text-gray-500">Infraestrutura Rodoviária e Loteamentos</p>
                </div>
                <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full font-bold text-[11px]">
                  Cliente VIP
                </span>
              </li>
              <li className="py-3.5 flex justify-between items-center">
                <div>
                  <p className="font-bold text-gray-900">Residencial Terras do Vale</p>
                  <p className="text-gray-500">Pavimentação e Vias Urbanas</p>
                </div>
                <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full font-bold text-[11px]">
                  Em Execução
                </span>
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* SubTab 3: Categorias */}
      {activeSubTab === 'categorias' && (
        <div className="bg-white p-6 rounded-2xl border border-[#DEE2E6] shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-[#010102] text-base">
                Categorias do Livro Caixa e DRE
              </h3>
              <p className="text-xs text-gray-500">
                Estrutura contábil para classificação de receitas e despesas da usina
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              icon="add"
              onClick={() => setIsCategoryModalOpen(true)}
            >
              Adicionar Categoria
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="p-4 rounded-xl border border-[#DEE2E6] bg-gray-50/50 flex items-center justify-between hover:bg-white hover:shadow-xs transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center">
                    <span
                      className={`material-symbols-outlined text-[20px] ${
                        cat.tipo === 'receita' ? 'text-[#2F9E44]' : 'text-[#835400]'
                      }`}
                    >
                      {cat.icone || 'label'}
                    </span>
                  </div>
                  <div>
                    <p className="font-bold text-xs text-[#010102]">{cat.nome}</p>
                    <span
                      className={`text-[10px] uppercase font-bold tracking-wider ${
                        cat.tipo === 'receita' ? 'text-[#2F9E44]' : 'text-[#E03131]'
                      }`}
                    >
                      {cat.tipo}
                    </span>
                  </div>
                </div>
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.cor }} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SubTab 4: Contas Bancárias */}
      {activeSubTab === 'contas' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {bankAccounts.map((acc) => (
            <div
              key={acc.id}
              className="bg-white p-6 rounded-2xl border border-[#DEE2E6] shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-gray-500 uppercase">{acc.banco}</span>
                  <span className="material-symbols-outlined text-[#835400]">account_balance</span>
                </div>
                <h4 className="text-base font-bold text-[#010102]">{acc.nome}</h4>
                <p className="text-xs text-gray-500 mt-1 font-mono">{acc.agenciaConta}</p>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between items-end">
                <div>
                  <span className="text-[10px] text-gray-400 uppercase font-bold block">
                    Saldo Disponível
                  </span>
                  <span className="text-xl font-black text-[#2F9E44] tabular-nums">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format(acc.saldo)}
                  </span>
                </div>
                <span className="w-2.5 h-2.5 rounded-full bg-[#2F9E44]" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Nova Categoria */}
      <Modal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        title="Nova Categoria Financeira"
        subtitle="Crie uma nova classificação contábil para o fluxo de caixa."
        footer={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsCategoryModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon="save"
              onClick={handleAddCategory}
            >
              Salvar Categoria
            </Button>
          </>
        }
      >
        <form onSubmit={handleAddCategory} className="flex flex-col gap-4">
          <Input
            label="Nome da Categoria *"
            placeholder="Ex: Óleo BPF / Combustível Secador"
            value={newCatNome}
            onChange={(e) => setNewCatNome(e.target.value)}
            required
            autoFocus
          />

          <Select
            label="Tipo de Lançamento"
            value={newCatTipo}
            onChange={(e) => setNewCatTipo(e.target.value as any)}
            options={[
              { value: 'despesa', label: 'Despesa / Saída de Caixa' },
              { value: 'receita', label: 'Receita / Entrada de Caixa' },
            ]}
          />

          <Select
            label="Ícone Decorativo"
            value={newCatIcone}
            onChange={(e) => setNewCatIcone(e.target.value)}
            options={[
              { value: 'category', label: 'Categoria Padrão' },
              { value: 'oil_barrel', label: 'Óleo / Betume / CAP' },
              { value: 'local_shipping', label: 'Transporte / Frete' },
              { value: 'build', label: 'Manutenção e Peças' },
              { value: 'bolt', label: 'Energia Elétrica' },
              { value: 'receipt', label: 'Impostos e Tributos' },
            ]}
          />
        </form>
      </Modal>
    </div>
  );
};
