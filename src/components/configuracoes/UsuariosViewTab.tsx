import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { SystemUser, UserRole } from '../../types';
import { Button } from '../common/Button';
import { ROLE_PERMISSIONS_MAP } from '../../data/initialData';

const ROLE_INFO: Record<UserRole, { label: string; badgeBg: string; badgeText: string; desc: string; icon: string }> = {
  admin: {
    label: 'Diretoria (Admin)',
    badgeBg: 'bg-amber-100 border-amber-300 text-amber-900',
    badgeText: 'Acesso Total',
    desc: 'Visão 360°, aprovação de orçamentos, relatórios fiscais, gestão de usuários e backup.',
    icon: 'shield_person'
  },
  financeiro: {
    label: 'Gerência Financeira',
    badgeBg: 'bg-blue-100 border-blue-300 text-blue-900',
    badgeText: 'Finanças & Contas',
    desc: 'Fluxo de caixa, conciliação bancária, contas a pagar/receber, DRE e baixas de títulos.',
    icon: 'account_balance'
  },
  comercial: {
    label: 'Engenharia & Comercial',
    badgeBg: 'bg-emerald-100 border-emerald-300 text-emerald-900',
    badgeText: 'Vendas & Propostas',
    desc: 'Emissão e conversão de propostas de CBUQ/massa asfáltica e cálculo de frete.',
    icon: 'request_quote'
  },
  operador: {
    label: 'Operador de Balança / Usina',
    badgeBg: 'bg-orange-100 border-orange-300 text-orange-900',
    badgeText: 'Operações de Pista',
    desc: 'Lançamentos rápidos de despesas na pista (diesel, diárias) e conferência de motoristas.',
    icon: 'local_shipping'
  }
};

