import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AccountType, AccountStatus } from '../../types';
import { formatDateToBR, getTodayDateInputValue } from '../../utils/formatters';
import { Modal, Button, Input, Select } from '../common';

export const NovaContaModal: React.FC = () => {
  const { isNovaContaOpen, setIsNovaContaOpen, addAccount, categories } = useApp();

  const [tipo, setTipo] = useState<AccountType>('pagar');
  const [descricao, setDescricao] = useState('');
  const [fornecedorCliente, setFornecedorCliente] = useState('');
  const [totalParcelas, setTotalParcelas] = useState('1');
  const [vencimento, setVencimento] = useState(getTodayDateInputValue());
  const [valor, setValor] = useState('');
  const [categoria, setCategoria] = useState('Matéria Prima (CAP / Brita)');
  const [errorDesc, setErrorDesc] = useState('');
  const [errorValor, setErrorValor] = useState('');

  if (!isNovaContaOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!descricao.trim()) {
      setErrorDesc('Informe a descrição do compromisso');
      return;
    }

    const cleanNum = parseFloat(valor.replace('.', '').replace(',', '.'));
    if (isNaN(cleanNum) || cleanNum <= 0) {
      setErrorValor('Informe um valor válido maior que zero');
      return;
    }

    const finalVal = cleanNum;
    const numParcelas = parseInt(totalParcelas, 10) || 1;

    if (numParcelas === 1) {
      addAccount({
        descricao: descricao.trim(),
        fornecedorCliente: fornecedorCliente.trim() || 'Não especificado',
        parcela: 'Única',
        vencimento: formatDateToBR(vencimento),
        valor: finalVal,
        status: 'pendente' as AccountStatus,
        tipo,
        categoria,
      });
    } else {
      const installmentVal = Number((finalVal / numParcelas).toFixed(2));
      for (let i = 1; i <= numParcelas; i++) {
        addAccount({
          descricao: `${descricao.trim()}`,
          fornecedorCliente: fornecedorCliente.trim() || 'Não especificado',
          parcela: `${i}/${numParcelas}`,
          vencimento: formatDateToBR(vencimento),
          valor: installmentVal,
          status: 'pendente' as AccountStatus,
          tipo,
          categoria,
        });
      }
    }

    setIsNovaContaOpen(false);
  };

  return (
    <Modal
      isOpen={isNovaContaOpen}
      onClose={() => setIsNovaContaOpen(false)}
      title={
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              tipo === 'pagar'
                ? 'bg-red-100 text-[#E03131]'
                : 'bg-emerald-100 text-[#2F9E44]'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">
              {tipo === 'pagar' ? 'outbox' : 'move_to_inbox'}
            </span>
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-[#010102]">
              Nova Conta a {tipo === 'pagar' ? 'Pagar (Despesa)' : 'Receber (Cliente)'}
            </h3>
            <p className="text-xs text-gray-500">
              Controle de títulos, parcelas e prazos operacionais da usina.
            </p>
          </div>
        </div>
      }
      size="md"
      footer={
        <>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsNovaContaOpen(false)}
          >
            Cancelar
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon="save"
            onClick={handleSubmit}
          >
            Salvar Título Financeiro
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Type Toggle Tabs */}
        <div className="grid grid-cols-2 p-1 bg-gray-100 rounded-xl border border-gray-200">
          <button
            type="button"
            onClick={() => {
              setTipo('pagar');
              setCategoria('Matéria Prima (CAP / Brita)');
            }}
            className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              tipo === 'pagar'
                ? 'bg-[#E03131] text-white shadow-xs'
                : 'text-gray-600 hover:text-black'
            }`}
          >
            Conta a Pagar (Despesa)
          </button>
          <button
            type="button"
            onClick={() => {
              setTipo('receber');
              setCategoria('Receita de Serviços');
            }}
            className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              tipo === 'receber'
                ? 'bg-[#2F9E44] text-white shadow-xs'
                : 'text-gray-600 hover:text-black'
            }`}
          >
            Conta a Receber (Receita)
          </button>
        </div>

        {/* Descrição */}
        <Input
          label="Descrição do Título *"
          placeholder="Ex: Fornecimento Cimento Asfáltico Petrobras - NF 4910"
          value={descricao}
          onChange={(e) => {
            setDescricao(e.target.value);
            if (errorDesc) setErrorDesc('');
          }}
          error={errorDesc}
          required
          autoFocus
        />

        {/* Fornecedor / Cliente */}
        <Input
          label={tipo === 'pagar' ? 'Fornecedor / Favorecido' : 'Cliente / Tomador'}
          placeholder="Ex: Petrobras Distribuidora S.A."
          value={fornecedorCliente}
          onChange={(e) => setFornecedorCliente(e.target.value)}
          leftIcon="business"
        />

        {/* Valor e Parcelas */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Valor Total (R$) *"
            placeholder="0,00"
            value={valor}
            onChange={(e) => {
              const val = e.target.value.replace(/[^\d,]/g, '');
              setValor(val);
              if (errorValor) setErrorValor('');
            }}
            error={errorValor}
            leftIcon="payments"
            required
          />

          <Select
            label="Número de Parcelas"
            value={totalParcelas}
            onChange={(e) => setTotalParcelas(e.target.value)}
            leftIcon="repeat"
            options={[
              { value: '1', label: 'Parcela Única (À vista / 30d)' },
              { value: '2', label: '2x Parcelas Mensais' },
              { value: '3', label: '3x Parcelas Mensais' },
              { value: '4', label: '4x Parcelas Mensais' },
              { value: '6', label: '6x Parcelas Mensais' },
              { value: '12', label: '12x Parcelas Mensais' },
            ]}
          />
        </div>

        {/* Vencimento e Categoria */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Data de Vencimento *"
            type="date"
            value={vencimento}
            onChange={(e) => setVencimento(e.target.value)}
            required
            leftIcon="event"
          />

          <Select
            label="Categoria Contábil"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            leftIcon="category"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.nome}>
                {c.nome}
              </option>
            ))}
          </Select>
        </div>
      </form>
    </Modal>
  );
};
