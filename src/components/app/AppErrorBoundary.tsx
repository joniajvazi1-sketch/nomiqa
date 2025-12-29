import React from "react";
import { Button } from "@/components/ui/button";

type Props = {
  children: React.ReactNode;
  title?: string;
  description?: string;
};

type State = {
  hasError: boolean;
};

/**
 * Minimal error boundary so /app pages never fail silently (security-safe UI).
 */
export class AppErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: unknown) {
    // Log for debugging; avoid rendering sensitive details in UI.
    console.error("[AppErrorBoundary]", error, info);
  }

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[70vh] w-full flex items-center justify-center px-6">
          <div className="max-w-md w-full rounded-xl border border-border bg-card p-6 text-center">
            <h2 className="text-lg font-semibold text-foreground">
              {this.props.title ?? "Something went wrong"}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {this.props.description ??
                "This screen failed to load. Please refresh and try again."}
            </p>
            <div className="mt-4 flex items-center justify-center gap-2">
              <Button onClick={this.handleReload}>Reload</Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
