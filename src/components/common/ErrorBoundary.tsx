import React, { ErrorInfo, ReactNode } from 'react';
import { errorDiagnosticsService } from '../../services/errorDiagnosticsService';
import { AlertTriangle, RefreshCw, Home, FileText } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onOpenDiagnostics?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
      errorId: null,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const recorded = errorDiagnosticsService.recordError({
      modulo: 'renderizacao_ui',
      acao: 'Renderização do Componente React',
      titulo: 'Exceção interceptada pelo Error Boundary',
      mensagem: error.message || 'Falha inesperada durante a exibição visual da tela.',
      codigo: 'ERR_REACT_RENDER_CRASH',
      severidade: 'critico',
      detalhesTecnicos: error.stack,
      stack: errorInfo.componentStack || undefined,
      resolucaoSugerida: 'Clique em "Recarregar Módulo" para restabelecer a interface. Se o erro continuar, consulte o diagnóstico detalhado.',
      acaoRapida: 'tentar_novamente',
      errorObj: error,
    });

    this.setState({
      error,
      errorInfo,
      errorId: recorded.id,
    });
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    });
  };

  private handleHardReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex flex-col items-center justify-center p-8 bg-white border border-[#E03131]/30 rounded-xl shadow-sm text-center max-w-2xl mx-auto my-8">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4 text-[#E03131]">
            <AlertTriangle className="w-8 h-8" />
          </div>

          <span className="inline-block px-2.5 py-1 text-xs font-mono font-bold text-[#E03131] bg-red-100/60 rounded mb-2">
            CÓDIGO: ERR_REACT_RENDER_CRASH
          </span>

          <h2 className="text-xl font-bold text-[#010102] mb-2">
            {this.props.fallbackTitle || 'Ocorreu uma falha visual neste módulo'}
          </h2>

          <p className="text-sm text-[#474649] mb-4 max-w-md">
            O sistema detectou um erro durante a renderização da interface e evitou o fechamento da aplicação. Seus dados continuam preservados no navegador.
          </p>

          {this.state.error && (
            <div className="w-full bg-[#F8F9FA] border border-[#DEE2E6] rounded-lg p-3 text-left mb-6 font-mono text-xs text-[#E03131] overflow-x-auto max-h-32">
              {this.state.error.message}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#010102] text-white text-sm font-semibold rounded-lg hover:bg-black transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Recarregar Este Módulo
            </button>

            <button
              onClick={this.handleHardReload}
              className="inline-flex items-center gap-2 px-4 py-2 border border-[#DEE2E6] bg-white text-[#010102] text-sm font-semibold rounded-lg hover:bg-[#F8F9FA] transition-colors"
            >
              <Home className="w-4 h-4" />
              Recarregar Toda a Página
            </button>

            {this.props.onOpenDiagnostics && (
              <button
                onClick={this.props.onOpenDiagnostics}
                className="inline-flex items-center gap-2 px-4 py-2 text-[#E03131] bg-red-50 hover:bg-red-100 text-sm font-semibold rounded-lg transition-colors"
              >
                <FileText className="w-4 h-4" />
                Ver Diagnóstico & Resolução
              </button>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
