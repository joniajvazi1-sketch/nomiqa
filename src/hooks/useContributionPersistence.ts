import { useState, useCallback, useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';

const CONTRIBUTION_STATE_KEY = 'nomiqa_contribution_state';
const SESSION_STATE_KEY = 'nomiqa_contribution_session';

interface PersistedContributionState {
  enabled: boolean;
  enabledAt: number | null;
  pausedAt: number | null;
  cumulativePoints: number;
  cumulativeDistanceMeters: number;
  cumulativeDurationSeconds: number;
}

interface PersistedSessionState {
  sessionId: string | null;
  startedAt: number | null;
  lastEventAt: number | null;
}

const DEFAULT_STATE: PersistedContributionState = {
  enabled: false,
  enabledAt: null,
  pausedAt: null,
  cumulativePoints: 0,
  cumulativeDistanceMeters: 0,
  cumulativeDurationSeconds: 0
};

const DEFAULT_SESSION: PersistedSessionState = {
  sessionId: null,
  startedAt: null,
  lastEventAt: null
};

/**
 * Hook for persisting contribution state across app lifecycle
 * 
 * iOS Background Behavior:
 * - "Enable Contribution" persists the intent to contribute
 * - Actual data collection happens when iOS allows (location updates, app resume)
 * - Points are accumulated and synced when app is active
 * 
 * This follows Apple guidelines by not trying to force background execution,
 * but instead using event-based triggers that iOS permits.
 */
export const useContributionPersistence = () => {
  const isNative = Capacitor.isNativePlatform();
  const appListenerRef = useRef<{ remove: () => void } | null>(null);
  
  const [state, setState] = useState<PersistedContributionState>(() => {
    try {
      const stored = localStorage.getItem(CONTRIBUTION_STATE_KEY);
      return stored ? JSON.parse(stored) : DEFAULT_STATE;
    } catch {
      return DEFAULT_STATE;
    }
  });
  
  const [sessionState, setSessionState] = useState<PersistedSessionState>(() => {
    try {
      const stored = localStorage.getItem(SESSION_STATE_KEY);
      return stored ? JSON.parse(stored) : DEFAULT_SESSION;
    } catch {
      return DEFAULT_SESSION;
    }
  });
  
  const [resumeTrigger, setResumeTrigger] = useState(0);

  // Persist state to localStorage
  const persistState = useCallback((newState: PersistedContributionState) => {
    try {
      localStorage.setItem(CONTRIBUTION_STATE_KEY, JSON.stringify(newState));
      setState(newState);
    } catch (error) {
      console.error('Failed to persist contribution state:', error);
    }
  }, []);
  
  const persistSessionState = useCallback((newSession: PersistedSessionState) => {
    try {
      localStorage.setItem(SESSION_STATE_KEY, JSON.stringify(newSession));
      setSessionState(newSession);
    } catch (error) {
      console.error('Failed to persist session state:', error);
    }
  }, []);

  // Enable contribution mode
  const enableContribution = useCallback((sessionId: string) => {
    const now = Date.now();
    persistState({
      ...state,
      enabled: true,
      enabledAt: now,
      pausedAt: null
    });
    persistSessionState({
      sessionId,
      startedAt: now,
      lastEventAt: now
    });
    console.log('[ContributionPersistence] Contribution enabled, session:', sessionId);
  }, [state, persistState, persistSessionState]);

  // Disable contribution mode
  const disableContribution = useCallback(() => {
    persistState({
      ...state,
      enabled: false,
      pausedAt: Date.now()
    });
    persistSessionState({
      sessionId: null,
      startedAt: null,
      lastEventAt: null
    });
    console.log('[ContributionPersistence] Contribution disabled');
  }, [state, persistState, persistSessionState]);

  // Record cumulative stats (for sync when app resumes)
  const recordCumulativeStats = useCallback((points: number, distanceMeters: number, durationSeconds: number) => {
    persistState({
      ...state,
      cumulativePoints: state.cumulativePoints + points,
      cumulativeDistanceMeters: state.cumulativeDistanceMeters + distanceMeters,
      cumulativeDurationSeconds: state.cumulativeDurationSeconds + durationSeconds
    });
    persistSessionState({
      ...sessionState,
      lastEventAt: Date.now()
    });
  }, [state, sessionState, persistState, persistSessionState]);

  // Clear cumulative stats after sync
  const clearCumulativeStats = useCallback(() => {
    persistState({
      ...state,
      cumulativePoints: 0,
      cumulativeDistanceMeters: 0,
      cumulativeDurationSeconds: 0
    });
  }, [state, persistState]);

  // Get time since last event (for calculating offline duration)
  const getTimeSinceLastEvent = useCallback((): number => {
    if (!sessionState.lastEventAt) return 0;
    return Math.floor((Date.now() - sessionState.lastEventAt) / 1000);
  }, [sessionState.lastEventAt]);

  // Listen for app resume events (Capacitor)
  useEffect(() => {
    if (!isNative) return;

    const setupAppListener = async () => {
      try {
        const { App } = await import('@capacitor/app');
        
        const listener = await App.addListener('appStateChange', ({ isActive }) => {
          if (isActive && state.enabled) {
            console.log('[ContributionPersistence] App resumed with contribution enabled');
            // Trigger a resume event that components can listen to
            setResumeTrigger(prev => prev + 1);
          }
        });
        
        appListenerRef.current = listener;
      } catch (error) {
        console.error('Failed to setup app state listener:', error);
      }
    };
    
    setupAppListener();
    
    return () => {
      appListenerRef.current?.remove();
    };
  }, [isNative, state.enabled]);

  // Also listen for page visibility changes (web + PWA)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && state.enabled) {
        console.log('[ContributionPersistence] Page became visible with contribution enabled');
        setResumeTrigger(prev => prev + 1);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [state.enabled]);

  return {
    // State
    isContributionEnabled: state.enabled,
    enabledAt: state.enabledAt,
    pausedAt: state.pausedAt,
    sessionId: sessionState.sessionId,
    sessionStartedAt: sessionState.startedAt,
    lastEventAt: sessionState.lastEventAt,
    cumulativePoints: state.cumulativePoints,
    cumulativeDistanceMeters: state.cumulativeDistanceMeters,
    cumulativeDurationSeconds: state.cumulativeDurationSeconds,
    
    // Actions
    enableContribution,
    disableContribution,
    recordCumulativeStats,
    clearCumulativeStats,
    getTimeSinceLastEvent,
    
    // Resume trigger (increment when app resumes)
    resumeTrigger
  };
};

export type { PersistedContributionState, PersistedSessionState };
