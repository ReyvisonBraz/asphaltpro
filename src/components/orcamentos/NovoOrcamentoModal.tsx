import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { Quote, QuoteItem, QuoteStatus, QuoteCatalogItem, BusinessPartner } from '../../types';
import { CatalogoItensDrawer } from './CatalogoItensDrawer';
import { PartnerAutocomplete } from '../common';

const TECH_PRESETS = [
  { label: 'CBUQ Faixa C (5cm)', text: 'Concreto Betuminoso Usinado a Quente (CBUQ) Faixa C, espessura compactada e=5,0 cm, fornecido e aplicado com rolo liso e de pneus.' },
  { label: 'Imprimação RR-1C', text: 'Pintura de imprimação ligante com emulsão asfáltica catiônica RR-1C na taxa de 1,0 a 1,2 kg/m².' },
  { label: 'Pintura de Ligação', text: 'Pintura de ligação com emulsão RR-1C diluída na taxa de 0,5 kg/m² para aderência da capa asfáltica.' },
  { label: 'Fresagem a Frio', text: 'Fresagem mecânica a frio de pavimento asfáltico deteriorado na espessura média de 4,0 a 5,0 cm com descarte.' },
  { label: 'Base BGS Compactada', text: 'Execução de sub-base e base em Brita Graduada Simples (BGS) compactada com grau de compactação mínimo 100% PN.' },
  { label: 'Transporte Basculante Térmico', text: 'Transporte rodoviário de massa asfáltica em caminhão basculante com lona térmica para retenção de temperatura mínima de 145°C.' }
];

interface NovoOrcamentoModalProps {
  isOpen: boolean;
  onClose: () => void;
  quoteToEdit?: Quote | null;
  onSaveAndPreview?: (quote: Quote) => void;
}

