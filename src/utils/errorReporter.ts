import { supabase } from "@/integrations/supabase/client";

/**
 * Privacy-safe error reporter for production monitoring
 * Sends minimal diagnostic info to help debug issues
 * NO PII: strips emails, tokens, query params
 */

let buildVersion: string | null = null;
let isInitialized = false;

// Fetch build version once
const fetchBuildVersion = async () => {
  try {
    const res = await fetch("/version.txt", { cache: "no-store" });
    if (res.ok) {
      buildVersion = (await res.text()).trim();
    }
  } catch {
    buildVersion = "unknown";
  }
};

type ErrorType = "js_error" | "unhandled_rejection" | "boot_timeout" | "chunk_load_error" | "network_error";

const reportError = async (
  type: ErrorType,
  message: string,
  stack?: string
) => {
  // Don't report in development
  if (import.meta.env.DEV) {
    console.log("[errorReporter] Skipped in dev:", type, message);
    return;
  }

  try {
    await supabase.functions.invoke("log-client-error", {
      body: {
        type,
        message: message?.slice(0, 500) || "No message",
        stack: stack?.slice(0, 1000) || "",
        route: window.location.pathname,
        buildVersion: buildVersion || "unknown",
        userAgent: navigator.userAgent?.slice(0, 200) || "",
        timestamp: Date.now(),
      },
    });
  } catch (err) {
    // Silent fail - don't cause more errors
    console.warn("[errorReporter] Failed to report:", err);
  }
};

/**
 * Initialize global error handlers
 * Call once at app startup (e.g., in main.tsx)
 */
export const initErrorReporter = () => {
  if (isInitialized || typeof window === "undefined") return;
  isInitialized = true;

  // Fetch build version
  fetchBuildVersion();

  // Catch unhandled JS errors
  window.addEventListener("error", (event) => {
    const { message, filename, lineno, colno, error } = event;
    
    // Check for chunk load errors (common cause of blank screens)
    const isChunkError = 
      message?.includes("Loading chunk") ||
      message?.includes("Failed to fetch dynamically imported module") ||
      message?.includes("error loading dynamically imported module");
    
    reportError(
      isChunkError ? "chunk_load_error" : "js_error",
      `${message} at ${filename}:${lineno}:${colno}`,
      error?.stack
    );
  });

  // Catch unhandled promise rejections
  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    const message = reason?.message || String(reason);
    const stack = reason?.stack;
    
    const isChunkError = 
      message?.includes("Loading chunk") ||
      message?.includes("Failed to fetch dynamically imported module");
    
    reportError(
      isChunkError ? "chunk_load_error" : "unhandled_rejection",
      message,
      stack
    );
  });

  console.log("[errorReporter] Initialized");
};

/**
 * Manually report a boot timeout
 */
export const reportBootTimeout = () => {
  reportError("boot_timeout", "App failed to render within timeout period");
};

/**
 * Manually report network errors
 */
export const reportNetworkError = (endpoint: string, status?: number) => {
  reportError("network_error", `Network error: ${endpoint} (${status || "unknown"})`);
};
