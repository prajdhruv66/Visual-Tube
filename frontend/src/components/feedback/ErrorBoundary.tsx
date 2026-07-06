import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertOctagon } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // In a real deployment this would report to an error-tracking service.
    console.error('Unhandled UI error:', error, info.componentStack);
  }

  handleReload = () => {
    this.setState({ hasError: false });
    window.location.assign('/');
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-bg px-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-2 text-danger">
            <AlertOctagon className="h-7 w-7" />
          </div>
          <h1 className="font-display text-xl font-semibold text-text-primary">Something went wrong</h1>
          <p className="max-w-sm text-sm text-text-secondary">
            An unexpected error occurred. Try reloading the page — if the problem persists, please try again later.
          </p>
          <button
            onClick={this.handleReload}
            className="inline-flex h-10 items-center justify-center rounded-md bg-accent px-4 text-sm font-medium text-white hover:bg-accent-hover"
          >
            Back to Home
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
