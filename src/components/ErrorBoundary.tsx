import React, { Component, ReactNode, ErrorInfo } from 'react';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorCount: number;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    
    // Log to external service (e.g., Sentry) in production
    if (process.env.NODE_ENV === 'production') {
      // logErrorToService(error, errorInfo);
    }

    this.setState(prevState => ({
      error,
      errorInfo,
      errorCount: prevState.errorCount + 1,
    }));
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  navigateHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-destructive/5 to-destructive/10 p-4">
          <Card className="w-full max-w-md border-destructive/20">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-6 w-6 text-destructive" />
                <div>
                  <CardTitle>Sesuatu Berlaku Salah</CardTitle>
                  <CardDescription>
                    Aplikasi mengalami ralat yang tidak dijangka
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {process.env.NODE_ENV === 'development' && (
                <div className="rounded-lg bg-muted p-3 text-sm max-h-40 overflow-y-auto">
                  <details className="cursor-pointer">
                    <summary className="font-semibold mb-2">Maklumat Ralat (Dev Only)</summary>
                    <pre className="text-xs whitespace-pre-wrap break-words">
                      {this.state.error?.toString()}
                      {'\n\n'}
                      {this.state.errorInfo?.componentStack}
                    </pre>
                  </details>
                </div>
              )}

              <p className="text-sm text-muted-foreground">
                Sila cuba untuk menyegarkan halaman atau kembali ke halaman utama.
              </p>

              {this.state.errorCount > 3 && (
                <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
                  ⚠️ Ralat berulang ({this.state.errorCount}x) - Sila hubungi sokongan jika masalah berlanjutan.
                </p>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={this.resetError}
                  className="flex-1"
                  variant="default"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Segarkan
                </Button>
                <Button
                  onClick={this.navigateHome}
                  className="flex-1"
                  variant="outline"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Halaman Utama
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
