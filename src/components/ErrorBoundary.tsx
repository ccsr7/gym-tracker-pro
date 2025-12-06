'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary Component
 *
 * Catches React errors and prevents the entire app from crashing.
 * Displays a user-friendly error message with recovery options.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details for debugging
    console.error('ErrorBoundary caught an error:', error);
    console.error('Error Info:', errorInfo);

    // You could also send to an error reporting service here
    // e.g., Sentry, LogRocket, etc.

    this.setState({
      error,
      errorInfo
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-slate-50 dark:via-slate-100 dark:to-slate-50 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full">
            <div className="bg-slate-800/50 dark:bg-white backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-slate-700/50 dark:border-slate-200">
              {/* Icon */}
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-red-500/20 dark:bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-10 h-10 text-red-400 dark:text-red-600" />
                </div>
              </div>

              {/* Title */}
              <h1 className="text-2xl md:text-3xl font-bold text-center text-white dark:text-slate-900 mb-3">
                ¡Oops! Algo salió mal
              </h1>

              {/* Description */}
              <p className="text-center text-slate-400 dark:text-slate-600 mb-6">
                La aplicación encontró un error inesperado. No te preocupes, tus datos están seguros.
              </p>

              {/* Error Details (Development Only) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="bg-slate-700/50 dark:bg-slate-100 border border-slate-600/50 dark:border-slate-300 rounded-lg p-4 mb-6 overflow-auto max-h-48">
                  <p className="text-xs font-mono text-red-400 dark:text-red-600 mb-2">
                    {this.state.error.toString()}
                  </p>
                  {this.state.errorInfo && (
                    <details className="text-xs font-mono text-slate-400 dark:text-slate-600">
                      <summary className="cursor-pointer hover:text-white dark:hover:text-slate-900 mb-2">
                        Stack Trace
                      </summary>
                      <pre className="whitespace-pre-wrap">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  onClick={this.handleReset}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Intentar de nuevo
                </button>

                <button
                  onClick={this.handleReload}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-700 dark:bg-slate-200 hover:bg-slate-600 dark:hover:bg-slate-300 text-white dark:text-slate-900 rounded-lg font-medium transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Recargar página
                </button>

                <button
                  onClick={this.handleGoHome}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
                >
                  <Home className="w-4 h-4" />
                  Ir al inicio
                </button>
              </div>

              {/* Help Text */}
              <div className="mt-6 bg-blue-500/10 dark:bg-blue-50 border border-blue-500/30 dark:border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-300 dark:text-blue-700 text-center">
                  Si el problema persiste, intenta limpiar el caché del navegador o{' '}
                  <button
                    onClick={() => {
                      if (confirm('¿Estás seguro? Esto cerrará tu sesión pero NO borrará tus datos.')) {
                        localStorage.removeItem('gym-tracker-user');
                        window.location.href = '/';
                      }
                    }}
                    className="underline hover:text-blue-200 dark:hover:text-blue-900"
                  >
                    cerrar sesión
                  </button>
                  .
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Default export for convenience
export default ErrorBoundary;
