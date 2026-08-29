import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { TransactionType, PaymentMethod } from '../../types';
import { getTodayDateInputValue, formatDateToBR } from '../../utils/formatters';
import { Modal, Button, Input, Select, PartnerAutocomplete } from '../common';

export const NovoLancamentoModal: React.FC = () => {
  const {
    isNovoLancamentoOpen,
    setIsNovoLancamentoOpen,
    novoLancamentoInitialTab,
    addTransaction,
    categories,
    employees,
    bankAccounts,
  } = useApp();

  const [tipo, setTipo] = useState<TransactionType>('entrada');
  const [valor, setValor] = useState('1500,00');
  const [categoria, setCategoria] = useState('Receita de Serviços');
  const [responsavel, setResponsavel] = useState('João Silva (Engenheiro)');
  const [contaFinanceira, setContaFinanceira] = useState('Caixa Principal Usina');
  const [data, setData] = useState(getTodayDateInputValue());
  const [clienteFornecedor, setClienteFornecedor] = useState('Construtora Alpha Ltda.');
  const [formaPagamento, setFormaPagamento] = useState<PaymentMethod>('Transferência Bancária (PIX)');
  const [observacao, setObservacao] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (isNovoLancamentoOpen) {
      setTipo(novoLancamentoInitialTab);
      if (novoLancamentoInitialTab === 'entrada') {
        setCategoria('Receita de Serviços');
        setClienteFornecedor('Construtora Alpha Ltda.');
      } else {
        setCategoria('Matéria Prima (CAP / Brita)');
        setClienteFornecedor('Petrobras Distribuidora S.A.');
      }
    }
  }, [isNovoLancamentoOpen, novoLancamentoInitialTab]);

  if (!isNovoLancamentoOpen) return null;

  const handleNumericInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^\d,]/g, '');
    setValor(val);
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setUploadedFileName(e.dataTransfer.files[0].name);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedFileName(e.target.files[0].name);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNum = parseFloat(valor.replace('.', '').replace(',', '.'));
    const finalValue = isNaN(cleanNum) || cleanNum <= 0 ? 100 : cleanNum;

    addTransaction({
      data: formatDateToBR(data),
      descricao: observacao.trim() || `${categoria} - ${clienteFornecedor}`,
      categoria,
      responsavel,
      formaPagamento,
      valor: finalValue,
      tipo,
      clienteFornecedor,
      contaFinanceira,
      observacao,
      comprovanteNome: uploadedFileName || undefined,
    });

    setIsNovoLancamentoOpen(false);
  };

  const availableCategories = categories.filter((c) =>
    tipo === 'entrada' ? c.tipo === 'receita' : c.tipo === 'despesa'
  );

  return (
    <Modal
      isOpen={isNovoLancamentoOpen}
      onClose={() => setIsNovoLancamentoOpen(false)}
      title={
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              tipo === 'entrada'
                ? 'bg-[#2F9E44]/15 text-[#2F9E44]'
                : 'bg-[#F2A93B]/20 text-[#835400]'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">
              {tipo === 'entrada' ? 'add_circle' : 'remove_circle'}
            </span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#010102]">
              {tipo === 'entrada' ? 'Nova Entrada Financeira' : 'Nova Saída Financeira'}
            </h3>
            <p className="text-xs text-gray-500">
              Registrar movimentação no Livro Caixa da usina de asfalto.
            </p>
          </div>
        </div>
      }
      size="lg"
      footer={
        <>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsNovoLancamentoOpen(false)}
          >
            Cancelar
          </Button>
          <Button
            variant={tipo === 'entrada' ? 'success' : 'warning'}
            size="sm"
            icon="check"
            onClick={handleSubmit}
          >
            {tipo === 'entrada' ? 'Confirmar Entrada' : 'Confirmar Saída'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Type Toggle Tabs */}
        <div className="grid grid-cols-2 p-1 bg-gray-100 rounded-xl border border-gray-200">
          <button
            type="button"
            onClick={() => {
              setTipo('entrada');
              setCategoria('Receita de Serviços');
            }}
            className={`py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              tipo === 'entrada'
                ? 'bg-[#2F9E44] text-white shadow-xs'
                : 'text-gray-600 hover:text-black'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">arrow_upward</span>
            Entrada (Receita CBUQ / Serviços)
          </button>

          <button
            type="button"
            onClick={() => {
              setTipo('saida');
              setCategoria('Matéria Prima (CAP / Brita)');
            }}
            className={`py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              tipo === 'saida'
                ? 'bg-[#F2A93B] text-[#010102] shadow-xs'
                : 'text-gray-600 hover:text-black'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">arrow_downward</span>
            Saída (Despesa / Insumos / Operacional)
          </button>
        </div>

        {/* Big Amount Field */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-[#FDFBF7] to-white border border-[#DEE2E6] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block">
              Valor do Lançamento *
            </label>
            <span className="text-xs text-gray-400">Informe o valor total em Reais (BRL)</span>
          </div>

          <div className="relative w-full sm:w-64">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">
              R$
            </span>
            <input
              type="text"
              value={valor}
              onChange={handleNumericInput}
              placeholder="0,00"
              required
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#DEE2E6] rounded-xl text-xl font-black text-[#010102] focus:border-[#835400] focus:ring-2 focus:ring-[#835400]/20 focus:outline-none tabular-nums text-right"
            />
          </div>
        </div>

        {/* Form Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Data da Operação *"
            type="date"
            value={data}
            onChange={(e) => setData(e.target.value)}
            required
            leftIcon="event"
          />

          <Select
            label="Categoria Contábil *"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            leftIcon="category"
          >
            {availableCategories.map((c) => (
              <option key={c.id} value={c.nome}>
                {c.nome}
              </option>
            ))}
          </Select>

          <PartnerAutocomplete
            label={tipo === 'entrada' ? 'Cliente / Contratante' : 'Favorecido / Fornecedor'}
            placeholder={
              tipo === 'entrada'
                ? 'Pesquise cliente por nome, CNPJ, obra...'
                : 'Pesquise fornecedor por nome, CNPJ, insumo...'
            }
            value={clienteFornecedor}
            onChange={setClienteFornecedor}
            onSelectPartner={(partner) => {
              setClienteFornecedor(partner.nome);
              if (partner.categoriaPadrao) {
                const matches = availableCategories.some((c) => c.nome === partner.categoriaPadrao);
                if (matches) {
                  setCategoria(partner.categoriaPadrao);
                }
              }
            }}
            partnerType={tipo === 'entrada' ? 'cliente' : 'fornecedor'}
            leftIcon="business"
            helperText="Pesquise no histórico e cadastros ou digite um novo parceiro"
          />

          <Select
            label="Responsável / Autorizador"
            value={responsavel}
            onChange={(e) => setResponsavel(e.target.value)}
            leftIcon="person"
          >
            {employees.map((e) => (
              <option key={e.id} value={e.nome}>
                {e.nome} ({e.cargo})
              </option>
            ))}
          </Select>

          <Select
            label="Forma de Pagamento"
            value={formaPagamento}
            onChange={(e) => setFormaPagamento(e.target.value as PaymentMethod)}
            leftIcon="credit_card"
          >
            <option value="Transferência Bancária (PIX)">Transferência Bancária (PIX)</option>
            <option value="Boleto Bancário">Boleto Bancário</option>
            <option value="TED / DOC">TED / DOC</option>
            <option value="Cartão de Crédito / Débito">Cartão de Crédito / Débito</option>
            <option value="Dinheiro em Espécie">Dinheiro em Espécie</option>
            <option value="Cheque Administrativo">Cheque Administrativo</option>
          </Select>

          <Select
            label="Conta Bancária / Caixa"
            value={contaFinanceira}
            onChange={(e) => setContaFinanceira(e.target.value)}
            leftIcon="account_balance"
          >
            {bankAccounts.map((b) => (
              <option key={b.id} value={b.nome}>
                {b.nome} ({b.banco})
              </option>
            ))}
          </Select>
        </div>

        {/* Observações */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-[#010102]">
            Descrição / Observações Operacionais
          </label>
          <textarea
            rows={2}
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            placeholder="Ex: Fornecimento de 150 toneladas de CBUQ Faixa C para a obra da Av. Brasil..."
            className="w-full p-3 rounded-xl border border-[#DEE2E6] text-xs text-[#010102] bg-white focus:border-[#835400] focus:ring-2 focus:ring-[#835400]/20 focus:outline-none resize-none"
          />
        </div>

        {/* Drag & Drop File Upload */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleFileDrop}
          className={`
            p-4 rounded-xl border-2 border-dashed transition-all flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left
            ${
              isDragging
                ? 'border-[#835400] bg-amber-50/50'
                : uploadedFileName
                ? 'border-emerald-300 bg-emerald-50/40'
                : 'border-[#DEE2E6] bg-gray-50/50 hover:bg-gray-50'
            }
          `}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                uploadedFileName ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-600'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">
                {uploadedFileName ? 'task' : 'cloud_upload'}
              </span>
            </div>
            <div>
              <p className="text-xs font-bold text-[#010102]">
                {uploadedFileName ? uploadedFileName : 'Anexar Comprovante / Nota Fiscal'}
              </p>
              <p className="text-[11px] text-gray-500">
                {uploadedFileName
                  ? 'Arquivo anexado com sucesso'
                  : 'Arraste o arquivo PDF/imagem aqui ou clique para selecionar'}
              </p>
            </div>
          </div>

          <label className="cursor-pointer">
            <input
              type="file"
              className="hidden"
              onChange={handleFileChange}
              accept=".pdf,.png,.jpg,.jpeg"
            />
            <span className="px-3 py-1.5 bg-white border border-[#DEE2E6] rounded-lg text-xs font-bold text-gray-700 hover:bg-gray-100 transition-colors inline-block shadow-xs">
              {uploadedFileName ? 'Alterar Arquivo' : 'Selecionar Arquivo'}
            </span>
          </label>
        </div>
      </form>
    </Modal>
  );
};
