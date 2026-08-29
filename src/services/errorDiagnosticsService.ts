import { AppErrorRecord, ErrorModule, ErrorSeverity, SystemHealthMetrics } from '../types';

const ERROR_STORAGE_KEY = 'asphaltpro_error_diagnostics_log';
const MAX_STORED_ERRORS = 40;

type ErrorListener = () => void;

class ErrorDiagnosticsService {
  private errors: AppErrorRecord[] = [];
  private listeners: Set<ErrorListener> = new Set();
  private initialized = false;

  constructor() {
    this.subscribe = this.subscribe.bind(this);
    this.getErrors = this.getErrors.bind(this);
    this.recordError = this.recordError.bind(this);
    this.getUnresolvedCount = this.getUnresolvedCount.bind(this);
    this.markAsResolved = this.markAsResolved.bind(this);
    this.markAllAsResolved = this.markAllAsResolved.bind(this);
    this.clearAll = this.clearAll.bind(this);
    this.deleteError = this.deleteError.bind(this);
    this.getSystemHealth = this.getSystemHealth.bind(this);
    this.generateFullReport = this.generateFullReport.bind(this);
    this.loadFromStorage();
    this.initGlobalHandlers();
  }

  private loadFromStorage() {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(ERROR_STORAGE_KEY);
      if (stored) {
        this.errors = JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Erro ao carregar log de diagnóstico de erros:', e);
      this.errors = [];
    }
  }

