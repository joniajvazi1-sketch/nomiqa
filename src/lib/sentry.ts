import * as Sentry from "@sentry/react";
import { Capacitor } from "@capacitor/core";

/**
 * Initialize Sentry error monitoring for web + Capacitor native
 * 
 * Features:
 * - React errors via ErrorBoundary integration
 * - console.error as breadcrumbs
 * - Release version tags (app_version)
 * - Source maps for readable stack traces
 * - Non-blocking initialization (won't crash app if Sentry fails)
 */
export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  
  // Don't block app startup if no DSN configured
  if (!dsn) {
    console.warn('[Sentry] No DSN configured - error monitoring disabled');
    return;
  }

  try {
    const isNative = Capacitor.isNativePlatform();
    const platform = Capacitor.getPlatform();
    
    Sentry.init({
      dsn,
      environment: import.meta.env.MODE || 'production',
      release: `nomiqa@1.0.0`, // TODO: Get from app config
      
      // Integrations
      integrations: [
        // Capture React component errors
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration(),
      ],
      
      // Performance monitoring
      tracesSampleRate: 0.1, // Capture 10% of transactions
      
      // Session replay - capture 10% of all sessions, and 100% of sessions with errors
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
      
      // Configure scope with platform info
      initialScope: {
        tags: {
          platform: isNative ? platform : 'web',
          app_version: '1.0.0',
          is_native: String(isNative),
        },
      },
      
      // Don't send errors in development
      enabled: import.meta.env.PROD,
      
      // Ignore common non-actionable errors
      ignoreErrors: [
        // Browser extensions
        'ResizeObserver loop limit exceeded',
        'ResizeObserver loop completed with undelivered notifications',
        // Network errors (handled by retry logic)
        'NetworkError',
        'Failed to fetch',
        'Load failed',
        // User-initiated
        'AbortError',
        // Safari quirks
        'cancelled',
        // Capacitor-specific (handled internally)
        'capacitor://localhost',
      ],
      
      // Before sending, add extra context
      beforeSend(event, hint) {
        // Add connection info if available
        if (typeof navigator !== 'undefined' && 'connection' in navigator) {
          const conn = (navigator as any).connection;
          event.contexts = {
            ...event.contexts,
            network: {
              type: conn?.type || 'unknown',
              effective_type: conn?.effectiveType || 'unknown',
              downlink: conn?.downlink,
            },
          };
        }
        
        // Add viewport info
        event.contexts = {
          ...event.contexts,
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight,
          },
        };
        
        return event;
      },
    });
    
    console.log(`[Sentry] Initialized for ${isNative ? platform : 'web'}`);
  } catch (error) {
    // Non-blocking - don't crash app if Sentry fails to initialize
    console.error('[Sentry] Failed to initialize:', error);
  }
}

/**
 * Capture a custom error with context
 */
export function captureError(error: Error, context?: Record<string, any>) {
  Sentry.captureException(error, {
    extra: context,
  });
}

/**
 * Capture a message for logging
 */
export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info') {
  Sentry.captureMessage(message, level);
}

/**
 * Set user context for error tracking
 */
export function setUser(userId: string | null, email?: string) {
  if (userId) {
    Sentry.setUser({ id: userId, email });
  } else {
    Sentry.setUser(null);
  }
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(message: string, category: string, data?: Record<string, any>) {
  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level: 'info',
  });
}

// Re-export ErrorBoundary for wrapping components
export { ErrorBoundary } from "@sentry/react";
