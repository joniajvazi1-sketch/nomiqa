import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import { ThemeProvider } from "next-themes";
import App from "./App.tsx";
import "./index.css";

// Initialize Sentry error monitoring before app renders
import { initSentry, ErrorBoundary } from "@/lib/sentry";
initSentry();

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
