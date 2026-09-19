import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  resetKey?: string | number;
  label?: string;
}

interface ErrorBoundaryState {
  error: Error | null;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.warn(this.props.label || 'ErrorBoundary', error, info.componentStack);
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null });
    }
  }

  private retry = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      return (
        <div
          dir="rtl"
          className="h-full min-h-[12rem] flex flex-col items-center justify-center gap-3 px-4 py-8 text-center bg-white/95 dark:bg-neutral-950/90"
        >
          <p className="text-sm font-bold text-neutral-900 dark:text-white">
            تعذر عرض {this.props.label || 'هذه الواجهة'}
          </p>
          <p className="text-xs text-neutral-500 dark:text-zinc-400 max-w-xs">
            حدث خطأ مؤقت في البيانات. الأماكن المحمّلة سابقاً لم تُحذف — أعد المحاولة للمتابعة.
          </p>
          <button
            type="button"
            onClick={this.retry}
            className="h-10 px-4 rounded-xl bg-brand-400 text-neutral-950 text-sm font-bold cursor-pointer"
          >
            إعادة المحاولة
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
