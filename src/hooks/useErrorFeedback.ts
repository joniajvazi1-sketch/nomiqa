import { useCallback, useRef } from 'react';
import { useHaptics } from './useHaptics';

/**
 * Hook for providing error feedback animations
 * 
 * Provides visual (shake + red highlight) and haptic feedback
 * to immediately cue the user to issues like permission errors,
 * validation failures, etc.
 */

interface ErrorFeedbackOptions {
  /** Duration of shake animation in ms (default: 400) */
  shakeDuration?: number;
  /** Duration of red highlight in ms (default: 800) */
  highlightDuration?: number;
  /** Enable haptic feedback (default: true) */
  haptics?: boolean;
}

export const useErrorFeedback = () => {
  const { error: errorHaptic } = useHaptics();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * Trigger error feedback on an element
   * Adds shake animation + red glow, auto-removes after duration
   */
  const triggerError = useCallback((
    element: HTMLElement | null,
    options: ErrorFeedbackOptions = {}
  ) => {
    if (!element) return;

    const {
      shakeDuration = 400,
      highlightDuration = 800,
      haptics = true,
    } = options;

    // Haptic feedback
    if (haptics) {
      errorHaptic();
    }

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Add error classes
    element.classList.add('animate-error-shake', 'error-highlight');

    // Remove shake class after animation
    setTimeout(() => {
      element.classList.remove('animate-error-shake');
    }, shakeDuration);

    // Remove highlight after longer duration
    timeoutRef.current = setTimeout(() => {
      element.classList.remove('error-highlight');
    }, highlightDuration);
  }, [errorHaptic]);

  /**
   * Trigger error feedback using a ref
   */
  const triggerErrorRef = useCallback(<T extends HTMLElement>(
    ref: React.RefObject<T>,
    options?: ErrorFeedbackOptions
  ) => {
    triggerError(ref.current, options);
  }, [triggerError]);

  return {
    triggerError,
    triggerErrorRef,
  };
};
