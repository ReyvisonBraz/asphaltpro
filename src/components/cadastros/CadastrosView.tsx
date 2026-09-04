import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Employee, BusinessPartner, PartnerType } from '../../types';
import { exportEmployeesCsv, exportPartnersCsv } from '../../utils/exportUtils';
import { ImportEntityType } from '../../utils/importUtils';
import {
  Button,
  StatusBadge,
  Pagination,
  EmptyState,
  Modal,
  Input,
  Select,
  ConfirmModal,
} from '../common';
import { ImportDataModal } from '../common/ImportDataModal';
import {
  partnerFormSchema,
  bankAccountFormSchema,
  categoryFormSchema,
  validateForm,
} from '../../schemas/validationSchemas';

export const CadastrosView: React.FC = () => {
  const {
    employees,
    deleteEmployee,
    toggleEmployeeStatus,
    setEditingEmployee,
    setIsNovoFuncionarioOpen,
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
    bankAccounts,
    addBankAccount,
    updateBankAccount,
    deleteBankAccount,
    partners,
    addPartner,
    updatePartner,
    deletePartner,
    globalSearch,
    showToast,
  } = useApp();

  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
    details?: { label: string; value: string }[];
  } | null>(null);

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importEntityType, setImportEntityType] = useState<ImportEntityType>('colaboradores');

  const [activeSubTab, setActiveSubTab] = useState<
    'funcionarios' | 'fornecedores' | 'categorias' | 'contas'
  >(() => {
    if (typeof window === 'undefined') return 'funcionarios';
    const params = new URLSearchParams(window.location.hash.split('?')[1] || '');
    const tab = params.get('tab');
    if (tab === 'funcionarios' || tab === 'fornecedores' || tab === 'categorias' || tab === 'contas') {
      return tab;
    }
    return 'funcionarios';
  });

  // Sync subtabs with browser back/forward history / hash
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      if (e.state?.subTab) {
        setActiveSubTab(e.state.subTab);
        setCurrentPage(1);
      } else {
        const params = new URLSearchParams(window.location.hash.split('?')[1] || '');
        const tab = params.get('tab');
        if (tab === 'funcionarios' || tab === 'fornecedores' || tab === 'categorias' || tab === 'contas') {
          setActiveSubTab(tab);
          setCurrentPage(1);
        }
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleSubTabChange = (tab: 'funcionarios' | 'fornecedores' | 'categorias' | 'contas') => {
    if (tab === activeSubTab) return;
    window.history.replaceState({ isView: true, view: 'cadastros', subTab: tab }, '', `#cadastros?tab=${tab}`);
    setActiveSubTab(tab);
    setCurrentPage(1);
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Modal for Category (Create & Edit)
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<{ id: string; nome: string; tipo: 'receita' | 'despesa'; icone?: string; cor?: string } | null>(null);
  const [newCatNome, setNewCatNome] = useState('');
  const [newCatTipo, setNewCatTipo] = useState<'receita' | 'despesa'>('despesa');
  const [newCatIcone, setNewCatIcone] = useState('category');
  const [newCatCor, setNewCatCor] = useState('#835400');

  // Modal for Bank Account (Create & Edit)
  const [isBankAccountModalOpen, setIsBankAccountModalOpen] = useState(false);
  const [editingBankAccount, setEditingBankAccount] = useState<{ id: string; nome: string; banco: string; agenciaConta: string; saldo: number } | null>(null);
  const [newBankNome, setNewBankNome] = useState('');
  const [newBankBanco, setNewBankBanco] = useState('Banco do Brasil');
  const [newBankAgenciaConta, setNewBankAgenciaConta] = useState('');
  const [newBankSaldo, setNewBankSaldo] = useState<number | string>('0');

  // Modal for Business Partner (Create & Edit)
  const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<BusinessPartner | null>(null);
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

  const openNewPartnerModal = (tipo: PartnerType = 'fornecedor') => {
    setEditingPartner(null);
    setNewPartnerNome('');
    setNewPartnerFantasia('');
    setNewPartnerTipo(tipo);
    setNewPartnerDoc('');
    setNewPartnerContato('');
    setNewPartnerTelefone('');
    setNewPartnerEmail('');
    setNewPartnerCidadeUf('');
    setNewPartnerEndereco('');
    setNewPartnerRamo('');
    setIsPartnerModalOpen(true);
  };

  const openEditPartnerModal = (partner: BusinessPartner) => {
    setEditingPartner(partner);
    setNewPartnerNome(partner.nome || '');
    setNewPartnerFantasia(partner.nomeFantasia || '');
    setNewPartnerTipo(partner.tipo || 'fornecedor');
    setNewPartnerDoc(partner.documento || '');
    setNewPartnerContato(partner.contato || '');
    setNewPartnerTelefone(partner.telefone || '');
    setNewPartnerEmail(partner.email || '');
    setNewPartnerCidadeUf(partner.cidadeUf || '');
    setNewPartnerEndereco(partner.endereco || '');
    setNewPartnerRamo(partner.ramoAtividade || '');
    setIsPartnerModalOpen(true);
  };

  const handleSavePartner = (e: React.FormEvent) => {
    e.preventDefault();

    const validation = validateForm(partnerFormSchema, {
      nome: newPartnerNome,
      nomeFantasia: newPartnerFantasia,
      tipo: newPartnerTipo,
      documento: newPartnerDoc,
      contato: newPartnerContato,
      telefone: newPartnerTelefone,
      email: newPartnerEmail,
      cidadeUf: newPartnerCidadeUf,
      endereco: newPartnerEndereco,
      ramoAtividade: newPartnerRamo,
    });

    if (!validation.success) {
      showToast(validation.firstError, 'error');
      return;
    }

    if (editingPartner) {
      updatePartner(editingPartner.id, {
        nome: validation.data.nome,
        nomeFantasia: validation.data.nomeFantasia || undefined,
        tipo: validation.data.tipo,
        documento: validation.data.documento || undefined,
        contato: validation.data.contato || undefined,
        telefone: validation.data.telefone || undefined,
        email: validation.data.email || undefined,
        cidadeUf: validation.data.cidadeUf || undefined,
        endereco: validation.data.endereco || undefined,
        ramoAtividade: validation.data.ramoAtividade || undefined,
      });
      showToast(`Parceiro "${validation.data.nome}" atualizado com sucesso!`, 'success');
    } else {
      addPartner({
        nome: validation.data.nome,
        nomeFantasia: validation.data.nomeFantasia || undefined,
        tipo: validation.data.tipo,
        documento: validation.data.documento || undefined,
        contato: validation.data.contato || undefined,
        telefone: validation.data.telefone || undefined,
        email: validation.data.email || undefined,
        cidadeUf: validation.data.cidadeUf || undefined,
        endereco: validation.data.endereco || undefined,
        ramoAtividade: validation.data.ramoAtividade || undefined,
        status: 'ativo',
      });
      showToast(`Parceiro "${validation.data.nome}" cadastrado com sucesso!`, 'success');
    }

    setIsPartnerModalOpen(false);
  };

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

  const openNewCategoryModal = () => {
    setEditingCategory(null);
    setNewCatNome('');
    setNewCatTipo('despesa');
    setNewCatIcone('category');
    setNewCatCor('#835400');
    setIsCategoryModalOpen(true);
  };

  const openEditCategoryModal = (cat: { id: string; nome: string; tipo: 'receita' | 'despesa'; icone?: string; cor?: string }) => {
    setEditingCategory(cat);
    setNewCatNome(cat.nome);
    setNewCatTipo(cat.tipo);
    setNewCatIcone(cat.icone || 'category');
    setNewCatCor(cat.cor || (cat.tipo === 'receita' ? '#2F9E44' : '#835400'));
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();

    const validation = validateForm(categoryFormSchema, {
      nome: newCatNome,
      tipo: newCatTipo,
      icone: newCatIcone,
      cor: newCatCor || (newCatTipo === 'receita' ? '#2F9E44' : '#835400'),
    });

    if (!validation.success) {
      showToast(validation.firstError, 'error');
      return;
    }

    if (editingCategory) {
      updateCategory(editingCategory.id, {
        nome: validation.data.nome,
        tipo: validation.data.tipo,
        icone: validation.data.icone,
        cor: validation.data.cor,
      });
      showToast('Categoria atualizada com sucesso!', 'success');
    } else {
      addCategory({
        nome: validation.data.nome,
        tipo: validation.data.tipo,
        cor: validation.data.cor,
        icone: validation.data.icone,
      });
      showToast('Categoria adicionada com sucesso!', 'success');
    }
    setIsCategoryModalOpen(false);
  };

  const openNewBankAccountModal = () => {
    setEditingBankAccount(null);
    setNewBankNome('');
    setNewBankBanco('Banco do Brasil');
    setNewBankAgenciaConta('');
    setNewBankSaldo('0,00');
    setIsBankAccountModalOpen(true);
  };

  const openEditBankAccountModal = (acc: { id: string; nome: string; banco: string; agenciaConta: string; saldo: number }) => {
    setEditingBankAccount(acc);
    setNewBankNome(acc.nome);
    setNewBankBanco(acc.banco);
    setNewBankAgenciaConta(acc.agenciaConta);
    setNewBankSaldo(acc.saldo.toFixed(2).replace('.', ','));
    setIsBankAccountModalOpen(true);
  };

  const handleSaveBankAccount = (e: React.FormEvent) => {
    e.preventDefault();

    const validation = validateForm(bankAccountFormSchema, {
      nome: newBankNome,
      banco: newBankBanco,
      agenciaConta: newBankAgenciaConta,
      saldo: newBankSaldo,
    });

    if (!validation.success) {
      showToast(validation.firstError, 'error');
      return;
    }

    if (editingBankAccount) {
      updateBankAccount(editingBankAccount.id, {
        nome: validation.data.nome,
        banco: validation.data.banco,
        agenciaConta: validation.data.agenciaConta || 'Ag. Principal / C/C Operacional',
        saldo: validation.data.saldo,
      });
      showToast('Conta bancária atualizada com sucesso!', 'success');
    } else {
      addBankAccount({
        nome: validation.data.nome,
        banco: validation.data.banco,
        agenciaConta: validation.data.agenciaConta || 'Ag. Principal / C/C Operacional',
        saldo: validation.data.saldo,
      });
      showToast('Conta bancária adicionada com sucesso!', 'success');
    }
    setIsBankAccountModalOpen(false);
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
    <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1440px] mx-auto w-full flex flex-col gap-6 animate-in fade-in duration-200">
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

        <div className="flex items-center gap-2 flex-wrap">
          {activeSubTab === 'funcionarios' && (
            <>
              <Button
                variant="outline"
                icon="upload_file"
                onClick={() => {
                  setImportEntityType('colaboradores');
                  setIsImportModalOpen(true);
                }}
                title="Importar lista de colaboradores em formato CSV"
              >
                Importar (.CSV)
              </Button>
              <Button
                variant="outline"
                icon="download"
                onClick={() => exportEmployeesCsv(employees)}
                title="Exportar lista de colaboradores em formato CSV"
              >
                Exportar (.CSV)
              </Button>
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
            </>
          )}

          {activeSubTab === 'fornecedores' && (
            <>
              <Button
                variant="outline"
                icon="upload_file"
                onClick={() => {
                  setImportEntityType('parceiros');
                  setIsImportModalOpen(true);
                }}
                title="Importar parceiros e clientes em formato CSV"
              >
                Importar (.CSV)
              </Button>
              <Button
                variant="outline"
                icon="download"
                onClick={() => exportPartnersCsv(filteredPartners)}
                title="Exportar parceiros e clientes em formato CSV"
              >
                Exportar (.CSV)
              </Button>
              <Button
                variant="primary"
                icon="add_business"
                onClick={() => setIsPartnerModalOpen(true)}
              >
                Novo Parceiro / Cliente
              </Button>
            </>
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
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-[#DEE2E6] gap-2 overflow-x-auto pb-0.5 scrollbar-none flex-nowrap sm:flex-wrap">
        <button
          onClick={() => handleSubTabChange('funcionarios')}
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
          onClick={() => handleSubTabChange('fornecedores')}
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
          onClick={() => handleSubTabChange('categorias')}
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
          onClick={() => handleSubTabChange('contas')}
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
              <div className="w-full">
                {/* Desktop / Tablet Table */}
                <div className="hidden md:block w-full">
                  <table className="w-full text-left border-collapse table-fixed">
                    <thead className="bg-gray-50/80 border-b border-[#DEE2E6] text-xs font-bold text-gray-500">
                      <tr>
                        <th className="py-3 px-4 w-[28%]">Nome</th>
                        <th className="py-3 px-4 w-[16%]">Documento</th>
                        <th className="py-3 px-4 w-[18%]">Cargo</th>
                        <th className="py-3 px-4 w-[16%]">Telefone</th>
                        <th className="py-3 px-4 w-[12%]">Tags</th>
                        <th className="py-3 px-4 w-[10%]">Status</th>
                        <th className="py-3 px-4 w-20 text-center">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs divide-y divide-[#DEE2E6]">
                      {paginatedEmployees.map((emp) => (
                        <tr key={emp.id} className="hover:bg-gray-50/80 transition-colors">
                          <td className="py-3 px-4 font-bold text-[#010102] min-w-0">
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
                          <td className="py-3 px-4 font-mono text-gray-600 truncate text-[11px]">
                            {emp.documento}
                          </td>
                          <td className="py-3 px-4 text-gray-800 font-semibold truncate" title={emp.cargo}>
                            {emp.cargo}
                          </td>
                          <td className="py-3 px-4 font-mono text-gray-600 truncate text-[11px]">
                            {emp.telefone}
                          </td>
                          <td className="py-3 px-4">
                            {emp.isMotorista && (
                              <span className="inline-flex items-center gap-1 bg-amber-50 text-[#835400] px-2 py-0.5 rounded-full text-[10px] font-bold border border-amber-200">
                                <span className="material-symbols-outlined text-[12px]">local_shipping</span>
                                Motorista
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4">
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
                          <td className="py-3 px-4 text-center">
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
                                  setDeleteConfirmTarget({
                                    title: 'Excluir Colaborador',
                                    message: `Tem certeza que deseja remover o cadastro de ${emp.nome}? O histórico associado será preservado nos lançamentos.`,
                                    onConfirm: () => deleteEmployee(emp.id),
                                    details: [
                                      { label: 'Nome', value: emp.nome },
                                      { label: 'Cargo', value: emp.cargo },
                                      ...(emp.documento ? [{ label: 'CPF / Doc', value: emp.documento }] : []),
                                    ],
                                  });
                                }}
                              />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden divide-y divide-[#DEE2E6]">
                  {paginatedEmployees.map((emp) => (
                    <div key={emp.id} className="p-4 space-y-3 bg-white">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
                          <div className="w-9 h-9 rounded-full bg-[#835400] text-white flex items-center justify-center font-bold text-xs shrink-0">
                            {emp.avatarInitials || emp.nome.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-sm text-[#010102] truncate" title={emp.nome}>
                              {emp.nome}
                            </div>
                            <div className="text-xs text-gray-500 truncate font-semibold">
                              {emp.cargo}
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => toggleEmployeeStatus(emp.id)}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
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
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                        <div>
                          <span className="text-[10px] text-gray-400 uppercase font-bold block">Documento</span>
                          <span className="font-mono text-[11px] text-gray-700">{emp.documento || '—'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-gray-400 uppercase font-bold block">Telefone</span>
                          <span className="font-mono text-[11px] text-gray-700">{emp.telefone || '—'}</span>
                        </div>
                        {emp.email && (
                          <div className="col-span-2 truncate">
                            <span className="text-[10px] text-gray-400 uppercase font-bold block">E-mail</span>
                            <span className="text-[11px] text-gray-700 truncate block">{emp.email}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <div>
                          {emp.isMotorista && (
                            <span className="inline-flex items-center gap-1 bg-amber-50 text-[#835400] px-2 py-0.5 rounded-full text-[10px] font-bold border border-amber-200">
                              <span className="material-symbols-outlined text-[12px]">local_shipping</span>
                              Motorista
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            icon="edit"
                            onClick={() => handleEdit(emp)}
                          >
                            Editar
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            icon="delete"
                            className="text-gray-400 hover:text-red-600 hover:bg-red-50"
                            onClick={() => {
                              setDeleteConfirmTarget({
                                title: 'Excluir Colaborador',
                                message: `Tem certeza que deseja remover o cadastro de ${emp.nome}? O histórico associado será preservado nos lançamentos.`,
                                onConfirm: () => deleteEmployee(emp.id),
                                details: [
                                  { label: 'Nome', value: emp.nome },
                                  { label: 'Cargo', value: emp.cargo },
                                ],
                              });
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
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
                    openNewPartnerModal('fornecedor');
                  }}
                />
              ) : (
                <ul className="divide-y divide-gray-100 text-xs flex-1">
                  {fornecedoresList.map((f) => (
                    <li key={f.id} className="py-3.5 flex justify-between items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                          <p className="font-bold text-gray-900 truncate max-w-full">{f.nome}</p>
                          {f.nomeFantasia && f.nomeFantasia !== f.nome && (
                            <span className="text-gray-500 text-[11px] truncate">({f.nomeFantasia})</span>
                          )}
                        </div>
                        {f.ramoAtividade && (
                          <p className="text-gray-500 text-[11px] mt-0.5 truncate">{f.ramoAtividade}</p>
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
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => openEditPartnerModal(f)}
                          className="text-gray-500 hover:text-black hover:bg-gray-100 p-1.5 rounded-lg transition-colors cursor-pointer"
                          title="Editar fornecedor"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button
                          onClick={() => {
                            setDeleteConfirmTarget({
                              title: 'Excluir Parceiro / Fornecedor',
                              message: `Deseja remover ${f.nome} da lista de parceiros comerciais?`,
                              onConfirm: () => deletePartner(f.id),
                              details: [
                                { label: 'Razão Social / Nome', value: f.nome },
                                ...(f.documento ? [{ label: 'CNPJ/CPF', value: f.documento }] : []),
                              ],
                            });
                          }}
                          className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors cursor-pointer"
                          title="Excluir parceiro"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
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
                    openNewPartnerModal('cliente');
                  }}
                />
              ) : (
                <ul className="divide-y divide-gray-100 text-xs flex-1">
                  {clientesList.map((c) => (
                    <li key={c.id} className="py-3.5 flex justify-between items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                          <p className="font-bold text-gray-900 truncate max-w-full">{c.nome}</p>
                          {c.nomeFantasia && c.nomeFantasia !== c.nome && (
                            <span className="text-gray-500 text-[11px] truncate">({c.nomeFantasia})</span>
                          )}
                        </div>
                        {c.ramoAtividade && (
                          <p className="text-gray-500 text-[11px] mt-0.5 truncate">{c.ramoAtividade}</p>
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
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => openEditPartnerModal(c)}
                          className="text-gray-500 hover:text-black hover:bg-gray-100 p-1.5 rounded-lg transition-colors cursor-pointer"
                          title="Editar cliente"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button
                          onClick={() => {
                            setDeleteConfirmTarget({
                              title: 'Excluir Cliente',
                              message: `Deseja remover ${c.nome} da lista de clientes cadastrados?`,
                              onConfirm: () => deletePartner(c.id),
                              details: [
                                { label: 'Razão Social / Nome', value: c.nome },
                                ...(c.documento ? [{ label: 'CNPJ/CPF', value: c.documento }] : []),
                              ],
                            });
                          }}
                          className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors cursor-pointer"
                          title="Excluir cliente"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
            <div>
              <h3 className="font-bold text-[#010102] text-base flex items-center gap-2">
                <span className="material-symbols-outlined text-[#835400] text-[20px]">category</span>
                Categorias do Livro Caixa e DRE ({categories.length})
              </h3>
              <p className="text-xs text-gray-500">
                Estrutura contábil para classificação de receitas operacionais e despesas da usina de asfalto
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              icon="add"
              onClick={openNewCategoryModal}
            >
              Adicionar Categoria
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="p-4 rounded-xl border border-[#DEE2E6] bg-gray-50/50 flex items-center justify-between hover:bg-white hover:shadow-xs transition-all group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div 
                    className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${cat.cor || '#835400'}20` }}
                  >
                    <span
                      className="material-symbols-outlined text-[20px]"
                      style={{ color: cat.cor || (cat.tipo === 'receita' ? '#2F9E44' : '#835400') }}
                    >
                      {cat.icone || 'label'}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-xs text-[#010102] truncate">{cat.nome}</p>
                    <span
                      className={`text-[10px] uppercase font-bold tracking-wider ${
                        cat.tipo === 'receita' ? 'text-[#2F9E44]' : 'text-[#835400]'
                      }`}
                    >
                      {cat.tipo}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEditCategoryModal(cat)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-[#835400] hover:bg-[#FFF4E6] transition-colors cursor-pointer"
                    title="Editar categoria"
                  >
                    <span className="material-symbols-outlined text-[16px]">edit</span>
                  </button>
                  <button
                    onClick={() => {
                      setDeleteConfirmTarget({
                        title: 'Excluir Categoria Contábil',
                        message: `Deseja excluir a categoria "${cat.nome}"? Lançamentos antigos manterão seu registro de texto.`,
                        onConfirm: () => deleteCategory(cat.id),
                        details: [
                          { label: 'Categoria', value: cat.nome },
                          { label: 'Tipo', value: cat.tipo === 'receita' ? 'Receita' : 'Despesa' },
                        ],
                      });
                    }}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                    title="Excluir categoria"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SubTab 4: Contas Bancárias */}
      {activeSubTab === 'contas' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#DEE2E6] shadow-xs">
            <div>
              <h3 className="font-bold text-[#010102] text-base flex items-center gap-2">
                <span className="material-symbols-outlined text-[#835400] text-[20px]">account_balance</span>
                Contas Bancárias & Caixas ({bankAccounts.length})
              </h3>
              <p className="text-xs text-gray-500">
                Gerenciamento de contas correntes, aplicações e caixas internos da usina
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              icon="add"
              onClick={openNewBankAccountModal}
            >
              Adicionar Conta Bancária
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {bankAccounts.map((acc) => (
              <div
                key={acc.id}
                className="bg-white p-6 rounded-2xl border border-[#DEE2E6] shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow group"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-gray-500 uppercase">{acc.banco}</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditBankAccountModal(acc)}
                        className="p-1 rounded text-gray-400 hover:text-[#835400] hover:bg-[#FFF4E6] transition-colors cursor-pointer"
                        title="Editar conta bancária"
                      >
                        <span className="material-symbols-outlined text-[16px]">edit</span>
                      </button>
                      <button
                        onClick={() => {
                          setDeleteConfirmTarget({
                            title: 'Excluir Conta Bancária / Caixa',
                            message: `Deseja excluir o registro da conta "${acc.nome}"?`,
                            onConfirm: () => deleteBankAccount(acc.id),
                            details: [
                              { label: 'Conta / Caixa', value: acc.nome },
                              { label: 'Instituição', value: acc.banco },
                              { label: 'Agência / Conta', value: acc.agenciaConta },
                            ],
                          });
                        }}
                        className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                        title="Excluir conta bancária"
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    </div>
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
        </div>
      )}

      {/* Modal Categoria (Nova ou Editar) */}
      <Modal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        title={editingCategory ? 'Editar Categoria Financeira' : 'Nova Categoria Financeira'}
        subtitle="Defina o nome, tipo e ícone da classificação contábil."
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
              onClick={handleSaveCategory}
            >
              {editingCategory ? 'Salvar Alterações' : 'Criar Categoria'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveCategory} className="flex flex-col gap-4">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                { value: 'badge', label: 'Folha de Pagamento' },
                { value: 'payments', label: 'Receita de Venda' },
              ]}
            />

            <div>
              <label className="text-xs font-bold text-[#010102] block mb-1.5">Cor da Etiqueta</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={newCatCor}
                  onChange={(e) => setNewCatCor(e.target.value)}
                  className="w-10 h-10 rounded-lg border border-gray-300 p-1 cursor-pointer"
                />
                <span className="text-xs text-gray-500 font-mono">{newCatCor}</span>
              </div>
            </div>
          </div>
        </form>
      </Modal>

      {/* Modal Conta Bancária (Nova ou Editar) */}
      <Modal
        isOpen={isBankAccountModalOpen}
        onClose={() => setIsBankAccountModalOpen(false)}
        title={editingBankAccount ? 'Editar Conta Bancária' : 'Nova Conta Bancária / Caixa'}
        subtitle="Cadastre agência, número de conta e saldo para controle do livro caixa."
        footer={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsBankAccountModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon="save"
              onClick={handleSaveBankAccount}
            >
              {editingBankAccount ? 'Salvar Alterações' : 'Cadastrar Conta'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveBankAccount} className="flex flex-col gap-4">
          <Input
            label="Nome da Conta / Identificação *"
            placeholder="Ex: Banco do Brasil - Conta Operacional"
            value={newBankNome}
            onChange={(e) => setNewBankNome(e.target.value)}
            required
            autoFocus
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Instituição Financeira *"
              value={newBankBanco}
              onChange={(e) => setNewBankBanco(e.target.value)}
              options={[
                { value: 'Banco do Brasil', label: 'Banco do Brasil' },
                { value: 'Itaú Unibanco', label: 'Itaú Unibanco' },
                { value: 'Bradesco', label: 'Bradesco' },
                { value: 'Santander', label: 'Santander' },
                { value: 'Caixa Econômica', label: 'Caixa Econômica Federal' },
                { value: 'Sicoob', label: 'Sicoob' },
                { value: 'Sicredi', label: 'Sicredi' },
                { value: 'BTG Pactual', label: 'BTG Pactual' },
                { value: 'Caixa Interno (Espécie)', label: 'Caixa Interno da Usina' },
              ]}
            />
            <Input
              label="Agência e Conta *"
              placeholder="Ex: Ag: 1234-5 / CC: 98765-4"
              value={newBankAgenciaConta}
              onChange={(e) => setNewBankAgenciaConta(e.target.value)}
              required
            />
          </div>

          <Input
            label="Saldo Inicial (R$)"
            type="number"
            step="0.01"
            placeholder="0.00"
            value={newBankSaldo}
            onChange={(e) => setNewBankSaldo(e.target.value)}
          />
        </form>
      </Modal>

      {/* Modal Parceiro Comercial (Novo & Edição) */}
      <Modal
        isOpen={isPartnerModalOpen}
        onClose={() => setIsPartnerModalOpen(false)}
        title={editingPartner ? `Editar: ${editingPartner.nome}` : 'Novo Parceiro Comercial'}
        subtitle={
          editingPartner
            ? 'Atualize os dados cadastrais e de contato do parceiro comercial.'
            : 'Cadastre clientes ou fornecedores para agilizar propostas e lançamentos.'
        }
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
              onClick={handleSavePartner}
            >
              {editingPartner ? 'Salvar Alterações' : 'Salvar Parceiro'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSavePartner} className="flex flex-col gap-3">
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

      {/* Confirmation Modal for Cadastros */}
      <ConfirmModal
        isOpen={!!deleteConfirmTarget}
        onClose={() => setDeleteConfirmTarget(null)}
        onConfirm={() => {
          if (deleteConfirmTarget) {
            deleteConfirmTarget.onConfirm();
            setDeleteConfirmTarget(null);
          }
        }}
        title={deleteConfirmTarget?.title || 'Confirmar Exclusão'}
        message={deleteConfirmTarget?.message || 'Deseja realmente excluir este item?'}
        confirmText="Sim, Excluir Registro"
        cancelText="Cancelar"
        variant="danger"
        icon="delete"
        itemDetails={deleteConfirmTarget?.details}
      />

      {/* Import Modal */}
      <ImportDataModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        entityType={importEntityType}
      />
    </div>
  );
};
