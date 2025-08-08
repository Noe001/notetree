import React, { Component, ErrorInfo, ReactNode } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: undefined,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
          <div className="text-center max-w-md">
            <h1 className="text-4xl font-bold text-destructive mb-4">エラーが発生しました</h1>
            <p className="text-muted-foreground mb-4">
              予期しないエラーが発生しました。ページを再読み込みするか、ホームに戻ってください。
            </p>
            {this.state.error && (
              <details className="bg-muted p-4 rounded-md mb-6 text-left">
                <summary className="cursor-pointer font-medium">エラーの詳細</summary>
                <pre className="mt-2 text-sm overflow-auto max-h-32">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
            <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
              <Button 
                onClick={this.handleReset}
                className="flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                再試行
              </Button>
              <Link href="/">
                <Button variant="secondary" className="flex items-center justify-center gap-2">
                  <Home className="w-4 h-4" />
                  ホームに戻る
                </Button>
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
