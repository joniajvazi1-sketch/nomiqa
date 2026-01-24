import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import { ThemeProvider } from "next-themes";
import App from "./App.tsx";
import "./index.css";

// Import ErrorBoundary synchronously (lightweight), but defer Sentry init
import { ErrorBoundary } from "@/lib/sentry";

// Render app immediately - don't block on Sentry
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary fallback={<div className="flex items-center justify-center min-h-screen bg-background text-foreground">Something went wrong. Please refresh the page.</div>}>
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
