/**
 * TypeScript types for Polymarket Gamma API
 * Based on: https://docs.polymarket.com and https://gamma-api.polymarket.com
 */

/**
 * Market from Gamma API
 */
export interface GammaMarket {
  id: string;
  conditionId: string;
  questionID: string;
  question: string;
  slug: string;
  category: string;
  outcomes: string; // JSON string like '["Yes", "No"]'
  outcomePrices?: string; // JSON string like '["0.65", "0.35"]'
  clobTokenIds: string; // JSON string like '["token1", "token2"]'
  liquidity?: string;
  liquidityNum?: number;
  volume?: string;
  volumeNum?: number;
  active: boolean;
  closed: boolean;
  endDate?: string; // ISO date
  startDate?: string; // ISO date
  image?: string;
  icon?: string;
  description?: string;
  marketMakerAddress?: string;
  tags?: string[]; // Array of tag slugs
  orderPriceMinTickSize?: number; // Minimum price increment (e.g., 0.01)
  negRisk?: boolean; // Negative risk market flag
}

/**
 * Parsed market outcome with price
 */
export interface MarketOutcome {
  name: string;
  tokenId: string;
  price?: number; // Current price (0-1, e.g., 0.65 = 65%)
}

/**
 * Simplified market for display
 */
export interface SimplifiedMarket {
  id: string;
  conditionId: string;
  question: string;
  slug: string;
  category: string;
  outcomes: MarketOutcome[];
  liquidity: number;
  volume: number;
  active: boolean;
  closed: boolean;
  endDate: string | null;
  image: string | null;
  tags: string[];
  tickSize: string; // Minimum price increment (e.g., "0.01", "0.001")
  negRisk: boolean; // Negative risk market flag
}

/**
 * Search/filter parameters for markets
 */
export interface MarketSearchParams {
  query?: string; // Free text search
  category?: string; // Category filter
  tag?: string; // Tag filter
  active?: boolean; // Default: true
  closed?: boolean; // Default: false
  limit?: number; // Default: 20, Max: 100
  offset?: number; // For pagination
  sortBy?: "volume" | "liquidity" | "newest" | "endingSoon";
  minLiquidity?: number; // Minimum liquidity filter (in USD)
  minVolume?: number; // Minimum volume filter (in USD)
  endDateMin?: string; // ISO date - markets ending after this date
  endDateMax?: string; // ISO date - markets ending before this date
}

/**
 * Market category
 */
export interface MarketCategory {
  name: string;
  slug: string;
  marketCount: number;
}

/**
 * Trending markets response
 */
export interface TrendingMarketsResult {
  markets: SimplifiedMarket[];
  timeframe: string;
  totalCount: number;
}

/**
 * Search results with pagination
 */
export interface MarketSearchResult {
  markets: SimplifiedMarket[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

/**
 * Event from Gamma API (groups related markets together)
 */
export interface GammaEvent {
  id: string;
  title: string;
  slug: string;
  description?: string;
  image?: string;
  icon?: string;
  startDate?: string; // ISO date
  endDate?: string; // ISO date
  createdAt?: string;
  updatedAt?: string;
  markets?: GammaMarket[]; // Associated markets
  marketCount?: number;
  liquidity?: string;
  liquidityNum?: number;
  volume?: string;
  volumeNum?: number;
  active?: boolean;
  closed?: boolean;
  archived?: boolean;
  enableOrderBook?: boolean;
  featured?: boolean;
  restricted?: boolean;
  tags?: Array<{
    id: string;
    label: string;
    slug: string;
  }>;
}

/**
 * Simplified event for display
 */
export interface SimplifiedEvent {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  image: string | null;
  startDate: string | null;
  endDate: string | null;
  marketCount: number;
  liquidity: number;
  volume: number;
  active: boolean;
  closed: boolean;
  markets: SimplifiedMarket[];
  tags: Array<{
    id: string;
    label: string;
    slug: string;
  }>;
}

/**
 * Event search parameters
 */
export interface EventSearchParams {
  query?: string; // Free text search
  tag?: string; // Tag filter
  tagId?: string; // Tag ID filter
  active?: boolean; // Default: true
  closed?: boolean; // Default: false
  archived?: boolean; // Default: false
  limit?: number; // Default: 20, Max: 100
  offset?: number; // For pagination
  sortBy?: "volume" | "liquidity" | "newest" | "endingSoon";
}

/**
 * Event search result with pagination
 */
export interface EventSearchResult {
  events: SimplifiedEvent[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

/**
 * Error response
 */
export interface PolymarketError {
  code: string;
  message: string;
  details?: string;
}

