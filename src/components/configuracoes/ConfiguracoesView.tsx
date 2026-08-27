import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { LetterheadSettings, Quote } from '../../types';
import { Button } from '../common/Button';
import { OrcamentoA4VisualizerModal } from '../orcamentos/OrcamentoA4VisualizerModal';

export const ConfiguracoesView: React.FC = () => {
  const {
    user,
    showToast,
    resetAllData,
    letterheadSettings,
    updateLetterheadSettings,
    quotes,
    exportFullBackup,
    importFullBackup,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'timbrado' | 'empresa' | 'sistema'>('timbrado');
  const backupInputRef = useRef<HTMLInputElement>(null);

  // Letterhead State
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

  // File upload ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

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
      backgroundImageUrl
    };

    updateLetterheadSettings(updated);
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
        <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl">
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

      {/* Tab: Papel Timbrado A4 */}
      {activeTab === 'timbrado' && (
        <form onSubmit={handleSaveLetterhead} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Main Form */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* 1. Letterhead Image Attachment Box */}
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

          {/* Backup & Data Export / Import */}
          <div className="bg-white p-6 rounded-2xl border border-[#DEE2E6] shadow-xs text-xs space-y-4">
            <h3 className="text-base font-bold text-[#010102] pb-3 border-b border-[#E5E2E1] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#835400]">cloud_download</span>
              Backup Completo & Migração
            </h3>
            <p className="text-gray-600 leading-relaxed">
              Exporte todos os orçamentos, lançamentos, colaboradores e contas em um arquivo único JSON para guardar em segurança ou transferir para outro computador.
            </p>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <Button
                variant="primary"
                icon="download"
                onClick={exportFullBackup}
              >
                Exportar Backup (.JSON)
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
                Importar / Restaurar Backup
              </Button>
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
                  if (confirm('Tem certeza de que deseja restaurar todos os dados para o padrão de demonstração?')) {
                    resetAllData();
                  }
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
    </div>
  );
};
