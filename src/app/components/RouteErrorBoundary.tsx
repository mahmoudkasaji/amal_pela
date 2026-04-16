/**
 * Route-level error boundary — catches errors inside a specific route tree
 * so that only the affected section shows the error, not the whole app.
 *
 * Usage:
 *   <RouteErrorBoundary scope="admin">
 *     <AdminLayout />
 *   </RouteErrorBoundary>
 */
import { Component, type ReactNode } from 'react';
import { log } from '../lib/log';

interface Props {
  children: ReactNode;
  scope: string; // e.g., 'admin', 'trainer', 'trainee'
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class RouteErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack?: string }) {
    log.error(`Route error in ${this.props.scope}`, error, { componentStack: info.componentStack });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          dir="rtl"
          className="min-h-screen flex items-center justify-center bg-gray-50"
          style={{ fontFamily: "'Cairo', sans-serif" }}
        >
          <div className="text-center p-8 max-w-md">
            <div
              className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
              style={{ background: '#fee2e2' }}
            >
              <span style={{ fontSize: '2rem' }}>⚠</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">حدث خطأ في هذه الصفحة</h1>
            <p className="text-gray-500 mb-6 text-sm">
              {this.state.error?.message || 'خطأ غير معروف — يمكنك المحاولة من جديد أو إعادة تحميل الصفحة.'}
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleRetry}
                className="px-5 py-2 bg-gray-900 text-white rounded-lg text-sm hover:bg-gray-800 transition"
              >
                إعادة المحاولة
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-5 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition"
              >
                إعادة تحميل الصفحة
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
