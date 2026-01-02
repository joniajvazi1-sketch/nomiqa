/**
 * Centralized Animation Configuration
 * 
 * This file defines consistent animation timings, easings, and utilities
 * to ensure a cohesive, performant animation experience across the app.
 * 
 * Best Practices Applied:
 * - Unified timing and easing curves
 * - 60fps target (durations optimized)
 * - Purposeful animations that reinforce brand
 * - Accessibility: respects prefers-reduced-motion
 */

// ============================================
// TIMING CONSTANTS (in milliseconds)
// ============================================

export const ANIMATION_DURATION = {
  /** Ultra-fast feedback (tap response) */
  instant: 100,
  /** Quick micro-interactions */
  fast: 150,
  /** Standard transitions */
  normal: 250,
  /** Smooth entrances/exits */
  medium: 350,
  /** Complex transitions */
  slow: 500,
  /** Celebratory/dramatic effects */
  celebration: 600,
} as const;

// ============================================
// EASING CURVES (consistent across app)
// ============================================

export const EASING = {
  /** Standard ease-out for most animations */
  default: 'cubic-bezier(0.4, 0, 0.2, 1)',
  /** Sharp deceleration for entrances */
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  /** Smooth acceleration for exits */
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  /** Natural spring-like bounce */
  bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  /** Snappy overshoot for emphasis */
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  /** Linear for continuous animations */
  linear: 'linear',
} as const;

// ============================================
// STAGGER DELAYS
// ============================================

export const STAGGER_DELAY = {
  /** Fast list items */
  fast: 50,
  /** Normal list items */
  normal: 75,
  /** Slower, more dramatic reveals */
  slow: 100,
} as const;

// ============================================
// HELPER: Check for reduced motion preference
// ============================================

export const prefersReducedMotion = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

// ============================================
// HELPER: Get animation duration respecting user preference
// ============================================

export const getAnimationDuration = (duration: number): number => {
  return prefersReducedMotion() ? 0 : duration;
};

// ============================================
// HELPER: Calculate staggered delay
// ============================================

export const getStaggerDelay = (index: number, baseDelay: number = STAGGER_DELAY.normal): number => {
  if (prefersReducedMotion()) return 0;
  return index * baseDelay;
};

// ============================================
// CSS-IN-JS ANIMATION PRESETS
// ============================================

export const animationPresets = {
  fadeIn: {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: ANIMATION_DURATION.normal / 1000, ease: [0.4, 0, 0.2, 1] },
  },
  scaleIn: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: ANIMATION_DURATION.fast / 1000, ease: [0, 0, 0.2, 1] },
  },
  bounceIn: {
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: ANIMATION_DURATION.celebration / 1000, ease: [0.68, -0.55, 0.265, 1.55] },
  },
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: ANIMATION_DURATION.medium / 1000, ease: [0, 0, 0.2, 1] },
  },
} as const;

// ============================================
// TAILWIND CLASS GENERATORS
// ============================================

/**
 * Generate staggered animation delay class
 * Usage: getStaggerClass(index) → "animation-delay: 75ms"
 */
export const getStaggerStyle = (index: number, baseDelay: number = STAGGER_DELAY.normal) => ({
  animationDelay: prefersReducedMotion() ? '0ms' : `${index * baseDelay}ms`,
});

/**
 * Combine animation classes with opacity for stagger effect
 */
export const getStaggeredEntryClasses = (baseClass: string = 'animate-stagger-in') => {
  if (prefersReducedMotion()) return '';
  return `${baseClass} opacity-0`;
};
