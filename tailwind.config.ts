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
        // Neon Gradient Palette
        "neon-blue": "hsl(var(--neon-blue))",
        "neon-cyan": "hsl(var(--neon-cyan))",
        "neon-violet": "hsl(var(--neon-violet))",
        "neon-pink": "hsl(var(--neon-pink))",
        "neon-coral": "hsl(var(--neon-coral))",
        "neon-orange": "hsl(var(--neon-orange))",
        "neon-yellow": "hsl(var(--neon-yellow))",
        "deep-space": "hsl(var(--deep-space))",
        "midnight-blue": "hsl(var(--midnight-blue))",
        "warm-sand": "hsl(var(--warm-sand))",
        "soft-cream": "hsl(var(--soft-cream))",
        // Brand Identity
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
        'gradient-freedom': 'var(--gradient-freedom)',
        'gradient-sunrise': 'var(--gradient-sunrise)',
        'gradient-digital': 'var(--gradient-digital)',
        'gradient-warmth': 'var(--gradient-warmth)',
        'gradient-neon': 'var(--gradient-neon)',
        'gradient-sunset': 'var(--gradient-sunset)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'Poppins', 'system-ui', 'sans-serif'],
        quote: ['Cormorant Garamond', 'serif'],
      },
      boxShadow: {
        'glow-neon': 'var(--glow-neon)',
        'glow-cyan': 'var(--glow-cyan)',
        'glow-violet': 'var(--glow-violet)',
        'glow-coral': 'var(--glow-coral)',
        'glow-orange': 'var(--glow-orange)',
        'shadow-warm': 'var(--shadow-warm)',
        'shadow-signal': 'var(--shadow-signal)',
        'shadow-neon': 'var(--shadow-neon)',
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0", opacity: "0" },
          to: { height: "var(--radix-accordion-content-height)", opacity: "1" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)", opacity: "1" },
          to: { height: "0", opacity: "0" },
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
        "shimmer-soft": {
          "0%": { backgroundPosition: "-800px 0", opacity: "0.3" },
          "100%": { backgroundPosition: "800px 0", opacity: "0.3" },
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
        "page-enter": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "page-exit": {
          "0%": { opacity: "1", transform: "translateY(0)" },
          "100%": { opacity: "0", transform: "translateY(-8px)" },
        },
        "modal-bounce": {
          "0%": { opacity: "0", transform: "translate(-50%, -48%) scale(0.96)" },
          "60%": { opacity: "1", transform: "translate(-50%, -50%) scale(1.02)" },
          "100%": { opacity: "1", transform: "translate(-50%, -50%) scale(1)" },
        },
        "sheet-bounce": {
          "0%": { transform: "translateY(100%)" },
          "60%": { transform: "translateY(-3%)" },
          "100%": { transform: "translateY(0)" },
        },
        "spin-slow": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "0.4", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.05)" },
        },
        "ripple": {
          "0%": { width: "0", height: "0", opacity: "0.5" },
          "100%": { width: "500px", height: "500px", opacity: "0" },
        },
        "stagger-in": {
          "0%": { opacity: "0", transform: "translateY(16px) scale(0.95)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        "count-up": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "glow-pulse": {
          "0%, 100%": { boxShadow: "0 0 20px hsla(180, 100%, 70%, 0.3)" },
          "50%": { boxShadow: "0 0 40px hsla(180, 100%, 70%, 0.6)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.1s ease-out",
        "accordion-up": "accordion-up 0.1s ease-out",
        "fade-in": "fade-in 0.6s ease-out",
        "fade-in-up": "fade-in-up 0.8s ease-out",
        "scale-in": "scale-in 0.4s ease-out",
        "bounce-in": "bounce-in 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)",
        "shimmer": "shimmer 3s linear infinite",
        "shimmer-soft": "shimmer-soft 8s linear infinite",
        "float": "float 3s ease-in-out infinite",
        "confetti": "confetti 2s ease-out forwards",
        "wave-up": "wave-up 4s ease-out forwards",
        "bounce-slow": "float 2s ease-in-out infinite",
        "pulse": "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "page-enter": "page-enter 0.3s ease-out",
        "page-exit": "page-exit 0.2s ease-in",
        "modal-bounce": "modal-bounce 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
        "sheet-bounce": "sheet-bounce 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
        "spin-slow": "spin-slow 2s linear infinite",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "ripple": "ripple 0.6s ease-out forwards",
        "stagger-in": "stagger-in 0.5s ease-out forwards",
        "count-up": "count-up 0.4s ease-out forwards",
        "glow-pulse": "glow-pulse 2s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
