import React, { Component, ErrorInfo, ReactNode } from "react";
import { Link } from "react-router-dom";
import { AlertCircle } from "lucide-react";

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      return (
        <div className="min-h-screen bg-black pt-32 pb-24 flex items-center justify-center">
          <div className="max-w-md w-full bg-white/5 border border-white/10 p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-6" />
            <h2 className="text-xl font-display uppercase tracking-widest text-white mb-2">Something went wrong</h2>
            <p className="text-sm text-brand-metallic mb-6">
              {this.state.error?.message || "An unexpected error occurred while loading this page."}
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 text-[10px] font-bold uppercase tracking-widest transition-colors"
              >
                Try Again
              </button>
              <Link
                to="/shop"
                className="bg-brand-accent hover:bg-brand-accent/90 text-white px-6 py-3 text-[10px] font-bold uppercase tracking-widest transition-colors"
                onClick={() => this.setState({ hasError: false, error: null })}
              >
                Return to Shop
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
