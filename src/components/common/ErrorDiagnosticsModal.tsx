import React, { useState, useSyncExternalStore } from 'react';
import { errorDiagnosticsService } from '../../services/errorDiagnosticsService';
import { AppErrorRecord, ErrorModule, ErrorSeverity } from '../../types';
import { Modal, Button } from '../common';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  HelpCircle, 
  Copy, 
  Trash2, 
  Download, 
  Check, 
  Play, 
  Activity, 
  Database, 
  ShieldAlert, 
  ChevronDown, 
  ChevronUp,
  FileSpreadsheet,
  RefreshCw,
  ExternalLink
} from 'lucide-react';

interface ErrorDiagnosticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedErrorId?: string | null;
}

export const ErrorDiagnosticsModal: React.FC<ErrorDiagnosticsModalProps> = ({
  isOpen,
  onClose,
  selectedErrorId: initialSelectedId,
}) => {
  const errors = useSyncExternalStore(
    (cb) => errorDiagnosticsService.subscribe(cb),
    () => errorDiagnosticsService.getErrors()
  );

  const [selectedModule, setSelectedModule] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [expandedErrorId, setExpandedErrorId] = useState<string | null>(initialSelectedId || null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedReport, setCopiedReport] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'errors' | 'health' | 'simulator'>('errors');
  const [simulatedModule, setSimulatedModule] = useState<ErrorModule>('lancamentos');

  const health = errorDiagnosticsService.getSystemHealth();

  if (!isOpen) return null;

  const filteredErrors = errors.filter((err) => {
    if (selectedModule !== 'all' && err.modulo !== selectedModule) return false;
    if (selectedSeverity !== 'all' && err.severidade !== selectedSeverity) return false;
    return true;
  });

  const handleCopySingleError = (err: AppErrorRecord) => {
    const text = `[DIAGNÓSTICO DE ERRO ASPHALT PRO]
Código: ${err.codigo}
Severidade: ${err.severidade.toUpperCase()}
Módulo: ${err.modulo.toUpperCase()}
Ação: ${err.acao}
Data/Hora: ${err.timestamp}
Título: ${err.titulo}
Mensagem: ${err.mensagem}
Como Resolver: ${err.resolucaoSugerida}
Detalhes Técnicos: ${err.detalhesTecnicos || 'N/A'}
Status: ${err.resolvido ? 'Resolvido' : 'Pendente'}`;

    navigator.clipboard.writeText(text);
    setCopiedId(err.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleCopyFullReport = () => {
    const report = errorDiagnosticsService.generateFullReport();
    navigator.clipboard.writeText(report);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2500);
  };

  const handleDownloadReportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(errors, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `diagnostico_erros_asphaltpro_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleSimulateError = () => {
    const created = errorDiagnosticsService.simulateTestError(simulatedModule);
    setExpandedErrorId(created.id);
    setActiveTab('errors');
  };

  const getSeverityBadge = (severity: ErrorSeverity) => {
    switch (severity) {
      case 'critico':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-red-100 text-red-800 border border-red-200">CRÍTICO</span>;
      case 'alto':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-orange-100 text-orange-800 border border-orange-200">ALTO</span>;
      case 'medio':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-yellow-100 text-yellow-800 border border-yellow-200">MÉDIO</span>;
      case 'baixo':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">BAIXO</span>;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Central de Diagnóstico e Mapeamento de Erros"
      size="2xl"
    >
      <div className="space-y-5">
        {/* Banner de Status de Saúde */}
        <div className="bg-[#F8F9FA] border border-[#DEE2E6] rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${
              health.status === 'excelente' ? 'bg-green-100 text-[#2F9E44]' :
              health.status === 'atencao' ? 'bg-yellow-100 text-[#F2A93B]' : 'bg-red-100 text-[#E03131]'
            }`}>
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-[#010102] text-sm">Saúde do Sistema:</h4>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full uppercase ${
                  health.status === 'excelente' ? 'bg-green-100 text-[#2F9E44]' :
                  health.status === 'atencao' ? 'bg-yellow-100 text-[#F2A93B]' : 'bg-red-100 text-[#E03131]'
                }`}>
                  {health.status === 'excelente' ? '100% Operacional' : health.status === 'atencao' ? 'Atenção Requerida' : 'Falhas Detectadas'}
                </span>
              </div>
              <p className="text-xs text-[#474649] mt-0.5">
                {health.errosNaoResolvidos === 0 
                  ? 'Nenhum erro pendente. Todos os módulos estão funcionando normalmente.' 
                  : `${health.errosNaoResolvidos} falha(s) registrada(s) aguardando verificação.`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-[#474649] border-t sm:border-t-0 sm:border-l border-[#DEE2E6] pt-2 sm:pt-0 sm:pl-4">
            <div>
              <div className="font-semibold text-[#010102]">Armazenamento Local</div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Database className="w-3.5 h-3.5 text-[#474649]" />
                <span>{health.storageUsadoKb} KB / {health.storageMaxKb} KB ({health.storagePercentual}%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Abas */}
        <div className="flex border-b border-[#DEE2E6] gap-2">
          <button
            onClick={() => setActiveTab('errors')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'errors'
                ? 'border-[#010102] text-[#010102]'
                : 'border-transparent text-[#474649] hover:text-[#010102]'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            Ocorrências de Erros ({errors.length})
            {health.errosNaoResolvidos > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-red-500 text-white font-bold">
                {health.errosNaoResolvidos}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('simulator')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'simulator'
                ? 'border-[#010102] text-[#010102]'
                : 'border-transparent text-[#474649] hover:text-[#010102]'
            }`}
          >
            <Play className="w-4 h-4" />
            Simulador de Erros & Testes
          </button>

          <button
            onClick={() => setActiveTab('health')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'health'
                ? 'border-[#010102] text-[#010102]'
                : 'border-transparent text-[#474649] hover:text-[#010102]'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            Guia Rápido de Prevenção
          </button>
        </div>

        {/* ABA: LISTA DE ERROS */}
        {activeTab === 'errors' && (
          <div className="space-y-4">
            {/* Barra de Filtros e Ações em Massa */}
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={selectedModule}
                  onChange={(e) => setSelectedModule(e.target.value)}
                  className="px-2.5 py-1.5 text-xs bg-white border border-[#DEE2E6] rounded-md text-[#010102] focus:outline-none focus:ring-1 focus:ring-black"
                >
                  <option value="all">Todos os Módulos</option>
                  <option value="lancamentos">Lançamentos Financeiros</option>
                  <option value="contas">Contas a Pagar / Receber</option>
                  <option value="orcamentos">Orçamentos & Propostas CBUQ</option>
                  <option value="cadastros">Cadastros & Colaboradores</option>
                  <option value="usuarios">Usuários & Acesso</option>
                  <option value="configuracoes">Configurações & Backup</option>
                  <option value="sincronizacao">Sincronização & Rede</option>
                  <option value="sistema_storage">Armazenamento Local</option>
                  <option value="renderizacao_ui">Interface / Tela</option>
                </select>

                <select
                  value={selectedSeverity}
                  onChange={(e) => setSelectedSeverity(e.target.value)}
                  className="px-2.5 py-1.5 text-xs bg-white border border-[#DEE2E6] rounded-md text-[#010102] focus:outline-none focus:ring-1 focus:ring-black"
                >
                  <option value="all">Todas as Severidades</option>
                  <option value="critico">Crítico</option>
                  <option value="alto">Alto</option>
                  <option value="medio">Médio</option>
                  <option value="baixo">Baixo</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                {errors.length > 0 && (
                  <>
                    <button
                      onClick={handleCopyFullReport}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-[#DEE2E6] text-xs font-semibold text-[#010102] rounded-md hover:bg-[#F8F9FA] transition-colors"
                      title="Copiar relatório completo para enviar ao suporte"
                    >
                      {copiedReport ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedReport ? 'Copiado!' : 'Copiar Diagnóstico'}</span>
                    </button>

                    <button
                      onClick={handleDownloadReportJson}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-[#DEE2E6] text-xs font-semibold text-[#010102] rounded-md hover:bg-[#F8F9FA] transition-colors"
                      title="Baixar arquivo de diagnóstico"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Salvar Diagnóstico</span>
                    </button>

                    <button
                      onClick={() => errorDiagnosticsService.markAllAsResolved()}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#F8F9FA] text-xs font-semibold text-[#2F9E44] rounded-md hover:bg-green-50 transition-colors"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Resolver Todos</span>
                    </button>

                    <button
                      onClick={() => errorDiagnosticsService.clearAll()}
                      className="inline-flex items-center gap-1 px-2 py-1.5 text-xs text-[#E03131] hover:bg-red-50 rounded-md transition-colors"
                      title="Limpar histórico"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Listagem de Cards de Erro */}
            {filteredErrors.length === 0 ? (
              <div className="text-center py-10 bg-[#F8F9FA] border border-[#DEE2E6] rounded-xl">
                <CheckCircle2 className="w-10 h-10 text-[#2F9E44] mx-auto mb-2" />
                <h5 className="font-bold text-[#010102] text-sm">Nenhum erro registrado neste filtro</h5>
                <p className="text-xs text-[#474649] max-w-sm mx-auto mt-1">
                  O sistema está operando perfeitamente. Se desejar verificar como o sistema mapeia falhas, utilize a aba de testes acima.
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {filteredErrors.map((err) => {
                  const isExpanded = expandedErrorId === err.id;

                  return (
                    <div
                      key={err.id}
                      className={`border rounded-xl transition-all ${
                        err.resolvido 
                          ? 'border-[#DEE2E6] bg-white opacity-75' 
                          : err.severidade === 'critico' || err.severidade === 'alto'
                          ? 'border-red-200 bg-red-50/20'
                          : 'border-yellow-200 bg-yellow-50/20'
                      }`}
                    >
                      {/* Cabeçalho do Card */}
                      <div
                        onClick={() => setExpandedErrorId(isExpanded ? null : err.id)}
                        className="p-3.5 flex items-start justify-between gap-3 cursor-pointer select-none"
                      >
                        <div className="flex items-start gap-3">
                          <div className={`mt-0.5 p-1.5 rounded-lg shrink-0 ${
                            err.resolvido 
                              ? 'bg-gray-100 text-gray-500' 
                              : err.severidade === 'critico' || err.severidade === 'alto'
                              ? 'bg-red-100 text-[#E03131]'
                              : 'bg-yellow-100 text-[#F2A93B]'
                          }`}>
                            <AlertTriangle className="w-4 h-4" />
                          </div>

                          <div>
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <span className="font-mono text-xs font-bold text-[#010102] bg-white px-2 py-0.5 border border-[#DEE2E6] rounded">
                                {err.codigo}
                              </span>
                              {getSeverityBadge(err.severidade)}
                              <span className="text-[11px] font-semibold uppercase text-[#474649] bg-gray-100 px-2 py-0.5 rounded">
                                {err.modulo}
                              </span>
                              <span className="text-[11px] text-[#474649]">
                                {err.timestamp}
                              </span>
                              {err.resolvido && (
                                <span className="text-[11px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded flex items-center gap-1">
                                  <Check className="w-3 h-3" /> Resolvido
                                </span>
                              )}
                            </div>

                            <h5 className="font-bold text-sm text-[#010102]">{err.titulo}</h5>
                            <p className="text-xs text-[#474649] mt-0.5 line-clamp-1">{err.mensagem}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {isExpanded ? <ChevronUp className="w-4 h-4 text-[#474649]" /> : <ChevronDown className="w-4 h-4 text-[#474649]" />}
                        </div>
                      </div>

                      {/* Conteúdo Expandido com Resolução Rápida */}
                      {isExpanded && (
                        <div className="px-4 pb-4 pt-1 border-t border-[#DEE2E6]/60 space-y-3">
                          {/* Box de Resolução Rápida */}
                          <div className="bg-emerald-50/70 border border-emerald-200 rounded-lg p-3 text-xs text-emerald-950">
                            <div className="flex items-center gap-1.5 font-bold text-emerald-900 mb-1">
                              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                              <span>Como Corrigir Rapidamente:</span>
                            </div>
                            <p className="leading-relaxed font-medium">
                              {err.resolucaoSugerida}
                            </p>
                          </div>

                          {/* Detalhes do Erro */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-white p-3 rounded-lg border border-[#DEE2E6]">
                            <div>
                              <span className="font-bold text-[#010102]">Ação tentada:</span>
                              <p className="text-[#474649]">{err.acao}</p>
                            </div>
                            <div>
                              <span className="font-bold text-[#010102]">Impacto no Sistema:</span>
                              <p className="text-[#474649]">
                                {err.severidade === 'critico' ? 'Bloqueou a gravação do registro' : 'Ação rejeitada pelas regras de validação'}
                              </p>
                            </div>
                          </div>

                          {err.detalhesTecnicos && (
                            <div className="space-y-1">
                              <span className="text-[11px] font-bold text-[#474649] uppercase">Log Técnico / Stack Trace:</span>
                              <pre className="text-[11px] font-mono bg-[#010102] text-green-400 p-2.5 rounded-lg overflow-x-auto max-h-28">
                                {err.detalhesTecnicos}
                              </pre>
                            </div>
                          )}

                          {/* Botões de Ação do Card */}
                          <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleCopySingleError(err)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#DEE2E6] text-xs font-semibold text-[#010102] rounded-md hover:bg-[#F8F9FA] transition-colors"
                              >
                                {copiedId === err.id ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                                <span>{copiedId === err.id ? 'Copiado para Área de Transferência!' : 'Copiar Diagnóstico'}</span>
                              </button>

                              {!err.resolvido ? (
                                <button
                                  onClick={() => errorDiagnosticsService.markAsResolved(err.id)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-800 border border-green-200 text-xs font-bold rounded-md hover:bg-green-100 transition-colors"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Marcar como Resolvido</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => errorDiagnosticsService.deleteError(err.id)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#E03131] hover:bg-red-50 rounded-md transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Excluir Ocorrência</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ABA: SIMULADOR DE TESTES */}
        {activeTab === 'simulator' && (
          <div className="space-y-4 bg-[#F8F9FA] border border-[#DEE2E6] rounded-xl p-5">
            <div>
              <h4 className="font-bold text-[#010102] text-sm flex items-center gap-2">
                <Play className="w-4 h-4 text-[#F2A93B]" />
                Simulador de Testes de Erros e Validação
              </h4>
              <p className="text-xs text-[#474649] mt-1">
                Utilize este recurso para testar na prática como o Asphalt Pro captura falhas, gera o código identificador único e fornece o passo a passo de correção imediata para o operador da Usina.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-xs font-bold text-[#010102] mb-1">
                  Selecione o Módulo da Usina para Simulação:
                </label>
                <select
                  value={simulatedModule}
                  onChange={(e) => setSimulatedModule(e.target.value as ErrorModule)}
                  className="w-full px-3 py-2 text-xs bg-white border border-[#DEE2E6] rounded-lg text-[#010102] focus:outline-none focus:ring-1 focus:ring-black"
                >
                  <option value="lancamentos">Lançamentos (Compra de Insumo / CAP)</option>
                  <option value="contas">Contas a Pagar / Fornecedores</option>
                  <option value="orcamentos">Orçamentos CBUQ & Frete por Tonelada</option>
                  <option value="cadastros">Colaboradores & Motoristas de Caminhão</option>
                  <option value="usuarios">Permissões de Segurança e Acesso</option>
                  <option value="configuracoes">Backup e Restauração de Dados</option>
                  <option value="sincronizacao">Sincronização Offline / Balança</option>
                  <option value="sistema_storage">Capacidade de Armazenamento Local</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={handleSimulateError}
                  className="w-full py-2 px-4 bg-[#010102] text-white text-xs font-bold rounded-lg hover:bg-black transition-colors flex items-center justify-center gap-2"
                >
                  <Play className="w-3.5 h-3.5 text-[#F2A93B]" />
                  <span>Disparar Erro de Teste & Ver Resolução</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ABA: GUIA RÁPIDO DE PREVENÇÃO */}
        {activeTab === 'health' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 bg-white border border-[#DEE2E6] rounded-xl space-y-2">
                <h5 className="font-bold text-xs text-[#010102] flex items-center gap-1.5">
                  <FileSpreadsheet className="w-4 h-4 text-[#2F9E44]" />
                  Falhas ao Salvar ou Editar Lançamentos
                </h5>
                <ul className="text-xs text-[#474649] space-y-1.5 list-disc pl-4">
                  <li>Certifique-se de que o campo <strong>Valor (R$)</strong> é positivo e maior que zero.</li>
                  <li>Selecione uma <strong>Categoria</strong> e a <strong>Conta Bancária / Caixa</strong> de movimentação.</li>
                  <li>Se o formulário recusar, o sistema indicará o campo exato com destaque vermelho.</li>
                </ul>
              </div>

              <div className="p-3.5 bg-white border border-[#DEE2E6] rounded-xl space-y-2">
                <h5 className="font-bold text-xs text-[#010102] flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-blue-600" />
                  Garantia de Não Perda de Dados
                </h5>
                <ul className="text-xs text-[#474649] space-y-1.5 list-disc pl-4">
                  <li>Todas as gravações no navegador são atômicas e protegidas contra corrupção.</li>
                  <li>Recomenda-se exportar um <strong>Backup JSON</strong> semanal em <em>Configurações &gt; Backup</em>.</li>
                  <li>O modo Offline preserva todas as pesagens e lançamentos na fila local até haver conexão.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Rodapé com botão de Fechar */}
        <div className="flex justify-end pt-2 border-t border-[#DEE2E6]">
          <Button variant="secondary" onClick={onClose}>
            Fechar Diagnóstico
          </Button>
        </div>
      </div>
    </Modal>
  );
};