export const NovoOrcamentoModal: React.FC<NovoOrcamentoModalProps> = ({
  isOpen,
  onClose,
  quoteToEdit,
  onSaveAndPreview
}) => {
  const {
    quotes,
    addQuote,
    updateQuote,
    quoteCatalog,
    addCatalogItem,
    letterheadSettings,
    user,
    showToast
  } = useApp();

  const [isCatalogDrawerOpen, setIsCatalogDrawerOpen] = useState(false);

  const modalIdRef = useRef(`orc-modal-${Math.random().toString(36).slice(2, 9)}`);
  const pushedHistoryRef = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      if (pushedHistoryRef.current) {
        pushedHistoryRef.current = false;
        if (window.history.state?.modalId === modalIdRef.current) {
          window.history.back();
        }
      }
      return;
    }

    pushedHistoryRef.current = true;
    window.history.pushState(
      { isModal: true, modalId: modalIdRef.current },
      ''
    );

    const handlePopState = () => {
      if (pushedHistoryRef.current) {
        pushedHistoryRef.current = false;
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('keydown', handleKeyDown);
      if (pushedHistoryRef.current) {
        pushedHistoryRef.current = false;
        if (window.history.state?.modalId === modalIdRef.current) {
          window.history.back();
        }
      }
    };
  }, [isOpen, onClose]);

  // Modal sizing, wizard & layout state
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [isWizardMode, setIsWizardMode] = useState(true);
  const [isMaximized, setIsMaximized] = useState(false);
  const [viewMode, setViewMode] = useState<'tabela' | 'cards'>('tabela');
  const [descRows, setDescRows] = useState<number>(2);
  const [expandedItemIndex, setExpandedItemIndex] = useState<number | null>(null);

  // Form State
  const [numero, setNumero] = useState('');
  const [dataEmissao, setDataEmissao] = useState('');
  const [diasValidade, setDiasValidade] = useState(15);
  const [status, setStatus] = useState<QuoteStatus>('rascunho');

  // Cliente
  const [clienteNome, setClienteNome] = useState('');
  const [clienteDocumento, setClienteDocumento] = useState('');
  const [clienteContato, setClienteContato] = useState('');
  const [clienteTelefone, setClienteTelefone] = useState('');
  const [clienteEmail, setClienteEmail] = useState('');
  const [clienteEnderecoObra, setClienteEnderecoObra] = useState('');
  const [clienteCidadeUf, setClienteCidadeUf] = useState('');

  // Texts
  const [textoIntroducao, setTextoIntroducao] = useState('');
  const [textoObservacoes, setTextoObservacoes] = useState('');
  const [condicoesPagamento, setCondicoesPagamento] = useState('');
  const [prazoEntrega, setPrazoEntrega] = useState('');

  // Responsavel
  const [responsavelNome, setResponsavelNome] = useState('');
  const [responsavelCargo, setResponsavelCargo] = useState('');

  // Items & Pricing
  const [itens, setItens] = useState<QuoteItem[]>([]);
  const [desconto, setDesconto] = useState<string>('0');
  const [acrescimoFrete, setAcrescimoFrete] = useState<string>('0');

  // Quick Client Suggestions (from existing quotes & transactions)
  const existingClients = Array.from(
    new Set(quotes.map((q) => q.cliente.nome).filter(Boolean))
  );

  useEffect(() => {
    if (isOpen) {
      if (quoteToEdit) {
        setNumero(quoteToEdit.numero);
        setDataEmissao(quoteToEdit.dataEmissao);
        setDiasValidade(quoteToEdit.diasValidade);
        setStatus(quoteToEdit.status);

        setClienteNome(quoteToEdit.cliente.nome);
        setClienteDocumento(quoteToEdit.cliente.documento || '');
        setClienteContato(quoteToEdit.cliente.contato || '');
        setClienteTelefone(quoteToEdit.cliente.telefone || '');
        setClienteEmail(quoteToEdit.cliente.email || '');
        setClienteEnderecoObra(quoteToEdit.cliente.enderecoObra || '');
        setClienteCidadeUf(quoteToEdit.cliente.cidadeUf || '');

        setTextoIntroducao(quoteToEdit.textoIntroducao || '');
        setTextoObservacoes(quoteToEdit.textoObservacoes || '');
        setCondicoesPagamento(quoteToEdit.condicoesPagamento || '');
        setPrazoEntrega(quoteToEdit.prazoEntrega || '');

        setResponsavelNome(quoteToEdit.responsavelNome || user.name);
        setResponsavelCargo(quoteToEdit.responsavelCargo || 'Depto. Comercial / Engenharia');

        setItens(quoteToEdit.itens);
        setDesconto(quoteToEdit.desconto.toString());
        setAcrescimoFrete(quoteToEdit.acrescimoFrete.toString());
      } else {
        // Initialize new quote
        const today = new Date();
        const formattedToday = today.toLocaleDateString('pt-BR');
        const nextNum = `ORC-${today.getFullYear()}-${String(quotes.length + 1).padStart(3, '0')}`;

        setNumero(nextNum);
        setDataEmissao(formattedToday);
        setDiasValidade(letterheadSettings.diasValidadePadrao || 15);
        setStatus('rascunho');

        setClienteNome('');
        setClienteDocumento('');
        setClienteContato('');
        setClienteTelefone('');
        setClienteEmail('');
        setClienteEnderecoObra('');
        setClienteCidadeUf('São Paulo - SP');

        setTextoIntroducao(letterheadSettings.textoPadraoIntroducao || '');
        setTextoObservacoes(letterheadSettings.textoPadraoCondicoes || '');
        setCondicoesPagamento('30 DDL (Boleto Bancário)');
        setPrazoEntrega('Início em até 3 dias úteis após aprovação');

        setResponsavelNome(user.name || 'Eng. Marcelo Albuquerque');
        setResponsavelCargo('Depto. Técnico & Comercial');

        // Default item if catalog has items
        if (quoteCatalog.length > 0) {
          const first = quoteCatalog[0];
          setItens([
            {
              id: `item-${Date.now()}`,
              nome: first.nome,
              descricao: first.descricao || '',
              modalidade: first.modalidade,
              quantidade: 100,
              unidade: first.unidadePadrao,
              valorUnitario: first.valorUnitarioPadrao,
              valorTotal: 100 * first.valorUnitarioPadrao
            }
          ]);
        } else {
          setItens([
            {
              id: `item-${Date.now()}`,
              nome: 'CBUQ Faixa C (CAP 50/70)',
              descricao: 'Com fornecimento e aplicação com vibroacabadora mecânica',
              modalidade: 'com_aplicacao',
              quantidade: 120,
              unidade: 'ton',
              valorUnitario: 480.0,
              valorTotal: 57600.0
            }
          ]);
        }
        setDesconto('0');
        setAcrescimoFrete('0');
      }
    }
  }, [isOpen, quoteToEdit]);

  if (!isOpen) return null;

  // Calculate validity date
  const computeValidityDate = (emission: string, days: number) => {
    const [d, m, y] = emission.split('/').map(Number);
    const base = (!isNaN(d) && !isNaN(m) && !isNaN(y)) ? new Date(y, m - 1, d) : new Date();
    const val = new Date(base.getTime() + days * 24 * 60 * 60 * 1000);
    return val.toLocaleDateString('pt-BR');
  };

  // Calculations
  const subtotal = itens.reduce((sum, it) => sum + (it.valorTotal || 0), 0);
  const descontoNum = parseFloat(desconto) || 0;
  const acrescimoNum = parseFloat(acrescimoFrete) || 0;
  const valorTotalGeral = Math.max(0, subtotal - descontoNum + acrescimoNum);

  const handleAddItemFromCatalog = (catItem: QuoteCatalogItem) => {
    const newItem: QuoteItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      nome: catItem.nome,
      descricao: catItem.descricao || '',
      modalidade: catItem.modalidade,
      quantidade: 50,
      unidade: catItem.unidadePadrao,
      valorUnitario: catItem.valorUnitarioPadrao,
      valorTotal: 50 * catItem.valorUnitarioPadrao
    };
    setItens((prev) => [...prev, newItem]);
    showToast(`"${catItem.nome}" adicionado à planilha.`, 'info');
  };

  const handleAddBlankItem = () => {
    const newItem: QuoteItem = {
      id: `item-${Date.now()}`,
      nome: '',
      descricao: '',
      modalidade: 'com_aplicacao',
      quantidade: 1,
      unidade: 'ton',
      valorUnitario: 0,
      valorTotal: 0
    };
    setItens((prev) => [...prev, newItem]);
    setExpandedItemIndex(itens.length);
  };

  const handleDuplicateItem = (index: number) => {
    const itemToDup = itens[index];
    if (!itemToDup) return;
    const duplicated: QuoteItem = {
      ...itemToDup,
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      nome: itemToDup.nome ? `${itemToDup.nome} (Cópia)` : ''
    };
    const nextItens = [...itens];
    nextItens.splice(index + 1, 0, duplicated);
    setItens(nextItens);
    showToast('Item duplicado na planilha.', 'info');
  };

  const handleMoveItem = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= itens.length) return;
    const nextItens = [...itens];
    const temp = nextItens[index];
    nextItens[index] = nextItens[targetIdx];
    nextItens[targetIdx] = temp;
    setItens(nextItens);
    if (expandedItemIndex === index) {
      setExpandedItemIndex(targetIdx);
    }
  };

  const handleUpdateItem = (index: number, field: keyof QuoteItem, val: any) => {
    setItens((prev) => {
      const updated = [...prev];
      const target = { ...updated[index], [field]: val };

      if (field === 'quantidade' || field === 'valorUnitario') {
        const q = field === 'quantidade' ? Number(val) || 0 : target.quantidade;
        const p = field === 'valorUnitario' ? Number(val) || 0 : target.valorUnitario;
        target.valorTotal = parseFloat((q * p).toFixed(2));
      }

      updated[index] = target;
      return updated;
    });
  };

  const handleRemoveItem = (index: number) => {
    setItens((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveItemToCatalog = (item: QuoteItem) => {
    if (!item.nome.trim()) return;
    addCatalogItem({
      nome: item.nome,
      descricao: item.descricao,
      modalidade: item.modalidade,
      unidadePadrao: item.unidade,
      valorUnitarioPadrao: item.valorUnitario
    });
  };

  const handleSelectPartner = (partner: BusinessPartner) => {
    setClienteNome(partner.nome);
    if (partner.documento) setClienteDocumento(partner.documento);
    if (partner.contato) setClienteContato(partner.contato);
    if (partner.telefone) setClienteTelefone(partner.telefone);
    if (partner.email) setClienteEmail(partner.email);
    if (partner.endereco) setClienteEnderecoObra(partner.endereco);
    if (partner.cidadeUf) setClienteCidadeUf(partner.cidadeUf);
    showToast(`Dados de ${partner.nome} carregados automaticamente.`, 'info');
  };

  const handleSelectExistingClient = (clientName: string) => {
    setClienteNome(clientName);
    const existing = quotes.find((q) => q.cliente.nome === clientName);
    if (existing) {
      setClienteDocumento(existing.cliente.documento || '');
      setClienteContato(existing.cliente.contato || '');
      setClienteTelefone(existing.cliente.telefone || '');
      setClienteEmail(existing.cliente.email || '');
      setClienteEnderecoObra(existing.cliente.enderecoObra || '');
      setClienteCidadeUf(existing.cliente.cidadeUf || '');
      showToast(`Dados de ${clientName} carregados.`, 'info');
    }
  };

  const handleSubmit = (e: React.FormEvent, previewAfter = false) => {
    e.preventDefault();

    if (!clienteNome.trim()) {
      showToast('Por favor, informe o nome do cliente.', 'error');
      return;
    }

    if (itens.length === 0) {
      showToast('Adicione pelo menos um item à planilha do orçamento.', 'error');
      return;
    }

    const valDate = computeValidityDate(dataEmissao, diasValidade);

    const quoteData: Omit<Quote, 'id' | 'createdAt'> = {
      numero,
      dataEmissao,
      dataValidade: valDate,
      diasValidade,
      status,
      cliente: {
        nome: clienteNome,
        documento: clienteDocumento,
        contato: clienteContato,
        telefone: clienteTelefone,
        email: clienteEmail,
        enderecoObra: clienteEnderecoObra,
        cidadeUf: clienteCidadeUf
      },
      textoIntroducao,
      textoObservacoes,
      itens,
      subtotal,
      desconto: descontoNum,
      acrescimoFrete: acrescimoNum,
      valorTotal: valorTotalGeral,
      condicoesPagamento,
      prazoEntrega,
      responsavelNome,
      responsavelCargo,
      convertidoEmReceita: quoteToEdit ? quoteToEdit.convertidoEmReceita : false,
      dataConversao: quoteToEdit?.dataConversao,
      detalhesConversao: quoteToEdit?.detalhesConversao
    };

    if (quoteToEdit) {
      updateQuote(quoteToEdit.id, quoteData);
      if (previewAfter && onSaveAndPreview) {
        onSaveAndPreview({ ...quoteToEdit, ...quoteData });
      }
    } else {
      const newId = `orc-${Date.now()}`;
      addQuote(quoteData);
      if (previewAfter && onSaveAndPreview) {
        onSaveAndPreview({
          ...quoteData,
          id: newId,
          createdAt: new Date().toISOString()
        });
      }
    }

    onClose();
  };

  return (
    <>
      <div className={`fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center ${isMaximized ? 'p-0' : 'p-2 sm:p-4 lg:p-6'}`}>
        <div className={`bg-white shadow-2xl overflow-hidden border border-[#DEE2E6] flex flex-col transition-all duration-200 ${
          isMaximized
            ? 'w-full h-full max-h-screen max-w-none rounded-none'
            : 'max-w-6xl xl:max-w-7xl w-full rounded-2xl max-h-[94vh]'
        } animate-in fade-in zoom-in-95 duration-150`}>
          
          {/* Top Modal Header */}
          <div className="bg-[#010102] text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-[#835400] flex items-center justify-center text-white shrink-0 shadow-sm">
                <span className="material-symbols-outlined text-[24px]">request_quote</span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold truncate">
                    {quoteToEdit ? `Editar Orçamento ${quoteToEdit.numero}` : 'Novo Orçamento Comercial'}
                  </h3>
                  <span className="hidden sm:inline px-2 py-0.5 rounded text-[10px] font-bold bg-[#835400]/30 text-[#F2A93B] border border-[#835400]/40">
                    Proposta Usina
                  </span>
                </div>
                <p className="text-xs text-gray-400 truncate">
                  Estruture a planilha de serviços, produtos e gere a folha timbrada A4
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsCatalogDrawerOpen(true)}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-[#1C1C1E] hover:bg-[#2C2C2E] text-[#F2A93B] border border-gray-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">inventory_2</span>
                Catálogo de Preços
              </button>

              <button
                type="button"
                onClick={() => setIsMaximized(!isMaximized)}
                title={isMaximized ? 'Restaurar tamanho padrão' : 'Maximizar para tela cheia (mais espaço visual)'}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors text-xs font-semibold cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">
                  {isMaximized ? 'fullscreen_exit' : 'fullscreen'}
                </span>
                <span className="hidden md:inline">
                  {isMaximized ? 'Restaurar' : 'Tela Cheia'}
                </span>
              </button>

              <button
                type="button"
                onClick={onClose}
                title="Fechar janela (Esc ou Voltar)"
                className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white border border-gray-700 transition-colors cursor-pointer"
                aria-label="Fechar"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
          </div>

          {/* Wizard Step Navigation Bar */}
          <div className="bg-gray-100 border-b border-[#DEE2E6] px-3 sm:px-6 py-2 flex items-center justify-between gap-2 overflow-x-auto select-none shrink-0 scrollbar-none">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  currentStep === 1
                    ? 'bg-[#010102] text-white shadow-xs'
                    : 'bg-white text-gray-700 hover:bg-gray-200 border border-gray-200'
                }`}
              >
                <span className="w-4 h-4 rounded-full bg-[#F2A93B] text-[#010102] text-[10px] font-black flex items-center justify-center">1</span>
                <span>Cliente & Obra</span>
              </button>

              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  currentStep === 2
                    ? 'bg-[#010102] text-white shadow-xs'
                    : 'bg-white text-gray-700 hover:bg-gray-200 border border-gray-200'
                }`}
              >
                <span className="w-4 h-4 rounded-full bg-[#F2A93B] text-[#010102] text-[10px] font-black flex items-center justify-center">2</span>
                <span>Itens & Serviços</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-100 text-[#835400] font-mono font-bold">
                  {itens.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  currentStep === 3
                    ? 'bg-[#010102] text-white shadow-xs'
                    : 'bg-white text-gray-700 hover:bg-gray-200 border border-gray-200'
                }`}
              >
                <span className="w-4 h-4 rounded-full bg-[#F2A93B] text-[#010102] text-[10px] font-black flex items-center justify-center">3</span>
                <span>Fechamento & Total</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-bold hidden sm:inline">
                  R$ {valorTotalGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsWizardMode(!isWizardMode)}
              className="hidden lg:flex items-center gap-1 text-xs text-gray-600 hover:text-black font-semibold px-2.5 py-1 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">
                {isWizardMode ? 'unfold_more' : 'unfold_less'}
              </span>
              {isWizardMode ? 'Ver Tudo (Página Única)' : 'Modo Passos (Wizard)'}
            </button>
          </div>

          {/* Form Scrollable Body */}
          <form onSubmit={(e) => handleSubmit(e, false)} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            
            {/* STEP 1: DADOS GERAIS, CLIENTE & APRESENTAÇÃO */}
            {(!isWizardMode || currentStep === 1) && (
              <div className="space-y-6 animate-in fade-in duration-150">
                {/* 1. Header & General Info */}
                <div className="bg-[#F8F9FA] p-4 rounded-xl border border-[#DEE2E6] space-y-4">
              <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                <span className="text-xs font-bold text-[#010102] uppercase tracking-wider flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-[#835400]">info</span>
                  1. Dados Gerais da Proposta
                </span>
                <span className="text-[11px] text-gray-500">
                  Válido até: <strong>{computeValidityDate(dataEmissao, diasValidade)}</strong>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-[#1C1B1B] uppercase mb-1">
                    Número do Orçamento *
                  </label>
                  <input
                    type="text"
                    required
                    value={numero}
                    onChange={(e) => setNumero(e.target.value)}
                    className="w-full p-2 rounded-lg border border-gray-300 text-xs bg-white font-mono font-bold text-[#010102] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#1C1B1B] uppercase mb-1">
                    Data de Emissão *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="DD/MM/AAAA"
                    value={dataEmissao}
                    onChange={(e) => setDataEmissao(e.target.value)}
                    className="w-full p-2 rounded-lg border border-gray-300 text-xs bg-white text-[#010102] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#1C1B1B] uppercase mb-1">
                    Validade da Proposta
                  </label>
                  <select
                    value={diasValidade}
                    onChange={(e) => setDiasValidade(Number(e.target.value))}
                    className="w-full p-2 rounded-lg border border-gray-300 text-xs bg-white text-[#010102] outline-none"
                  >
                    <option value={7}>7 dias corridos</option>
                    <option value={10}>10 dias corridos</option>
                    <option value={15}>15 dias corridos</option>
                    <option value={30}>30 dias corridos</option>
                    <option value={60}>60 dias corridos</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#1C1B1B] uppercase mb-1">
                    Status Atual
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as QuoteStatus)}
                    className="w-full p-2 rounded-lg border border-gray-300 text-xs bg-white font-bold text-[#010102] outline-none"
                  >
                    <option value="rascunho">Rascunho</option>
                    <option value="enviado">Enviado ao Cliente</option>
                    <option value="aprovado">Aprovado pelo Cliente</option>
                    <option value="recusado">Recusado / Não Fechado</option>
                    <option value="convertido">Convertido em Receita</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 2. Client & Work Location Info */}
            <div className="bg-[#F8F9FA] p-4 rounded-xl border border-[#DEE2E6] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-200 pb-2">
                <span className="text-xs font-bold text-[#010102] uppercase tracking-wider flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-[#835400]">person</span>
                  2. Dados do Cliente & Local da Obra
                </span>

                {existingClients.length > 0 && (
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-gray-500 text-[11px]">Clientes Recentes:</span>
                    <select
                      onChange={(e) => {
                        if (e.target.value) handleSelectExistingClient(e.target.value);
                      }}
                      className="text-xs p-1 rounded border border-gray-300 bg-white"
                      defaultValue=""
                    >
                      <option value="" disabled>Selecionar cliente cadastrado...</option>
                      {existingClients.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <PartnerAutocomplete
                    label="Cliente / Razão Social"
                    placeholder="Pesquise por nome, razão social, CNPJ ou cidade..."
                    value={clienteNome}
                    onChange={setClienteNome}
                    onSelectPartner={handleSelectPartner}
                    partnerType="cliente"
                    required
                    leftIcon="business"
                    helperText="Digite para pesquisar no histórico e cadastro da usina ou digite um novo cliente"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#1C1B1B] uppercase mb-1">
                    CNPJ / CPF
                  </label>
                  <input
                    type="text"
                    placeholder="00.000.000/0001-00"
                    value={clienteDocumento}
                    onChange={(e) => setClienteDocumento(e.target.value)}
                    className="w-full p-2 rounded-lg border border-gray-300 text-xs bg-white text-[#010102] outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#1C1B1B] uppercase mb-1">
                    A/C (Contato / Comprador)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Eng. Roberto Santos"
                    value={clienteContato}
                    onChange={(e) => setClienteContato(e.target.value)}
                    className="w-full p-2 rounded-lg border border-gray-300 text-xs bg-white text-[#010102] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#1C1B1B] uppercase mb-1">
                    Telefone / WhatsApp
                  </label>
                  <input
                    type="text"
                    placeholder="(11) 98765-4321"
                    value={clienteTelefone}
                    onChange={(e) => setClienteTelefone(e.target.value)}
                    className="w-full p-2 rounded-lg border border-gray-300 text-xs bg-white text-[#010102] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#1C1B1B] uppercase mb-1">
                    E-mail Comercial
                  </label>
                  <input
                    type="email"
                    placeholder="compras@empresa.com.br"
                    value={clienteEmail}
                    onChange={(e) => setClienteEmail(e.target.value)}
                    className="w-full p-2 rounded-lg border border-gray-300 text-xs bg-white text-[#010102] outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-[#1C1B1B] uppercase mb-1">
                    Endereço da Obra / Local de Aplicação
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Rodovia SP-330, KM 145 - Trecho Norte / Loteamento Imperial"
                    value={clienteEnderecoObra}
                    onChange={(e) => setClienteEnderecoObra(e.target.value)}
                    className="w-full p-2 rounded-lg border border-gray-300 text-xs bg-white text-[#010102] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#1C1B1B] uppercase mb-1">
                    Cidade / UF
                  </label>
                  <input
                    type="text"
                    placeholder="Campinas - SP"
                    value={clienteCidadeUf}
                    onChange={(e) => setClienteCidadeUf(e.target.value)}
                    className="w-full p-2 rounded-lg border border-gray-300 text-xs bg-white text-[#010102] outline-none"
                  />
                </div>
              </div>
            </div>

            {/* 3. Text Before Spreadsheet (Introdução) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-[#010102] uppercase tracking-wider">
                  3. Texto de Apresentação / Objeto da Proposta (Antes da Planilha)
                </label>
                <button
                  type="button"
                  onClick={() => setTextoIntroducao(letterheadSettings.textoPadraoIntroducao || '')}
                  className="text-[11px] text-[#835400] hover:underline font-semibold"
                >
                  Restaurar Texto Padrão
                </button>
              </div>
              <textarea
                rows={2}
                placeholder="Texto introdutório com agradecimento e objeto do fornecimento..."
                value={textoIntroducao}
                onChange={(e) => setTextoIntroducao(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-gray-300 text-xs text-[#010102] bg-white outline-none focus:border-[#010102]"
              />
            </div>
          </div>
        )}

            {/* STEP 2: PLANILHA DE ITENS & SERVIÇOS */}
            {(!isWizardMode || currentStep === 2) && (
              <div className="space-y-4 animate-in fade-in duration-150">
                {/* 4. Spreadsheet of Items (Planilha do Orçamento) */}
                <div className="space-y-3">
                  <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 bg-[#F8F9FA] p-3.5 rounded-xl border border-[#DEE2E6]">
                <div>
                  <h4 className="text-xs font-bold text-[#010102] uppercase tracking-wider flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[18px] text-[#835400]">table_chart</span>
                    4. Planilha de Itens & Serviços (Com/Sem Aplicação e Transporte)
                  </h4>
                  <p className="text-[11px] text-gray-500">
                    Monte a composição detalhada. Você pode esticar qualquer campo de texto arrastando o canto inferior direito (↘).
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Preset height selector to stretch/shrink all rows at once */}
                  <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-gray-200 text-[11px]">
                    <span className="text-gray-500 font-semibold px-1.5 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">format_line_spacing</span>
                      Linhas:
                    </span>
                    {[
                      { r: 1, label: '1L' },
                      { r: 2, label: '2L (Padrão)' },
                      { r: 4, label: '4L (Amplo)' }
                    ].map((opt) => (
                      <button
                        key={opt.r}
                        type="button"
                        onClick={() => setDescRows(opt.r)}
                        title={`Ajustar todas as descrições para ${opt.r} linhas`}
                        className={`px-2 py-0.5 rounded font-bold transition-all ${
                          descRows === opt.r
                            ? 'bg-[#835400] text-white shadow-xs'
                            : 'text-gray-600 hover:text-black hover:bg-gray-100'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  {/* View Mode: Tabela vs Cards */}
                  <div className="flex items-center bg-white p-1 rounded-lg border border-gray-200 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setViewMode('tabela')}
                      title="Visualização em Tabela Fluida com caixas esticáveis"
                      className={`px-2.5 py-1 rounded font-bold flex items-center gap-1 transition-all ${
                        viewMode === 'tabela'
                          ? 'bg-[#010102] text-white shadow-xs'
                          : 'text-gray-600 hover:text-black hover:bg-gray-100'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[15px]">table_rows</span>
                      Tabela
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('cards')}
                      title="Visualização em Cards Amplos com editor completo"
                      className={`px-2.5 py-1 rounded font-bold flex items-center gap-1 transition-all ${
                        viewMode === 'cards'
                          ? 'bg-[#010102] text-white shadow-xs'
                          : 'text-gray-600 hover:text-black hover:bg-gray-100'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[15px]">view_agenda</span>
                      Cards Amplos
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsCatalogDrawerOpen(true)}
                    className="px-3 py-1.5 bg-[#835400] hover:bg-[#6b4400] text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">add_box</span>
                    Buscar Catálogo
                  </button>

                  <button
                    type="button"
                    onClick={handleAddBlankItem}
                    className="px-3 py-1.5 border border-gray-300 bg-white hover:bg-gray-100 text-gray-800 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">add</span>
                    Novo Item Avulso
                  </button>
                </div>
              </div>

              {/* Items Container */}
              <div className="border border-[#DEE2E6] rounded-xl bg-white shadow-xs overflow-hidden">
                {viewMode === 'tabela' ? (
                  <>
                    {/* Desktop / Tablet: Fluid Table with Resizable Textareas */}
                    <div className="hidden md:block w-full">
                      <table className="w-full text-left text-xs border-collapse table-fixed">
                        <thead>
                          <tr className="bg-[#010102] text-white text-[10px] uppercase font-semibold">
                            <th className="py-2.5 px-2 w-10 text-center">#</th>
                            <th className="py-2.5 px-3 w-[40%]">Item / Especificação Técnica (Esticável)</th>
                            <th className="py-2.5 px-2 w-[14%]">Modalidade</th>
                            <th className="py-2.5 px-2 w-[9%] text-right">Qtd.</th>
                            <th className="py-2.5 px-2 w-[8%] text-center">Unid.</th>
                            <th className="py-2.5 px-2 w-[13%] text-right">Preço Unit. (R$)</th>
                            <th className="py-2.5 px-3 w-[13%] text-right">Total (R$)</th>
                            <th className="py-2.5 px-2 w-24 text-center">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {itens.map((item, index) => (
                            <React.Fragment key={item.id || index}>
                              <tr className="hover:bg-gray-50/80 transition-colors">
                                <td className="py-2.5 px-2 text-center text-gray-400 font-bold text-[11px] align-top pt-3">
                                  <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center mx-auto text-gray-700 font-mono text-[11px]">
                                    {index + 1}
                                  </div>
                                </td>

                                {/* Name & Resizable Desc */}
                                <td className="py-2.5 px-3 space-y-1.5 min-w-0 align-top">
                                  <div className="flex items-center gap-1.5">
                                    <input
                                      type="text"
                                      required
                                      placeholder="Nome do produto ou serviço..."
                                      value={item.nome}
                                      onChange={(e) => handleUpdateItem(index, 'nome', e.target.value)}
                                      className="w-full px-2.5 py-1.5 rounded-lg border border-gray-300 text-xs font-bold text-[#010102] bg-white outline-none focus:border-[#835400] focus:ring-1 focus:ring-[#835400]"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => setExpandedItemIndex(expandedItemIndex === index ? null : index)}
                                      title={expandedItemIndex === index ? "Recolher painel amplo" : "Expandir editor amplo de especificações"}
                                      className={`p-1.5 rounded-lg transition-colors shrink-0 text-xs flex items-center gap-0.5 cursor-pointer ${
                                        expandedItemIndex === index
                                          ? 'bg-[#835400] text-white shadow-xs'
                                          : 'text-gray-500 hover:text-[#835400] hover:bg-amber-50 border border-gray-200'
                                      }`}
                                    >
                                      <span className="material-symbols-outlined text-[16px]">
                                        {expandedItemIndex === index ? 'unfold_less' : 'open_in_full'}
                                      </span>
                                    </button>
                                  </div>

                                  <div className="relative">
                                    <textarea
                                      rows={descRows}
                                      placeholder="Especificação técnica, espessura, traço, maquinários (arraste o canto ↘ para esticar)..."
                                      value={item.descricao || ''}
                                      onChange={(e) => handleUpdateItem(index, 'descricao', e.target.value)}
                                      className="w-full p-2 text-xs rounded-lg border border-gray-200 text-gray-700 bg-white outline-none resize-y min-h-[46px] transition-all focus:border-[#835400] focus:ring-1 focus:ring-[#835400] leading-relaxed"
                                    />
                                    <div className="flex items-center justify-between text-[10px] text-gray-400 px-0.5 mt-0.5">
                                      <span className="truncate">Especificação visível na proposta</span>
                                      <span className="font-mono text-[9px] text-gray-400 flex items-center gap-0.5 select-none shrink-0">
                                        <span className="material-symbols-outlined text-[12px]">drag_handle</span>
                                        esticar ↘
                                      </span>
                                    </div>
                                  </div>
                                </td>

                                {/* Modalidade */}
                                <td className="py-2.5 px-2 align-top pt-3">
                                  <select
                                    value={item.modalidade}
                                    onChange={(e) => handleUpdateItem(index, 'modalidade', e.target.value)}
                                    className="w-full p-2 rounded-lg border border-gray-300 text-[11px] font-semibold bg-white text-black outline-none focus:border-[#835400]"
                                  >
                                    <option value="com_aplicacao">Com Aplicação</option>
                                    <option value="sem_aplicacao">Sem Aplicação (FOB)</option>
                                    <option value="transporte">Transporte/Frete</option>
                                    <option value="locacao">Locação</option>
                                    <option value="material">Material/Insumo</option>
                                  </select>
                                </td>

                                {/* Qtd */}
                                <td className="py-2.5 px-2 align-top pt-3">
                                  <input
                                    type="number"
                                    inputMode="decimal"
                                    step="any"
                                    min="0"
                                    value={item.quantidade}
                                    onChange={(e) => handleUpdateItem(index, 'quantidade', e.target.value)}
                                    className="w-full p-2 rounded-lg border border-gray-300 text-xs text-right font-mono font-bold text-[#010102] bg-white outline-none focus:border-[#835400]"
                                  />
                                </td>

                                {/* Unidade */}
                                <td className="py-2.5 px-2 align-top pt-3">
                                  <select
                                    value={item.unidade}
                                    onChange={(e) => handleUpdateItem(index, 'unidade', e.target.value)}
                                    className="w-full p-2 rounded-lg border border-gray-300 text-[11px] text-center bg-white text-black outline-none focus:border-[#835400]"
                                  >
                                    <option value="ton">ton</option>
                                    <option value="m²">m²</option>
                                    <option value="m³">m³</option>
                                    <option value="viagem">viagem</option>
                                    <option value="hora">hora</option>
                                    <option value="diária">diária</option>
                                    <option value="saco 25kg">saco</option>
                                    <option value="un">un</option>
                                  </select>
                                </td>

                                {/* Unit Price */}
                                <td className="py-2.5 px-2 align-top pt-3">
                                  <input
                                    type="number"
                                    inputMode="decimal"
                                    step="0.01"
                                    min="0"
                                    value={item.valorUnitario}
                                    onChange={(e) => handleUpdateItem(index, 'valorUnitario', e.target.value)}
                                    className="w-full p-2 rounded-lg border border-gray-300 text-xs text-right font-mono font-bold text-[#835400] bg-white outline-none focus:border-[#835400]"
                                  />
                                </td>

                                {/* Total item */}
                                <td className="py-2.5 px-3 text-right font-mono font-black text-[#010102] text-xs align-top pt-4">
                                  R$ {item.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </td>

                                {/* Action buttons */}
                                <td className="py-2.5 px-2 text-center align-top pt-3">
                                  <div className="flex items-center justify-center gap-0.5">
                                    <button
                                      type="button"
                                      onClick={() => handleMoveItem(index, 'up')}
                                      disabled={index === 0}
                                      title="Mover item para cima"
                                      className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-20 disabled:hover:text-gray-400 rounded cursor-pointer"
                                    >
                                      <span className="material-symbols-outlined text-[15px]">arrow_upward</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleMoveItem(index, 'down')}
                                      disabled={index === itens.length - 1}
                                      title="Mover item para baixo"
                                      className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-20 disabled:hover:text-gray-400 rounded cursor-pointer"
                                    >
                                      <span className="material-symbols-outlined text-[15px]">arrow_downward</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDuplicateItem(index)}
                                      title="Duplicar este item"
                                      className="p-1 text-gray-400 hover:text-blue-600 rounded cursor-pointer"
                                    >
                                      <span className="material-symbols-outlined text-[15px]">content_copy</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleSaveItemToCatalog(item)}
                                      title="Salvar no catálogo geral"
                                      className="p-1 text-gray-400 hover:text-[#835400] rounded cursor-pointer"
                                    >
                                      <span className="material-symbols-outlined text-[15px]">bookmark_add</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveItem(index)}
                                      title="Excluir item"
                                      className="p-1 text-gray-400 hover:text-red-600 rounded cursor-pointer"
                                    >
                                      <span className="material-symbols-outlined text-[15px]">delete</span>
                                    </button>
                                  </div>
                                </td>
                              </tr>

                              {/* Expanded Detailed Specification Drawer */}
                              {expandedItemIndex === index && (
                                <tr className="bg-amber-50/50 border-y border-amber-200">
                                  <td colSpan={8} className="p-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-[18px] text-[#835400]">description</span>
                                        <span className="text-xs font-bold text-[#835400] uppercase tracking-wider">
                                          Editor Amplo de Especificação Técnica — Item #{index + 1}: {item.nome || 'Sem título'}
                                        </span>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => setExpandedItemIndex(null)}
                                        className="text-xs font-semibold text-gray-600 hover:text-black flex items-center gap-1 cursor-pointer"
                                      >
                                        <span className="material-symbols-outlined text-[16px]">close</span>
                                        Recolher Editor
                                      </button>
                                    </div>

                                    <div>
                                      <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                                        Descrição Técnica Detalhada & Condições de Execução
                                      </label>
                                      <textarea
                                        rows={4}
                                        value={item.descricao || ''}
                                        onChange={(e) => handleUpdateItem(index, 'descricao', e.target.value)}
                                        placeholder="Insira as especificações completas: traço da mistura betuminosa, espessura compactada, normas DNIT/DER, temperatura de entrega na obra, equipamentos de espalhamento e compactação..."
                                        className="w-full p-3 rounded-xl border border-amber-300 bg-white text-xs text-[#010102] outline-none resize-y min-h-[90px] leading-relaxed shadow-xs focus:ring-2 focus:ring-[#835400]"
                                      />
                                    </div>

                                    {/* Tech presets quick insertion */}
                                    <div className="space-y-1.5">
                                      <span className="text-[10px] font-bold uppercase text-gray-600 flex items-center gap-1">
                                        <span className="material-symbols-outlined text-[14px] text-[#835400]">bolt</span>
                                        Inserir Parâmetros Rápidos de Pavimentação (clique para adicionar ao texto):
                                      </span>
                                      <div className="flex flex-wrap gap-1.5">
                                        {TECH_PRESETS.map((preset, pIdx) => (
                                          <button
                                            key={pIdx}
                                            type="button"
                                            onClick={() => {
                                              const current = item.descricao ? item.descricao + '\n' : '';
                                              handleUpdateItem(index, 'descricao', current + preset.text);
                                              showToast(`Parâmetro "${preset.label}" inserido.`, 'info');
                                            }}
                                            className="px-2.5 py-1 bg-white hover:bg-amber-100 text-gray-800 hover:text-[#835400] border border-amber-200 rounded-lg text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                                          >
                                            <span className="material-symbols-outlined text-[13px] text-[#835400]">add</span>
                                            {preset.label}
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile Table Replacement: High-density cards */}
                    <div className="md:hidden divide-y divide-gray-200">
                      {itens.map((item, index) => (
                        <div key={item.id || index} className="p-3.5 space-y-2.5 bg-white">
                          {/* Top line: Index + Total + Actions */}
                          <div className="flex items-center justify-between">
                            <span className="bg-gray-100 text-gray-700 text-[10px] font-bold px-2 py-0.5 rounded">
                              Item #{index + 1}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-black text-xs text-[#010102]">
                                R$ {item.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleDuplicateItem(index)}
                                title="Duplicar item"
                                className="p-1 text-gray-400 hover:text-blue-600 rounded"
                              >
                                <span className="material-symbols-outlined text-[16px]">content_copy</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSaveItemToCatalog(item)}
                                title="Salvar no catálogo"
                                className="p-1 text-gray-400 hover:text-[#835400] rounded"
                              >
                                <span className="material-symbols-outlined text-[16px]">bookmark_add</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(index)}
                                title="Remover item"
                                className="p-1 text-gray-400 hover:text-red-600 rounded"
                              >
                                <span className="material-symbols-outlined text-[16px]">delete</span>
                              </button>
                            </div>
                          </div>

                          {/* Inputs: Name and Resizable Description */}
                          <div className="space-y-1.5">
                            <input
                              type="text"
                              required
                              placeholder="Nome do produto/serviço..."
                              value={item.nome}
                              onChange={(e) => handleUpdateItem(index, 'nome', e.target.value)}
                              className="w-full p-2 rounded-lg border border-gray-300 text-xs font-bold text-[#010102] bg-white outline-none"
                            />
                            <textarea
                              rows={2}
                              placeholder="Obs técnica opcional (arraste ↘ para esticar)..."
                              value={item.descricao || ''}
                              onChange={(e) => handleUpdateItem(index, 'descricao', e.target.value)}
                              className="w-full p-2 text-xs rounded-lg border border-gray-200 text-gray-600 bg-white outline-none resize-y min-h-[50px] leading-relaxed"
                            />
                          </div>

                          {/* Grid: Modalidade, Qtd, Unidade, Preço Unit */}
                          <div className="grid grid-cols-2 gap-2 text-[11px]">
                            <div>
                              <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Modalidade</label>
                              <select
                                value={item.modalidade}
                                onChange={(e) => handleUpdateItem(index, 'modalidade', e.target.value)}
                                className="w-full p-1.5 rounded-lg border border-gray-300 text-[11px] font-semibold bg-white outline-none"
                              >
                                <option value="com_aplicacao">Com Aplicação</option>
                                <option value="sem_aplicacao">Sem Aplicação</option>
                                <option value="transporte">Transporte/Frete</option>
                                <option value="locacao">Locação</option>
                                <option value="material">Material</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Preço Unitário (R$)</label>
                              <input
                                type="number"
                                inputMode="decimal"
                                step="0.01"
                                min="0"
                                value={item.valorUnitario}
                                onChange={(e) => handleUpdateItem(index, 'valorUnitario', e.target.value)}
                                className="w-full p-2 rounded-lg border border-gray-300 text-xs font-mono font-bold text-[#835400] text-right bg-white outline-none focus:border-[#835400]"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Quantidade</label>
                              <input
                                type="number"
                                inputMode="decimal"
                                step="any"
                                min="0"
                                value={item.quantidade}
                                onChange={(e) => handleUpdateItem(index, 'quantidade', e.target.value)}
                                className="w-full p-2 rounded-lg border border-gray-300 text-xs font-mono font-bold text-[#010102] text-right bg-white outline-none focus:border-[#835400]"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Unidade</label>
                              <select
                                value={item.unidade}
                                onChange={(e) => handleUpdateItem(index, 'unidade', e.target.value)}
                                className="w-full p-1.5 rounded-lg border border-gray-300 text-[11px] text-center bg-white outline-none"
                              >
                                <option value="ton">ton</option>
                                <option value="m²">m²</option>
                                <option value="m³">m³</option>
                                <option value="viagem">viagem</option>
                                <option value="hora">hora</option>
                                <option value="diária">diária</option>
                                <option value="saco 25kg">saco</option>
                                <option value="un">un</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  /* Cards Amplos View Mode (Both desktop and mobile) */
                  <div className="p-4 space-y-4 bg-gray-50">
                    {itens.map((item, index) => (
                      <div key={item.id || index} className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-2.5">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-[#835400] text-white flex items-center justify-center font-bold text-xs">
                              {index + 1}
                            </span>
                            <span className="text-xs font-bold text-[#010102]">
                              {item.nome || `Item Sem Nome #${index + 1}`}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
                              <span className="text-[10px] font-semibold text-gray-500 uppercase mr-1.5">Total Linha:</span>
                              <span className="font-mono font-black text-xs text-[#010102]">
                                R$ {item.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </span>
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleMoveItem(index, 'up')}
                                disabled={index === 0}
                                title="Mover para cima"
                                className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-20 rounded"
                              >
                                <span className="material-symbols-outlined text-[18px]">arrow_upward</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMoveItem(index, 'down')}
                                disabled={index === itens.length - 1}
                                title="Mover para baixo"
                                className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-20 rounded"
                              >
                                <span className="material-symbols-outlined text-[18px]">arrow_downward</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDuplicateItem(index)}
                                title="Duplicar este item"
                                className="p-1 text-gray-400 hover:text-blue-600 rounded"
                              >
                                <span className="material-symbols-outlined text-[18px]">content_copy</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSaveItemToCatalog(item)}
                                title="Salvar no catálogo"
                                className="p-1 text-gray-400 hover:text-[#835400] rounded"
                              >
                                <span className="material-symbols-outlined text-[18px]">bookmark_add</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(index)}
                                title="Remover item"
                                className="p-1 text-gray-400 hover:text-red-600 rounded"
                              >
                                <span className="material-symbols-outlined text-[18px]">delete</span>
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Title and Specification */}
                        <div className="grid grid-cols-1 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                              Nome do Produto ou Serviço *
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="Ex: CBUQ Faixa C (CAP 50/70) - Com Aplicação Mecanizada"
                              value={item.nome}
                              onChange={(e) => handleUpdateItem(index, 'nome', e.target.value)}
                              className="w-full p-2.5 rounded-lg border border-gray-300 text-xs font-bold text-[#010102] bg-white outline-none focus:border-[#835400]"
                            />
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="block text-[11px] font-bold text-gray-700 uppercase">
                                Especificação Técnica & Detalhes (Esticável)
                              </label>
                              <span className="text-[10px] text-gray-400 font-mono">
                                arraste o canto inferior direito para esticar ↘
                              </span>
                            </div>
                            <textarea
                              rows={3}
                              value={item.descricao || ''}
                              onChange={(e) => handleUpdateItem(index, 'descricao', e.target.value)}
                              placeholder="Descreva a composição, espessura, transporte, temperatura e maquinários..."
                              className="w-full p-2.5 text-xs rounded-lg border border-gray-300 text-gray-700 bg-white outline-none resize-y min-h-[70px] leading-relaxed focus:border-[#835400]"
                            />
                          </div>

                          {/* Quick Chips */}
                          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                            <span className="text-[10px] font-bold text-gray-500 uppercase mr-1">Inserir:</span>
                            {TECH_PRESETS.map((preset, pIdx) => (
                              <button
                                key={pIdx}
                                type="button"
                                onClick={() => {
                                  const current = item.descricao ? item.descricao + '\n' : '';
                                  handleUpdateItem(index, 'descricao', current + preset.text);
                                  showToast(`Parâmetro "${preset.label}" inserido.`, 'info');
                                }}
                                className="px-2 py-0.5 bg-white hover:bg-amber-50 text-gray-700 hover:text-[#835400] border border-gray-200 rounded text-[10px] font-semibold transition-colors"
                              >
                                + {preset.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Numeric Fields */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50 p-3 rounded-lg border border-gray-200">
                          <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                              Modalidade
                            </label>
                            <select
                              value={item.modalidade}
                              onChange={(e) => handleUpdateItem(index, 'modalidade', e.target.value)}
                              className="w-full p-2 rounded-lg border border-gray-300 text-xs font-semibold bg-white outline-none"
                            >
                              <option value="com_aplicacao">Com Aplicação</option>
                              <option value="sem_aplicacao">Sem Aplicação (FOB)</option>
                              <option value="transporte">Transporte/Frete</option>
                              <option value="locacao">Locação</option>
                              <option value="material">Material</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                              Quantidade
                            </label>
                            <input
                              type="number"
                              step="any"
                              min="0"
                              value={item.quantidade}
                              onChange={(e) => handleUpdateItem(index, 'quantidade', e.target.value)}
                              className="w-full p-2 rounded-lg border border-gray-300 text-xs font-mono font-bold text-right bg-white outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                              Unidade
                            </label>
                            <select
                              value={item.unidade}
                              onChange={(e) => handleUpdateItem(index, 'unidade', e.target.value)}
                              className="w-full p-2 rounded-lg border border-gray-300 text-xs text-center bg-white outline-none"
                            >
                              <option value="ton">tonelada (ton)</option>
                              <option value="m²">metro quadrado (m²)</option>
                              <option value="m³">metro cúbico (m³)</option>
                              <option value="viagem">viagem</option>
                              <option value="hora">hora</option>
                              <option value="diária">diária</option>
                              <option value="saco 25kg">saco 25kg</option>
                              <option value="un">unidade</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                              Preço Unitário (R$)
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.valorUnitario}
                              onChange={(e) => handleUpdateItem(index, 'valorUnitario', e.target.value)}
                              className="w-full p-2 rounded-lg border border-gray-300 text-xs font-mono font-bold text-[#835400] text-right bg-white outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

                {/* Step 2 Bottom: Subtotal Summary & Fast Navigation */}
                <div className="bg-[#F8F9FA] p-3.5 sm:p-4 border-t border-[#DEE2E6] flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-[#835400] shrink-0">
                      <span className="material-symbols-outlined text-[20px]">calculate</span>
                    </div>
                    <div>
                      <span className="text-[11px] text-gray-500 font-semibold block uppercase tracking-wider">Subtotal da Planilha ({itens.length} {itens.length === 1 ? 'item' : 'itens'})</span>
                      <span className="font-mono font-black text-base text-[#010102]">
                        R$ {subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  {isWizardMode && currentStep === 2 && (
                    <button
                      type="button"
                      onClick={() => setCurrentStep(3)}
                      className="w-full sm:w-auto px-5 py-2.5 bg-[#835400] hover:bg-[#6b4400] text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <span>Avançar: Condições & Fechamento</span>
                      <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: FECHAMENTO, CONDIÇÕES & TOTAL GERAL */}
          {(!isWizardMode || currentStep === 3) && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Resumo Financeiro & Fechamento de Valores */}
              <div className="bg-[#F8F9FA] p-4 sm:p-5 rounded-xl border border-[#DEE2E6] space-y-4">
                <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                  <span className="text-xs font-bold text-[#010102] uppercase tracking-wider flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-[#835400]">payments</span>
                    Fechamento Financeiro da Proposta
                  </span>
                  <span className="text-[11px] text-gray-500 font-mono">
                    {itens.length} {itens.length === 1 ? 'item orçado' : 'itens orçados'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-3 bg-white rounded-xl border border-gray-200">
                    <span className="block text-[11px] font-semibold text-gray-500 uppercase mb-1">Subtotal dos Itens</span>
                    <span className="font-mono font-black text-lg text-gray-800">
                      R$ {subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-green-200">
                    <label className="block text-[11px] font-bold text-green-700 uppercase mb-1">Desconto Especial (R$)</label>
                    <input
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      min="0"
                      value={desconto}
                      onChange={(e) => setDesconto(e.target.value)}
                      placeholder="0,00"
                      className="w-full p-1.5 text-right text-sm rounded-lg border border-green-300 font-mono font-bold text-green-700 bg-white outline-none focus:ring-1 focus:ring-green-500"
                    />
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-blue-200">
                    <label className="block text-[11px] font-bold text-blue-700 uppercase mb-1">Frete / Acréscimo (R$)</label>
                    <input
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      min="0"
                      value={acrescimoFrete}
                      onChange={(e) => setAcrescimoFrete(e.target.value)}
                      placeholder="0,00"
                      className="w-full p-1.5 text-right text-sm rounded-lg border border-blue-300 font-mono font-bold text-blue-700 bg-white outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="p-4 bg-[#010102] rounded-xl text-white flex flex-col sm:flex-row items-center justify-between gap-2 shadow-xs">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block">Valor Total Geral da Proposta</span>
                    <span className="text-xs text-gray-300">Inclui insumos, aplicação e condições ajustadas</span>
                  </div>
                  <span className="font-mono text-2xl sm:text-3xl font-black text-[#F2A93B]">
                    R$ {valorTotalGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* 5. Conditions & Notes (Texto Depois da Planilha) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#010102] uppercase tracking-wider mb-1">
                    5. Condições de Pagamento & Prazo de Entrega
                  </label>
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Condição: Ex: 30 DDL / Entrada de 30% + Saldo em 30/60 dias"
                      value={condicoesPagamento}
                      onChange={(e) => setCondicoesPagamento(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-gray-300 text-xs bg-white text-[#010102] outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Prazo: Ex: Início imediato após assinatura da proposta"
                      value={prazoEntrega}
                      onChange={(e) => setPrazoEntrega(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-gray-300 text-xs bg-white text-[#010102] outline-none"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-[#010102] uppercase tracking-wider">
                      6. Observações Técnicas & Normas (Pós-Planilha)
                    </label>
                    <span className="text-[10px] text-gray-400 font-mono">
                      arraste ↘ para esticar
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    placeholder="Normas técnicas DNIT, espessuras compactadas, garantia da usinagem e aplicação, restrições climáticas..."
                    value={textoObservacoes}
                    onChange={(e) => setTextoObservacoes(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-gray-300 text-xs bg-white text-[#010102] outline-none resize-y min-h-[75px] leading-relaxed focus:border-[#835400] focus:ring-1 focus:ring-[#835400]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#010102] uppercase tracking-wider mb-1">
                    Responsável pela Proposta
                  </label>
                  <input
                    type="text"
                    placeholder="Nome do emissor..."
                    value={responsavelNome}
                    onChange={(e) => setResponsavelNome(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-gray-300 text-xs bg-white text-[#010102] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#010102] uppercase tracking-wider mb-1">
                    Cargo / Departamento
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Engenheiro Responsável / Gerente Comercial"
                    value={responsavelCargo}
                    onChange={(e) => setResponsavelCargo(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-gray-300 text-xs bg-white text-[#010102] outline-none"
                  />
                </div>
              </div>
            </div>
          )}
          </form>

          {/* Modal Footer Controls */}
          <div className="p-3.5 sm:p-4 bg-gray-50 border-t border-[#DEE2E6] flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 border border-gray-300 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              {isWizardMode && currentStep > 1 && (
                <button
                  type="button"
                  onClick={() => setCurrentStep((prev) => (prev > 1 ? ((prev - 1) as any) : 1))}
                  className="px-4 py-2.5 border border-gray-300 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                  <span>Voltar para {currentStep === 2 ? 'Cliente' : 'Itens'}</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {isWizardMode && currentStep < 3 ? (
                <button
                  type="button"
                  onClick={() => {
                    if (currentStep === 1 && !clienteNome.trim()) {
                      showToast('Por favor, informe o nome do cliente antes de prosseguir.', 'info');
                      return;
                    }
                    setCurrentStep((prev) => (prev < 3 ? ((prev + 1) as any) : 3));
                  }}
                  className="px-5 sm:px-6 py-2.5 bg-[#835400] hover:bg-[#6b4400] text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <span>Avançar para {currentStep === 1 ? 'Itens & Serviços' : 'Fechamento & Total'}</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={(e) => handleSubmit(e as any, true)}
                    className="px-3.5 sm:px-4 py-2.5 bg-[#F2A93B] hover:bg-[#d99632] text-[#010102] font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">visibility</span>
                    <span className="hidden sm:inline">Salvar e</span> Ver Timbrado A4
                  </button>

                  <button
                    type="button"
                    onClick={(e) => handleSubmit(e as any, false)}
                    className="px-5 sm:px-6 py-2.5 bg-[#835400] hover:bg-[#6b4400] text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">save</span>
                    Salvar Orçamento
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Drawer for selecting catalog items */}
      <CatalogoItensDrawer
        isOpen={isCatalogDrawerOpen}
        onClose={() => setIsCatalogDrawerOpen(false)}
        onSelectItem={handleAddItemFromCatalog}
      />
    </>
  );
};
