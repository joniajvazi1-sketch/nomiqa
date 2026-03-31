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
 * - DEFERRED initialization after first paint for better LCP
 */

// App version - update this when releasing new versions
const APP_VERSION = '1.0.3';

/**
 * Get the environment based on build mode and URL
 */
function getEnvironment(): string {
  // Check for explicit environment variable first
  if (import.meta.env.VITE_SENTRY_ENVIRONMENT) {
    return import.meta.env.VITE_SENTRY_ENVIRONMENT;
  }
  
  // Development mode
  if (import.meta.env.DEV) {
    return 'development';
  }
  
  // Check URL patterns for staging/preview
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname.includes('preview') || hostname.includes('staging')) {
      return 'staging';
    }
    if (hostname.includes('localhost') || hostname === '127.0.0.1') {
      return 'development';
    }
  }
  
  return 'production';
}

/**
 * Core Sentry initialization - called after first paint
 */
function doInitSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  
  // Don't block app startup if no DSN configured
  if (!dsn) {
    console.warn('[Sentry] No DSN configured - error monitoring disabled');
    return;
  }

  try {
    const isNative = Capacitor.isNativePlatform();
    const platform = Capacitor.getPlatform();
    const environment = getEnvironment();
    
    // Release format: nomiqa@version+platform
    // e.g., nomiqa@1.0.1+android, nomiqa@1.0.1+web
    const release = `nomiqa@${APP_VERSION}+${isNative ? platform : 'web'}`;
    
    Sentry.init({
      dsn,
      environment,
      release,
      
      // Dist helps differentiate builds with same version
      dist: isNative ? platform : 'web',
      
      // Integrations - REMOVED replayIntegration to save ~50KB
      integrations: [
        Sentry.browserTracingIntegration(),
        // Replay removed for performance - adds ~50KB to bundle
      ],
      
      // Performance monitoring - more sampling in dev
      tracesSampleRate: environment === 'production' ? 0.1 : 0.5,
      
      // Configure scope with platform info
      initialScope: {
        tags: {
          platform: isNative ? platform : 'web',
          app_version: APP_VERSION,
          is_native: String(isNative),
          build_mode: import.meta.env.MODE,
        },
      },
      
      // Only enable in production builds (native apps or published web)
      enabled: import.meta.env.PROD,
      
      // Ignore common non-actionable errors
      ignoreErrors: [
        'ResizeObserver loop limit exceeded',
        'ResizeObserver loop completed with undelivered notifications',
        'NetworkError',
        'Failed to fetch',
        'Load failed',
        'AbortError',
        'cancelled',
        'capacitor://localhost',
      ],
      
      // Before sending, add extra context
      beforeSend(event) {
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
    
    console.log(`[Sentry] Initialized: env=${environment}, release=${release}, platform=${isNative ? platform : 'web'}`);
  } catch (error) {
    // Non-blocking - don't crash app if Sentry fails to initialize
    console.error('[Sentry] Failed to initialize:', error);
  }
}

/**
 * Initialize Sentry AFTER first paint for better LCP performance
 * Uses requestIdleCallback to defer initialization until browser is idle
 */
export function initSentry() {
  // Skip in development
  if (import.meta.env.DEV) {
    console.log('[Sentry] Skipping in development mode');
    return;
  }
  
  // Defer initialization using requestIdleCallback (with setTimeout fallback)
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => doInitSentry(), { timeout: 5000 });
  } else {
    // Fallback for Safari - defer by 2 seconds after load
    setTimeout(doInitSentry, 2000);
  }
}

/**
 * Get the current app version
 */
export function getAppVersion(): string {
  return APP_VERSION;
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
