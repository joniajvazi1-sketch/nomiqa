import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface OnboardingSlideProps {
  icon: React.ElementType;
  iconColor?: string;
  title: string;
  description: string;
  isActive: boolean;
  children?: React.ReactNode;
}

export const OnboardingSlide: React.FC<OnboardingSlideProps> = ({
  icon: Icon,
  iconColor = 'text-primary',
  title,
  description,
  isActive,
  children,
}) => {
  return (
    <div className="flex-[0_0_100%] min-w-0 flex flex-col items-center justify-center px-8">
      {/* Icon with subtle animation */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ 
          scale: isActive ? 1 : 0.8,
          opacity: isActive ? 1 : 0.5
        }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="mb-8"
      >
        <div className={cn(
          "w-20 h-20 rounded-2xl flex items-center justify-center",
          "bg-card border border-border relative overflow-hidden"
        )}>
          {/* Background glow */}
          <motion.div
            className={cn(
              "absolute inset-0 opacity-20",
              iconColor === 'text-primary' && "bg-primary",
              iconColor === 'text-success' && "bg-success",
              iconColor === 'text-accent' && "bg-accent",
            )}
            animate={isActive ? { 
              opacity: [0.1, 0.2, 0.1],
            } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <Icon className={cn("w-10 h-10 relative z-10", iconColor)} strokeWidth={1.5} />
        </div>
      </motion.div>

      {/* Text content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ 
          opacity: isActive ? 1 : 0.3,
          y: isActive ? 0 : 20
        }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="text-center max-w-[300px]"
      >
        <h2 className="text-2xl font-bold text-foreground mb-3 leading-tight">
          {title}
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
      </motion.div>

      {/* Optional additional content */}
      {children && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ 
            opacity: isActive ? 1 : 0,
            y: isActive ? 0 : 10
          }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="mt-6 w-full max-w-[300px]"
        >
          {children}
        </motion.div>
      )}
    </div>
  );
};

export default OnboardingSlide;
