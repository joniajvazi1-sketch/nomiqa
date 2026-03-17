/**
 * Tokenomics Configuration v2
 * Central source of truth for token economy constants
 * 
 * KEY CONCEPT: Points are RELATIVE to the pool
 * At launch: User tokens = (User points / Total points of all users) × User allocation
 * This means points automatically scale with user growth.
 */

export const TOKENOMICS = {
  // ============ TOKEN SUPPLY ============
  // Total token supply: 1 billion
  TOTAL_SUPPLY: 1_000_000_000,
  
  // User rewards pool: 500 million (50%)
  USER_REWARDS_POOL: 500_000_000,
  
  // ============ EMISSION SCHEDULE ============
  // Duration: 4 years = 1,460 days
  EMISSION_DURATION_DAYS: 4 * 365, // 1,460 days
  
  // Daily emission: ~342,466 tokens/day (hard cap)
  // 500,000,000 ÷ 1,460 = 342,465.75
  DAILY_TOKEN_EMISSION: Math.floor(500_000_000 / (4 * 365)), // 342,465
  
  // ============ POINT DESIGN ============
  // Points are an accounting system - NOT 1:1 with tokens
  // Token conversion happens proportionally at distribution time
  
  // Base earning rates (per day, active user)
  DAILY_POINTS: {
    BACKGROUND_CONTRIBUTION: 144, // 0.1 pts/min × 1440 min = 144 (time alone over 24h)
    DAILY_CHALLENGES: 30,         // Average from challenges
    BASE_TOTAL: 174,              // Conservative base (144 + 30)
  },
  
  // Daily cap (hard limit to prevent abuse)
  DAILY_POINT_CAP: 200,
  
  // Monthly cap (prevents whales/bots from draining supply)
  MONTHLY_POINT_CAP: 6000,
  
  // ============ BOOST MULTIPLIERS ============
  BOOSTS: {
    // Early user boost: +50% for first 30 days
    EARLY_USER_MULTIPLIER: 1.5,
    EARLY_USER_DURATION_DAYS: 30,
    
    // Streak bonuses (applied to background contribution only)
    STREAK_30_DAYS_MULTIPLIER: 2.0, // 2x background = +50 extra pts/day
  },
  
  // ============ REFERRAL SYSTEM ============
  // Referral points come from the same pool (no extra tokens minted)
  
  // One-time bonus for both parties (points)
  REFERRAL_BONUS_POINTS: 50,
  
  // Ongoing commission rate (5% of referred user's earnings)
  REFERRAL_COMMISSION_RATE: 0.10,
  
  // Welcome bonus for new users (points)
  WELCOME_BONUS_POINTS: 20,
} as const;

/**
 * Earning status interface (returned from DB function)
 */
export interface EarningStatus {
  points_today: number;
  daily_cap: number;
  remaining_cap: number;
  boost_multiplier: number;
  days_since_join: number;
  is_early_user: boolean;
}

/**
 * Calculate estimated tokens per point based on user count
 * This is for display purposes only - actual conversion happens at distribution
 * 
 * Formula: daily_emission / (users × avg_points_per_day)
 */
export const estimateTokensPerPoint = (totalActiveUsers: number): number => {
  if (totalActiveUsers <= 0) return 0;
  
  const avgPointsPerUser = 100; // Conservative estimate
  const totalDailyPoints = totalActiveUsers * avgPointsPerUser;
  
  return TOKENOMICS.DAILY_TOKEN_EMISSION / totalDailyPoints;
};

/**
 * Calculate user's share of daily token emission
 * 
 * @param userPointsToday - Points the user earned today
 * @param totalNetworkPointsToday - Total points earned by all users today
 * @returns Estimated token share for display
 */
export const calculateDailyTokenShare = (
  userPointsToday: number,
  totalNetworkPointsToday: number
): number => {
  if (totalNetworkPointsToday <= 0 || userPointsToday <= 0) return 0;
  
  const userShare = userPointsToday / totalNetworkPointsToday;
  return Math.floor(userShare * TOKENOMICS.DAILY_TOKEN_EMISSION);
};

