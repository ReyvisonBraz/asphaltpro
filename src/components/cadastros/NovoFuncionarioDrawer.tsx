import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { maskCpfCnpj, maskPhone } from '../../utils/formatters';
import { Drawer, Button, Input, Select } from '../common';
import { employeeFormSchema, validateForm } from '../../schemas/validationSchemas';

export const NovoFuncionarioDrawer: React.FC = () => {
  const {
    isNovoFuncionarioOpen,
    setIsNovoFuncionarioOpen,
    editingEmployee,
    setEditingEmployee,
    addEmployee,
    updateEmployee,
    showToast,
  } = useApp();

  const [nome, setNome] = useState('');
  const [documento, setDocumento] = useState('');
  const [cargo, setCargo] = useState('Operador de Usina');
  const [telefone, setTelefone] = useState('');
  const [isMotorista, setIsMotorista] = useState(false);
  const [status, setStatus] = useState<'ativo' | 'inativo'>('ativo');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (editingEmployee) {
      setNome(editingEmployee.nome);
      setDocumento(editingEmployee.documento);
      setCargo(editingEmployee.cargo);
      setTelefone(editingEmployee.telefone);
      setIsMotorista(editingEmployee.isMotorista);
      setStatus(editingEmployee.status);
    } else {
      setNome('');
      setDocumento('');
      setCargo('Operador de Usina');
      setTelefone('');
      setIsMotorista(false);
      setStatus('ativo');
    }
    setFormErrors({});
  }, [editingEmployee, isNovoFuncionarioOpen]);

  const handleClose = () => {
    setIsNovoFuncionarioOpen(false);
    setEditingEmployee(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const validation = validateForm(employeeFormSchema, {
      nome,
      cargo,
      documento,
      telefone,
      isMotorista,
      status,
    });

    if (!validation.success) {
      setFormErrors(validation.errors);
      showToast(validation.firstError, 'error');
      return;
    }

    setFormErrors({});

    if (editingEmployee) {
      updateEmployee(editingEmployee.id, {
        nome: validation.data.nome,
        documento: validation.data.documento,
        cargo: validation.data.cargo,
        telefone: validation.data.telefone,
        isMotorista: validation.data.isMotorista,
        status: validation.data.status,
      });
      showToast('Colaborador atualizado com sucesso!', 'success');
    } else {
      addEmployee({
        nome: validation.data.nome,
        documento: validation.data.documento,
        cargo: validation.data.cargo,
        telefone: validation.data.telefone,
        isMotorista: validation.data.isMotorista,
        status: validation.data.status,
      });
      showToast('Colaborador cadastrado com sucesso!', 'success');
    }

    handleClose();
  };

  return (
    <Drawer
      isOpen={isNovoFuncionarioOpen}
      onClose={handleClose}
      title={editingEmployee ? 'Editar Colaborador' : 'Novo Colaborador'}
      subtitle={
        editingEmployee
          ? 'Atualize os dados e atribuições do colaborador.'
          : 'Cadastre operadores, motoristas, laboratoristas ou gerentes da usina.'
      }
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon="save"
            onClick={handleSubmit}
          >
            {editingEmployee ? 'Salvar Alterações' : 'Cadastrar Colaborador'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Nome */}
        <Input
          label="Nome Completo *"
          placeholder="Ex: Carlos Roberto Silva"
          value={nome}
          onChange={(e) => {
            setNome(e.target.value);
            if (formErrors.nome) {
              setFormErrors((prev) => {
                const n = { ...prev };
                delete n.nome;
                return n;
              });
            }
          }}
          error={formErrors.nome}
          leftIcon="person"
          required
        />

        {/* Cargo */}
        <Select
          label="Cargo / Função Operacional *"
          value={cargo}
          onChange={(e) => setCargo(e.target.value)}
          error={formErrors.cargo}
          leftIcon="badge"
          options={[
            { value: 'Operador de Usina', label: 'Operador de Usina de Asfalto' },
            { value: 'Motorista de Caçamba', label: 'Motorista de Caminhão Basculante' },
            { value: 'Operador de Pá Carregadeira', label: 'Operador de Pá Carregadeira' },
            { value: 'Laboratorista de Asfalto', label: 'Laboratorista / Controle Tecnológico' },
            { value: 'Encarregado de Pavimentação', label: 'Encarregado de Pavimentação' },
            { value: 'Mecânico de Manutenção', label: 'Mecânico de Usina & Frota' },
            { value: 'Engenheiro Responsável', label: 'Engenheiro Civil / Responsável Técnico' },
            { value: 'Gerente Financeiro', label: 'Gerente Financeiro & Administrativo' },
            { value: 'Auxiliar Administrativo', label: 'Auxiliar Administrativo' },
          ]}
        />

        {/* CPF / Documento */}
        <Input
          label="CPF / Registro"
          placeholder="000.000.000-00"
          value={documento}
          onChange={(e) => setDocumento(maskCpfCnpj(e.target.value))}
          error={formErrors.documento}
          leftIcon="badge"
        />

        {/* Telefone */}
        <Input
          label="Telefone / WhatsApp"
          placeholder="(00) 00000-0000"
          value={telefone}
          onChange={(e) => setTelefone(maskPhone(e.target.value))}
          error={formErrors.telefone}
          leftIcon="phone"
        />

        {/* Status */}
        <Select
          label="Status Operacional"
          value={status}
          onChange={(e) => setStatus(e.target.value as 'ativo' | 'inativo')}
          leftIcon="toggle_on"
          options={[
            { value: 'ativo', label: 'Ativo (Em Operação)' },
            { value: 'inativo', label: 'Inativo (Afastado / Desligado)' },
          ]}
        />

        {/* Is Motorista Checkbox */}
        <div className="p-3.5 bg-amber-50/50 rounded-xl border border-amber-200/80 flex items-start gap-3 mt-1">
          <input
            type="checkbox"
            id="isMotorista"
            checked={isMotorista}
            onChange={(e) => setIsMotorista(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#835400] focus:ring-[#835400] cursor-pointer"
          />
          <label htmlFor="isMotorista" className="text-xs text-[#010102] cursor-pointer">
            <span className="font-bold block">Habilitado para Transporte de CBUQ</span>
            <span className="text-gray-500 block text-[11px] mt-0.5">
              Identifica este colaborador como motorista apto para escalas de entrega de massa asfáltica.
            </span>
          </label>
        </div>
      </form>
    </Drawer>
  );
};
