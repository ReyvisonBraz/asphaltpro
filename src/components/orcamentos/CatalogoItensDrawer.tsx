import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { QuoteCatalogItem } from '../../types';

interface CatalogoItensDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectItem?: (item: QuoteCatalogItem) => void;
}

export const CatalogoItensDrawer: React.FC<CatalogoItensDrawerProps> = ({
  isOpen,
  onClose,
  onSelectItem
}) => {
  const { quoteCatalog, addCatalogItem, updateCatalogItem, deleteCatalogItem, showToast } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterModalidade, setFilterModalidade] = useState<string>('todos');
  const [editingItem, setEditingItem] = useState<QuoteCatalogItem | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Form state
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [modalidade, setModalidade] = useState<QuoteCatalogItem['modalidade']>('com_aplicacao');
  const [unidadePadrao, setUnidadePadrao] = useState('ton');
  const [valorUnitarioPadrao, setValorUnitarioPadrao] = useState<string>('450.00');

  if (!isOpen) return null;

  const handleStartCreate = () => {
    setEditingItem(null);
    setNome('');
    setDescricao('');
    setModalidade('com_aplicacao');
    setUnidadePadrao('ton');
    setValorUnitarioPadrao('450.00');
    setIsCreating(true);
  };

  const handleStartEdit = (item: QuoteCatalogItem) => {
    setEditingItem(item);
    setNome(item.nome);
    setDescricao(item.descricao || '');
    setModalidade(item.modalidade);
    setUnidadePadrao(item.unidadePadrao);
    setValorUnitarioPadrao(item.valorUnitarioPadrao.toFixed(2));
    setIsCreating(true);
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      showToast('Informe o nome do item.', 'error');
      return;
    }

    const price = parseFloat(valorUnitarioPadrao.replace(',', '.')) || 0;

    if (editingItem) {
      updateCatalogItem(editingItem.id, {
        nome,
        descricao,
        modalidade,
        unidadePadrao,
        valorUnitarioPadrao: price
      });
    } else {
      addCatalogItem({
        nome,
        descricao,
        modalidade,
        unidadePadrao,
        valorUnitarioPadrao: price
      });
    }

    setIsCreating(false);
    setEditingItem(null);
  };

  const filteredItems = quoteCatalog.filter(item => {
    const matchesSearch = item.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.descricao && item.descricao.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesModalidade = filterModalidade === 'todos' || item.modalidade === filterModalidade;
    return matchesSearch && matchesModalidade;
  });

  const getModalidadeBadge = (mod: QuoteCatalogItem['modalidade']) => {
    switch (mod) {
      case 'com_aplicacao':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#EBFBEE] text-[#2F9E44]">Com Aplicação</span>;
      case 'sem_aplicacao':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FFF4E6] text-[#D97706]">Sem Aplicação (FOB)</span>;
      case 'transporte':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#E7F5FF] text-[#1971C2]">Transporte / Frete</span>;
      case 'locacao':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#F3F0FF] text-[#7950F2]">Locação Maquinário</span>;
      case 'material':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#F8F9FA] text-[#495057]">Material / Insumo</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity" onClick={onClose} />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-2xl bg-white shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-6 bg-[#010102] text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#835400] flex items-center justify-center text-white">
                <span className="material-symbols-outlined text-[24px]">inventory_2</span>
              </div>
              <div>
                <h3 className="text-base font-bold">Catálogo de Produtos & Serviços</h3>
                <p className="text-xs text-[#858486]">Modelos de itens rápidos para orçamentos da usina</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white rounded-lg transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Create/Edit Form */}
            {isCreating ? (
              <form onSubmit={handleSaveItem} className="bg-[#F8F9FA] p-5 rounded-xl border border-[#DEE2E6] space-y-4">
                <div className="flex items-center justify-between border-b border-[#E9ECEF] pb-3">
                  <h4 className="text-sm font-bold text-[#010102]">
                    {editingItem ? 'Editar Item do Catálogo' : 'Novo Item / Modelo Rápido'}
                  </h4>
                  <button
                    type="button"
                    onClick={() => setIsCreating(false)}
                    className="text-xs text-gray-500 hover:text-black font-semibold"
                  >
                    Cancelar
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-[#1C1B1B] uppercase mb-1">
                      Nome do Item / Serviço *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: CBUQ Faixa C (CAP 50/70) - Com Aplicação"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-[#C7C6CA] text-xs text-[#010102] bg-white focus:border-[#010102] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#1C1B1B] uppercase mb-1">
                      Modalidade / Tipo
                    </label>
                    <select
                      value={modalidade}
                      onChange={(e) => setModalidade(e.target.value as any)}
                      className="w-full p-2.5 rounded-lg border border-[#C7C6CA] text-xs text-[#010102] bg-white focus:border-[#010102] outline-none"
                    >
                      <option value="com_aplicacao">Com Aplicação (Execução Completa)</option>
                      <option value="sem_aplicacao">Sem Aplicação (Retirada Usina FOB)</option>
                      <option value="transporte">Transporte / Frete Térmico</option>
                      <option value="locacao">Locação de Equipamento</option>
                      <option value="material">Insumo / Material Ensacado</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#1C1B1B] uppercase mb-1">
                      Unidade de Medida
                    </label>
                    <select
                      value={unidadePadrao}
                      onChange={(e) => setUnidadePadrao(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-[#C7C6CA] text-xs text-[#010102] bg-white focus:border-[#010102] outline-none"
                    >
                      <option value="ton">Tonelada (ton)</option>
                      <option value="m²">Metro Quadrado (m²)</option>
                      <option value="m³">Metro Cúbico (m³)</option>
                      <option value="viagem">Viagem (Caminhão Térmico)</option>
                      <option value="hora">Hora (h)</option>
                      <option value="diária">Diária</option>
                      <option value="saco 25kg">Saco 25kg</option>
                      <option value="un">Unidade (un)</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-[#1C1B1B] uppercase mb-1">
                      Preço Unitário Padrão (R$)
                    </label>
                    <input
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      min="0"
                      required
                      placeholder="0.00"
                      value={valorUnitarioPadrao}
                      onChange={(e) => setValorUnitarioPadrao(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-[#C7C6CA] text-xs text-[#010102] bg-white focus:border-[#010102] outline-none font-mono"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-[#1C1B1B] uppercase mb-1">
                      Descrição Detalhada / Especificação Técnica
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Ex: Concreto Betuminoso Usinado a Quente com espalhamento mecânico, temperatura padrão 150°C a 165°C."
                      value={descricao}
                      onChange={(e) => setDescricao(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-[#C7C6CA] text-xs text-[#010102] bg-white focus:border-[#010102] outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCreating(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-100"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#835400] hover:bg-[#6b4400] text-white rounded-lg text-xs font-bold shadow-sm"
                  >
                    {editingItem ? 'Salvar Alterações' : 'Cadastrar Item'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex items-center justify-between gap-4">
                <button
                  onClick={handleStartCreate}
                  className="flex items-center gap-2 px-4 py-2.5 bg-[#835400] hover:bg-[#6b4400] text-white rounded-lg text-xs font-bold shadow-sm transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">add_circle</span>
                  Cadastrar Novo Modelo de Item
                </button>
              </div>
            )}

            {/* Filter and Search */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <span className="material-symbols-outlined absolute left-3 top-2.5 text-gray-400 text-[18px]">
                  search
                </span>
                <input
                  type="text"
                  placeholder="Buscar modelo de item (ex: Faixa C, Pintura, Frete)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-gray-300 bg-white focus:border-[#010102] outline-none"
                />
              </div>

              <select
                value={filterModalidade}
                onChange={(e) => setFilterModalidade(e.target.value)}
                className="px-3 py-2 text-xs rounded-lg border border-gray-300 bg-white focus:border-[#010102] outline-none"
              >
                <option value="todos">Todas Modalidades</option>
                <option value="com_aplicacao">Com Aplicação</option>
                <option value="sem_aplicacao">Sem Aplicação (FOB)</option>
                <option value="transporte">Transporte</option>
                <option value="locacao">Locação</option>
                <option value="material">Insumo/Material</option>
              </select>
            </div>

            {/* List of items */}
            <div className="space-y-3">
              {filteredItems.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-gray-300 rounded-xl">
                  <span className="material-symbols-outlined text-4xl text-gray-300">inventory_2</span>
                  <p className="text-xs font-semibold text-gray-500 mt-2">Nenhum item encontrado no catálogo.</p>
                </div>
              ) : (
                filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl border border-[#DEE2E6] bg-white hover:border-[#835400]/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs text-[#010102]">{item.nome}</span>
                        {getModalidadeBadge(item.modalidade)}
                      </div>
                      {item.descricao && (
                        <p className="text-[11px] text-gray-500 line-clamp-2">{item.descricao}</p>
                      )}
                      <div className="text-xs font-semibold text-[#835400] pt-1">
                        R$ {item.valorUnitarioPadrao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} / {item.unidadePadrao}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {onSelectItem && (
                        <button
                          onClick={() => {
                            onSelectItem(item);
                            onClose();
                          }}
                          className="px-3 py-1.5 bg-[#F2A93B] hover:bg-[#d99632] text-[#010102] font-bold text-xs rounded-lg transition-colors flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-[16px]">add</span>
                          Inserir no Orçamento
                        </button>
                      )}
                      <button
                        onClick={() => handleStartEdit(item)}
                        className="p-1.5 text-gray-400 hover:text-black hover:bg-gray-100 rounded-lg transition-colors"
                        title="Editar modelo"
                      >
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Remover "${item.nome}" do catálogo?`)) {
                            deleteCatalogItem(item.id);
                          }
                        }}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Excluir"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-[#DEE2E6] bg-gray-50 flex justify-between items-center text-xs text-gray-500">
            <span>Total de {quoteCatalog.length} itens cadastrados</span>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