  private saveToStorage() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(ERROR_STORAGE_KEY, JSON.stringify(this.errors.slice(0, MAX_STORED_ERRORS)));
    } catch (e) {
      console.warn('Falha de escrita no LocalStorage ao salvar log de erros:', e);
      // Se estourar a cota de armazenamento, descarta os mais antigos
      try {
        this.errors = this.errors.slice(0, 10);
        localStorage.setItem(ERROR_STORAGE_KEY, JSON.stringify(this.errors));
      } catch {
        // no-op
      }
    }
    this.notify();
  }

  private initGlobalHandlers() {
    if (typeof window === 'undefined' || this.initialized) return;
    this.initialized = true;

    // Erros não tratados de runtime
    window.addEventListener('error', (event) => {
      // Ignorar erros benignos de hot-reload ou extensões do navegador
      if (event.message?.includes('ResizeObserver') || event.message?.includes('websocket')) {
        return;
      }

      this.recordError({
        modulo: 'renderizacao_ui',
        acao: 'Renderização do Navegador',
        titulo: 'Erro não tratado no script da interface',
        mensagem: event.message || 'Exceção não tratada na execução da página.',
        codigo: 'ERR_UNCAUGHT_RUNTIME',
        severidade: 'alto',
        detalhesTecnicos: `${event.filename || 'Desconhecido'}:${event.lineno || 0}:${event.colno || 0}`,
        stack: event.error?.stack,
        resolucaoSugerida: 'Recarregue a página (F5 ou Ctrl+R). Se o erro persistir, exporte o relatório de diagnóstico e acione o suporte.',
        acaoRapida: 'limpar_cache',
      });
    });

    // Promises rejeitadas sem catch
    window.addEventListener('unhandledrejection', (event) => {
      this.recordError({
        modulo: 'sistema_storage',
        acao: 'Operação Assíncrona',
        titulo: 'Falha de processamento assíncrono',
        mensagem: String(event.reason?.message || event.reason || 'Promise rejeitada sem tratamento.'),
        codigo: 'ERR_UNHANDLED_PROMISE',
        severidade: 'medio',
        detalhesTecnicos: typeof event.reason === 'object' ? JSON.stringify(event.reason) : String(event.reason),
        stack: event.reason?.stack,
        resolucaoSugerida: 'Verifique se sua conexão com a rede está estável e tente executar a operação novamente.',
        acaoRapida: 'tentar_novamente',
      });
    });
  }

  public subscribe(listener: ErrorListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    queueMicrotask(() => {
      this.listeners.forEach((listener) => {
        try {
          listener();
        } catch (err) {
          console.error('Error notifying error listener:', err);
        }
      });
    });
  }

  public recordError(params: {
    modulo: ErrorModule;
    acao: string;
    titulo: string;
    mensagem: string;
    codigo?: string;
    severidade?: ErrorSeverity;
    detalhesTecnicos?: string;
    resolucaoSugerida?: string;
    acaoRapida?: AppErrorRecord['acaoRapida'];
    payloadResumo?: Record<string, any>;
    stack?: string;
    errorObj?: unknown;
  }): AppErrorRecord {
    const rawError = params.errorObj as Error | undefined;
    const generatedCode = params.codigo || `ERR_${params.modulo.toUpperCase()}_${Date.now().toString().slice(-4)}`;

    // Resolução inteligente padrão caso não informada
    let autoResolucao = params.resolucaoSugerida;
    if (!autoResolucao) {
      if (params.modulo === 'lancamentos') {
        autoResolucao = 'Verifique se o valor, a categoria e a data do lançamento estão preenchidos corretamente e tente salvar novamente.';
      } else if (params.modulo === 'contas') {
        autoResolucao = 'Certifique-se de que a data de vencimento é válida e que o fornecedor/cliente foi selecionado.';
      } else if (params.modulo === 'orcamentos') {
        autoResolucao = 'Confira se há itens adicionados na planilha e se os valores unitários e quantidades são maiores que zero.';
      } else if (params.modulo === 'configuracoes') {
        autoResolucao = 'Verifique se o arquivo importado é um JSON de backup válido gerado pelo próprio Asphalt Pro.';
      } else if (params.modulo === 'sistema_storage') {
        autoResolucao = 'O armazenamento local do navegador pode estar cheio. Exporte um backup em Configurações > Backup e depois limpe os dados obsoletos.';
      } else {
        autoResolucao = 'Tente repetir a ação. Se a falha continuar, consulte o detalhe do erro ou acione o suporte com o código gerado.';
      }
    }

    const newRecord: AppErrorRecord = {
      id: 'err_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      codigo: generatedCode,
      modulo: params.modulo,
      acao: params.acao,
      titulo: params.titulo,
      mensagem: params.mensagem,
      detalhesTecnicos: params.detalhesTecnicos || (rawError ? rawError.message : undefined),
      resolucaoSugerida: autoResolucao,
      acaoRapida: params.acaoRapida || 'tentar_novamente',
      payloadResumo: params.payloadResumo,
      timestamp: new Date().toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
      resolvido: false,
      stack: params.stack || (rawError ? rawError.stack : undefined),
      severidade: params.severidade || 'medio',
    };

    this.errors = [newRecord, ...this.errors].slice(0, MAX_STORED_ERRORS);
    this.saveToStorage();
    return newRecord;
  }

  public getErrors(): AppErrorRecord[] {
    return this.errors;
  }

  public getUnresolvedCount(): number {
    return this.errors.filter((e) => !e.resolvido).length;
  }

  public markAsResolved(id: string) {
    this.errors = this.errors.map((e) => (e.id === id ? { ...e, resolvido: true } : e));
    this.saveToStorage();
  }

  public markAllAsResolved() {
    this.errors = this.errors.map((e) => ({ ...e, resolvido: true }));
    this.saveToStorage();
  }

  public clearAll() {
    this.errors = [];
    this.saveToStorage();
  }

  public deleteError(id: string) {
    this.errors = this.errors.filter((e) => e.id !== id);
    this.saveToStorage();
  }

  public getSystemHealth(): SystemHealthMetrics {
    let usedBytes = 0;
    try {
      for (const key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          usedBytes += (localStorage[key]?.length || 0) * 2; // UTF-16
        }
      }
    } catch {
      usedBytes = 1024 * 50;
    }

    const storageUsadoKb = Math.round(usedBytes / 1024);
    const storageMaxKb = 5120; // 5MB standard localStorage
    const storagePercentual = Math.min(100, Math.round((storageUsadoKb / storageMaxKb) * 100));

    const unresolved = this.getUnresolvedCount();
    let status: SystemHealthMetrics['status'] = 'excelente';
    if (unresolved > 5 || storagePercentual > 80) {
      status = 'critico';
    } else if (unresolved > 0 || storagePercentual > 50) {
      status = 'atencao';
    }

    return {
      status,
      totalErros24h: this.errors.length,
      errosNaoResolvidos: unresolved,
      storageUsadoKb,
      storageMaxKb,
      storagePercentual,
      ultimaFalha: this.errors[0]?.timestamp,
      versaoApp: 'v2.4.0 (Industrial CBUQ Pro)',
    };
  }

  public generateFullReport(): string {
    const health = this.getSystemHealth();
    const errorsList = this.errors.map((e, idx) => `
[#${idx + 1}] Código: ${e.codigo} | Severidade: ${e.severidade.toUpperCase()}
Módulo: ${e.modulo} | Ação: ${e.acao} | Data/Hora: ${e.timestamp}
Título: ${e.titulo}
Mensagem: ${e.mensagem}
Resolução Sugerida: ${e.resolucaoSugerida}
Detalhes Técnicos: ${e.detalhesTecnicos || 'N/A'}
Status: ${e.resolvido ? 'RESOLVIDO' : 'PENDENTE / NÃO RESOLVIDO'}
------------------------------------------------------------`).join('\n');

    return `=== RELATÓRIO DE DIAGNÓSTICO E SAÚDE DO SISTEMA ===
Software: Asphalt Pro - Gestão Financeira de Usina de Asfalto
Versão: ${health.versaoApp}
Data da Coleta: ${new Date().toLocaleString('pt-BR')}
Status Global: ${health.status.toUpperCase()}
Espaço Armazenamento Navegador: ${health.storageUsadoKb} KB / ${health.storageMaxKb} KB (${health.storagePercentual}%)
Total de Falhas no Registro: ${this.errors.length}
Falhas Pendentes: ${health.errosNaoResolvidos}

=== HISTÓRICO DE OCORRÊNCIAS / ERROS REGISTRADOS ===
${this.errors.length === 0 ? 'Nenhum erro registrado no histórico. O sistema está 100% saudável.' : errorsList}
`;
  }

  public simulateTestError(modulo: ErrorModule = 'lancamentos'): AppErrorRecord {
    const moduleMap: Record<ErrorModule, { acao: string; titulo: string; mensagem: string; resolucao: string }> = {
      lancamentos: {
        acao: 'Salvar Lançamento de Compra de CAP',
        titulo: 'Simulação: Falha de validação no lançamento financeiro',
        mensagem: 'O valor unitário do insumo asfáltico não pode ser negativo ou vazio.',
        resolucao: 'Corrija o valor unitário para um número positivo superior a R$ 0,01 e selecione a conta de débito.',
      },
      contas: {
        acao: 'Baixar Parcela de Fornecedor de Brita',
        titulo: 'Simulação: Falha de conciliação de conta a pagar',
        mensagem: 'A conta de origem não possui saldo suficiente para liquidação imediata da duplicata.',
        resolucao: 'Transfira recursos para a conta bancária da Usina ou altere a forma de pagamento.',
      },
      orcamentos: {
        acao: 'Calcular Frete e Emitir Proposta CBUQ',
        titulo: 'Simulação: Erro de cálculo de frete por tonelagem',
        mensagem: 'A distância informada até o canteiro de obras (km) não pode ser nula para propostas com entrega.',
        resolucao: 'Abra a proposta, informe a quilometragem ou selecione a modalidade "FOB - Retirada na Usina".',
      },
      cadastros: {
        acao: 'Cadastrar Novo Fornecedor de Emulsão',
        titulo: 'Simulação: CNPJ ou Documento Inválido',
        mensagem: 'O documento fiscal informado contém dígitos verificadores incorretos.',
        resolucao: 'Verifique o número do CNPJ/CPF cadastrado no Sintegra ou Receita Federal.',
      },
      funcionarios: {
        acao: 'Cadastrar Novo Motorista / Operador',
        titulo: 'Simulação: Documento ou Matrícula Duplicada',
        mensagem: 'Já existe um colaborador ativo cadastrado com estes dados na Usina.',
        resolucao: 'Verifique a lista de colaboradores ou edite o cadastro já existente.',
      },
      usuarios: {
        acao: 'Alterar Permissões de Acesso de Operador',
        titulo: 'Simulação: Falha de permissão de administrador',
        mensagem: 'Apenas usuários com perfil Diretoria (Admin) têm privilégios para criar novos operadores.',
        resolucao: 'Faça login com uma conta de Diretoria para alterar permissões de segurança.',
      },
      configuracoes: {
        acao: 'Restaurar Arquivo de Backup da Usina',
        titulo: 'Simulação: Estrutura de arquivo corrompida',
        mensagem: 'O arquivo JSON selecionado não contém a assinatura de segurança do Asphalt Pro.',
        resolucao: 'Certifique-se de utilizar um arquivo .json exportado na aba Configurações > Exportar Backup.',
      },
      sincronizacao: {
        acao: 'Sincronizar Fila Offline de Pesagem de Caminhões',
        titulo: 'Simulação: Timeout de conexão com a balança',
        mensagem: 'Servidor de nuvem demorou mais de 10 segundos para responder à requisição de upsert.',
        resolucao: 'A fila de sincronização continuará ativa no navegador e sincronizará automaticamente quando o sinal restabelecer.',
      },
      sistema_storage: {
        acao: 'Persistência de Dados em LocalStorage',
        titulo: 'Simulação: Limite de cota de armazenamento local',
        mensagem: 'O navegador atingiu a cota máxima de armazenamento em cache local.',
        resolucao: 'Exporte um backup dos dados e limpe logs antigos para liberar espaço no dispositivo.',
      },
      renderizacao_ui: {
        acao: 'Renderização de Gráfico de Produção',
        titulo: 'Simulação: Erro de renderização de elemento visual',
        mensagem: 'Propriedade de data inválida recebida no componente de visualização.',
        resolucao: 'Recarregue o módulo ou selecione um intervalo de datas válido no filtro superior.',
      },
      geral: {
        acao: 'Processamento de Rotina do Sistema',
        titulo: 'Simulação: Falha genérica de teste',
        mensagem: 'Este é um erro de teste disparado propositalmente para validar o sistema de diagnóstico.',
        resolucao: 'Nenhuma ação necessária! O teste demonstra como falhas reais são mapeadas com código e resolução.',
      },
    };

    const target = moduleMap[modulo] || moduleMap.geral;

    return this.recordError({
      modulo,
      acao: target.acao,
      titulo: target.titulo,
      mensagem: target.mensagem,
      codigo: `SIM_${modulo.toUpperCase()}_${Date.now().toString().slice(-4)}`,
      severidade: 'medio',
      resolucaoSugerida: target.resolucao,
      acaoRapida: 'tentar_novamente',
      detalhesTecnicos: `SimulatedError: Test trigger executed from UI diagnostic panel at ${new Date().toISOString()}`,
    });
  }
}

export const errorDiagnosticsService = new ErrorDiagnosticsService();
