import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Employee, BusinessPartner, PartnerType } from '../../types';
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
    partners,
    addPartner,
    deletePartner,
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

  // Modal for new Business Partner
  const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false);
  const [newPartnerNome, setNewPartnerNome] = useState('');
  const [newPartnerFantasia, setNewPartnerFantasia] = useState('');
  const [newPartnerTipo, setNewPartnerTipo] = useState<PartnerType>('fornecedor');
  const [newPartnerDoc, setNewPartnerDoc] = useState('');
  const [newPartnerContato, setNewPartnerContato] = useState('');
  const [newPartnerTelefone, setNewPartnerTelefone] = useState('');
  const [newPartnerEmail, setNewPartnerEmail] = useState('');
  const [newPartnerCidadeUf, setNewPartnerCidadeUf] = useState('');
  const [newPartnerEndereco, setNewPartnerEndereco] = useState('');
  const [newPartnerRamo, setNewPartnerRamo] = useState('');

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

  const handleAddPartner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPartnerNome.trim()) {
      showToast('Informe o nome ou razão social do parceiro.', 'error');
      return;
    }

    addPartner({
      nome: newPartnerNome.trim(),
      nomeFantasia: newPartnerFantasia.trim() || undefined,
      tipo: newPartnerTipo,
      documento: newPartnerDoc.trim() || undefined,
      contato: newPartnerContato.trim() || undefined,
      telefone: newPartnerTelefone.trim() || undefined,
      email: newPartnerEmail.trim() || undefined,
      cidadeUf: newPartnerCidadeUf.trim() || undefined,
      endereco: newPartnerEndereco.trim() || undefined,
      ramoAtividade: newPartnerRamo.trim() || undefined,
      status: 'ativo',
    });

    setNewPartnerNome('');
    setNewPartnerFantasia('');
    setNewPartnerDoc('');
    setNewPartnerContato('');
    setNewPartnerTelefone('');
    setNewPartnerEmail('');
    setNewPartnerCidadeUf('');
    setNewPartnerEndereco('');
    setNewPartnerRamo('');
    setIsPartnerModalOpen(false);
  };

  const filteredPartners = useMemo(() => {
    const q = (globalSearch || searchTerm).toLowerCase();
    return partners.filter(
      (p) =>
        p.nome.toLowerCase().includes(q) ||
        (p.nomeFantasia && p.nomeFantasia.toLowerCase().includes(q)) ||
        (p.documento && p.documento.toLowerCase().includes(q)) ||
        (p.contato && p.contato.toLowerCase().includes(q)) ||
        (p.cidadeUf && p.cidadeUf.toLowerCase().includes(q)) ||
        (p.ramoAtividade && p.ramoAtividade.toLowerCase().includes(q))
    );
  }, [partners, globalSearch, searchTerm]);

  const fornecedoresList = filteredPartners.filter((p) => p.tipo === 'fornecedor' || p.tipo === 'ambos');
  const clientesList = filteredPartners.filter((p) => p.tipo === 'cliente' || p.tipo === 'ambos');

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

        {activeSubTab === 'fornecedores' && (
          <Button
            variant="primary"
            icon="add_business"
            onClick={() => setIsPartnerModalOpen(true)}
          >
            Novo Parceiro / Cliente
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
        <div className="flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 rounded-xl border border-[#DEE2E6]">
            <div className="relative flex-1 w-full max-w-md">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]">
                search
              </span>
              <input
                type="text"
                placeholder="Pesquisar por nome, CNPJ, contato ou cidade..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-[#DEE2E6] rounded-lg text-xs bg-gray-50 focus:bg-white focus:outline-none focus:border-[#835400]"
              />
            </div>
            <div className="text-xs text-gray-500 font-medium flex items-center gap-3">
              <span>{fornecedoresList.length} Fornecedores</span>
              <span>•</span>
              <span>{clientesList.length} Clientes</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Fornecedores */}
            <div className="bg-white p-6 rounded-2xl border border-[#DEE2E6] shadow-xs flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-[#010102] text-base flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#E03131]">store</span>
                  Fornecedores de Insumos da Usina ({fornecedoresList.length})
                </h3>
              </div>
              {fornecedoresList.length === 0 ? (
                <EmptyState
                  title="Nenhum fornecedor encontrado"
                  description="Cadastre seus fornecedores de brita, cimento asfáltico (CAP) e maquinário."
                  actionLabel="Cadastrar Fornecedor"
                  onAction={() => {
                    setNewPartnerTipo('fornecedor');
                    setIsPartnerModalOpen(true);
                  }}
                />
              ) : (
                <ul className="divide-y divide-gray-100 text-xs flex-1">
                  {fornecedoresList.map((f) => (
                    <li key={f.id} className="py-3.5 flex justify-between items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-gray-900 truncate">{f.nome}</p>
                          {f.nomeFantasia && f.nomeFantasia !== f.nome && (
                            <span className="text-gray-500 text-[11px]">({f.nomeFantasia})</span>
                          )}
                        </div>
                        {f.ramoAtividade && (
                          <p className="text-gray-500 text-[11px] mt-0.5">{f.ramoAtividade}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-gray-600">
                          {f.documento && (
                            <span className="bg-gray-100 px-1.5 py-0.5 rounded font-mono text-[10px]">
                              {f.documento}
                            </span>
                          )}
                          {f.cidadeUf && <span>{f.cidadeUf}</span>}
                          {f.telefone && <span>Tel: {f.telefone}</span>}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          if (confirm(`Deseja remover "${f.nome}" da lista de parceiros?`)) {
                            deletePartner(f.id);
                          }
                        }}
                        className="text-gray-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors"
                        title="Excluir parceiro"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Clientes */}
            <div className="bg-white p-6 rounded-2xl border border-[#DEE2E6] shadow-xs flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-[#010102] text-base flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#2F9E44]">business</span>
                  Clientes & Contratantes de Asfalto ({clientesList.length})
                </h3>
              </div>
              {clientesList.length === 0 ? (
                <EmptyState
                  title="Nenhum cliente cadastrado"
                  description="Cadastre prefeituras, construtoras e condomínios que compram massa asfáltica."
                  actionLabel="Cadastrar Cliente"
                  onAction={() => {
                    setNewPartnerTipo('cliente');
                    setIsPartnerModalOpen(true);
                  }}
                />
              ) : (
                <ul className="divide-y divide-gray-100 text-xs flex-1">
                  {clientesList.map((c) => (
                    <li key={c.id} className="py-3.5 flex justify-between items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-gray-900 truncate">{c.nome}</p>
                          {c.nomeFantasia && c.nomeFantasia !== c.nome && (
                            <span className="text-gray-500 text-[11px]">({c.nomeFantasia})</span>
                          )}
                        </div>
                        {c.ramoAtividade && (
                          <p className="text-gray-500 text-[11px] mt-0.5">{c.ramoAtividade}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-gray-600">
                          {c.documento && (
                            <span className="bg-gray-100 px-1.5 py-0.5 rounded font-mono text-[10px]">
                              {c.documento}
                            </span>
                          )}
                          {c.cidadeUf && <span>{c.cidadeUf}</span>}
                          {c.contato && <span>Contato: {c.contato}</span>}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          if (confirm(`Deseja remover "${c.nome}" da lista de clientes?`)) {
                            deletePartner(c.id);
                          }
                        }}
                        className="text-gray-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors"
                        title="Excluir cliente"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
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

      {/* Modal Novo Parceiro Comercial */}
      <Modal
        isOpen={isPartnerModalOpen}
        onClose={() => setIsPartnerModalOpen(false)}
        title="Novo Parceiro Comercial"
        subtitle="Cadastre clientes ou fornecedores para agilizar propostas e lançamentos."
        size="md"
        footer={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsPartnerModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon="save"
              onClick={handleAddPartner}
            >
              Salvar Parceiro
            </Button>
          </>
        }
      >
        <form onSubmit={handleAddPartner} className="flex flex-col gap-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Tipo de Parceiro *"
              value={newPartnerTipo}
              onChange={(e) => setNewPartnerTipo(e.target.value as PartnerType)}
              options={[
                { value: 'fornecedor', label: 'Fornecedor de Insumos / Serviços' },
                { value: 'cliente', label: 'Cliente / Contratante de Asfalto' },
                { value: 'ambos', label: 'Ambos (Cliente e Fornecedor)' },
              ]}
            />
            <Input
              label="CNPJ / CPF"
              placeholder="00.000.000/0001-00"
              value={newPartnerDoc}
              onChange={(e) => setNewPartnerDoc(e.target.value)}
            />
          </div>

          <Input
            label="Razão Social / Nome Oficial *"
            placeholder="Ex: Petrobras Distribuidora S.A. ou Construtora Alpha"
            value={newPartnerNome}
            onChange={(e) => setNewPartnerNome(e.target.value)}
            required
            autoFocus
          />

          <Input
            label="Nome Fantasia / Apelido Comercial"
            placeholder="Ex: Petrobras Asfalto ou Alpha Engenharia"
            value={newPartnerFantasia}
            onChange={(e) => setNewPartnerFantasia(e.target.value)}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Nome do Contato / Fiscal"
              placeholder="Ex: Eng. Roberto Santos"
              value={newPartnerContato}
              onChange={(e) => setNewPartnerContato(e.target.value)}
            />
            <Input
              label="Telefone / WhatsApp"
              placeholder="(11) 98765-4321"
              value={newPartnerTelefone}
              onChange={(e) => setNewPartnerTelefone(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="E-mail"
              placeholder="comercial@empresa.com.br"
              value={newPartnerEmail}
              onChange={(e) => setNewPartnerEmail(e.target.value)}
            />
            <Input
              label="Cidade / UF"
              placeholder="Ex: São Paulo/SP"
              value={newPartnerCidadeUf}
              onChange={(e) => setNewPartnerCidadeUf(e.target.value)}
            />
          </div>

          <Input
            label="Endereço Completo"
            placeholder="Rua, Número, Bairro, CEP"
            value={newPartnerEndereco}
            onChange={(e) => setNewPartnerEndereco(e.target.value)}
          />

          <Input
            label="Ramo de Atividade / Insumos Principais"
            placeholder="Ex: Brita 0, Areia Industrial, CAP 50/70, Recapeamento"
            value={newPartnerRamo}
            onChange={(e) => setNewPartnerRamo(e.target.value)}
          />
        </form>
      </Modal>
    </div>
  );
};