/**
 * Format points display (no USD estimate - just points)
 */
export const formatPoints = (points: number): string => {
  if (points < 1000) return points.toLocaleString();
  if (points < 1_000_000) return `${(points / 1000).toFixed(1)}K`;
  return `${(points / 1_000_000).toFixed(1)}M`;
};

/**
 * Format token amount with abbreviations
 */
export const formatTokens = (tokens: number): string => {
  if (tokens < 1000) return tokens.toLocaleString();
  if (tokens < 1_000_000) return `${(tokens / 1000).toFixed(1)}K`;
  if (tokens < 1_000_000_000) return `${(tokens / 1_000_000).toFixed(1)}M`;
  return `${(tokens / 1_000_000_000).toFixed(1)}B`;
};

/**
 * Check if user is still in early boost period
 */
export const isEarlyUser = (daysSinceJoin: number): boolean => {
  return daysSinceJoin < TOKENOMICS.BOOSTS.EARLY_USER_DURATION_DAYS;
};

/**
 * Get boost multiplier based on user status
 */
export const getBoostMultiplier = (daysSinceJoin: number, streakDays: number = 0): number => {
  let multiplier = 1.0;
  
  // Early user boost
  if (isEarlyUser(daysSinceJoin)) {
    multiplier = TOKENOMICS.BOOSTS.EARLY_USER_MULTIPLIER;
  }
  
  // Note: Streak bonus is applied to background contribution only,
  // not as a global multiplier. This is handled in the backend.
  
  return multiplier;
};

/**
 * Calculate points remaining before daily cap
 */
export const getRemainingDailyPoints = (pointsEarnedToday: number): number => {
  return Math.max(0, TOKENOMICS.DAILY_POINT_CAP - pointsEarnedToday);
};

/**
 * Calculate points remaining before monthly cap
 */
export const getRemainingMonthlyPoints = (pointsEarnedThisMonth: number): number => {
  return Math.max(0, TOKENOMICS.MONTHLY_POINT_CAP - pointsEarnedThisMonth);
};

/**
 * Check if daily cap has been reached
 */
export const isDailyCapReached = (pointsEarnedToday: number): boolean => {
  return pointsEarnedToday >= TOKENOMICS.DAILY_POINT_CAP;
};

/**
 * Check if monthly cap has been reached
 */
export const isMonthlyCapReached = (pointsEarnedThisMonth: number): boolean => {
  return pointsEarnedThisMonth >= TOKENOMICS.MONTHLY_POINT_CAP;
};

/**
 * Token allocation breakdown for display
 */
export const TOKEN_ALLOCATION = {
  userRewards: { percentage: 50, label: 'User Rewards', color: 'hsl(var(--primary))' },
  ecosystem: { percentage: 20, label: 'Ecosystem Development', color: 'hsl(var(--secondary))' },
  team: { percentage: 15, label: 'Team & Advisors', color: 'hsl(var(--accent))' },
  liquidity: { percentage: 10, label: 'Liquidity', color: 'hsl(var(--success))' },
  reserve: { percentage: 5, label: 'Reserve', color: 'hsl(var(--muted-foreground))' },
} as const;

// ============ DEPRECATED (kept for backwards compatibility) ============
// These will be removed in a future version

/**
 * @deprecated Points are now relative - use formatPoints instead
 * Kept for backwards compatibility during transition
 */
export const pointsToUsd = (points: number): number => {
  // Return 0 since we no longer estimate USD value
  // This prevents breaking existing code that calls this
  return 0;
};

/**
 * @deprecated Points are relative to the pool, not 1:1 with tokens
 */
export const pointsToTokens = (points: number): number => {
  // This is now meaningless - tokens are distributed proportionally
  return points;
};

/**
 * @deprecated No longer showing USD estimates
 */
export const formatUsd = (usd: number): string => {
  return '—';
};
