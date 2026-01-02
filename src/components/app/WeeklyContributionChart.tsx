import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface DayData {
  day: string;
  value: number;
}

interface WeeklyContributionChartProps {
  data: DayData[];
  maxValue?: number;
  className?: string;
  animated?: boolean;
}

/**
 * Animated bar chart showing weekly contribution data
 * Bars animate from zero to their actual values on mount
 */
export const WeeklyContributionChart: React.FC<WeeklyContributionChartProps> = ({
  data,
  maxValue,
  className,
  animated = true
}) => {
  const [animatedValues, setAnimatedValues] = useState<number[]>(
    animated ? data.map(() => 0) : data.map(d => d.value)
  );
  const [isVisible, setIsVisible] = useState(false);

  const max = maxValue || Math.max(...data.map(d => d.value), 1);

  useEffect(() => {
    if (!animated) return;
    
    // Trigger animation after a short delay for entrance
    const showTimer = setTimeout(() => setIsVisible(true), 100);
    
    return () => clearTimeout(showTimer);
  }, [animated]);

  useEffect(() => {
    if (!isVisible || !animated) return;

    // Stagger the bar animations
    data.forEach((d, index) => {
      const delay = index * 100;
      setTimeout(() => {
        setAnimatedValues(prev => {
          const newValues = [...prev];
          newValues[index] = d.value;
          return newValues;
        });
      }, delay);
    });
  }, [isVisible, data, animated]);

  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-end justify-between gap-2 h-24">
        {data.map((day, index) => {
          const height = max > 0 ? (animatedValues[index] / max) * 100 : 0;
          const isToday = index === data.length - 1;
          
          return (
            <div key={day.day} className="flex-1 flex flex-col items-center gap-1">
              <div className="relative w-full h-20 flex items-end justify-center">
                {/* Bar */}
                <div
                  className={cn(
                    'w-full max-w-[24px] rounded-t-md transition-all duration-500 ease-out',
                    isToday 
                      ? 'bg-gradient-to-t from-primary to-primary/70 shadow-lg shadow-primary/30' 
                      : 'bg-primary/40'
                  )}
                  style={{ 
                    height: `${height}%`,
                    minHeight: animatedValues[index] > 0 ? '4px' : '0'
                  }}
                >
                  {/* Glow effect for today */}
                  {isToday && height > 0 && (
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-primary rounded-full animate-pulse" />
                  )}
                </div>
              </div>
              
              {/* Day label */}
              <span className={cn(
                'text-[10px] transition-colors duration-300',
                isToday ? 'text-primary font-medium' : 'text-muted-foreground'
              )}>
                {day.day}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
