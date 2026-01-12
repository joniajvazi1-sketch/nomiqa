/**
 * Human-readable time and metric formatters
 */

/**
 * Format a date to a human-readable relative time
 * Examples: "Just now", "2 hours ago", "Yesterday", "3 days ago"
 */
export const formatRelativeTime = (date: Date | string): string => {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  }
  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `${months} month${months > 1 ? 's' : ''} ago`;
  }
  
  const years = Math.floor(diffDays / 365);
  return `${years} year${years > 1 ? 's' : ''} ago`;
};

/**
 * Format distance with appropriate units
 */
export const formatDistance = (meters: number | null | undefined): string => {
  if (!meters || meters === 0) return '0 m';
  if (meters < 1000) return `${Math.round(meters)} m`;
  const km = meters / 1000;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
};

/**
 * Format points with appropriate suffix
 */
export const formatPoints = (points: number): string => {
  if (points >= 1000000) return `${(points / 1000000).toFixed(1)}M`;
  if (points >= 1000) return `${(points / 1000).toFixed(1)}K`;
  return points.toLocaleString();
};

/**
 * Format duration in seconds to human-readable
 */
export const formatDuration = (seconds: number): string => {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
};

/**
 * Technical to human-readable label map
 */
export const HUMAN_LABELS: Record<string, string> = {
  'contribution_sessions': 'Scanning history',
  'total_distance_meters': 'Distance covered',
  'data_points_count': 'Network samples',
  'total_points': 'Total points',
  'pending_points': 'Pending rewards',
  'contribution_streak_days': 'Day streak',
  'total_contribution_time_seconds': 'Time contributed',
  'signal_logs': 'Signal readings',
  'coverage_confirmations': 'Coverage verified',
};

/**
 * Get human-readable label for a technical term
 */
export const humanizeLabel = (technicalTerm: string): string => {
  return HUMAN_LABELS[technicalTerm] || technicalTerm.replace(/_/g, ' ');
};
