import React, { useState } from 'react';
import { User, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FallbackAvatarProps {
  src?: string | null;
  alt?: string;
  fallbackText?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Avatar with graceful fallback to initials
 */
export const FallbackAvatar: React.FC<FallbackAvatarProps> = ({
  src,
  alt = 'Avatar',
  fallbackText,
  size = 'md',
  className
}) => {
  const [hasError, setHasError] = useState(false);

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-base'
  };

  const getInitials = (text?: string) => {
    if (!text) return '';
    return text
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (!src || hasError) {
    const initials = getInitials(fallbackText);
    
    return (
      <div
        className={cn(
          'rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center font-semibold text-primary',
          sizeClasses[size],
          className
        )}
        role="img"
        aria-label={alt}
      >
        {initials || <User className="w-1/2 h-1/2 text-muted-foreground" />}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={cn('rounded-full object-cover', sizeClasses[size], className)}
      onError={() => setHasError(true)}
    />
  );
};

interface FallbackFlagProps {
  src?: string | null;
  alt?: string;
  countryCode?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Country flag with graceful fallback to globe icon
 */
export const FallbackFlag: React.FC<FallbackFlagProps> = ({
  src,
  alt = 'Flag',
  countryCode,
  size = 'md',
  className
}) => {
  const [hasError, setHasError] = useState(false);

  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  if (!src || hasError) {
    return (
      <div
        className={cn(
          'rounded flex items-center justify-center bg-muted/50',
          sizeClasses[size],
          className
        )}
        role="img"
        aria-label={alt}
      >
        <Globe className="w-3/4 h-3/4 text-muted-foreground" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={cn('rounded object-cover', sizeClasses[size], className)}
      onError={() => setHasError(true)}
    />
  );
};

interface FallbackImageProps {
  src?: string | null;
  alt?: string;
  fallback?: React.ReactNode;
  className?: string;
}

/**
 * Generic image with fallback support
 */
export const FallbackImage: React.FC<FallbackImageProps> = ({
  src,
  alt = 'Image',
  fallback,
  className
}) => {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-muted/30 text-muted-foreground',
          className
        )}
        role="img"
        aria-label={alt}
      >
        {fallback || <Globe className="w-1/3 h-1/3" />}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setHasError(true)}
    />
  );
};
