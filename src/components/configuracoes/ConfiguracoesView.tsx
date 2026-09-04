import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { LetterheadSettings, Quote, Category, BankAccount, TextoRapidoPreset, ToastPosition } from '../../types';
import { DEFAULT_TEXTOS_RAPIDOS } from '../../data/initialData';
import { Button, Input, Select, Modal, ConfirmModal } from '../common';
import { OrcamentoA4VisualizerModal } from '../orcamentos/OrcamentoA4VisualizerModal';
import { UsuariosViewTab } from './UsuariosViewTab';
import { ImportDataModal } from '../common/ImportDataModal';
import { ImportEntityType, downloadTemplateCsv } from '../../utils/importUtils';
import { SyncDetailsModal } from '../sync/SyncDetailsModal';
import { syncManager } from '../../services/syncManager';

export const ConfiguracoesView: React.FC = () => {
  const {
    user,
    permissions,
    showToast,
    resetAllData,
    letterheadSettings,
    updateLetterheadSettings,
    quotes,
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
    bankAccounts,
    addBankAccount,
    updateBankAccount,
    deleteBankAccount,
    exportFullBackup,
    importFullBackup,
    exportCsvData,
    transactions,
    accounts,
    employees,
    partners,
    toastPosition,
    setToastPosition,
  } = useApp();

  const [activeTab, setActiveTab] = useState<
    'usuarios' | 'categorias' | 'contas' | 'timbrado' | 'empresa' | 'textos_rapidos' | 'sistema'
  >('usuarios');
  const backupInputRef = useRef<HTMLInputElement>(null);

  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
    details?: { label: string; value: string }[];
  } | null>(null);

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isSyncConfigModalOpen, setIsSyncConfigModalOpen] = useState(false);
  const [importEntityType, setImportEntityType] = useState<ImportEntityType>('transacoes');

  // Category Modal State in Configuracoes
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [catNome, setCatNome] = useState('');
  const [catTipo, setCatTipo] = useState<'receita' | 'despesa'>('despesa');
  const [catIcone, setCatIcone] = useState('category');
  const [catCor, setCatCor] = useState('#835400');

  // Bank Account Modal State in Configuracoes
  const [isBankAccountModalOpen, setIsBankAccountModalOpen] = useState(false);
  const [editingBankAccount, setEditingBankAccount] = useState<BankAccount | null>(null);
  const [bankNome, setBankNome] = useState('');
  const [bankBanco, setBankBanco] = useState('Banco do Brasil');
  const [bankAgenciaConta, setBankAgenciaConta] = useState('');
  const [bankSaldo, setBankSaldo] = useState<number | string>('0');

  // Letterhead & Company State
  const [nomeEmpresa, setNomeEmpresa] = useState(letterheadSettings.nomeEmpresa);
  const [cnpj, setCnpj] = useState(letterheadSettings.cnpj);
  const [inscricaoEstadual, setInscricaoEstadual] = useState(letterheadSettings.inscricaoEstadual || '');
  const [enderecoUsina, setEnderecoUsina] = useState(letterheadSettings.enderecoUsina);
  const [telefone, setTelefone] = useState(letterheadSettings.telefone);
  const [emailComercial, setEmailComercial] = useState(letterheadSettings.emailComercial);
  const [responsavelTecnicoPadrao, setResponsavelTecnicoPadrao] = useState(letterheadSettings.responsavelTecnicoPadrao || 'Eng. Marcelo Albuquerque');
  const [cargoResponsavelPadrao, setCargoResponsavelPadrao] = useState(letterheadSettings.cargoResponsavelPadrao || 'Engenheiro Civil / Responsável Técnico CREA');
  const [diasValidadePadrao, setDiasValidadePadrao] = useState(letterheadSettings.diasValidadePadrao || 15);
  const [textoPadraoIntroducao, setTextoPadraoIntroducao] = useState(letterheadSettings.textoPadraoIntroducao || '');
  const [textoPadraoCondicoes, setTextoPadraoCondicoes] = useState(letterheadSettings.textoPadraoCondicoes || '');
  const [backgroundImageUrl, setBackgroundImageUrl] = useState(letterheadSettings.backgroundImageUrl || '');
  const [logoUrl, setLogoUrl] = useState(letterheadSettings.logoUrl || '');

  // File upload refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const logoFileInputRef = useRef<HTMLInputElement>(null);
  const [isLogoDragOver, setIsLogoDragOver] = useState(false);

  // Quick Texts Presets State
  const [textosRapidos, setTextosRapidos] = useState<TextoRapidoPreset[]>(() => {
    return letterheadSettings.textosRapidos && letterheadSettings.textosRapidos.length > 0
      ? letterheadSettings.textosRapidos
      : DEFAULT_TEXTOS_RAPIDOS;
  });
  const [filtroCategoriaPreset, setFiltroCategoriaPreset] = useState<'todos' | 'item_tecnico' | 'pagamento' | 'condicoes_gerais'>('todos');
  const [isTextoRapidoModalOpen, setIsTextoRapidoModalOpen] = useState(false);
  const [editingTextoRapido, setEditingTextoRapido] = useState<TextoRapidoPreset | null>(null);
  const [trLabel, setTrLabel] = useState('');
  const [trCategoria, setTrCategoria] = useState<'item_tecnico' | 'pagamento' | 'condicoes_gerais'>('item_tecnico');
  const [trText, setTrText] = useState('');

  // Test modal
  const [previewSampleQuote, setPreviewSampleQuote] = useState<Quote | null>(null);

  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      showToast('Por favor, selecione um arquivo de imagem (PNG, JPG, WEBP).', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('A imagem deve ter no máximo 5MB para otimização da página A4.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setBackgroundImageUrl(result);
      showToast('Imagem de Papel Timbrado carregada com sucesso!', 'success');
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleLogoUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      showToast('Por favor, selecione um arquivo de imagem válido (PNG, JPG, SVG, WEBP).', 'error');
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      showToast('O arquivo de logotipo deve ter no máximo 4MB.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setLogoUrl(result);
      updateLetterheadSettings({ logoUrl: result });
      showToast('Logotipo da empresa atualizado com sucesso!', 'success');
    };
    reader.readAsDataURL(file);
  };

  const handleLogoDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsLogoDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleLogoUpload(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveLogo = () => {
    setLogoUrl('');
    updateLetterheadSettings({ logoUrl: '' });
    showToast('Logotipo removido com sucesso.', 'info');
  };

  const handleSaveLetterhead = (e: React.FormEvent) => {
    e.preventDefault();

    const updated: Partial<LetterheadSettings> = {
      nomeEmpresa,
      cnpj,
      inscricaoEstadual,
      enderecoUsina,
      telefone,
      emailComercial,
      responsavelTecnicoPadrao,
      cargoResponsavelPadrao,
      diasValidadePadrao: Number(diasValidadePadrao),
      textoPadraoIntroducao,
      textoPadraoCondicoes,
      backgroundImageUrl,
      logoUrl,
      textosRapidos
    };

    updateLetterheadSettings(updated);
  };

  // Quick Texts Handlers
  const handleSaveTextoRapido = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trLabel.trim() || !trText.trim()) {
      showToast('Preencha a etiqueta e o conteúdo do texto rápido.', 'error');
      return;
    }

    let updatedList: TextoRapidoPreset[];
    if (editingTextoRapido) {
      updatedList = textosRapidos.map((item) =>
        item.id === editingTextoRapido.id
          ? { ...item, label: trLabel.trim(), categoria: trCategoria, text: trText.trim() }
          : item
      );
      showToast('Texto rápido atualizado com sucesso!', 'success');
    } else {
      const newItem: TextoRapidoPreset = {
        id: `tr-${Date.now()}`,
        label: trLabel.trim(),
        categoria: trCategoria,
        text: trText.trim()
      };
      updatedList = [...textosRapidos, newItem];
      showToast('Novo texto rápido adicionado com sucesso!', 'success');
    }

    setTextosRapidos(updatedList);
    updateLetterheadSettings({ textosRapidos: updatedList });
    setIsTextoRapidoModalOpen(false);
    setEditingTextoRapido(null);
    setTrLabel('');
    setTrText('');
  };

  const handleOpenNewTextoRapido = () => {
    setEditingTextoRapido(null);
    setTrLabel('');
    setTrCategoria('item_tecnico');
    setTrText('');
    setIsTextoRapidoModalOpen(true);
  };

  const handleOpenEditTextoRapido = (item: TextoRapidoPreset) => {
    setEditingTextoRapido(item);
    setTrLabel(item.label);
    setTrCategoria(item.categoria || 'item_tecnico');
    setTrText(item.text);
    setIsTextoRapidoModalOpen(true);
  };

  const handleDeleteTextoRapido = (item: TextoRapidoPreset) => {
    setDeleteConfirmTarget({
      title: 'Excluir Texto Rápido',
      message: `Tem certeza que deseja remover o texto rápido "${item.label}"? Ele não aparecerá mais nos botões de inserção rápida dos orçamentos.`,
      details: [
        { label: 'Título', value: item.label },
        { label: 'Categoria', value: item.categoria === 'pagamento' ? 'Condições de Pagamento' : item.categoria === 'condicoes_gerais' ? 'Normas & Observações Gerais' : 'Item Técnico' }
      ],
      onConfirm: () => {
        const updatedList = textosRapidos.filter((t) => t.id !== item.id);
        setTextosRapidos(updatedList);
        updateLetterheadSettings({ textosRapidos: updatedList });
        showToast(`Texto rápido "${item.label}" removido.`, 'info');
      }
    });
  };

  const handleResetTextosRapidos = () => {
    setDeleteConfirmTarget({
      title: 'Restaurar Textos Padrão de Fábrica',
      message: 'Deseja restaurar a lista padrão de textos rápidos de pavimentação, termos de pagamento e observações técnicas DNIT/DER?',
      onConfirm: () => {
        setTextosRapidos(DEFAULT_TEXTOS_RAPIDOS);
        updateLetterheadSettings({ textosRapidos: DEFAULT_TEXTOS_RAPIDOS });
        showToast('Textos rápidos restaurados para os padrões originais.', 'success');
      }
    });
  };

  const handleOpenSamplePreview = () => {
    const sample: Quote = quotes[0] || {
      id: 'orc-sample',
      numero: 'ORC-2026-001',
      dataEmissao: new Date().toLocaleDateString('pt-BR'),
      dataValidade: new Date(Date.now() + 15 * 86400000).toLocaleDateString('pt-BR'),
      diasValidade: diasValidadePadrao,
      status: 'aprovado',
      cliente: {
        nome: 'Construtora Horizonte Engenharia & Pavimentação',
        documento: '12.345.678/0001-90',
        contato: 'Eng. Roberto Silva',
        telefone: '(11) 98765-4321',
        email: 'compras@horizonte.eng.br',
        enderecoObra: 'Av. das Indústrias, 1500 - Distrito Industrial',
        cidadeUf: 'Campinas - SP'
      },
      textoIntroducao: textoPadraoIntroducao,
      textoObservacoes: textoPadraoCondicoes,
      itens: [
        {
          id: 'item-1',
          nome: 'CBUQ Faixa C (CAP 50/70)',
          descricao: 'Fornecimento e aplicação com acabadora mecânica e compactação pesada',
          modalidade: 'com_aplicacao',
          quantidade: 150,
          unidade: 'ton',
          valorUnitario: 480.0,
          valorTotal: 72000.0
        },
        {
          id: 'item-2',
          nome: 'Pintura de Ligação (Emulsão RR-2C)',
          descricao: 'Taxa de aplicação 0,8 l/m² com caminhão espargidor hidrostático',
          modalidade: 'com_aplicacao',
          quantidade: 1800,
          unidade: 'm²',
          valorUnitario: 8.5,
          valorTotal: 15300.0
        },
        {
          id: 'item-3',
          nome: 'Transporte Térmico de CBUQ',
          descricao: 'Caminhões basculantes térmicos com lona de alta temperatura',
          modalidade: 'transporte',
          quantidade: 6,
          unidade: 'viagem',
          valorUnitario: 950.0,
          valorTotal: 5700.0
        }
      ],
      subtotal: 93000.0,
      desconto: 3000.0,
      acrescimoFrete: 0,
      valorTotal: 90000.0,
      condicoesPagamento: '30 DDL (Boleto Bancário)',
      prazoEntrega: 'Início em até 3 dias úteis após liberação da sub-base',
      responsavelNome: responsavelTecnicoPadrao,
      responsavelCargo: cargoResponsavelPadrao,
      createdAt: new Date().toISOString()
    };

    setPreviewSampleQuote(sample);
  };

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-10 max-w-[1440px] mx-auto w-full flex flex-col gap-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#010102] tracking-tight">
            Configurações & Papel Timbrado A4
          </h2>
          <p className="text-xs sm:text-sm text-[#46464A] mt-1">
            Personalize a identidade visual dos orçamentos impressos, dados da usina e parâmetros do sistema.
          </p>
        </div>

        {/* Quick Tabs */}
        <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl flex-wrap">
          <button
            onClick={() => setActiveTab('usuarios')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'usuarios'
                ? 'bg-white text-[#835400] shadow-xs'
                : 'text-gray-600 hover:text-black'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">manage_accounts</span>
            Usuários & Permissões
          </button>

          <button
            onClick={() => setActiveTab('categorias')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'categorias'
                ? 'bg-white text-[#835400] shadow-xs'
                : 'text-gray-600 hover:text-black'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">category</span>
            Plano de Contas & Categorias
          </button>

          <button
            onClick={() => setActiveTab('contas')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'contas'
                ? 'bg-white text-[#835400] shadow-xs'
                : 'text-gray-600 hover:text-black'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">account_balance</span>
            Contas Bancárias
          </button>

          <button
            onClick={() => setActiveTab('timbrado')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'timbrado'
                ? 'bg-white text-[#835400] shadow-xs'
                : 'text-gray-600 hover:text-black'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">article</span>
            Papel Timbrado A4
          </button>

          <button
            onClick={() => setActiveTab('empresa')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'empresa'
                ? 'bg-white text-[#835400] shadow-xs'
                : 'text-gray-600 hover:text-black'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">business</span>
            Dados da Usina
          </button>

          <button
            onClick={() => setActiveTab('textos_rapidos')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'textos_rapidos'
                ? 'bg-white text-[#835400] shadow-xs'
                : 'text-gray-600 hover:text-black'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">bolt</span>
            Textos Rápidos
          </button>

          <button
            onClick={() => setActiveTab('sistema')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'sistema'
                ? 'bg-white text-[#835400] shadow-xs'
                : 'text-gray-600 hover:text-black'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">settings</span>
            Sistema & Backup
          </button>
        </div>
      </div>

      {/* Tab: Usuários & Regras de Acesso (RBAC) */}
      {activeTab === 'usuarios' && <UsuariosViewTab />}

      {/* Tab: Plano de Contas & Categorias */}
      {activeTab === 'categorias' && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#DEE2E6] shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E2E1] pb-4">
            <div>
              <h3 className="text-lg font-bold text-[#010102] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#835400]">category</span>
                Plano de Contas & Categorias Contábeis
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Classificação financeira para DRE Gerencial, centro de custo da usina e lançamentos do fluxo de caixa.
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              icon="add"
              onClick={() => {
                setEditingCategory(null);
                setCatNome('');
                setCatTipo('despesa');
                setCatIcone('category');
                setCatCor('#835400');
                setIsCategoryModalOpen(true);
              }}
            >
              Nova Categoria
            </Button>
          </div>

          {/* Categorias Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="p-4 rounded-xl border border-[#DEE2E6] bg-gray-50/50 flex items-center justify-between hover:bg-white hover:shadow-xs transition-all group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${cat.cor || '#835400'}18` }}
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

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => {
                      setEditingCategory(cat);
                      setCatNome(cat.nome);
                      setCatTipo(cat.tipo);
                      setCatIcone(cat.icone || 'category');
                      setCatCor(cat.cor || (cat.tipo === 'receita' ? '#2F9E44' : '#835400'));
                      setIsCategoryModalOpen(true);
                    }}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-[#835400] hover:bg-[#FFF4E6] transition-colors cursor-pointer"
                    title="Editar"
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
                    title="Excluir"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Contas Bancárias */}
      {activeTab === 'contas' && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#DEE2E6] shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E2E1] pb-4">
            <div>
              <h3 className="text-lg font-bold text-[#010102] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#835400]">account_balance</span>
                Contas Bancárias & Caixas
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Contas correntes, aplicações de liquidez e caixa em espécie para conciliação contábil.
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              icon="add"
              onClick={() => {
                setEditingBankAccount(null);
                setBankNome('');
                setBankBanco('Banco do Brasil');
                setBankAgenciaConta('');
                setBankSaldo('0');
                setIsBankAccountModalOpen(true);
              }}
            >
              Nova Conta Bancária
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {bankAccounts.map((acc) => (
              <div
                key={acc.id}
                className="p-6 rounded-2xl border border-[#DEE2E6] bg-gray-50/50 flex flex-col justify-between hover:bg-white hover:shadow-md transition-all group"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-gray-500 uppercase">{acc.banco}</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingBankAccount(acc);
                          setBankNome(acc.nome);
                          setBankBanco(acc.banco);
                          setBankAgenciaConta(acc.agenciaConta);
                          setBankSaldo(acc.saldo);
                          setIsBankAccountModalOpen(true);
                        }}
                        className="p-1 rounded text-gray-400 hover:text-[#835400] hover:bg-[#FFF4E6] transition-colors cursor-pointer"
                        title="Editar"
                      >
                        <span className="material-symbols-outlined text-[16px]">edit</span>
                      </button>
                      <button
                        onClick={() => {
                          setDeleteConfirmTarget({
                            title: 'Excluir Conta Bancária',
                            message: `Deseja excluir o registro da conta "${acc.nome}"?`,
                            onConfirm: () => deleteBankAccount(acc.id),
                            details: [
                              { label: 'Conta', value: acc.nome },
                              { label: 'Instituição', value: acc.banco },
                              { label: 'Agência / Conta', value: acc.agenciaConta },
                            ],
                          });
                        }}
                        className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                        title="Excluir"
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    </div>
                  </div>
                  <h4 className="text-base font-bold text-[#010102]">{acc.nome}</h4>
                  <p className="text-xs text-gray-500 mt-1 font-mono">{acc.agenciaConta}</p>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-200/70 flex justify-between items-end">
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

      {/* Tab: Papel Timbrado A4 */}
      {activeTab === 'timbrado' && (
        <form onSubmit={handleSaveLetterhead} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Main Form */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* 1. Logo da Empresa */}
            <div className="bg-white p-6 rounded-2xl border border-[#DEE2E6] shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-[#E5E2E1] pb-3">
                <div>
                  <h3 className="text-sm font-bold text-[#010102] flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#835400] text-[20px]">badge</span>
                    Logotipo Oficial da Usina / Empresa
                  </h3>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Utilizado no cabeçalho padrão das propostas A4 impressas e no topo da barra de navegação.
                  </p>
                </div>
                {logoUrl && (
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="px-2.5 py-1 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg border border-red-200 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[14px]">delete</span>
                    Remover
                  </button>
                )}
              </div>

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsLogoDragOver(true);
                }}
                onDragLeave={() => setIsLogoDragOver(false)}
                onDrop={handleLogoDrop}
                onClick={() => logoFileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all ${
                  isLogoDragOver
                    ? 'border-[#835400] bg-[#FFF4E6]'
                    : logoUrl
                    ? 'border-green-300 bg-green-50/20 hover:border-green-400'
                    : 'border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-[#835400]'
                }`}
              >
                <input
                  type="file"
                  ref={logoFileInputRef}
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleLogoUpload(e.target.files[0]);
                    }
                  }}
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  className="hidden"
                />

                {logoUrl ? (
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4 py-2">
                    <div className="h-16 w-36 bg-white border border-gray-200 rounded-lg flex items-center justify-center p-2 shadow-xs shrink-0 overflow-hidden">
                      <img
                        src={logoUrl}
                        alt="Logotipo Oficial"
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                    <div className="text-left space-y-0.5">
                      <span className="text-green-700 font-bold text-xs flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">check_circle</span>
                        Logotipo ativo e aplicado nos documentos
                      </span>
                      <p className="text-[11px] text-gray-500">
                        Clique aqui para substituir o logotipo por outro arquivo.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1.5 py-3">
                    <span className="material-symbols-outlined text-3xl text-[#835400]">
                      add_photo_alternate
                    </span>
                    <p className="text-xs font-bold text-[#010102]">
                      Clique para selecionar ou arraste o logotipo da empresa
                    </p>
                    <p className="text-[11px] text-gray-500">
                      Formatos recomendados: PNG transparente, JPG, SVG ou WEBP (Máx 4MB)
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* 2. Letterhead Image Attachment Box */}
            <div className="bg-white p-6 rounded-2xl border border-[#DEE2E6] shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-[#E5E2E1] pb-3">
                <h3 className="text-sm font-bold text-[#010102] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#835400] text-[20px]">image</span>
                  Imagem do Papel Timbrado A4 (Fundo Completo ou Cabeçalho)
                </h3>
                <span className="text-[11px] text-gray-500">Proporção A4 (210 x 297 mm)</span>
              </div>

              {/* Upload Drag & Drop Area */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                  isDragOver
                    ? 'border-[#835400] bg-[#FFF4E6]'
                    : backgroundImageUrl
                    ? 'border-green-300 bg-green-50/30 hover:border-green-400'
                    : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleFileUpload(e.target.files[0]);
                    }
                  }}
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  className="hidden"
                />

                {backgroundImageUrl ? (
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <div className="w-20 h-28 bg-white border border-gray-300 shadow-md rounded overflow-hidden shrink-0 relative group">
                      <img
                        src={backgroundImageUrl}
                        alt="Papel Timbrado Anexado"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="text-left space-y-1">
                      <div className="flex items-center gap-1.5 text-green-700 font-bold text-xs">
                        <span className="material-symbols-outlined text-[16px]">check_circle</span>
                        Papel timbrado personalizado anexado com sucesso!
                      </div>
                      <p className="text-[11px] text-gray-500">
                        Clique aqui para substituir a imagem ou use o botão abaixo para remover.
                      </p>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setBackgroundImageUrl('');
                          showToast('Imagem de fundo removida.', 'info');
                        }}
                        className="text-xs text-red-600 hover:text-red-800 font-semibold inline-flex items-center gap-1 pt-1"
                      >
                        <span className="material-symbols-outlined text-[14px]">delete</span>
                        Remover imagem e usar cabeçalho padrão
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <span className="material-symbols-outlined text-4xl text-[#835400]">
                      cloud_upload
                    </span>
                    <p className="text-xs font-bold text-[#010102]">
                      Clique para selecionar ou arraste a imagem do seu Papel Timbrado A4
                    </p>
                    <p className="text-[11px] text-gray-500">
                      Suporta PNG, JPG ou WEBP (Recomendado: 2480 x 3508 px ou 1240 x 1754 px)
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* 2. Default Text Templates */}
            <div className="bg-white p-6 rounded-2xl border border-[#DEE2E6] shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-[#010102] pb-3 border-b border-[#E5E2E1] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#835400] text-[20px]">edit_note</span>
                Modelos de Texto Padrão dos Orçamentos
              </h3>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-[#1C1B1B] uppercase tracking-wider mb-1">
                    Texto Padrão de Apresentação (Antes da Planilha de Itens)
                  </label>
                  <textarea
                    rows={3}
                    value={textoPadraoIntroducao}
                    onChange={(e) => setTextoPadraoIntroducao(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-gray-300 text-xs bg-white text-black outline-none focus:border-[#010102]"
                    placeholder="Ex: Agradecemos a oportunidade de apresentar nossa proposta técnico-comercial para fornecimento de massa asfáltica CBUQ..."
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#1C1B1B] uppercase tracking-wider mb-1">
                    Texto Padrão de Observações Técnicas & Normas (Depois da Planilha de Itens)
                  </label>
                  <textarea
                    rows={4}
                    value={textoPadraoCondicoes}
                    onChange={(e) => setTextoPadraoCondicoes(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-gray-300 text-xs bg-white text-black outline-none focus:border-[#010102]"
                    placeholder="Ex: 1. Concreto Asfáltico usinado a quente segundo especificações DNIT 031/2006-ES..."
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-[#1C1B1B] uppercase tracking-wider mb-1">
                      Validade Padrão das Propostas (Dias)
                    </label>
                    <select
                      value={diasValidadePadrao}
                      onChange={(e) => setDiasValidadePadrao(Number(e.target.value))}
                      className="w-full p-2.5 rounded-lg border border-gray-300 text-xs bg-white text-black outline-none"
                    >
                      <option value={7}>7 dias corridos</option>
                      <option value={10}>10 dias corridos</option>
                      <option value={15}>15 dias corridos (Recomendado)</option>
                      <option value={30}>30 dias corridos</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-[#1C1B1B] uppercase tracking-wider mb-1">
                      Responsável Técnico / Comercial Padrão
                    </label>
                    <input
                      type="text"
                      value={responsavelTecnicoPadrao}
                      onChange={(e) => setResponsavelTecnicoPadrao(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-gray-300 text-xs bg-white text-black outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[#DEE2E6] flex flex-wrap items-center justify-between gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  icon="visibility"
                  onClick={handleOpenSamplePreview}
                >
                  Testar / Pré-visualizar Folha A4
                </Button>

                <Button
                  type="submit"
                  variant="primary"
                  icon="save"
                >
                  Salvar Configurações de Timbrado
                </Button>
              </div>
            </div>
          </div>

          {/* Right Col: Live Mini A4 Preview Card */}
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-[#DEE2E6] shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-[#010102] uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#835400] text-[18px]">aspect_ratio</span>
                Prévia da Folha A4
              </h3>
              <p className="text-[11px] text-gray-500">
                Visualização miniaturizada em proporção real de folha A4 (210 x 297 mm):
              </p>

              {/* Miniature A4 Sheet Canvas */}
              <div 
                className="w-full aspect-[210/297] bg-white border border-gray-300 shadow-md rounded-lg p-3 flex flex-col justify-between overflow-hidden relative"
                style={{
                  backgroundImage: backgroundImageUrl ? `url(${backgroundImageUrl})` : undefined,
                  backgroundSize: '100% 100%',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat'
                }}
              >
                {/* Mini Header */}
                {!backgroundImageUrl ? (
                  <div className="border-b border-gray-300 pb-1 flex justify-between items-start">
                    <div>
                      <div className="font-black text-[9px] text-[#010102] uppercase">{nomeEmpresa}</div>
                      <div className="text-[7px] text-gray-500">CNPJ: {cnpj}</div>
                    </div>
                    <div className="text-right">
                      <span className="text-[7px] bg-[#835400] text-white px-1 py-0.5 rounded font-bold">ORÇAMENTO</span>
                      <div className="text-[8px] font-mono font-bold">ORC-2026-001</div>
                    </div>
                  </div>
                ) : (
                  <div className="h-6"></div>
                )}

                {/* Mini Content Skeleton */}
                <div className="space-y-1.5 my-auto">
                  <div className="bg-gray-100 p-1 rounded text-[7px] space-y-0.5">
                    <div className="font-bold text-[#010102]">Cliente: Construtora Horizonte Eng.</div>
                    <div className="text-gray-500">Obra: Rod. SP-330 KM 145</div>
                  </div>

                  <div className="border border-gray-200 rounded overflow-hidden">
                    <div className="bg-[#010102] text-white text-[6px] px-1 py-0.5 flex justify-between font-bold">
                      <span>ITEM / DESCRIÇÃO</span>
                      <span>TOTAL</span>
                    </div>
                    <div className="p-1 space-y-0.5 text-[6px] text-gray-700">
                      <div className="flex justify-between">
                        <span>1. CBUQ Faixa C (150 ton)</span>
                        <span className="font-mono">R$ 72.000</span>
                      </div>
                      <div className="flex justify-between">
                        <span>2. Pintura Ligação (1.800 m²)</span>
                        <span className="font-mono">R$ 15.300</span>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-0.5 text-right font-black text-[7px] border-t border-gray-200">
                      TOTAL: R$ 87.300,00
                    </div>
                  </div>
                </div>

                {/* Mini Footer */}
                <div className="border-t border-gray-200 pt-1 flex justify-between text-[6px] text-gray-400">
                  <span>{responsavelTecnicoPadrao}</span>
                  <span>Página 1 de 1</span>
                </div>
              </div>

              <Button
                type="button"
                variant="warning"
                fullWidth
                icon="open_in_new"
                onClick={handleOpenSamplePreview}
              >
                Abrir Visualizador Completo A4
              </Button>
            </div>
          </div>
        </form>
      )}

      {/* Tab: Dados da Usina */}
      {activeTab === 'empresa' && (
        <form onSubmit={handleSaveLetterhead} className="bg-white p-6 rounded-2xl border border-[#DEE2E6] shadow-xs space-y-5 text-xs max-w-3xl">
          <h3 className="text-base font-bold text-[#010102] pb-3 border-b border-[#E5E2E1] flex items-center gap-2">
            <span className="material-symbols-outlined text-[#835400]">business</span>
            Dados Cadastrais da Usina de Asfalto
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-[#1C1B1B] uppercase tracking-wider mb-1">
                Razão Social / Nome Fantasia *
              </label>
              <input
                type="text"
                required
                value={nomeEmpresa}
                onChange={(e) => setNomeEmpresa(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-gray-300 text-xs bg-white text-black outline-none focus:border-[#010102]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#1C1B1B] uppercase tracking-wider mb-1">
                CNPJ *
              </label>
              <input
                type="text"
                required
                value={cnpj}
                onChange={(e) => setCnpj(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-gray-300 text-xs bg-white text-black outline-none font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#1C1B1B] uppercase tracking-wider mb-1">
                Inscrição Estadual (IE)
              </label>
              <input
                type="text"
                value={inscricaoEstadual}
                onChange={(e) => setInscricaoEstadual(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-gray-300 text-xs bg-white text-black outline-none font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#1C1B1B] uppercase tracking-wider mb-1">
                Telefone da Usina / Comercial
              </label>
              <input
                type="text"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-gray-300 text-xs bg-white text-black outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-[#1C1B1B] uppercase tracking-wider mb-1">
                E-mail Comercial & Faturamento
              </label>
              <input
                type="email"
                value={emailComercial}
                onChange={(e) => setEmailComercial(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-gray-300 text-xs bg-white text-black outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-[#1C1B1B] uppercase tracking-wider mb-1">
                Endereço da Unidade Fabril / Usina
              </label>
              <input
                type="text"
                value={enderecoUsina}
                onChange={(e) => setEnderecoUsina(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-gray-300 text-xs bg-white text-black outline-none"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-[#DEE2E6] flex justify-end">
            <Button
              type="submit"
              variant="primary"
              icon="save"
            >
              Salvar Dados Cadastrais
            </Button>
          </div>
        </form>
      )}

      {/* Tab: Textos Rápidos & Cláusulas Padrão */}
      {activeTab === 'textos_rapidos' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-[#DEE2E6] shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5E2E1]">
              <div>
                <h3 className="text-base font-bold text-[#010102] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#835400]">bolt</span>
                  Biblioteca de Textos Rápidos & Parâmetros Técnicos
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Cadastre botões de atalho para preencher especificações técnicas de asfalto, condições de pagamento e observações com um clique no orçamento.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  icon="restart_alt"
                  onClick={handleResetTextosRapidos}
                  title="Restaurar parâmetros padrão de fábrica"
                >
                  Restaurar Padrões
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  icon="add"
                  onClick={handleOpenNewTextoRapido}
                >
                  Novo Texto Rápido
                </Button>
              </div>
            </div>

            {/* Filter by Category */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-xs font-semibold text-gray-600 mr-1">Filtrar por:</span>
              {[
                { id: 'todos', label: 'Todos' },
                { id: 'item_tecnico', label: 'Parâmetros Técnicos (Massa/Solo)' },
                { id: 'pagamento', label: 'Condições de Pagamento' },
                { id: 'condicoes_gerais', label: 'Normas & Observações Gerais' },
              ].map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setFiltroCategoriaPreset(filter.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    filtroCategoriaPreset === filter.id
                      ? 'bg-[#835400] text-white shadow-xs'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            {/* List of Quick Texts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {textosRapidos
                .filter((item) => filtroCategoriaPreset === 'todos' || item.categoria === filtroCategoriaPreset)
                .map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl border border-gray-200 hover:border-amber-300 hover:bg-amber-50/20 transition-all flex flex-col justify-between gap-3 bg-white"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-[#010102] flex items-center gap-1">
                            <span className="material-symbols-outlined text-[15px] text-[#835400]">label</span>
                            {item.label}
                          </span>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            item.categoria === 'pagamento'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : item.categoria === 'condicoes_gerais'
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {item.categoria === 'pagamento'
                            ? 'Pagamento'
                            : item.categoria === 'condicoes_gerais'
                            ? 'Observações'
                            : 'Técnico'}
                        </span>
                      </div>

                      <p className="text-xs text-gray-600 bg-gray-50 p-2.5 rounded-lg border border-gray-100 font-mono whitespace-pre-wrap leading-relaxed line-clamp-4">
                        {item.text}
                      </p>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                      <button
                        type="button"
                        onClick={() => handleOpenEditTextoRapido(item)}
                        className="px-2.5 py-1 text-xs font-semibold text-gray-700 hover:text-black hover:bg-gray-100 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[15px]">edit</span>
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteTextoRapido(item)}
                        className="px-2.5 py-1 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[15px]">delete</span>
                        Excluir
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Sistema & Reset */}
      {activeTab === 'sistema' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Profile */}
          <div className="bg-white p-6 rounded-2xl border border-[#DEE2E6] shadow-xs text-xs space-y-4">
            <h3 className="text-base font-bold text-[#010102] pb-3 border-b border-[#E5E2E1] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#010102]">account_circle</span>
              Usuário Atual & Permissões
            </h3>

            <div className="flex items-center gap-4 my-2">
              <img
                src={user.avatarUrl}
                alt="Avatar"
                className="w-14 h-14 rounded-full border border-gray-200 object-cover"
              />
              <div>
                <p className="font-bold text-sm text-[#010102]">{user.name}</p>
                <p className="text-gray-500">{user.email}</p>
                <span className="inline-block mt-1 bg-[#D3F9D8] text-[#2B8A3E] px-2 py-0.5 rounded-full text-[10px] font-bold">
                  {user.role} ({user.status})
                </span>
              </div>
            </div>
          </div>

          {/* Configuração de Posição das Notificações / Toasts */}
          <div className="bg-white p-6 rounded-2xl border border-[#DEE2E6] shadow-xs text-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E2E1]">
              <h3 className="text-base font-bold text-[#010102] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#835400]">notifications_active</span>
                Posição dos Avisos & Notificações (Popups)
              </h3>
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 font-bold text-[11px] rounded-full border border-emerald-200">
                Não Obstrui Botões
              </span>
            </div>

            <p className="text-gray-600 leading-relaxed">
              Define onde os avisos e mensagens de confirmação aparecem. O padrão recomendado é o <strong>Canto Superior Direito</strong>, garantindo que botões de rodapé como &quot;Avançar&quot;, &quot;Salvar&quot; ou &quot;Concluir&quot; nunca fiquem cobertos.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
              {[
                { id: 'top-right', label: 'Superior Direito', desc: 'Padrão Recomendado', icon: 'north_east' },
                { id: 'top-center', label: 'Superior Central', desc: 'Topo no Centro', icon: 'north' },
                { id: 'top-left', label: 'Superior Esquerdo', desc: 'Topo à Esquerda', icon: 'north_west' },
                { id: 'bottom-left', label: 'Inferior Esquerdo', desc: 'Base à Esquerda', icon: 'south_west' },
                { id: 'bottom-center', label: 'Inferior Central', desc: 'Base no Centro', icon: 'south' },
                { id: 'bottom-right', label: 'Inferior Direito', desc: 'Base à Direita', icon: 'south_east' },
              ].map((pos) => {
                const isSelected = (toastPosition || 'top-right') === pos.id;
                return (
                  <button
                    key={pos.id}
                    type="button"
                    onClick={() => {
                      setToastPosition(pos.id as ToastPosition);
                      showToast(`Posição das notificações alterada para ${pos.label}!`, 'info');
                    }}
                    className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#835400] bg-amber-50/60 ring-2 ring-[#835400]/20 text-[#835400]'
                        : 'border-gray-200 bg-[#FAFAFA] hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="material-symbols-outlined text-[17px]">
                        {pos.icon}
                      </span>
                      {isSelected && (
                        <span className="w-2 h-2 rounded-full bg-[#835400]" />
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-xs leading-tight">{pos.label}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">{pos.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-gray-100">
              <span className="text-[11px] text-gray-500">
                Deseja testar como a mensagem aparece?
              </span>
              <Button
                variant="outline"
                size="sm"
                icon="notifications"
                onClick={() => {
                  showToast('Perfeito! A notificação aparece sem cobrir os botões de ação.', 'success');
                }}
              >
                Testar Aviso na Tela
              </Button>
            </div>
          </div>

          {/* Backup Geral (JSON) */}
          <div className="bg-white p-6 rounded-2xl border border-[#DEE2E6] shadow-xs text-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E2E1]">
              <h3 className="text-base font-bold text-[#010102] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#835400]">cloud_download</span>
                Backup Completo (JSON)
              </h3>
              <span className="px-2 py-0.5 bg-amber-50 text-[#835400] font-bold text-[11px] rounded-full border border-amber-200">
                Segurança Total
              </span>
            </div>
            <p className="text-gray-600 leading-relaxed">
              Gera um arquivo completo de restauração com todos os orçamentos, lançamentos do caixa, colaboradores, clientes, fornecedores, contas bancárias e timbrado oficial.
            </p>

            {/* Badges de registros */}
            <div className="flex flex-wrap gap-1.5 py-1">
              <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-md text-[11px] font-medium">
                <strong>{transactions.length}</strong> Lançamentos
              </span>
              <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-md text-[11px] font-medium">
                <strong>{accounts.length}</strong> Contas
              </span>
              <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-md text-[11px] font-medium">
                <strong>{quotes.length}</strong> Orçamentos
              </span>
              <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-md text-[11px] font-medium">
                <strong>{partners.length}</strong> Parceiros
              </span>
              <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-md text-[11px] font-medium">
                <strong>{employees.length}</strong> Colaboradores
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <Button
                variant="primary"
                icon="download"
                onClick={exportFullBackup}
              >
                Baixar Backup (.JSON)
              </Button>

              <input
                type="file"
                ref={backupInputRef}
                accept=".json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      const content = ev.target?.result as string;
                      if (content) {
                        importFullBackup(content);
                      }
                    };
                    reader.readAsText(file);
                  }
                  if (e.target) e.target.value = '';
                }}
              />

              <Button
                variant="secondary"
                icon="upload_file"
                onClick={() => backupInputRef.current?.click()}
              >
                Restaurar Backup (.JSON)
              </Button>
            </div>
          </div>

          {/* Sincronização com Firebase & Auditoria de Cotas */}
          <div className="bg-white p-6 rounded-2xl border border-[#DEE2E6] shadow-xs text-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E2E1]">
              <h3 className="text-base font-bold text-[#010102] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#835400]">cloud_sync</span>
                Sincronização Nuvem & Conta Firebase
              </h3>
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 font-bold text-[11px] rounded-full border border-emerald-200">
                Anti-Abuso Ativo
              </span>
            </div>
            <p className="text-gray-600 leading-relaxed">
              O sistema opera em modo <strong>Cache-First</strong>: zero leituras desnecessárias no Firebase. Configure os dados da conta Google da empresa e audite a sincronização em tempo real.
            </p>

            <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/80 flex items-center justify-between">
              <div>
                <p className="font-bold text-gray-800 text-xs">
                  {syncManager.getFirebaseConfig()?.projectId ? `Projeto: ${syncManager.getFirebaseConfig()?.projectId}` : 'Aguardando Conta da Empresa'}
                </p>
                <p className="text-[11px] text-gray-500">
                  {syncManager.getPendingCount()} itens pendentes de envio
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                icon="tune"
                onClick={() => setIsSyncConfigModalOpen(true)}
              >
                Gerenciar Sincronização
              </Button>
            </div>
          </div>

          {/* Central de Planilhas Modelo, Importação e Exportação (CSV / Excel) */}
          <div className="bg-white p-6 rounded-2xl border border-[#DEE2E6] shadow-xs text-xs space-y-5 lg:col-span-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E5E2E1]">
              <div>
                <h3 className="text-base font-bold text-[#010102] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#2B8A3E]">table_view</span>
                  Central de Planilhas: Modelos, Importação e Exportação (CSV / Excel)
                </h3>
                <p className="text-gray-500 text-[11px] mt-0.5">
                  Baixe planilhas modelo padronizadas com instruções e campos obrigatórios marcados com (*), alimente externamente e importe com validação em tempo real.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  icon="download"
                  onClick={() => exportCsvData('todos')}
                  title="Baixa arquivos CSV separados de todas as tabelas"
                >
                  Exportar Todas as Tabelas (.CSV)
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
              {/* Card 1: Livro Caixa */}
              <div className="p-4 rounded-xl border border-gray-200 bg-[#FAFAFA] flex flex-col justify-between gap-3">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                        <span className="material-symbols-outlined text-[18px]">receipt_long</span>
                      </span>
                      <div>
                        <h4 className="font-bold text-[#010102] text-xs">Lançamentos (Livro Caixa)</h4>
                        <span className="text-[10px] text-gray-500">{transactions.length} registros</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-500 text-[11px] leading-relaxed">
                    Entradas, saídas de caixa, categorias, favorecidos e formas de pagamento.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-gray-200/70">
                  <button
                    onClick={() => {
                      downloadTemplateCsv('transacoes');
                      showToast('Planilha modelo de lançamentos baixada!', 'success');
                    }}
                    className="py-1.5 px-2 rounded-lg bg-white border border-gray-200 hover:border-[#835400] hover:bg-amber-50/50 text-[10px] font-bold text-gray-700 flex items-center justify-center gap-1 transition-all cursor-pointer"
                    title="Baixar planilha modelo vazia com campos obrigatórios e exemplos"
                  >
                    <span className="material-symbols-outlined text-[13px]">description</span>
                    Modelo
                  </button>
                  <button
                    onClick={() => {
                      setImportEntityType('transacoes');
                      setIsImportModalOpen(true);
                    }}
                    className="py-1.5 px-2 rounded-lg bg-amber-100/70 text-[#835400] hover:bg-amber-100 text-[10px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer"
                    title="Importar planilha preenchida"
                  >
                    <span className="material-symbols-outlined text-[13px]">upload</span>
                    Importar
                  </button>
                  <button
                    onClick={() => exportCsvData('transacoes')}
                    className="py-1.5 px-2 rounded-lg bg-white border border-gray-200 hover:border-emerald-600 text-[10px] font-bold text-gray-700 flex items-center justify-center gap-1 transition-all cursor-pointer"
                    title="Exportar dados atuais"
                  >
                    <span className="material-symbols-outlined text-[13px]">download</span>
                    Exportar
                  </button>
                </div>
              </div>

              {/* Card 2: Contas a Pagar e Receber */}
              <div className="p-4 rounded-xl border border-gray-200 bg-[#FAFAFA] flex flex-col justify-between gap-3">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
                        <span className="material-symbols-outlined text-[18px]">payments</span>
                      </span>
                      <div>
                        <h4 className="font-bold text-[#010102] text-xs">Contas a Pagar e Receber</h4>
                        <span className="text-[10px] text-gray-500">{accounts.length} títulos</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-500 text-[11px] leading-relaxed">
                    Títulos a liquidar, vencimentos, fornecedores, clientes e parcelas.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-gray-200/70">
                  <button
                    onClick={() => {
                      downloadTemplateCsv('contas');
                      showToast('Planilha modelo de contas baixada!', 'success');
                    }}
                    className="py-1.5 px-2 rounded-lg bg-white border border-gray-200 hover:border-[#835400] hover:bg-amber-50/50 text-[10px] font-bold text-gray-700 flex items-center justify-center gap-1 transition-all cursor-pointer"
                    title="Baixar planilha modelo vazia"
                  >
                    <span className="material-symbols-outlined text-[13px]">description</span>
                    Modelo
                  </button>
                  <button
                    onClick={() => {
                      setImportEntityType('contas');
                      setIsImportModalOpen(true);
                    }}
                    className="py-1.5 px-2 rounded-lg bg-blue-100 text-blue-800 hover:bg-blue-200 text-[10px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer"
                    title="Importar contas em lote"
                  >
                    <span className="material-symbols-outlined text-[13px]">upload</span>
                    Importar
                  </button>
                  <button
                    onClick={() => exportCsvData('contas')}
                    className="py-1.5 px-2 rounded-lg bg-white border border-gray-200 hover:border-blue-600 text-[10px] font-bold text-gray-700 flex items-center justify-center gap-1 transition-all cursor-pointer"
                    title="Exportar dados atuais"
                  >
                    <span className="material-symbols-outlined text-[13px]">download</span>
                    Exportar
                  </button>
                </div>
              </div>

              {/* Card 3: Clientes e Fornecedores */}
              <div className="p-4 rounded-xl border border-gray-200 bg-[#FAFAFA] flex flex-col justify-between gap-3">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center font-bold">
                        <span className="material-symbols-outlined text-[18px]">handshake</span>
                      </span>
                      <div>
                        <h4 className="font-bold text-[#010102] text-xs">Clientes & Fornecedores</h4>
                        <span className="text-[10px] text-gray-500">{partners.length} parceiros</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-500 text-[11px] leading-relaxed">
                    Carteira comercial, pedreiras, distribuidoras de CAP e contatos.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-gray-200/70">
                  <button
                    onClick={() => {
                      downloadTemplateCsv('parceiros');
                      showToast('Planilha modelo de parceiros baixada!', 'success');
                    }}
                    className="py-1.5 px-2 rounded-lg bg-white border border-gray-200 hover:border-[#835400] hover:bg-amber-50/50 text-[10px] font-bold text-gray-700 flex items-center justify-center gap-1 transition-all cursor-pointer"
                    title="Baixar planilha modelo vazia"
                  >
                    <span className="material-symbols-outlined text-[13px]">description</span>
                    Modelo
                  </button>
                  <button
                    onClick={() => {
                      setImportEntityType('parceiros');
                      setIsImportModalOpen(true);
                    }}
                    className="py-1.5 px-2 rounded-lg bg-purple-100 text-purple-800 hover:bg-purple-200 text-[10px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer"
                    title="Importar parceiros em lote"
                  >
                    <span className="material-symbols-outlined text-[13px]">upload</span>
                    Importar
                  </button>
                  <button
                    onClick={() => exportCsvData('parceiros')}
                    className="py-1.5 px-2 rounded-lg bg-white border border-gray-200 hover:border-purple-600 text-[10px] font-bold text-gray-700 flex items-center justify-center gap-1 transition-all cursor-pointer"
                    title="Exportar dados atuais"
                  >
                    <span className="material-symbols-outlined text-[13px]">download</span>
                    Exportar
                  </button>
                </div>
              </div>

              {/* Card 4: Colaboradores e Motoristas */}
              <div className="p-4 rounded-xl border border-gray-200 bg-[#FAFAFA] flex flex-col justify-between gap-3">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 rounded-lg bg-orange-100 text-orange-800 flex items-center justify-center font-bold">
                        <span className="material-symbols-outlined text-[18px]">badge</span>
                      </span>
                      <div>
                        <h4 className="font-bold text-[#010102] text-xs">Equipe & Motoristas</h4>
                        <span className="text-[10px] text-gray-500">{employees.length} colaboradores</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-500 text-[11px] leading-relaxed">
                    Operadores de usina, motoristas de basculante, equipe de pista e contatos.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-gray-200/70">
                  <button
                    onClick={() => {
                      downloadTemplateCsv('colaboradores');
                      showToast('Planilha modelo de colaboradores baixada!', 'success');
                    }}
                    className="py-1.5 px-2 rounded-lg bg-white border border-gray-200 hover:border-[#835400] hover:bg-amber-50/50 text-[10px] font-bold text-gray-700 flex items-center justify-center gap-1 transition-all cursor-pointer"
                    title="Baixar planilha modelo vazia"
                  >
                    <span className="material-symbols-outlined text-[13px]">description</span>
                    Modelo
                  </button>
                  <button
                    onClick={() => {
                      setImportEntityType('colaboradores');
                      setIsImportModalOpen(true);
                    }}
                    className="py-1.5 px-2 rounded-lg bg-orange-100 text-orange-800 hover:bg-orange-200 text-[10px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer"
                    title="Importar equipe em lote"
                  >
                    <span className="material-symbols-outlined text-[13px]">upload</span>
                    Importar
                  </button>
                  <button
                    onClick={() => exportCsvData('colaboradores')}
                    className="py-1.5 px-2 rounded-lg bg-white border border-gray-200 hover:border-orange-600 text-[10px] font-bold text-gray-700 flex items-center justify-center gap-1 transition-all cursor-pointer"
                    title="Exportar dados atuais"
                  >
                    <span className="material-symbols-outlined text-[13px]">download</span>
                    Exportar
                  </button>
                </div>
              </div>

              {/* Card 5: Catálogo de Preços e Insumos */}
              <div className="p-4 rounded-xl border border-gray-200 bg-[#FAFAFA] flex flex-col justify-between gap-3">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
                        <span className="material-symbols-outlined text-[18px]">inventory_2</span>
                      </span>
                      <div>
                        <h4 className="font-bold text-[#010102] text-xs">Catálogo & Tabela de Preços</h4>
                        <span className="text-[10px] text-gray-500">Tabela de Preços e Insumos</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-500 text-[11px] leading-relaxed">
                    Preços de CBUQ, emulsão, aplicação por m² e locação de maquinários.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-gray-200/70">
                  <button
                    onClick={() => {
                      downloadTemplateCsv('catalogo');
                      showToast('Planilha modelo do catálogo baixada!', 'success');
                    }}
                    className="py-1.5 px-2 rounded-lg bg-white border border-gray-200 hover:border-[#835400] hover:bg-amber-50/50 text-[10px] font-bold text-gray-700 flex items-center justify-center gap-1 transition-all cursor-pointer"
                    title="Baixar planilha modelo vazia"
                  >
                    <span className="material-symbols-outlined text-[13px]">description</span>
                    Modelo
                  </button>
                  <button
                    onClick={() => {
                      setImportEntityType('catalogo');
                      setIsImportModalOpen(true);
                    }}
                    className="py-1.5 px-2 rounded-lg bg-teal-100 text-teal-800 hover:bg-teal-200 text-[10px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer"
                    title="Importar itens e preços em lote"
                  >
                    <span className="material-symbols-outlined text-[13px]">upload</span>
                    Importar
                  </button>
                </div>
              </div>

              {/* Card 6: Orçamentos e Propostas */}
              <div className="p-4 rounded-xl border border-gray-200 bg-[#FAFAFA] flex flex-col justify-between gap-3">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 rounded-lg bg-amber-100 text-[#835400] flex items-center justify-center font-bold">
                        <span className="material-symbols-outlined text-[18px]">description</span>
                      </span>
                      <div>
                        <h4 className="font-bold text-[#010102] text-xs">Orçamentos & Propostas</h4>
                        <span className="text-[10px] text-gray-500">{quotes.length} propostas emitidas</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-500 text-[11px] leading-relaxed">
                    Histórico de propostas comerciais com BDI, tonelagem e valores totais.
                  </p>
                </div>

                <div className="pt-2 border-t border-gray-200/70">
                  <button
                    onClick={() => exportCsvData('orcamentos')}
                    className="w-full py-1.5 px-2 rounded-lg bg-white border border-gray-200 hover:border-[#835400] text-[10px] font-bold text-gray-700 flex items-center justify-center gap-1 transition-all cursor-pointer"
                    title="Exportar propostas comerciais em CSV"
                  >
                    <span className="material-symbols-outlined text-[13px]">download</span>
                    Exportar Orçamentos (.CSV)
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Reset Factory Settings */}
          <div className="bg-white p-6 rounded-2xl border border-[#DEE2E6] shadow-xs text-xs space-y-3 lg:col-span-2">
            <h3 className="text-base font-bold text-[#E03131] pb-3 border-b border-[#E5E2E1] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#E03131]">restart_alt</span>
              Restauração de Dados & Fábrica
            </h3>
            <p className="text-gray-600 leading-relaxed">
              Restaura todos os orçamentos, lançamentos, funcionários, contas e catálogo de preços para o padrão inicial de fábrica do Asphalt Pro.
            </p>
            <div className="max-w-xs">
              <Button
                variant="danger"
                fullWidth
                icon="restart_alt"
                onClick={() => {
                  setDeleteConfirmTarget({
                    title: 'Restaurar Dados de Fábrica',
                    message: 'Tem certeza de que deseja restaurar todos os dados para o padrão inicial de fábrica? Todos os lançamentos e cadastros atuais serão redefinidos.',
                    onConfirm: () => resetAllData(),
                    details: [
                      { label: 'Ação', value: 'Restauração de Fábrica' },
                      { label: 'Impacto', value: 'Redefine orçamentos, lançamentos e contas' },
                    ],
                  });
                }}
              >
                Restaurar Dados de Fábrica
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Sample Visualizer Modal */}
      <OrcamentoA4VisualizerModal
        quote={previewSampleQuote}
        onClose={() => setPreviewSampleQuote(null)}
      />

      {/* Modal Categoria (Configurações) */}
      <Modal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        title={editingCategory ? 'Editar Categoria Contábil' : 'Nova Categoria Contábil'}
        subtitle="Configure classificação de receitas e despesas para o Plano de Contas e DRE."
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
              onClick={(e) => {
                e.preventDefault();
                if (!catNome.trim()) return;
                if (editingCategory) {
                  updateCategory(editingCategory.id, {
                    nome: catNome.trim(),
                    tipo: catTipo,
                    icone: catIcone,
                    cor: catCor,
                  });
                } else {
                  addCategory({
                    nome: catNome.trim(),
                    tipo: catTipo,
                    cor: catCor,
                    icone: catIcone,
                  });
                }
                setIsCategoryModalOpen(false);
              }}
            >
              {editingCategory ? 'Salvar Alterações' : 'Criar Categoria'}
            </Button>
          </>
        }
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!catNome.trim()) return;
            if (editingCategory) {
              updateCategory(editingCategory.id, {
                nome: catNome.trim(),
                tipo: catTipo,
                icone: catIcone,
                cor: catCor,
              });
            } else {
              addCategory({
                nome: catNome.trim(),
                tipo: catTipo,
                cor: catCor,
                icone: catIcone,
              });
            }
            setIsCategoryModalOpen(false);
          }}
          className="flex flex-col gap-4"
        >
          <Input
            label="Nome da Categoria *"
            placeholder="Ex: Óleo BPF / Insumos de Usinagem"
            value={catNome}
            onChange={(e) => setCatNome(e.target.value)}
            required
            autoFocus
          />

          <Select
            label="Tipo de Lançamento"
            value={catTipo}
            onChange={(e) => setCatTipo(e.target.value as any)}
            options={[
              { value: 'despesa', label: 'Despesa / Saída de Caixa' },
              { value: 'receita', label: 'Receita / Entrada de Caixa' },
            ]}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Ícone Decorativo"
              value={catIcone}
              onChange={(e) => setCatIcone(e.target.value)}
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
                  value={catCor}
                  onChange={(e) => setCatCor(e.target.value)}
                  className="w-10 h-10 rounded-lg border border-gray-300 p-1 cursor-pointer"
                />
                <span className="text-xs text-gray-500 font-mono">{catCor}</span>
              </div>
            </div>
          </div>
        </form>
      </Modal>

      {/* Modal Conta Bancária (Configurações) */}
      <Modal
        isOpen={isBankAccountModalOpen}
        onClose={() => setIsBankAccountModalOpen(false)}
        title={editingBankAccount ? 'Editar Conta Bancária' : 'Nova Conta Bancária / Caixa'}
        subtitle="Gerencie contas bancárias e caixas da empresa para livro caixa e conciliação."
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
              onClick={(e) => {
                e.preventDefault();
                if (!bankNome.trim()) return;
                const parsedSaldo = typeof bankSaldo === 'string' ? parseFloat(bankSaldo) || 0 : bankSaldo;
                if (editingBankAccount) {
                  updateBankAccount(editingBankAccount.id, {
                    nome: bankNome.trim(),
                    banco: bankBanco,
                    agenciaConta: bankAgenciaConta.trim() || 'Ag. Principal / C/C Operacional',
                    saldo: parsedSaldo,
                  });
                } else {
                  addBankAccount({
                    nome: bankNome.trim(),
                    banco: bankBanco,
                    agenciaConta: bankAgenciaConta.trim() || 'Ag. Principal / C/C Operacional',
                    saldo: parsedSaldo,
                  });
                }
                setIsBankAccountModalOpen(false);
              }}
            >
              {editingBankAccount ? 'Salvar Alterações' : 'Cadastrar Conta'}
            </Button>
          </>
        }
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!bankNome.trim()) return;
            const parsedSaldo = typeof bankSaldo === 'string' ? parseFloat(bankSaldo) || 0 : bankSaldo;
            if (editingBankAccount) {
              updateBankAccount(editingBankAccount.id, {
                nome: bankNome.trim(),
                banco: bankBanco,
                agenciaConta: bankAgenciaConta.trim() || 'Ag. Principal / C/C Operacional',
                saldo: parsedSaldo,
              });
            } else {
              addBankAccount({
                nome: bankNome.trim(),
                banco: bankBanco,
                agenciaConta: bankAgenciaConta.trim() || 'Ag. Principal / C/C Operacional',
                saldo: parsedSaldo,
              });
            }
            setIsBankAccountModalOpen(false);
          }}
          className="flex flex-col gap-4"
        >
          <Input
            label="Nome da Conta / Identificação *"
            placeholder="Ex: Banco Santander - Conta Folha / Fornecedores"
            value={bankNome}
            onChange={(e) => setBankNome(e.target.value)}
            required
            autoFocus
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Instituição Financeira *"
              value={bankBanco}
              onChange={(e) => setBankBanco(e.target.value)}
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
              placeholder="Ex: Ag: 3456 / CC: 123456-7"
              value={bankAgenciaConta}
              onChange={(e) => setBankAgenciaConta(e.target.value)}
              required
            />
          </div>

          <Input
            label="Saldo Inicial (R$)"
            type="number"
            step="0.01"
            placeholder="0.00"
            value={bankSaldo}
            onChange={(e) => setBankSaldo(e.target.value)}
          />
        </form>
      </Modal>

      {/* Modal Texto Rápido / Parâmetro Técnico */}
      <Modal
        isOpen={isTextoRapidoModalOpen}
        onClose={() => setIsTextoRapidoModalOpen(false)}
        title={editingTextoRapido ? 'Editar Texto Rápido' : 'Novo Texto Rápido / Parâmetro Técnico'}
        subtitle="Crie atalhos para preencher dados técnicos, termos de pagamento e observações de orçamentos."
        footer={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsTextoRapidoModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon="save"
              onClick={handleSaveTextoRapido}
            >
              {editingTextoRapido ? 'Salvar Alterações' : 'Cadastrar Texto Rápido'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveTextoRapido} className="flex flex-col gap-4">
          <Input
            label="Etiqueta / Nome do Botão *"
            placeholder="Ex: CBUQ Faixa C (4cm) ou Entrada 40% + 2x"
            value={trLabel}
            onChange={(e) => setTrLabel(e.target.value)}
            required
            autoFocus
          />

          <Select
            label="Categoria do Texto Rápido *"
            value={trCategoria}
            onChange={(e) => setTrCategoria(e.target.value as any)}
            options={[
              { value: 'item_tecnico', label: 'Parâmetro Técnico de Pavimentação (Item da Planilha)' },
              { value: 'pagamento', label: 'Condições de Pagamento & Prazos' },
              { value: 'condicoes_gerais', label: 'Normas, Validade & Observações Gerais' },
            ]}
          />

          <div>
            <label className="text-xs font-bold text-[#010102] block mb-1.5">
              Texto que será inserido ao clicar *
            </label>
            <textarea
              required
              rows={4}
              value={trText}
              onChange={(e) => setTrText(e.target.value)}
              placeholder="Digite o texto exato, especificações técnicas ou cláusula que será adicionada ao documento..."
              className="w-full p-2.5 rounded-lg border border-gray-300 text-xs bg-white text-[#010102] outline-none focus:border-[#835400] font-mono leading-relaxed"
            />
            <p className="text-[11px] text-gray-500 mt-1">
              Dica: Você pode incluir quebras de linha para formatação de tópicos técnicos.
            </p>
          </div>
        </form>
      </Modal>

      {/* Confirmation Modal for Settings & Reset */}
      <ConfirmModal
        isOpen={!!deleteConfirmTarget}
        onClose={() => setDeleteConfirmTarget(null)}
        onConfirm={() => {
          if (deleteConfirmTarget) {
            deleteConfirmTarget.onConfirm();
            setDeleteConfirmTarget(null);
          }
        }}
        title={deleteConfirmTarget?.title || 'Confirmar Ação'}
        message={deleteConfirmTarget?.message || 'Deseja confirmar esta ação?'}
        confirmText="Confirmar"
        cancelText="Cancelar"
        variant="danger"
        icon="warning"
        itemDetails={deleteConfirmTarget?.details}
      />
      {/* Import Data Modal */}
      <ImportDataModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        entityType={importEntityType}
      />
      {/* Sync Details & Anti-Abuse Integrity Modal */}
      {isSyncConfigModalOpen && (
        <SyncDetailsModal
          isOpen={isSyncConfigModalOpen}
          onClose={() => setIsSyncConfigModalOpen(false)}
        />
      )}
    </div>
  );
};
