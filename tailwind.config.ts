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
        // Trustworthy Color Palette
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
        // Reward & Trust Colors
        "success": "hsl(var(--success))",
        "reward-gold": "hsl(var(--reward-gold))",
        "reward-bronze": "hsl(var(--reward-bronze))",
        "reward-silver": "hsl(var(--reward-silver))",
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
        'gradient-reward': 'var(--gradient-reward)',
        'gradient-trust': 'var(--gradient-trust)',
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
        'glow-gold': 'var(--glow-gold)',
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
          "0%, 100%": { boxShadow: "0 0 20px hsla(175, 70%, 48%, 0.3)" },
          "50%": { boxShadow: "0 0 40px hsla(175, 70%, 48%, 0.5)" },
        },
        "radar-sweep": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        "radar-blip": {
          "0%": { opacity: "0", transform: "scale(0)" },
          "20%": { opacity: "1", transform: "scale(1)" },
          "100%": { opacity: "0", transform: "scale(1.5)" },
        },
        "celebration-bounce": {
          "0%": { transform: "scale(0)", opacity: "0" },
          "50%": { transform: "scale(1.15)" },
          "70%": { transform: "scale(0.95)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "number-pop": {
          "0%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.15)", color: "hsl(var(--neon-cyan))" },
          "100%": { transform: "scale(1)" },
        },
        "signal-wave": {
          "0%": { transform: "scale(1)", opacity: "1" },
          "100%": { transform: "scale(2)", opacity: "0" },
        },
        "particle-burst": {
          "0%": { transform: "translate(-50%, -50%) rotate(var(--particle-angle)) translateX(0)", opacity: "1" },
          "100%": { transform: "translate(-50%, -50%) rotate(var(--particle-angle)) translateX(60px)", opacity: "0" },
        },
        "avatar-glow-pulse": {
          "0%, 100%": { transform: "scale(1)", opacity: "0.5" },
          "50%": { transform: "scale(1.3)", opacity: "0.8" },
        },
        "float-up": {
          "0%": { transform: "translateX(-50%) translateY(0)", opacity: "1" },
          "100%": { transform: "translateX(-50%) translateY(-20px)", opacity: "0" },
        },
        "tab-content-in": {
          "0%": { transform: "translateX(12px)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        "stat-pop": {
          "0%": { transform: "scale(0.8)", opacity: "0" },
          "70%": { transform: "scale(1.05)", opacity: "1" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        // Error feedback animations
        "error-shake": {
          "0%, 100%": { transform: "translateX(0)" },
          "10%, 30%, 50%, 70%, 90%": { transform: "translateX(-4px)" },
          "20%, 40%, 60%, 80%": { transform: "translateX(4px)" },
        },
        "error-pulse": {
          "0%": { boxShadow: "0 0 0 0 hsla(0, 75%, 55%, 0.7)" },
          "70%": { boxShadow: "0 0 0 10px hsla(0, 75%, 55%, 0)" },
          "100%": { boxShadow: "0 0 0 0 hsla(0, 75%, 55%, 0)" },
        },
        // Success feedback
        "success-pop": {
          "0%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.1)" },
          "100%": { transform: "scale(1)" },
        },
        // WiFi pulsing for paused state
        "wifi-pulse": {
          "0%, 100%": { opacity: "0.3", transform: "scale(1)" },
          "50%": { opacity: "0.7", transform: "scale(1.05)" },
        },
        // Sparkle effect for badges
        "sparkle": {
          "0%, 100%": { opacity: "0", transform: "scale(0) rotate(0deg)" },
          "50%": { opacity: "1", transform: "scale(1) rotate(180deg)" },
        },
        // Gentle pulse for CTAs
        "gentle-pulse": {
          "0%, 100%": { boxShadow: "0 10px 25px -5px hsla(175, 70%, 48%, 0.3)" },
          "50%": { boxShadow: "0 10px 35px -5px hsla(175, 70%, 48%, 0.5)" },
        },
        // Sonar ping for idle buttons
        "sonar-ping": {
          "0%": { transform: "scale(1)", opacity: "0.8" },
          "100%": { transform: "scale(1.5)", opacity: "0" },
        },
      },
      animation: {
        // UI feedback (instant: 100ms)
        "accordion-down": "accordion-down 0.1s ease-out",
        "accordion-up": "accordion-up 0.1s ease-out",
        // Quick micro-interactions (fast: 150ms)  
        "number-pop": "number-pop 0.15s ease-out",
        "success-pop": "success-pop 0.15s ease-out",
        // Standard transitions (normal: 250ms)
        "fade-in": "fade-in 0.25s cubic-bezier(0, 0, 0.2, 1)",
        "scale-in": "scale-in 0.25s cubic-bezier(0, 0, 0.2, 1)",
        "page-enter": "page-enter 0.25s cubic-bezier(0, 0, 0.2, 1)",
        "page-exit": "page-exit 0.2s cubic-bezier(0.4, 0, 1, 1)",
        "count-up": "count-up 0.25s cubic-bezier(0, 0, 0.2, 1) forwards",
        // Smooth entrances (medium: 350ms)
        "fade-in-up": "fade-in-up 0.35s cubic-bezier(0, 0, 0.2, 1)",
        "stagger-in": "stagger-in 0.35s cubic-bezier(0, 0, 0.2, 1) forwards",
        "tab-content-in": "tab-content-in 0.35s cubic-bezier(0, 0, 0.2, 1) forwards",
        "modal-bounce": "modal-bounce 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)",
        "sheet-bounce": "sheet-bounce 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)",
        // Complex/celebratory (slow: 500ms+)
        "bounce-in": "bounce-in 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)",
        "celebration-bounce": "celebration-bounce 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards",
        "stat-pop": "stat-pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
        // Continuous animations (optimized for 60fps)
        "shimmer": "shimmer 3s linear infinite",
        "shimmer-soft": "shimmer-soft 8s linear infinite",
        "float": "float 3s ease-in-out infinite",
        "pulse": "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "bounce-slow": "float 2s ease-in-out infinite",
        "spin-slow": "spin-slow 2s linear infinite",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "glow-pulse": "glow-pulse 2s ease-in-out infinite",
        "radar-sweep": "radar-sweep 2s linear infinite",
        "radar-blip": "radar-blip 2s ease-out infinite",
        "signal-wave": "signal-wave 1.5s ease-out infinite",
        // One-shot effects
        "confetti": "confetti 2s ease-out forwards",
        "wave-up": "wave-up 4s ease-out forwards",
        "ripple": "ripple 0.5s cubic-bezier(0, 0, 0.2, 1) forwards",
        "particle-burst": "particle-burst 1s ease-out forwards",
        "avatar-glow-pulse": "avatar-glow-pulse 0.5s ease-out",
        "float-up": "float-up 1s ease-out forwards",
        // Error/feedback animations
        "error-shake": "error-shake 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97)",
        "error-pulse": "error-pulse 0.6s ease-out",
        // New Phase 2 animations
        "wifi-pulse": "wifi-pulse 2s ease-in-out infinite",
        "sparkle": "sparkle 1.5s ease-in-out infinite",
        "gentle-pulse": "gentle-pulse 2s ease-in-out infinite",
        "sonar-ping": "sonar-ping 2s ease-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
