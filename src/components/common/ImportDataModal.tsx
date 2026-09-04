import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ImportEntityType,
  IMPORT_SCHEMAS,
  downloadTemplateCsv,
  validateImportData,
  ImportValidationResult,
} from '../../utils/importUtils';
import { Button } from './Button';

interface ImportDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: ImportEntityType;
}

export const ImportDataModal: React.FC<ImportDataModalProps> = ({
  isOpen,
  onClose,
  entityType,
}) => {
  const {
    addTransaction,
    addAccount,
    addPartner,
    addEmployee,
    addCatalogItem,
    showToast,
  } = useApp();

  const schema = IMPORT_SCHEMAS[entityType];
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<'upload' | 'preview'>('upload');
  const [fileName, setFileName] = useState<string>('');
  const [csvContent, setCsvContent] = useState<string>('');
  const [validationResult, setValidationResult] = useState<ImportValidationResult<any> | null>(null);
  const [filterView, setFilterView] = useState<'todos' | 'validos' | 'invalidos'>('todos');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleDownloadTemplate = () => {
    downloadTemplateCsv(entityType);
    showToast('Planilha modelo baixada com sucesso!', 'success');
  };

  const processFile = (file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv') && !file.name.toLowerCase().endsWith('.txt')) {
      showToast('Por favor, selecione um arquivo em formato .CSV', 'error');
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) {
        showToast('O arquivo selecionado está vazio.', 'error');
        return;
      }
      setCsvContent(text);
      const result = validateImportData(entityType, text);
      setValidationResult(result);
      setStep('preview');
      setFilterView(result.invalidCount > 0 ? 'invalidos' : 'todos');
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleConfirmImport = async () => {
    if (!validationResult || validationResult.validCount === 0) {
      showToast('Nenhum registro válido disponível para importação.', 'error');
      return;
    }

    setIsProcessing(true);
    try {
      const validItems = validationResult.items.filter((item) => item.isValid);

      for (const item of validItems) {
        if (entityType === 'transacoes') {
          addTransaction(item.data as any);
        } else if (entityType === 'contas') {
          addAccount(item.data as any);
        } else if (entityType === 'parceiros') {
          addPartner(item.data as any);
        } else if (entityType === 'colaboradores') {
          addEmployee(item.data as any);
        } else if (entityType === 'catalogo') {
          addCatalogItem(item.data as any);
        }
      }

      showToast(
        `${validItems.length} registros de ${schema.entityName} importados com sucesso!`,
        'success'
      );
      handleResetAndClose();
    } catch (error) {
      console.error(error);
      showToast('Erro ao gravar dados importados.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResetAndClose = () => {
    setStep('upload');
    setFileName('');
    setCsvContent('');
    setValidationResult(null);
    onClose();
  };

  const displayedItems = validationResult?.items.filter((item) => {
    if (filterView === 'validos') return item.isValid;
    if (filterView === 'invalidos') return !item.isValid;
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-3 md:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-5xl lg:max-w-6xl max-h-[95vh] flex flex-col shadow-2xl border border-[#DEE2E6] overflow-hidden text-[#010102]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#E5E2E1] flex items-center justify-between bg-linear-to-r from-amber-50/50 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-[#835400] flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px]">upload_file</span>
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#010102] flex items-center gap-2">
                Importar Planilha: {schema.title}
              </h2>
              <p className="text-xs text-gray-500">
                Alimente dados em lote através de arquivos CSV estruturados.
              </p>
            </div>
          </div>

          <button
            onClick={handleResetAndClose}
            className="w-8 h-8 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {step === 'upload' ? (
            <div className="space-y-6">
              {/* Step 1: Download Template */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[#F8F9FA] border border-[#DEE2E6] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#835400] text-white text-[11px] font-bold flex items-center justify-center">
                      1
                    </span>
                    <h3 className="text-sm font-bold text-[#010102]">
                      Baixe a Planilha Modelo Oficial
                    </h3>
                  </div>
                  <p className="text-xs text-gray-600 max-w-xl leading-relaxed">
                    A planilha modelo já vem com o cabeçalho padronizado, campos obrigatórios marcados com{' '}
                    <strong className="text-red-600 font-bold">(*)</strong> e linhas de exemplo prontas para você preencher no Excel ou Google Planilhas.
                  </p>
                </div>

                <Button
                  variant="outline"
                  icon="download"
                  onClick={handleDownloadTemplate}
                  className="shrink-0 bg-white hover:bg-amber-50/50 hover:border-[#835400] text-xs font-bold"
                >
                  Baixar Modelo (.CSV)
                </Button>
              </div>

              {/* Required & Optional Fields Reference */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Estrutura de Colunas Aceitas
                  </h4>
                  <span className="text-[11px] text-gray-500">
                    <span className="text-red-500 font-bold">*</span> = Campo obrigatório
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
                  {schema.fields.map((f) => (
                    <div
                      key={f.key}
                      className={`p-2.5 rounded-xl border ${
                        f.required
                          ? 'border-amber-200 bg-amber-50/40'
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-[#010102] flex items-center gap-1">
                          {f.label}
                          {f.required && (
                            <span className="text-red-600 font-extrabold text-sm" title="Obrigatório">
                              *
                            </span>
                          )}
                        </span>
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                            f.required
                              ? 'bg-amber-200/70 text-[#835400]'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {f.required ? 'Obrigatório' : 'Opcional'}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 line-clamp-1">{f.description}</p>
                      <p className="text-[10px] text-gray-400 font-mono mt-1">Ex: {f.example}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Step 2: Upload Dropzone */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#835400] text-white text-[11px] font-bold flex items-center justify-center">
                    2
                  </span>
                  <h3 className="text-sm font-bold text-[#010102]">
                    Carregue seu Arquivo Preenchido
                  </h3>
                </div>

                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-8 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                    isDragging
                      ? 'border-[#835400] bg-amber-50/60 scale-[0.99]'
                      : 'border-[#DEE2E6] hover:border-[#835400] hover:bg-amber-50/20 bg-white'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  <div className="w-12 h-12 rounded-2xl bg-amber-100/70 text-[#835400] flex items-center justify-center mb-3">
                    <span className="material-symbols-outlined text-[28px]">cloud_upload</span>
                  </div>

                  <p className="text-sm font-bold text-[#010102]">
                    Clique para selecionar ou arraste o arquivo CSV aqui
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Suporta arquivos CSV delimitados por ponto e vírgula (;) ou vírgula (,)
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* Step 2: Preview & Validation */
            <div className="space-y-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl border border-gray-200 bg-white flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 text-gray-700 flex items-center justify-center font-bold">
                    <span className="material-symbols-outlined">table_rows</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block">Total de Linhas</span>
                    <span className="text-lg font-bold text-[#010102]">
                      {validationResult?.totalRows || 0}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                    <span className="material-symbols-outlined">check_circle</span>
                  </div>
                  <div>
                    <span className="text-xs text-emerald-700 block">Registros Válidos</span>
                    <span className="text-lg font-bold text-emerald-800">
                      {validationResult?.validCount || 0}
                    </span>
                  </div>
                </div>

                <div
                  className={`p-3.5 rounded-xl border flex items-center gap-3 ${
                    (validationResult?.invalidCount || 0) > 0
                      ? 'border-red-200 bg-red-50/50'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                      (validationResult?.invalidCount || 0) > 0
                        ? 'bg-red-100 text-red-700'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    <span className="material-symbols-outlined">error</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block">Linhas com Inconsistências</span>
                    <span
                      className={`text-lg font-bold ${
                        (validationResult?.invalidCount || 0) > 0 ? 'text-red-700' : 'text-gray-700'
                      }`}
                    >
                      {validationResult?.invalidCount || 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setFilterView('todos')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                      filterView === 'todos'
                        ? 'bg-[#835400] text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Todos ({validationResult?.totalRows || 0})
                  </button>
                  <button
                    onClick={() => setFilterView('validos')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                      filterView === 'validos'
                        ? 'bg-emerald-700 text-white'
                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    }`}
                  >
                    Válidos ({validationResult?.validCount || 0})
                  </button>
                  <button
                    onClick={() => setFilterView('invalidos')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                      filterView === 'invalidos'
                        ? 'bg-red-700 text-white'
                        : 'bg-red-50 text-red-700 hover:bg-red-100'
                    }`}
                  >
                    Inconsistentes ({validationResult?.invalidCount || 0})
                  </button>
                </div>

                <span className="text-xs text-gray-500 truncate max-w-xs font-mono">
                  {fileName}
                </span>
              </div>

              {/* Data Table Preview */}
              <div className="border border-[#DEE2E6] rounded-xl overflow-hidden max-h-[380px] overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#F8F9FA] sticky top-0 border-b border-[#DEE2E6] z-10">
                    <tr>
                      <th className="p-2.5 font-bold text-gray-600 w-16">Linha</th>
                      <th className="p-2.5 font-bold text-gray-600 w-28">Status</th>
                      <th className="p-2.5 font-bold text-gray-600">Dados Identificados</th>
                      <th className="p-2.5 font-bold text-gray-600">Validação / Inconsistências</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {displayedItems && displayedItems.length > 0 ? (
                      displayedItems.map((item) => (
                        <tr
                          key={item.rowNumber}
                          className={item.isValid ? 'hover:bg-emerald-50/30' : 'bg-red-50/30'}
                        >
                          <td className="p-2.5 font-mono text-gray-500 font-bold">
                            #{item.rowNumber}
                          </td>
                          <td className="p-2.5">
                            {item.isValid ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                                <span className="material-symbols-outlined text-[14px]">check</span>
                                Válido
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-100 text-red-800 font-bold text-[11px]">
                                <span className="material-symbols-outlined text-[14px]">warning</span>
                                Erro
                              </span>
                            )}
                          </td>
                          <td className="p-2.5">
                            <div className="space-y-0.5">
                              {entityType === 'transacoes' && (
                                <>
                                  <div className="font-bold text-[#010102]">
                                    {item.data.descricao || '(Sem descrição)'}
                                  </div>
                                  <div className="text-[11px] text-gray-500 flex items-center gap-2">
                                    <span>{item.data.data || '-'}</span>
                                    <span>•</span>
                                    <span className="capitalize font-semibold">{item.data.tipo || '-'}</span>
                                    <span>•</span>
                                    <span className="font-bold text-[#835400]">
                                      {item.data.valor
                                        ? `R$ ${item.data.valor.toLocaleString('pt-BR', {
                                            minimumFractionDigits: 2,
                                          })}`
                                        : '-'}
                                    </span>
                                  </div>
                                </>
                              )}

                              {entityType === 'contas' && (
                                <>
                                  <div className="font-bold text-[#010102]">
                                    {item.data.descricao || '(Sem descrição)'}
                                  </div>
                                  <div className="text-[11px] text-gray-500 flex items-center gap-2">
                                    <span>{item.data.fornecedorCliente || '-'}</span>
                                    <span>•</span>
                                    <span>Venc: {item.data.vencimento || '-'}</span>
                                    <span>•</span>
                                    <span className="font-bold text-[#835400]">
                                      {item.data.valor
                                        ? `R$ ${item.data.valor.toLocaleString('pt-BR', {
                                            minimumFractionDigits: 2,
                                          })}`
                                        : '-'}
                                    </span>
                                  </div>
                                </>
                              )}

                              {entityType === 'parceiros' && (
                                <>
                                  <div className="font-bold text-[#010102]">
                                    {item.data.nome || '(Sem nome)'}
                                  </div>
                                  <div className="text-[11px] text-gray-500 flex items-center gap-2">
                                    <span className="capitalize">{item.data.tipo || 'cliente'}</span>
                                    {item.data.documento && (
                                      <>
                                        <span>•</span>
                                        <span>{item.data.documento}</span>
                                      </>
                                    )}
                                    {item.data.telefone && (
                                      <>
                                        <span>•</span>
                                        <span>{item.data.telefone}</span>
                                      </>
                                    )}
                                  </div>
                                </>
                              )}

                              {entityType === 'colaboradores' && (
                                <>
                                  <div className="font-bold text-[#010102]">
                                    {item.data.nome || '(Sem nome)'}
                                  </div>
                                  <div className="text-[11px] text-gray-500 flex items-center gap-2">
                                    <span>{item.data.cargo || '-'}</span>
                                    <span>•</span>
                                    <span>{item.data.isMotorista ? 'Motorista' : 'Pista/Usina'}</span>
                                  </div>
                                </>
                              )}

                              {entityType === 'catalogo' && (
                                <>
                                  <div className="font-bold text-[#010102]">
                                    {item.data.nome || '(Sem nome)'}
                                  </div>
                                  <div className="text-[11px] text-gray-500 flex items-center gap-2">
                                    <span>{item.data.unidade || '-'}</span>
                                    <span>•</span>
                                    <span className="font-bold text-[#835400]">
                                      {item.data.precoUnitario
                                        ? `R$ ${item.data.precoUnitario.toLocaleString('pt-BR', {
                                            minimumFractionDigits: 2,
                                          })}`
                                        : '-'}
                                    </span>
                                  </div>
                                </>
                              )}
                            </div>
                          </td>
                          <td className="p-2.5">
                            {item.isValid ? (
                              <span className="text-[11px] text-emerald-700 font-medium">
                                Pronto para inclusão no sistema
                              </span>
                            ) : (
                              <ul className="text-[11px] text-red-700 list-disc list-inside space-y-0.5 font-medium">
                                {item.errors.map((err, i) => (
                                  <li key={i}>{err}</li>
                                ))}
                              </ul>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-gray-500">
                          Nenhum registro correspondente ao filtro selecionado.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-[#E5E2E1] bg-[#F8F9FA] flex flex-col sm:flex-row items-center justify-between gap-3">
          {step === 'upload' ? (
            <>
              <span className="text-xs text-gray-500">
                Dica: Você pode exportar dados existentes em CSV para ver o formato ideal.
              </span>
              <Button variant="ghost" onClick={handleResetAndClose}>
                Cancelar
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                icon="arrow_back"
                onClick={() => setStep('upload')}
                disabled={isProcessing}
              >
                Trocar Arquivo
              </Button>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button variant="ghost" onClick={handleResetAndClose} disabled={isProcessing}>
                  Cancelar
                </Button>

                <Button
                  variant="primary"
                  icon="check"
                  onClick={handleConfirmImport}
                  disabled={isProcessing || !validationResult || validationResult.validCount === 0}
                >
                  {isProcessing
                    ? 'Importando...'
                    : `Confirmar e Importar ${validationResult?.validCount || 0} Registros`}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
