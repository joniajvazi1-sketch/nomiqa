import React from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { useHaptics } from '@/hooks/useHaptics';

interface HapticButtonProps extends ButtonProps {
  hapticStyle?: 'light' | 'medium' | 'heavy';
}

/**
 * Button with built-in haptic feedback for native app
 * Wraps the standard Button component with automatic haptic on press
 */
export const HapticButton: React.FC<HapticButtonProps> = ({
  onClick,
  hapticStyle = 'light',
  children,
  ...props
}) => {
  const { lightTap, mediumTap, heavyTap } = useHaptics();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Trigger haptic feedback
    switch (hapticStyle) {
      case 'heavy':
        heavyTap();
        break;
      case 'medium':
        mediumTap();
        break;
      default:
        lightTap();
    }
    
    // Call original onClick handler
    onClick?.(e);
  };

  return (
    <Button onClick={handleClick} {...props}>
      {children}
    </Button>
  );
};
