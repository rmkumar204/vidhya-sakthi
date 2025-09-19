import React, { Component, ErrorInfo, ReactNode } from 'react';
import { callService } from '../services/CallService';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class CallErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Call Error Boundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Clean up any active calls when an error occurs
    try {
      callService.endCall();
    } catch (cleanupError) {
      console.error('Error during call cleanup:', cleanupError);
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  private handleReset = () => {
    // Force reload the page to reset all state
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 dark:bg-red-900 rounded-full mb-4">
              <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white text-center mb-2">
              Call System Error
            </h2>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-6">
              Something went wrong with the call system. This might be due to a network issue or browser compatibility problem.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                <p className="font-mono text-red-600 dark:text-red-400">
                  {this.state.error.message}
                </p>
                {this.state.errorInfo && (
                  <pre className="mt-2 text-xs text-gray-600 dark:text-gray-400 overflow-auto">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </div>
            )}

            <div className="flex space-x-3">
              <button
                onClick={this.handleRetry}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={this.handleReset}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
              >
                Reload Page
              </button>
            </div>

            <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center">
              <p>If the problem persists, please check your:</p>
              <ul className="mt-1 space-y-1">
                <li>• Internet connection</li>
                <li>• Browser permissions for camera/microphone</li>
                <li>• Browser compatibility (Chrome, Firefox, Safari, Edge)</li>
              </ul>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default CallErrorBoundary;
