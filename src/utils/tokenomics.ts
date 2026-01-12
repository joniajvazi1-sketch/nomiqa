/**
 * Tokenomics Configuration
 * Central source of truth for token economy constants
 */

export const TOKENOMICS = {
  // Total token supply: 1 billion
  TOTAL_SUPPLY: 1_000_000_000,
  
  // User rewards pool: 500 million (50%)
  USER_REWARDS_POOL: 500_000_000,
  
  // Points to token conversion ratio (1:1)
  POINTS_TO_TOKEN_RATIO: 1,
  
  // Estimated token value in USD (beta estimate)
  // This will be updated once token launches
  ESTIMATED_TOKEN_VALUE_USD: 0.01,
  
  // Referral commission rate (5% of referred user's earnings)
  REFERRAL_COMMISSION_RATE: 0.05,
  
  // Welcome bonus for new users (points)
  WELCOME_BONUS_POINTS: 20,
  
  // Referral bonus for both parties (points)
  REFERRAL_BONUS_POINTS: 50,
} as const;

/**
 * Convert points to estimated USD value
 */
export const pointsToUsd = (points: number): number => {
  return points * TOKENOMICS.ESTIMATED_TOKEN_VALUE_USD;
};

/**
 * Convert points to tokens (1:1 ratio)
 */
export const pointsToTokens = (points: number): number => {
  return points * TOKENOMICS.POINTS_TO_TOKEN_RATIO;
};

/**
 * Format USD value with proper decimals
 */
export const formatUsd = (usd: number): string => {
  if (usd < 0.01) return '<$0.01';
  if (usd < 1) return `$${usd.toFixed(2)}`;
  if (usd < 1000) return `$${usd.toFixed(2)}`;
  return `$${(usd / 1000).toFixed(1)}k`;
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
 * Token allocation breakdown for display
 */
export const TOKEN_ALLOCATION = {
  userRewards: { percentage: 50, label: 'User Rewards', color: 'hsl(var(--primary))' },
  ecosystem: { percentage: 20, label: 'Ecosystem Development', color: 'hsl(var(--secondary))' },
  team: { percentage: 15, label: 'Team & Advisors', color: 'hsl(var(--accent))' },
  liquidity: { percentage: 10, label: 'Liquidity', color: 'hsl(var(--success))' },
  reserve: { percentage: 5, label: 'Reserve', color: 'hsl(var(--muted-foreground))' },
} as const;
