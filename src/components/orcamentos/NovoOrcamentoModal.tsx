import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Quote, QuoteItem, QuoteStatus, QuoteCatalogItem, BusinessPartner } from '../../types';
import { CatalogoItensDrawer } from './CatalogoItensDrawer';
import { PartnerAutocomplete } from '../common';

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
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 lg:p-6">
        <div className="bg-white rounded-2xl max-w-5xl w-full shadow-2xl overflow-hidden border border-[#DEE2E6] flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
          
          {/* Top Modal Header */}
          <div className="bg-[#010102] text-white p-5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#835400] flex items-center justify-center text-white">
                <span className="material-symbols-outlined text-[24px]">request_quote</span>
              </div>
              <div>
                <h3 className="text-base font-bold">
                  {quoteToEdit ? `Editar Orçamento ${quoteToEdit.numero}` : 'Novo Orçamento Comercial'}
                </h3>
                <p className="text-xs text-gray-400">
                  Estruture a planilha de serviços, produtos e gere a folha timbrada A4
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsCatalogDrawerOpen(true)}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-[#1C1C1E] hover:bg-[#2C2C2E] text-[#F2A93B] border border-gray-700 rounded-lg text-xs font-bold transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">inventory_2</span>
                Catálogo de Preços
              </button>

              <button
                onClick={onClose}
                className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
          </div>

          {/* Form Scrollable Body */}
          <form onSubmit={(e) => handleSubmit(e, false)} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
            
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

            {/* 4. Spreadsheet of Items (Planilha do Orçamento) */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-xs font-bold text-[#010102] uppercase tracking-wider flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-[#835400]">table_chart</span>
                    4. Planilha de Itens & Serviços (Com/Sem Aplicação e Transporte)
                  </h4>
                  <p className="text-[11px] text-gray-500">
                    Monte a composição detalhada com cálculo automático em tempo real
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCatalogDrawerOpen(true)}
                    className="px-3 py-1.5 bg-[#835400] hover:bg-[#6b4400] text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">add_box</span>
                    Buscar do Catálogo
                  </button>

                  <button
                    type="button"
                    onClick={handleAddBlankItem}
                    className="px-3 py-1.5 border border-gray-300 bg-gray-50 hover:bg-gray-100 text-gray-800 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">add</span>
                    Novo Item Avulso
                  </button>
                </div>
              </div>

              {/* Items Table Container */}
              <div className="border border-[#DEE2E6] rounded-xl overflow-x-auto bg-white shadow-xs">
                <table className="w-full text-left text-xs border-collapse min-w-[700px]">
                  <thead>
                    <tr className="bg-[#010102] text-white text-[10px] uppercase font-semibold">
                      <th className="py-2.5 px-3 w-10 text-center">#</th>
                      <th className="py-2.5 px-3 min-w-[220px]">Item / Especificação</th>
                      <th className="py-2.5 px-2 w-36">Modalidade</th>
                      <th className="py-2.5 px-2 w-20 text-right">Qtd.</th>
                      <th className="py-2.5 px-2 w-20 text-center">Unid.</th>
                      <th className="py-2.5 px-2 w-28 text-right">Preço Unit. (R$)</th>
                      <th className="py-2.5 px-3 w-28 text-right">Total (R$)</th>
                      <th className="py-2.5 px-2 w-16 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {itens.map((item, index) => (
                      <tr key={item.id || index} className="hover:bg-gray-50/80">
                        <td className="py-2 px-3 text-center text-gray-400 font-bold text-[11px]">
                          {index + 1}
                        </td>

                        {/* Name & Desc */}
                        <td className="py-2 px-3 space-y-1">
                          <input
                            type="text"
                            required
                            placeholder="Nome do produto/serviço..."
                            value={item.nome}
                            onChange={(e) => handleUpdateItem(index, 'nome', e.target.value)}
                            className="w-full p-1.5 rounded border border-gray-300 text-xs font-bold text-[#010102] bg-white outline-none"
                          />
                          <input
                            type="text"
                            placeholder="Obs técnica opcional (ex: espessura, transporte)..."
                            value={item.descricao || ''}
                            onChange={(e) => handleUpdateItem(index, 'descricao', e.target.value)}
                            className="w-full p-1 text-[11px] rounded border border-gray-200 text-gray-600 bg-white outline-none"
                          />
                        </td>

                        {/* Modalidade */}
                        <td className="py-2 px-2">
                          <select
                            value={item.modalidade}
                            onChange={(e) => handleUpdateItem(index, 'modalidade', e.target.value)}
                            className="w-full p-1.5 rounded border border-gray-300 text-[11px] font-semibold bg-white text-black outline-none"
                          >
                            <option value="com_aplicacao">Com Aplicação</option>
                            <option value="sem_aplicacao">Sem Aplicação (FOB)</option>
                            <option value="transporte">Transporte/Frete</option>
                            <option value="locacao">Locação</option>
                            <option value="material">Material/Insumo</option>
                          </select>
                        </td>

                        {/* Qtd */}
                        <td className="py-2 px-2">
                          <input
                            type="number"
                            step="any"
                            min="0"
                            value={item.quantidade}
                            onChange={(e) => handleUpdateItem(index, 'quantidade', e.target.value)}
                            className="w-full p-1.5 rounded border border-gray-300 text-xs text-right font-mono font-bold text-[#010102] bg-white outline-none"
                          />
                        </td>

                        {/* Unidade */}
                        <td className="py-2 px-2">
                          <select
                            value={item.unidade}
                            onChange={(e) => handleUpdateItem(index, 'unidade', e.target.value)}
                            className="w-full p-1.5 rounded border border-gray-300 text-[11px] text-center bg-white text-black outline-none"
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
                        <td className="py-2 px-2">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.valorUnitario}
                            onChange={(e) => handleUpdateItem(index, 'valorUnitario', e.target.value)}
                            className="w-full p-1.5 rounded border border-gray-300 text-xs text-right font-mono font-bold text-[#835400] bg-white outline-none"
                          />
                        </td>

                        {/* Total item */}
                        <td className="py-2 px-3 text-right font-mono font-black text-[#010102] text-xs">
                          R$ {item.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>

                        {/* Action buttons */}
                        <td className="py-2 px-2 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleSaveItemToCatalog(item)}
                              title="Salvar este item no Catálogo Geral"
                              className="p-1 text-gray-400 hover:text-[#835400] rounded"
                            >
                              <span className="material-symbols-outlined text-[16px]">bookmark_add</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(index)}
                              title="Remover linha"
                              className="p-1 text-gray-400 hover:text-red-600 rounded"
                            >
                              <span className="material-symbols-outlined text-[16px]">delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Subtotals & Adjustments */}
                <div className="bg-[#F8F9FA] p-4 border-t border-[#DEE2E6] flex flex-col sm:flex-row items-end justify-between gap-4">
                  <div className="text-xs text-gray-500 space-y-1">
                    <p>💡 Dica: Clique no ícone de marcador para salvar qualquer item avulso diretamente no catálogo.</p>
                  </div>

                  <div className="w-full sm:w-80 space-y-2 text-xs">
                    <div className="flex justify-between items-center text-gray-600">
                      <span>Subtotal dos Itens:</span>
                      <span className="font-mono font-bold text-sm">
                        R$ {subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-green-700">
                      <span>Desconto Especial (R$):</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={desconto}
                        onChange={(e) => setDesconto(e.target.value)}
                        className="w-28 p-1 text-right text-xs rounded border border-gray-300 font-mono font-bold text-green-700 bg-white"
                      />
                    </div>

                    <div className="flex justify-between items-center text-blue-700">
                      <span>Frete / Acréscimo (R$):</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={acrescimoFrete}
                        onChange={(e) => setAcrescimoFrete(e.target.value)}
                        className="w-28 p-1 text-right text-xs rounded border border-gray-300 font-mono font-bold text-blue-700 bg-white"
                      />
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t-2 border-[#010102] text-sm font-black text-[#010102]">
                      <span>VALOR TOTAL GERAL:</span>
                      <span className="font-mono text-lg text-[#835400]">
                        R$ {valorTotalGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>
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
                <label className="block text-xs font-bold text-[#010102] uppercase tracking-wider mb-1">
                  6. Observações Técnicas & Normas (Texto Depois da Planilha)
                </label>
                <textarea
                  rows={3}
                  placeholder="Normas técnicas DNIT, espessuras compactadas, garantias..."
                  value={textoObservacoes}
                  onChange={(e) => setTextoObservacoes(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-gray-300 text-xs bg-white text-[#010102] outline-none"
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
          </form>

          {/* Modal Footer Controls */}
          <div className="p-4 bg-gray-50 border-t border-[#DEE2E6] flex flex-wrap items-center justify-between gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Cancelar
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={(e) => handleSubmit(e as any, true)}
                className="px-4 py-2.5 bg-[#F2A93B] hover:bg-[#d99632] text-[#010102] font-bold text-xs rounded-lg shadow-sm flex items-center gap-1.5 transition-all"
              >
                <span className="material-symbols-outlined text-[16px]">visibility</span>
                Salvar e Visualizar A4
              </button>

              <button
                type="button"
                onClick={(e) => handleSubmit(e as any, false)}
                className="px-6 py-2.5 bg-[#835400] hover:bg-[#6b4400] text-white font-bold text-xs rounded-lg shadow-sm flex items-center gap-1.5 transition-all"
              >
                <span className="material-symbols-outlined text-[16px]">save</span>
                Salvar Orçamento
              </button>
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
