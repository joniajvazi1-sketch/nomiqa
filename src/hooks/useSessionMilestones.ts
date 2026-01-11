import { useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { useEnhancedHaptics } from './useEnhancedHaptics';
import { useEnhancedSounds } from './useEnhancedSounds';

interface MilestoneConfig {
  points: number[];
  time: number[]; // in minutes
  distance: number[]; // in meters
}

const DEFAULT_MILESTONES: MilestoneConfig = {
  points: [5, 10, 25, 50, 100, 250, 500],
  time: [5, 10, 15, 30, 60],
  distance: [500, 1000, 2500, 5000, 10000],
};

export const useSessionMilestones = () => {
  const reachedMilestones = useRef<Set<string>>(new Set());
  const { pointsEarnedPattern, successPattern } = useEnhancedHaptics();
  const { playCelebration, playCoin } = useEnhancedSounds();

  const resetMilestones = useCallback(() => {
    reachedMilestones.current = new Set();
  }, []);

  const checkPointsMilestone = useCallback((currentPoints: number) => {
    for (const milestone of DEFAULT_MILESTONES.points) {
      const key = `points_${milestone}`;
      if (currentPoints >= milestone && !reachedMilestones.current.has(key)) {
        reachedMilestones.current.add(key);
        pointsEarnedPattern();
        playCoin();
        
        toast.success(`🎉 ${milestone} points earned!`, {
          description: 'Keep scanning to earn more!',
          duration: 3000,
        });
        return true;
      }
    }
    return false;
  }, [pointsEarnedPattern, playCoin]);

  const checkTimeMilestone = useCallback((elapsedMinutes: number) => {
    for (const milestone of DEFAULT_MILESTONES.time) {
      const key = `time_${milestone}`;
      if (elapsedMinutes >= milestone && !reachedMilestones.current.has(key)) {
        reachedMilestones.current.add(key);
        successPattern();
        
        const message = milestone >= 60 
          ? `${milestone / 60} hour${milestone >= 120 ? 's' : ''} of scanning!`
          : `${milestone} minutes of scanning!`;
        
        toast.success(`⏱️ ${message}`, {
          description: 'Great dedication! Keep it up!',
          duration: 3000,
        });
        return true;
      }
    }
    return false;
  }, [successPattern]);

  const checkDistanceMilestone = useCallback((distanceMeters: number) => {
    for (const milestone of DEFAULT_MILESTONES.distance) {
      const key = `distance_${milestone}`;
      if (distanceMeters >= milestone && !reachedMilestones.current.has(key)) {
        reachedMilestones.current.add(key);
        successPattern();
        playCelebration();
        
        const distanceLabel = milestone >= 1000 
          ? `${(milestone / 1000).toFixed(1)}km`
          : `${milestone}m`;
        
        toast.success(`📍 ${distanceLabel} covered!`, {
          description: 'Amazing exploration! Keep moving!',
          duration: 3000,
        });
        return true;
      }
    }
    return false;
  }, [successPattern, playCelebration]);

  const checkAllMilestones = useCallback((
    points: number,
    elapsedMinutes: number,
    distanceMeters: number
  ) => {
    checkPointsMilestone(points);
    checkTimeMilestone(elapsedMinutes);
    checkDistanceMilestone(distanceMeters);
  }, [checkPointsMilestone, checkTimeMilestone, checkDistanceMilestone]);

  return {
    checkPointsMilestone,
    checkTimeMilestone,
    checkDistanceMilestone,
    checkAllMilestones,
    resetMilestones,
  };
};
