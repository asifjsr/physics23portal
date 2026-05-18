import React from "react";
import { AlertCircle, RefreshCw, Home } from "lucide-react";

interface Props {
  children?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State;
  props: Props;

  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
    this.props = props;
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6 text-center">
          <div className="max-w-md w-full space-y-6">
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto border border-red-500/20">
              <AlertCircle size={40} className="text-red-500" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-black text-white tracking-tight uppercase">Something went wrong</h1>
              <p className="text-gray-500 text-sm italic">
                {this.state.error?.message || "An unexpected error occurred while rendering this page."}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button 
                onClick={() => window.location.reload()}
                className="flex-1 btn-primary h-12 text-sm font-black uppercase tracking-widest flex items-center justify-center gap-2"
              >
                <RefreshCw size={18} />
                Reload Page
              </button>
              <button 
                onClick={() => window.location.href = '/'}
                className="flex-1 px-6 h-12 rounded-2xl bg-white/5 text-white/70 hover:bg-white/10 transition-all text-sm font-black uppercase tracking-widest border border-white/10 flex items-center justify-center gap-2"
              >
                <Home size={18} />
                Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
