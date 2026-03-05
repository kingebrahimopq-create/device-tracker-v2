import { cn } from "@/lib/utils";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen p-8 bg-background">
          <div className="flex flex-col items-center w-full max-w-2xl p-8">
            <AlertTriangle
              size={48}
              className="text-destructive mb-6 flex-shrink-0"
            />

            <h2 className="text-xl mb-4">An unexpected error occurred.</h2>

            <div className="p-4 w-full rounded bg-muted overflow-auto mb-6">
              <div className="text-sm text-muted-foreground mb-3">
                <strong>Error:</strong> {this.state.error?.message}
              </div>
              <details className="cursor-pointer">
                <summary className="text-xs text-muted-foreground hover:text-foreground mb-2">
                  Show Details
                </summary>
                <pre className="text-xs text-muted-foreground whitespace-break-spaces mt-2">
                  {this.state.error?.stack}
                </pre>
              </details>
            </div>

            <div className="p-4 w-full rounded bg-yellow-50 border border-yellow-200 mb-6">
              <p className="text-sm text-yellow-800">
                <strong>Configuration Issue:</strong> Please ensure all required environment variables are set in your Railway project settings:
              </p>
              <ul className="text-xs text-yellow-700 mt-2 ml-4 list-disc">
                <li>VITE_APP_ID</li>
                <li>VITE_OAUTH_PORTAL_URL</li>
                <li>DATABASE_URL</li>
              </ul>
            </div>

            <button
              onClick={() => window.location.reload()}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg",
                "bg-primary text-primary-foreground",
                "hover:opacity-90 cursor-pointer"
              )}
            >
              <RotateCcw size={16} />
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
