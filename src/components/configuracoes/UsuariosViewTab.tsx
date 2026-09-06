import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { SystemUser, UserRole } from '../../types';
import { Button } from '../common/Button';
import { ConfirmModal } from '../common/ConfirmModal';
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
  const [userToDelete, setUserToDelete] = useState<SystemUser | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [offlinePassword, setOfflinePassword] = useState('');
  const [showModalPassword, setShowModalPassword] = useState(false);
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
    setOfflinePassword('');
    setShowModalPassword(false);
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
    setOfflinePassword(user.offlinePassword || '');
    setShowModalPassword(false);
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
        offlinePassword: offlinePassword.trim() || undefined,
        role,
        roleTitle: roleTitle || ROLE_INFO[role].label,
        department: department || 'Usina de Asfalto',
        phone,
        avatarUrl
      });
      showToast(`Usuário ${name} atualizado com sucesso!`, 'success');
    } else {
      addSystemUser({
        name,
        email,
        offlinePassword: offlinePassword.trim() || undefined,
        role,
        roleTitle: roleTitle || ROLE_INFO[role].label,
        department: department || 'Usina de Asfalto',
        phone,
        avatarUrl,
        status: 'ativo'
      });
      showToast(`Novo usuário ${name} autorizado e cadastrado!`, 'success');
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

      {/* Security Architecture Whitelist Banner */}
      <div className="bg-gradient-to-r from-[#010102] to-[#141D24] rounded-2xl p-5 border border-[#2a2a2e] text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-emerald-400 text-[22px]">verified_user</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-white">Whitelist Corporativa & Segurança Híbrida</h4>
              <span className="text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                Ativa
              </span>
            </div>
            <p className="text-xs text-gray-300 mt-1 leading-relaxed max-w-3xl">
              <strong>1. Autenticação Online (Google Workspace / Gmail):</strong> O e-mail cadastrado na tabela abaixo atua como <span className="text-emerald-300 font-semibold">Whitelist oficial</span>. Somente colaboradores com e-mail ativo nesta lista têm permissão de acessar via Google Auth e sincronizar dados na nuvem.
              <br className="hidden sm:block" />
              <strong>2. Autenticação Offline (Pista / Balança):</strong> Cada operador possui sua senha local individual com proteção de <em>Rate Limiting</em> (bloqueio temporário após 5 tentativas incorretas).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 md:self-center">
          <Button
            variant="primary"
            size="sm"
            icon="person_add"
            onClick={handleOpenAddModal}
          >
            Autorizar Novo E-mail
          </Button>
        </div>
      </div>

      {/* Main Users Table Box */}
      <div className="bg-white rounded-2xl border border-[#DEE2E6] shadow-xs overflow-hidden">
        {/* Table Header Controls */}
        <div className="p-5 border-b border-[#E5E2E1] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-[#010102] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#835400]">group</span>
              Usuários do Sistema & Níveis de Acesso
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
          <div className="p-4 sm:p-5 bg-gray-50 border-b border-[#E5E2E1] animate-in slide-in-from-top-2 duration-150">
            <h4 className="text-xs font-bold text-[#010102] uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm text-[#835400]">table_view</span>
              Matriz de Permissões por Perfil de Acesso
            </h4>
            {/* Desktop Table */}
            <div className="hidden md:block w-full">
              <table className="w-full text-left text-xs border-collapse bg-white rounded-xl overflow-hidden border border-gray-200 table-fixed">
                <thead>
                  <tr className="bg-gray-100 text-gray-700 font-bold border-b border-gray-200">
                    <th className="p-3">Módulo / Ação</th>
                    <th className="p-3 text-center text-amber-900 bg-amber-50/50 w-36">Diretoria (Admin)</th>
                    <th className="p-3 text-center text-blue-900 bg-blue-50/50 w-36">Financeiro</th>
                    <th className="p-3 text-center text-emerald-900 bg-emerald-50/50 w-36">Comercial / Vendas</th>
                    <th className="p-3 text-center text-orange-900 bg-orange-50/50 w-36">Operador Balança</th>
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

            {/* Mobile Matrix Cards */}
            <div className="md:hidden space-y-3">
              {[
                { module: 'Dashboard & Indicadores Operacionais', roles: { admin: '✓ Liberado', financeiro: '✓ Liberado', comercial: '✓ Liberado', operador: '✓ Liberado' } },
                { module: 'Visualizar Saldo Bancário & DRE Sigiloso', roles: { admin: '✓ Liberado', financeiro: '✓ Liberado', comercial: '✗ Oculto', operador: '✗ Oculto' } },
                { module: 'Lançamentos de Despesas & Receitas', roles: { admin: '✓ Total', financeiro: '✓ Total', comercial: '✗ Somente Leitura', operador: '✓ Despesas Pista' } },
                { module: 'Contas a Pagar & Receber (Baixas)', roles: { admin: '✓ Total', financeiro: '✓ Total', comercial: '✗ Sem Acesso', operador: '✗ Sem Acesso' } },
                { module: 'Calculadora & Emissão de Orçamentos A4', roles: { admin: '✓ Total', financeiro: '✓ Total', comercial: '✓ Total (Vendas)', operador: '✗ Sem Acesso' } },
                { module: 'Configurações Mestres, Backup & Usuários', roles: { admin: '✓ Total', financeiro: '✗ Bloqueado', comercial: '✗ Bloqueado', operador: '✗ Bloqueado' } },
              ].map((item, idx) => (
                <div key={idx} className="bg-white p-3 rounded-xl border border-gray-200 space-y-2">
                  <div className="font-bold text-xs text-gray-800">{item.module}</div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="bg-amber-50/70 p-1.5 rounded">
                      <span className="text-[10px] block text-amber-800 font-bold">Admin / Diretoria</span>
                      <span className="font-semibold text-emerald-700">{item.roles.admin}</span>
                    </div>
                    <div className="bg-blue-50/70 p-1.5 rounded">
                      <span className="text-[10px] block text-blue-800 font-bold">Financeiro</span>
                      <span className="font-semibold text-emerald-700">{item.roles.financeiro}</span>
                    </div>
                    <div className="bg-emerald-50/70 p-1.5 rounded">
                      <span className="text-[10px] block text-emerald-800 font-bold">Comercial</span>
                      <span className={item.roles.comercial.startsWith('✓') ? 'font-semibold text-emerald-700' : 'text-gray-500'}>
                        {item.roles.comercial}
                      </span>
                    </div>
                    <div className="bg-orange-50/70 p-1.5 rounded">
                      <span className="text-[10px] block text-orange-800 font-bold">Operador</span>
                      <span className={item.roles.operador.startsWith('✓') ? 'font-semibold text-orange-700' : 'text-gray-500'}>
                        {item.roles.operador}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Users Table / List */}
        <div>
          {/* Desktop Table */}
          <div className="hidden md:block w-full">
            <table className="w-full text-left text-xs border-collapse table-fixed">
              <thead>
                <tr className="bg-gray-50/75 text-gray-600 border-b border-[#E5E2E1] font-bold">
                  <th className="py-3 px-4 w-[28%]">Usuário</th>
                  <th className="py-3 px-4 w-[24%]">E-mail & Telefone</th>
                  <th className="py-3 px-4 w-[18%]">Perfil & Regra</th>
                  <th className="py-3 px-4 w-[18%]">Departamento / Cargo</th>
                  <th className="py-3 px-4 w-[12%] text-center">Status</th>
                  <th className="py-3 px-4 w-28 text-right">Ações</th>
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
                      <td className="py-3.5 px-4 min-w-0">
                        <div className="flex items-center gap-3 min-w-0">
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
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-[#010102] text-sm truncate">
                                {u.name}
                              </span>
                              {isCurrentActive && (
                                <span className="px-1.5 py-0.5 bg-amber-200/70 text-amber-900 text-[10px] font-bold rounded shrink-0">
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

                      <td className="py-3.5 px-4 min-w-0">
                        <div className="space-y-1 min-w-0">
                          <span className="text-gray-900 font-medium block truncate">
                            {u.email}
                          </span>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                                u.status === 'ativo'
                                  ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                                  : 'text-gray-500 bg-gray-100 border-gray-200 line-through'
                              }`}
                              title={
                                u.status === 'ativo'
                                  ? 'E-mail autorizado para Login Google (Whitelist Ativa)'
                                  : 'Acesso Google Bloqueado (Usuário Inativo)'
                              }
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  u.status === 'ativo' ? 'bg-emerald-500' : 'bg-gray-400'
                                }`}
                              />
                              Google Auth
                            </span>

                            {u.offlinePassword ? (
                              <span
                                className="inline-flex items-center gap-0.5 text-[9px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200"
                                title="Senha offline configurada para balança/pista"
                              >
                                <span className="material-symbols-outlined text-[11px] text-amber-700">
                                  key
                                </span>
                                Offline OK
                              </span>
                            ) : (
                              <span
                                className="inline-flex items-center gap-0.5 text-[9px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-200"
                                title="Sem senha offline definida"
                              >
                                Sem Senha Off
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold shrink-0 shadow-2xs ${roleMeta.badgeBg}`}>
                          <span className="material-symbols-outlined text-[16px]">{roleMeta.icon}</span>
                          <span>{roleMeta.label}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 min-w-0">
                        <div className="min-w-0">
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
                            onClick={() => setUserToDelete(u)}
                            disabled={systemUsers.length <= 1}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-30 transition-colors cursor-pointer"
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

          {/* Mobile User Cards */}
          <div className="md:hidden divide-y divide-gray-200">
            {systemUsers.map((u) => {
              const isCurrentActive = currentUser.id === u.id || currentUser.email === u.email;
              const roleMeta = ROLE_INFO[u.role] || ROLE_INFO.operador;

              return (
                <div
                  key={u.id}
                  className={`p-4 space-y-3 ${isCurrentActive ? 'bg-amber-50/40' : 'bg-white'}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-gray-300 relative">
                        <img
                          src={u.avatarUrl}
                          alt={u.name}
                          className="w-full h-full object-cover"
                        />
                        {isCurrentActive && (
                          <span
                            className="absolute bottom-0 right-0 w-3 h-3 bg-[#2F9E44] border-2 border-white rounded-full"
                            title="Usuário Atual"
                          />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-sm text-[#010102] truncate">
                            {u.name}
                          </span>
                          {isCurrentActive && (
                            <span className="px-1.5 py-0.5 bg-amber-200/70 text-amber-900 text-[10px] font-bold rounded">
                              VOCÊ
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-gray-500 block truncate">
                          {u.email}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => toggleSystemUserStatus(u.id)}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                        u.status === 'ativo'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {u.status === 'ativo' ? '● Ativo' : '○ Inativo'}
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-2 text-xs bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                    <div className="min-w-0">
                      <span className="font-semibold text-gray-800 block truncate">{u.roleTitle}</span>
                      <span className="text-[11px] text-gray-500 block truncate">{u.department}</span>
                    </div>
                    <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[11px] font-bold shrink-0 ${roleMeta.badgeBg}`}>
                      <span className="material-symbols-outlined text-[14px]">{roleMeta.icon}</span>
                      <span>{roleMeta.label}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 text-xs">
                    <span className="text-[11px] text-gray-400">
                      Tel: {u.phone || 'N/I'}
                    </span>
                    <div className="flex items-center gap-1">
                      {!isCurrentActive && u.status === 'ativo' && (
                        <button
                          onClick={() => switchUser(u.id)}
                          className="px-2.5 py-1 text-xs bg-amber-100 hover:bg-amber-200 text-[#835400] font-bold rounded-lg flex items-center gap-1 transition-colors"
                        >
                          <span className="material-symbols-outlined text-[16px]">login</span>
                          <span>Alternar</span>
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
                        onClick={() => setUserToDelete(u)}
                        disabled={systemUsers.length <= 1}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-30 transition-colors cursor-pointer"
                        title="Excluir Usuário"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
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
                  <label className="block font-bold text-gray-800 mb-1">
                    E-mail Corporativo (Whitelist Google) *
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="valdir@asphaltpro.com.br"
                    required
                    className="w-full px-3 py-2 border border-[#C7C6CA] rounded-lg focus:border-[#010102] focus:ring-1 focus:ring-[#010102] outline-none text-xs"
                  />
                  <p className="text-[10px] text-gray-500 mt-0.5">
                    Utilizado para validar o login online via Google Auth.
                  </p>
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

              {/* Offline Password Field */}
              <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-amber-950">
                    Senha de Acesso Offline (Pista / Balança)
                  </label>
                  <span className="text-[10px] font-semibold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded">
                    Rate Limit Ativo
                  </span>
                </div>
                <div className="relative flex items-center">
                  <input
                    type={showModalPassword ? 'text' : 'password'}
                    value={offlinePassword}
                    onChange={(e) => setOfflinePassword(e.target.value)}
                    placeholder="Defina a senha para login sem internet (mín. 6 caracteres)"
                    className="w-full px-3 py-2 pr-9 bg-white border border-amber-300 rounded-lg focus:border-amber-600 focus:ring-1 focus:ring-amber-600 outline-none text-xs text-gray-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowModalPassword(!showModalPassword)}
                    className="absolute right-2.5 text-gray-400 hover:text-gray-700 cursor-pointer"
                    title={showModalPassword ? 'Ocultar senha' : 'Ver senha'}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {showModalPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
                <p className="text-[10px] text-amber-900/80 leading-relaxed">
                  Permite que este colaborador acerte balanças e lance despesas mesmo sem conexão com a internet. O sistema bloqueia tentativas repetidas de força bruta por 60 segundos após 5 erros.
                </p>
              </div>

              {/* Role Selection */}
              <div>
                <label className="block font-bold text-gray-800 mb-1.5">
                  Perfil de Segurança & Nível de Acesso *
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

      {/* Confirmation Modal for User Deletion */}
      <ConfirmModal
        isOpen={!!userToDelete}
        onClose={() => setUserToDelete(null)}
        onConfirm={() => {
          if (userToDelete) {
            deleteSystemUser(userToDelete.id);
            setUserToDelete(null);
          }
        }}
        title="Excluir Usuário do Sistema"
        message={`Deseja realmente remover o acesso de "${userToDelete?.name}"? Esta ação revogará imediatamente as permissões vinculadas a esta conta.`}
        confirmText="Sim, Excluir Usuário"
        cancelText="Cancelar"
        variant="danger"
        icon="person_remove"
        itemDetails={
          userToDelete
            ? [
                { label: 'Nome', value: userToDelete.name },
                { label: 'E-mail', value: userToDelete.email },
                { label: 'Perfil / Cargo', value: `${userToDelete.roleTitle} (${ROLE_INFO[userToDelete.role]?.label || userToDelete.role})` },
                { label: 'Departamento', value: userToDelete.department },
              ]
            : []
        }
      />
    </div>
  );
};
