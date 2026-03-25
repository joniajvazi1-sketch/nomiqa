import { useEffect } from 'react';

/**
 * PointsSyncBridge — always-mounted listener that persists points-updated
 * events to sessionStorage so AppHome can read them on mount even if it
 * was unmounted when the event fired.
 */
export const PointsSyncBridge = () => {
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent)?.detail;
      if (!detail) return;

      try {
        const pending = JSON.parse(sessionStorage.getItem('pendingPointsSync') || 'null');

        if (detail.newTotal != null) {
          // Absolute total — always overwrite
          sessionStorage.setItem('pendingPointsSync', JSON.stringify({
            type: 'absolute',
            total: detail.newTotal,
            ts: Date.now(),
          }));
        } else if (detail.pointsAdded != null && detail.pointsAdded > 0) {
          // Delta — accumulate on top of any existing pending delta
          const prevDelta = pending?.type === 'delta' ? pending.delta : 0;
          sessionStorage.setItem('pendingPointsSync', JSON.stringify({
            type: 'delta',
            delta: prevDelta + detail.pointsAdded,
            ts: Date.now(),
          }));
        }
      } catch {
        // sessionStorage may be unavailable in rare cases — silently ignore
      }
    };

    window.addEventListener('points-updated', handler);
    return () => window.removeEventListener('points-updated', handler);
  }, []);

  return null;
};