const AVATAR_PRESETS = [
  { id: '1', url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB7LkHlJKY7QjurPQFmQAzY7wrUoQvzbkf96mcEvjVg4yWEewc9S01rdk5-KwEfqKsLoY_Ui6xuWB3CJxdksTsQsmZhoXuFwLBuRIGqnG9nvnagE4qFD2RBIaHW3ub0GXDb_0xHACM5AkJKCEQYF7ksj-FlERm_EH2mzPxoalt1JfT364i_D3AEKOgsj7oic4VGcn6Gzw92ljQdO41U8AwbhqqSugM464BKj51SwUv_pd0kM9lCg7cpOw', label: 'Diretoria' },
  { id: '2', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80', label: 'Financeiro' },
  { id: '3', url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80', label: 'Engenharia' },
  { id: '4', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', label: 'Operador' },
  { id: '5', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', label: 'Supervisão' },
  { id: '6', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80', label: 'Balança' }
];

export const UsuariosViewTab: React.FC = () => {
  const {
    systemUsers,
    user: currentUser,
    switchUser,
    addSystemUser,
    updateSystemUser,
    toggleSystemUserStatus,
    deleteSystemUser,
    showToast
  } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('operador');
  const [roleTitle, setRoleTitle] = useState('');
  const [department, setDepartment] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(AVATAR_PRESETS[0].url);
  const [showMatrix, setShowMatrix] = useState(false);

  const handleOpenAddModal = () => {
    setEditingUser(null);
    setName('');
    setEmail('');
    setRole('operador');
    setRoleTitle('Operador de Balança');
    setDepartment('Usina & Operações');
    setPhone('');
    setAvatarUrl(AVATAR_PRESETS[3].url);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (user: SystemUser) => {
    setEditingUser(user);
    setName(user.name);
    setEmail(user.email);
    setRole(user.role);
    setRoleTitle(user.roleTitle);
    setDepartment(user.department);
    setPhone(user.phone || '');
    setAvatarUrl(user.avatarUrl);
    setIsModalOpen(true);
  };

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    if (!editingUser) {
      if (newRole === 'admin') {
        setRoleTitle('Diretor de Operações');
        setDepartment('Diretoria Executiva');
        setAvatarUrl(AVATAR_PRESETS[0].url);
      } else if (newRole === 'financeiro') {
        setRoleTitle('Analista Financeiro');
        setDepartment('Controladoria & Finanças');
        setAvatarUrl(AVATAR_PRESETS[1].url);
      } else if (newRole === 'comercial') {
        setRoleTitle('Engenheiro de Vendas');
        setDepartment('Comercial & Orçamentos');
        setAvatarUrl(AVATAR_PRESETS[2].url);
      } else {
        setRoleTitle('Operador de Balança');
        setDepartment('Usina & Operações');
        setAvatarUrl(AVATAR_PRESETS[3].url);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      showToast('Por favor, preencha nome e e-mail do usuário.', 'error');
      return;
    }

    if (editingUser) {
      updateSystemUser(editingUser.id, {
        name,
        email,
        role,
        roleTitle: roleTitle || ROLE_INFO[role].label,
        department: department || 'Usina de Asfalto',
        phone,
        avatarUrl
      });
    } else {
      addSystemUser({
        name,
        email,
        role,
        roleTitle: roleTitle || ROLE_INFO[role].label,
        department: department || 'Usina de Asfalto',
        phone,
        avatarUrl,
        status: 'ativo'
      });
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Overview Cards & Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {(Object.keys(ROLE_INFO) as UserRole[]).map((r) => {
          const info = ROLE_INFO[r];
          const count = systemUsers.filter((u) => u.role === r && u.status === 'ativo').length;
          return (
            <div
              key={r}
              className="bg-white p-4 rounded-2xl border border-[#DEE2E6] shadow-xs flex items-start gap-3.5"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${info.badgeBg}`}>
                <span className="material-symbols-outlined text-[22px]">{info.icon}</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <h4 className="text-xs font-bold text-[#010102] truncate">{info.label}</h4>
                  <span className="text-xs font-black text-gray-900 px-1.5 py-0.2 bg-gray-100 rounded-md">
                    {count}
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 line-clamp-2 mt-1 leading-snug">
                  {info.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Users Table Box */}
      <div className="bg-white rounded-2xl border border-[#DEE2E6] shadow-xs overflow-hidden">
        {/* Table Header Controls */}
        <div className="p-5 border-b border-[#E5E2E1] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-[#010102] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#835400]">group</span>
              Usuários do Sistema & Níveis de Acesso (RBAC)
            </h3>
            <p className="text-xs text-gray-600 mt-0.5">
              Gerencie a equipe da usina, atribua perfis de segurança e controle quem tem acesso a saldos bancários e orçamentos.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="secondary"
              size="sm"
              icon="rule"
              onClick={() => setShowMatrix(!showMatrix)}
            >
              {showMatrix ? 'Ocultar Matriz de Regras' : 'Ver Matriz de Permissões'}
            </Button>

            <Button
              variant="primary"
              size="sm"
              icon="person_add"
              onClick={handleOpenAddModal}
            >
              Novo Usuário
            </Button>
          </div>
        </div>

        {/* Permissions Matrix Drawer (Collapsible) */}
        {showMatrix && (
          <div className="p-5 bg-gray-50 border-b border-[#E5E2E1] animate-in slide-in-from-top-2 duration-150">
            <h4 className="text-xs font-bold text-[#010102] uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm text-[#835400]">table_view</span>
              Matriz de Permissões por Perfil de Acesso
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse bg-white rounded-xl overflow-hidden border border-gray-200">
                <thead>
                  <tr className="bg-gray-100 text-gray-700 font-bold border-b border-gray-200">
                    <th className="p-3">Módulo / Ação</th>
                    <th className="p-3 text-center text-amber-900 bg-amber-50/50">Diretoria (Admin)</th>
                    <th className="p-3 text-center text-blue-900 bg-blue-50/50">Financeiro</th>
                    <th className="p-3 text-center text-emerald-900 bg-emerald-50/50">Comercial / Vendas</th>
                    <th className="p-3 text-center text-orange-900 bg-orange-50/50">Operador Balança</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-[11px]">
                  <tr>
                    <td className="p-3 font-semibold text-gray-800">Dashboard & Indicadores Operacionais</td>
                    <td className="p-3 text-center text-emerald-600 font-bold">✓ Liberado</td>
                    <td className="p-3 text-center text-emerald-600 font-bold">✓ Liberado</td>
                    <td className="p-3 text-center text-emerald-600 font-bold">✓ Liberado</td>
                    <td className="p-3 text-center text-emerald-600 font-bold">✓ Liberado</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-gray-800">Visualizar Saldo Bancário & DRE Sigiloso</td>
                    <td className="p-3 text-center text-emerald-600 font-bold">✓ Liberado</td>
                    <td className="p-3 text-center text-emerald-600 font-bold">✓ Liberado</td>
                    <td className="p-3 text-center text-red-500 font-semibold">✗ Oculto</td>
                    <td className="p-3 text-center text-red-500 font-semibold">✗ Oculto</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-gray-800">Lançamentos de Despesas & Receitas</td>
                    <td className="p-3 text-center text-emerald-600 font-bold">✓ Total</td>
                    <td className="p-3 text-center text-emerald-600 font-bold">✓ Total</td>
                    <td className="p-3 text-center text-gray-400">✗ Somente Leitura</td>
                    <td className="p-3 text-center text-orange-600 font-bold">✓ Despesas Pista</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-gray-800">Contas a Pagar & Receber (Baixas)</td>
                    <td className="p-3 text-center text-emerald-600 font-bold">✓ Total</td>
                    <td className="p-3 text-center text-emerald-600 font-bold">✓ Total</td>
                    <td className="p-3 text-center text-red-500 font-semibold">✗ Sem Acesso</td>
                    <td className="p-3 text-center text-red-500 font-semibold">✗ Sem Acesso</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-gray-800">Calculadora & Emissão de Orçamentos A4</td>
                    <td className="p-3 text-center text-emerald-600 font-bold">✓ Total</td>
                    <td className="p-3 text-center text-emerald-600 font-bold">✓ Total</td>
                    <td className="p-3 text-center text-emerald-600 font-bold">✓ Total (Vendas)</td>
                    <td className="p-3 text-center text-red-500 font-semibold">✗ Sem Acesso</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-gray-800">Configurações Mestres, Backup & Usuários</td>
                    <td className="p-3 text-center text-emerald-600 font-bold">✓ Total</td>
                    <td className="p-3 text-center text-red-500 font-semibold">✗ Bloqueado</td>
                    <td className="p-3 text-center text-red-500 font-semibold">✗ Bloqueado</td>
                    <td className="p-3 text-center text-red-500 font-semibold">✗ Bloqueado</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Users Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50/75 text-gray-600 border-b border-[#E5E2E1] font-bold">
                <th className="py-3 px-4">Usuário</th>
                <th className="py-3 px-4">E-mail & Telefone</th>
                <th className="py-3 px-4">Perfil & Regra</th>
                <th className="py-3 px-4">Departamento / Cargo</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {systemUsers.map((u) => {
                const isCurrentActive = currentUser.id === u.id || currentUser.email === u.email;
                const roleMeta = ROLE_INFO[u.role] || ROLE_INFO.operador;

                return (
                  <tr
                    key={u.id}
                    className={`hover:bg-gray-50/70 transition-colors ${
                      isCurrentActive ? 'bg-amber-50/40' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-gray-300 relative">
                          <img
                            src={u.avatarUrl}
                            alt={u.name}
                            className="w-full h-full object-cover"
                          />
                          {isCurrentActive && (
                            <span
                              className="absolute bottom-0 right-0 w-3 h-3 bg-[#2F9E44] border-2 border-white rounded-full"
                              title="Usuário Atual em Sessão"
                            />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#010102] text-sm truncate">
                              {u.name}
                            </span>
                            {isCurrentActive && (
                              <span className="px-1.5 py-0.5 bg-amber-200/70 text-amber-900 text-[10px] font-bold rounded">
                                VOCÊ
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-gray-500 block truncate">
                            Criado em: {new Date(u.createdAt).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5">
                        <span className="text-gray-900 font-medium block truncate">
                          {u.email}
                        </span>
                        <span className="text-[11px] text-gray-500 block">
                          {u.phone || 'Sem telefone'}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold shrink-0 shadow-2xs ${roleMeta.badgeBg}`}>
                        <span className="material-symbols-outlined text-[16px]">{roleMeta.icon}</span>
                        <span>{roleMeta.label}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div>
                        <span className="font-semibold text-gray-900 block truncate">{u.roleTitle}</span>
                        <span className="text-[11px] text-gray-500 block truncate">{u.department}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => toggleSystemUserStatus(u.id)}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                          u.status === 'ativo'
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                        }`}
                        title="Clique para alternar Ativo / Inativo"
                      >
                        {u.status === 'ativo' ? '● Ativo' : '○ Inativo'}
                      </button>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {!isCurrentActive && u.status === 'ativo' && (
                          <button
                            onClick={() => switchUser(u.id)}
                            className="p-1.5 text-xs text-[#835400] hover:bg-amber-100 rounded-lg flex items-center gap-1 font-bold transition-colors"
                            title="Entrar/Simular visão deste usuário"
                          >
                            <span className="material-symbols-outlined text-[18px]">login</span>
                            <span className="hidden xl:inline">Alternar</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleOpenEditModal(u)}
                          className="p-1.5 text-gray-600 hover:text-black hover:bg-gray-100 rounded-lg transition-colors"
                          title="Editar Usuário"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>

                        <button
                          onClick={() => {
                            if (confirm(`Deseja realmente remover o usuário ${u.name}?`)) {
                              deleteSystemUser(u.id);
                            }
                          }}
                          disabled={systemUsers.length <= 1}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-30 transition-colors"
                          title="Excluir Usuário"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Novo / Editar Usuário */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-[#DEE2E6] shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-[#E5E2E1] flex items-center justify-between">
              <h3 className="text-base font-bold text-[#010102] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#835400]">
                  {editingUser ? 'manage_accounts' : 'person_add'}
                </span>
                {editingUser ? 'Editar Usuário do Sistema' : 'Novo Usuário do Sistema'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 p-1 rounded-lg"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-800 mb-1">Nome Completo *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Valdir Martins"
                  required
                  className="w-full px-3 py-2 border border-[#C7C6CA] rounded-lg focus:border-[#010102] focus:ring-1 focus:ring-[#010102] outline-none text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-800 mb-1">E-mail de Login *</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="valdir@asphaltpro.com.br"
                    required
                    className="w-full px-3 py-2 border border-[#C7C6CA] rounded-lg focus:border-[#010102] focus:ring-1 focus:ring-[#010102] outline-none text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-800 mb-1">Telefone / WhatsApp</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(11) 98765-4321"
                    className="w-full px-3 py-2 border border-[#C7C6CA] rounded-lg focus:border-[#010102] focus:ring-1 focus:ring-[#010102] outline-none text-xs"
                  />
                </div>
              </div>

              {/* Role Selection */}
              <div>
                <label className="block font-bold text-gray-800 mb-1.5">
                  Perfil de Segurança & Regra (RBAC) *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(Object.keys(ROLE_INFO) as UserRole[]).map((r) => {
                    const info = ROLE_INFO[r];
                    const isSelected = role === r;
                    return (
                      <button
                        type="button"
                        key={r}
                        onClick={() => handleRoleChange(r)}
                        className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'border-[#835400] bg-amber-50/60 ring-1 ring-[#835400]'
                            : 'border-gray-200 bg-gray-50/50 hover:bg-gray-100/70'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[18px] text-[#835400]">
                            {info.icon}
                          </span>
                          <span className="font-bold text-[#010102]">{info.label}</span>
                        </div>
                        <span className="text-[10px] text-gray-500 mt-1 line-clamp-2">
                          {info.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block font-bold text-gray-800 mb-1">Cargo / Função</label>
                  <input
                    type="text"
                    value={roleTitle}
                    onChange={(e) => setRoleTitle(e.target.value)}
                    placeholder="Ex: Operador Chefe de Balança"
                    className="w-full px-3 py-2 border border-[#C7C6CA] rounded-lg focus:border-[#010102] focus:ring-1 focus:ring-[#010102] outline-none text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-800 mb-1">Departamento</label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="Ex: Operações de Usina"
                    className="w-full px-3 py-2 border border-[#C7C6CA] rounded-lg focus:border-[#010102] focus:ring-1 focus:ring-[#010102] outline-none text-xs"
                  />
                </div>
              </div>

              {/* Avatar Picker */}
              <div>
                <label className="block font-bold text-gray-800 mb-1.5">Avatar / Foto de Perfil</label>
                <div className="flex items-center gap-2 mb-2 overflow-x-auto pb-1">
                  {AVATAR_PRESETS.map((preset) => (
                    <button
                      type="button"
                      key={preset.id}
                      onClick={() => setAvatarUrl(preset.url)}
                      className={`w-10 h-10 rounded-full overflow-hidden shrink-0 border-2 transition-all ${
                        avatarUrl === preset.url
                          ? 'border-[#835400] ring-2 ring-amber-300 scale-105'
                          : 'border-gray-200 opacity-60 hover:opacity-100'
                      }`}
                      title={preset.label}
                    >
                      <img src={preset.url} alt={preset.label} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="Ou cole a URL direta de uma foto..."
                  className="w-full px-3 py-1.5 border border-[#C7C6CA] rounded-lg text-[11px] text-gray-600 focus:border-[#010102] outline-none"
                />
              </div>

              {/* Footer Buttons */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  icon="check"
                >
                  {editingUser ? 'Salvar Alterações' : 'Cadastrar Usuário'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
