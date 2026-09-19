import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { TransactionType, PaymentMethod } from '../../types';
import {
  getTodayDateInputValue,
  formatDateToBR,
  formatCurrencyValue,
  maskCurrencyInput,
  parseAndFormatPastedCurrency
} from '../../utils/formatters';
import { Modal, Button, Input, Select, PartnerAutocomplete } from '../common';
import { transactionFormSchema, validateForm } from '../../schemas/validationSchemas';

export const NovoLancamentoModal: React.FC = () => {
  const {
    isNovoLancamentoOpen,
    setIsNovoLancamentoOpen,
    novoLancamentoInitialTab,
    editingTransaction,
    setEditingTransaction,
    addTransaction,
    updateTransaction,
    categories,
    employees,
    bankAccounts,
    showToast,
    user,
  } = useApp();

  const [tipo, setTipo] = useState<TransactionType>('entrada');
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('1.500,00');
  const [categoria, setCategoria] = useState('Receita de Serviços');
  const [responsavel, setResponsavel] = useState(user?.name || 'Administrador');
  const [showEditResponsavel, setShowEditResponsavel] = useState(false);
  const [contaFinanceira, setContaFinanceira] = useState('Caixa Principal Usina');
  const [data, setData] = useState(getTodayDateInputValue());
  const [clienteFornecedor, setClienteFornecedor] = useState('Construtora Alpha Ltda.');
  const [formaPagamento, setFormaPagamento] = useState<PaymentMethod>('Transferência Bancária (PIX)');
  const [observacao, setObservacao] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const brToIso = (brDate: string) => {
    if (!brDate) return getTodayDateInputValue();
    if (brDate.includes('-')) return brDate;
    const parts = brDate.split('/');
    if (parts.length === 3) {
      const [d, m, y] = parts;
      return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
    return getTodayDateInputValue();
  };

  useEffect(() => {
    if (isNovoLancamentoOpen) {
      setFormErrors({});
      setIsSubmitting(false);

      setShowEditResponsavel(false);

      if (editingTransaction) {
        setTipo(editingTransaction.tipo);
        setDescricao(editingTransaction.descricao || '');
        setValor(formatCurrencyValue(Number(editingTransaction.valor || 0)));
        setCategoria(editingTransaction.categoria || 'Receita de Serviços');
        setResponsavel(editingTransaction.responsavel || user?.name || 'Administrador');
        setContaFinanceira(editingTransaction.contaFinanceira || 'Caixa Principal Usina');
        setData(brToIso(editingTransaction.data));
        setClienteFornecedor(editingTransaction.clienteFornecedor || '');
        setFormaPagamento(editingTransaction.formaPagamento || 'Transferência Bancária (PIX)');
        setObservacao(editingTransaction.observacao || '');
        setUploadedFileName(editingTransaction.comprovanteNome || null);
      } else {
        setTipo(novoLancamentoInitialTab);
        setDescricao('');
        setObservacao('');
        setUploadedFileName(null);
        setData(getTodayDateInputValue());
        setResponsavel(user?.name || 'Administrador');
        if (novoLancamentoInitialTab === 'entrada') {
          setCategoria('Receita de Serviços');
          setClienteFornecedor('Construtora Alpha Ltda.');
          setValor('1.500,00');
        } else {
          setCategoria('Matéria Prima (CAP / Brita)');
          setClienteFornecedor('Petrobras Distribuidora S.A.');
          setValor('1.500,00');
        }
      }
    }
  }, [isNovoLancamentoOpen, novoLancamentoInitialTab, editingTransaction, user?.name]);

  const handleClose = () => {
    setIsNovoLancamentoOpen(false);
    setEditingTransaction(null);
  };

  const handleNumericInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const formatted = maskCurrencyInput(raw);
    setValor(formatted || '0,00');
    if (formErrors.valor) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next.valor;
        return next;
      });
    }
  };

  const handleNumericKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // If user presses comma (,) or dot (.), and they typed integer (e.g. 1000 or 1500 which is currently 10,00 or 15,00),
    // instantly multiply by 100 to shift to 1.000,00 or 1.500,00
    if (e.key === ',' || e.key === '.') {
      e.preventDefault();
      const cleanDigits = valor.replace(/\D/g, '');
      const num = parseInt(cleanDigits || '0', 10);
      if (num > 0 && num < 10000000) {
        setValor(maskCurrencyInput((num * 100).toString()));
      }
    }
  };

  const handleNumericPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text');
    const formatted = parseAndFormatPastedCurrency(pasted);
    if (formatted) {
      setValor(formatted);
      if (formErrors.valor) {
        setFormErrors((prev) => {
          const next = { ...prev };
          delete next.valor;
          return next;
        });
      }
    }
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
    if (isSubmitting) return;

    const formattedData = data.includes('/') ? data : formatDateToBR(data);

    const validation = validateForm(transactionFormSchema, {
      tipo,
      data: formattedData,
      valor,
      categoria,
      responsavel,
      contaFinanceira,
      clienteFornecedor,
      formaPagamento,
      observacao,
      comprovanteNome: uploadedFileName || undefined,
    });

    if (!validation.success) {
      setFormErrors(validation.errors);
      showToast(validation.firstError, 'error');
      return;
    }

    setFormErrors({});
    setIsSubmitting(true);

    const finalDescricao = descricao.trim() || observacao.trim() || `${categoria} - ${clienteFornecedor}`;

    if (editingTransaction) {
      updateTransaction(editingTransaction.id, {
        data: validation.data.data,
        descricao: finalDescricao,
        categoria: validation.data.categoria,
        responsavel: validation.data.responsavel,
        formaPagamento: validation.data.formaPagamento as PaymentMethod,
        valor: validation.data.valor,
        tipo: validation.data.tipo,
        clienteFornecedor: validation.data.clienteFornecedor,
        contaFinanceira: validation.data.contaFinanceira,
        observacao: validation.data.observacao,
        comprovanteNome: validation.data.comprovanteNome,
      });
      handleClose();
    } else {
      addTransaction({
        data: validation.data.data,
        descricao: finalDescricao,
        categoria: validation.data.categoria,
        responsavel: validation.data.responsavel,
        formaPagamento: validation.data.formaPagamento as PaymentMethod,
        valor: validation.data.valor,
        tipo: validation.data.tipo,
        clienteFornecedor: validation.data.clienteFornecedor,
        contaFinanceira: validation.data.contaFinanceira,
        observacao: validation.data.observacao,
        comprovanteNome: validation.data.comprovanteNome,
      });
      handleClose();
    }
  };

  const availableCategories = categories.filter((c) =>
    tipo === 'entrada' ? c.tipo === 'receita' : c.tipo === 'despesa'
  );

  return (
    <Modal
      isOpen={isNovoLancamentoOpen}
      onClose={handleClose}
      size="xl"
      title={
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              editingTransaction
                ? 'bg-blue-100 text-blue-700'
                : tipo === 'entrada'
                ? 'bg-[#2F9E44]/15 text-[#2F9E44]'
                : 'bg-[#F2A93B]/20 text-[#835400]'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">
              {editingTransaction ? 'edit_note' : tipo === 'entrada' ? 'add_circle' : 'remove_circle'}
            </span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#010102]">
              {editingTransaction
                ? 'Editar Lançamento Contábil'
                : tipo === 'entrada'
                ? 'Nova Entrada Financeira'
                : 'Nova Saída Financeira'}
            </h3>
            <p className="text-xs text-gray-500">
              {editingTransaction
                ? `Editando lançamento #${editingTransaction.id} de ${editingTransaction.data}`
                : 'Registrar movimentação no Livro Caixa da usina de asfalto.'}
            </p>
          </div>
        </div>
      }
      footer={
        <>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            variant={editingTransaction ? 'primary' : tipo === 'entrada' ? 'success' : 'warning'}
            size="sm"
            icon={editingTransaction ? 'save' : 'check'}
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting
              ? 'Gravando...'
              : editingTransaction
              ? 'Salvar Alterações'
              : tipo === 'entrada'
              ? 'Confirmar Entrada'
              : 'Confirmar Saída'}
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
              if (!editingTransaction) setCategoria('Receita de Serviços');
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
              if (!editingTransaction) setCategoria('Matéria Prima (CAP / Brita)');
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
        <div
          className={`p-4 rounded-2xl bg-gradient-to-r from-[#FDFBF7] to-white border flex flex-col gap-3 ${
            formErrors.valor ? 'border-red-500 ring-2 ring-red-100' : 'border-[#DEE2E6]'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block">
                Valor do Lançamento *
              </label>
              <span className="text-xs text-gray-400">
                O ponto e a vírgula andam automaticamente enquanto você digita
              </span>
              {formErrors.valor && (
                <span className="text-xs text-red-600 font-semibold block mt-1">
                  {formErrors.valor}
                </span>
              )}
            </div>

            <div className="relative w-full sm:w-72">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">
                R$
              </span>
              <input
                type="text"
                inputMode="numeric"
                value={valor}
                onChange={handleNumericInput}
                onKeyDown={handleNumericKeyDown}
                onPaste={handleNumericPaste}
                onFocus={(e) => e.target.select()}
                placeholder="0,00"
                required
                className={`w-full pl-10 pr-4 py-2.5 bg-white border rounded-xl text-2xl font-black text-[#010102] focus:ring-2 focus:outline-none tabular-nums text-right ${
                  formErrors.valor
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-100'
                    : 'border-[#DEE2E6] focus:border-[#835400] focus:ring-[#835400]/20'
                }`}
              />
            </div>
          </div>

          {/* Quick preset buttons for fast input */}
          <div className="flex flex-wrap items-center justify-between gap-1.5 pt-2 border-t border-gray-100 text-xs">
            <span className="text-[11px] font-semibold text-gray-400">Atalhos rápidos:</span>
            <div className="flex flex-wrap items-center gap-1">
              {[500, 1000, 1500, 2500, 5000, 10000].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => {
                    setValor(formatCurrencyValue(val));
                    if (formErrors.valor) {
                      setFormErrors((prev) => {
                        const next = { ...prev };
                        delete next.valor;
                        return next;
                      });
                    }
                  }}
                  className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-white hover:bg-[#835400]/10 text-gray-700 hover:text-[#835400] border border-gray-200 transition-colors cursor-pointer"
                >
                  R$ {formatCurrencyValue(val)}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  const cleanDigits = valor.replace(/\D/g, '');
                  const num = parseInt(cleanDigits || '0', 10);
                  if (num > 0 && num < 10000000) {
                    setValor(maskCurrencyInput((num * 100).toString()));
                  }
                }}
                className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 transition-colors cursor-pointer"
                title="Multiplica por 100 (adiciona dois zeros para centavos)"
              >
                +00
              </button>
              <button
                type="button"
                onClick={() => setValor('0,00')}
                className="px-2 py-0.5 rounded-md text-[11px] font-medium text-gray-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors cursor-pointer"
                title="Limpar valor"
              >
                Zerar
              </button>
            </div>
          </div>
        </div>

        {/* Descrição Principal */}
        <Input
          label="Descrição do Lançamento"
          placeholder="Ex: TINTA, Fornecimento CBUQ, Abastecimento de Diesel, etc."
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          leftIcon="edit_note"
          helperText="Identificação rápida na listagem financeira (se em branco, usará Categoria + Favorecido)"
        />

        {/* Form Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Data da Operação *"
            type="date"
            value={data}
            onChange={(e) => {
              setData(e.target.value);
              if (formErrors.data) {
                setFormErrors((prev) => {
                  const n = { ...prev };
                  delete n.data;
                  return n;
                });
              }
            }}
            error={formErrors.data}
            required
            leftIcon="event"
          />

          <Select
            label="Categoria Contábil *"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            error={formErrors.categoria}
            leftIcon="category"
          >
            {availableCategories.map((c) => (
              <option key={c.id} value={c.nome}>
                {c.nome}
              </option>
            ))}
          </Select>

          <PartnerAutocomplete
            label={tipo === 'entrada' ? 'Cliente / Contratante *' : 'Favorecido / Fornecedor *'}
            placeholder={
              tipo === 'entrada'
                ? 'Pesquise cliente por nome, CNPJ, obra...'
                : 'Pesquise fornecedor por nome, CNPJ, insumo...'
            }
            value={clienteFornecedor}
            onChange={(val) => {
              setClienteFornecedor(val);
              if (formErrors.clienteFornecedor) {
                setFormErrors((prev) => {
                  const n = { ...prev };
                  delete n.clienteFornecedor;
                  return n;
                });
              }
            }}
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
            error={formErrors.clienteFornecedor}
            helperText="Pesquise no histórico e cadastros ou digite um novo parceiro"
          />

          {/* Responsável pelo Lançamento (Automático do usuário logado) */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#010102] flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px] text-gray-400">person</span>
                Responsável pelo Lançamento
              </label>
              <button
                type="button"
                onClick={() => setShowEditResponsavel(!showEditResponsavel)}
                className="text-[11px] text-[#835400] hover:underline font-semibold cursor-pointer"
              >
                {showEditResponsavel ? 'Manter atual' : 'Alterar'}
              </button>
            </div>

            {!showEditResponsavel ? (
              <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <span className="text-gray-500 font-medium">Registrado por:</span>
                  <span className="font-bold text-gray-900">{responsavel || user?.name || 'Administrador'}</span>
                </div>
                <span className="text-[10px] text-gray-400 font-medium hidden sm:inline">Automático do login</span>
              </div>
            ) : (
              <Select
                value={responsavel}
                onChange={(e) => setResponsavel(e.target.value)}
                error={formErrors.responsavel}
                leftIcon="person"
                helperText="Selecione caso este lançamento esteja sendo feito em nome de outro colaborador"
              >
                {user?.name && (
                  <option value={user.name}>
                    {user.name} (Meu usuário atual)
                  </option>
                )}
                {employees
                  .filter((e) => e.nome !== user?.name)
                  .map((e) => (
                    <option key={e.id} value={e.nome}>
                      {e.nome} ({e.cargo})
                    </option>
                  ))}
              </Select>
            )}
          </div>

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
