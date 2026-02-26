'use client';

import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>;
}

// Default error fallback component
const DefaultErrorFallback: React.FC<{ error: Error; retry: () => void }> = ({ 
  error, 
  retry 
}) => (
  <div className="min-h-screen flex items-center justify-center bg-red-50">
    <div className="text-center space-y-6 max-w-lg p-8">
      <div className="text-red-500 text-6xl">💥</div>
      
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-red-800">
          Something went wrong
        </h1>
        <p className="text-red-600">
          The application encountered an unexpected error.
        </p>
      </div>

      <div className="bg-red-100 border border-red-300 rounded p-4 text-left">
        <p className="font-mono text-sm text-red-800 break-all">
          {error.message}
        </p>
      </div>

      <div className="space-y-3">
        <button
          onClick={retry}
          className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
        >
          Try Again
        </button>
        
        <div className="text-xs text-red-500 space-y-1">
          <p>If this error persists:</p>
          <p>• Clear your browser cache and cookies</p>
          <p>• Try refreshing the page</p>
          <p>• Contact support if the issue continues</p>
        </div>
      </div>
    </div>
  </div>
);

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // In production, you would log this to your error reporting service
    if (process.env.NODE_ENV === 'production') {
      // Example: Sentry.captureException(error, { extra: errorInfo });
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      
      return (
        <FallbackComponent 
          error={this.state.error} 
          retry={this.handleRetry}
        />
      );
    }

    return this.props.children;
  }
}

// Hook version for functional components
export const useErrorHandler = () => {
  return (error: Error, errorInfo?: React.ErrorInfo) => {
    console.error('Error caught by useErrorHandler:', error, errorInfo);
    
    if (process.env.NODE_ENV === 'production') {
      // Log to error reporting service
    }
  };
};