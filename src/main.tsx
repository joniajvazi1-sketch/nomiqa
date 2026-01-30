import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import { ThemeProvider } from "next-themes";
import App from "./App.tsx";
import "./index.css";

// Import ErrorBoundary synchronously (lightweight), but defer Sentry init
import { ErrorBoundary } from "@/lib/sentry";

// =============================================================================
// GLOBAL CRASH GUARDS - Catch unhandled errors before they kill the WebView
// =============================================================================
const setupGlobalErrorHandlers = () => {
  // Catch synchronous errors
  window.onerror = (message, source, lineno, colno, error) => {
    console.error('[GlobalError] Uncaught error:', {
      message,
      source,
      lineno,
      colno,
      error: error?.stack || error,
    });
    // Don't return true - let default behavior continue for debugging
    return false;
  };

  // Catch unhandled promise rejections (async errors)
  window.onunhandledrejection = (event: PromiseRejectionEvent) => {
    console.error('[GlobalError] Unhandled rejection:', {
      reason: event.reason,
      stack: event.reason?.stack,
    });
    // Prevent default crash behavior on iOS WebView
    event.preventDefault();
  };

  console.log('[CrashGuard] Global error handlers installed');
};

// Install crash guards immediately - before anything else
setupGlobalErrorHandlers();

// Render app immediately - don't block on Sentry
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary 
      fallback={
        <div 
          className="flex items-center justify-center min-h-screen bg-background text-foreground"
          style={{ 
            minHeight: '100vh', 
            backgroundColor: '#0a0a0a', 
            color: '#fafaf9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            textAlign: 'center',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          <div>
            <p style={{ marginBottom: '16px' }}>Something went wrong.</p>
            <button 
              onClick={() => window.location.reload()}
              style={{
                backgroundColor: '#00c8ff',
                color: '#0a0a0a',
                padding: '12px 24px',
                borderRadius: '8px',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Reload Page
            </button>
          </div>
        </div>
      }
    >
      <HelmetProvider>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <App />
        </ThemeProvider>
      </HelmetProvider>
    </ErrorBoundary>
  </StrictMode>
);

// Defer Sentry initialization until after first paint (non-blocking)
const initSentryDeferred = () => {
  import("@/lib/sentry").then(({ initSentry }) => {
    initSentry();
  });
};

// Use requestIdleCallback for maximum performance, fallback to setTimeout
if (typeof requestIdleCallback !== 'undefined') {
  requestIdleCallback(initSentryDeferred, { timeout: 3000 });
} else {
  setTimeout(initSentryDeferred, 100);
}
