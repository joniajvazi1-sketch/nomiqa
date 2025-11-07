import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // New Nomiqa Brand Identity
        midnight: "hsl(var(--midnight))",
        "midnight-foreground": "hsl(var(--midnight-foreground))",
        cyan: "hsl(var(--cyan))",
        "cyan-foreground": "hsl(var(--cyan-foreground))",
        sand: "hsl(var(--sand))",
        "sand-foreground": "hsl(var(--sand-foreground))",
        // Legacy Nomiqa colors
        nomiqa: {
          orange: "hsl(var(--nomiqa-orange))",
          teal: "hsl(var(--nomiqa-teal))",
          green: "hsl(var(--nomiqa-green))",
          cream: "hsl(var(--nomiqa-cream))",
          peach: "hsl(var(--nomiqa-peach))",
          blue: "hsl(var(--nomiqa-blue))",
          dark: "hsl(var(--nomiqa-dark))",
        },
      },
      backgroundImage: {
        'gradient-primary': 'var(--gradient-primary)',
        'gradient-hero': 'var(--gradient-hero)',
        'gradient-warm': 'var(--gradient-warm)',
        'gradient-card': 'var(--gradient-card)',
        'gradient-teal': 'var(--gradient-teal)',
        'gradient-green': 'var(--gradient-green)',
        'gradient-explorer': 'var(--gradient-explorer)',
        'gradient-horizon': 'var(--gradient-horizon)',
        'gradient-signal': 'var(--gradient-signal)',
      },
      boxShadow: {
        'glow-orange': 'var(--glow-orange)',
        'glow-teal': 'var(--glow-teal)',
        'shadow-warm': 'var(--shadow-warm)',
        'shadow-signal': 'var(--shadow-signal)',
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(30px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          "0%": { transform: "scale(0.9)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "bounce-in": {
          "0%": { transform: "scale(0.3)", opacity: "0" },
          "50%": { transform: "scale(1.05)" },
          "70%": { transform: "scale(0.9)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-1000px 0" },
          "100%": { backgroundPosition: "1000px 0" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "confetti": {
          "0%": { transform: "translateY(0) rotateZ(0deg)", opacity: "1" },
          "100%": { transform: "translateY(100vh) rotateZ(720deg)", opacity: "0" },
        },
        "wave-up": {
          "0%": { transform: "translateY(0) scale(0.5)", opacity: "0" },
          "50%": { opacity: "1" },
          "100%": { transform: "translateY(-150vh) scale(1)", opacity: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.6s ease-out",
        "fade-in-up": "fade-in-up 0.8s ease-out",
        "scale-in": "scale-in 0.4s ease-out",
        "bounce-in": "bounce-in 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)",
        "shimmer": "shimmer 3s linear infinite",
        "float": "float 3s ease-in-out infinite",
        "confetti": "confetti 2s ease-out forwards",
        "wave-up": "wave-up 4s ease-out forwards",
        "bounce-slow": "float 2s ease-in-out infinite",
        "pulse": "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
