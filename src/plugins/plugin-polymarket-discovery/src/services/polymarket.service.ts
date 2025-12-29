/**
 * Polymarket Discovery Service
 *
 * Provides market discovery and pricing data via:
 * - Gamma API: Market metadata, categories, search
 * - CLOB API: Real-time orderbook and pricing
 *
 * Features:
 * - In-memory caching with TTL
 * - Retry with exponential backoff
 * - AbortController for timeouts
 * - No authentication required (read-only)
 */

import { type IAgentRuntime, Service, ServiceType, logger } from "@elizaos/core";
import type {
  PolymarketMarket,
  MarketsResponse,
  MarketPrices,
  OrderBook,
  MarketSearchParams,
  MarketCategory,
  CachedMarket,
  CachedPrice,
  PolymarketServiceConfig,
} from "../types";

export class PolymarketService extends Service {
  static serviceType = "POLYMARKET_DISCOVERY_SERVICE" as const;
  capabilityDescription = "Discover and fetch real-time pricing data for Polymarket prediction markets.";

  // API endpoints
  private gammaApiUrl: string = "https://gamma-api.polymarket.com";
  private clobApiUrl: string = "https://clob.polymarket.com";

  // Cache configuration
  private marketCacheTtl: number = 60000; // 1 minute
  private priceCacheTtl: number = 15000; // 15 seconds
  private maxRetries: number = 3;
  private requestTimeout: number = 10000; // 10 seconds

  // In-memory caches
  private marketCache: Map<string, CachedMarket> = new Map();
  private priceCache: Map<string, CachedPrice> = new Map();
  private marketsListCache: { data: PolymarketMarket[]; timestamp: number } | null = null;

  constructor(runtime: IAgentRuntime) {
    super(runtime);
  }

  async initialize(runtime: IAgentRuntime): Promise<void> {
    // Load configuration with defaults
    this.gammaApiUrl = runtime.getSetting("POLYMARKET_GAMMA_API_URL") as string || "https://gamma-api.polymarket.com";
    this.clobApiUrl = runtime.getSetting("POLYMARKET_CLOB_API_URL") as string || "https://clob.polymarket.com";
    this.marketCacheTtl = parseInt(runtime.getSetting("POLYMARKET_MARKET_CACHE_TTL") as string || "60000"); // 1 minute
    this.priceCacheTtl = parseInt(runtime.getSetting("POLYMARKET_PRICE_CACHE_TTL") as string || "15000"); // 15 seconds
    this.maxRetries = parseInt(runtime.getSetting("POLYMARKET_MAX_RETRIES") as string || "3");
    this.requestTimeout = parseInt(runtime.getSetting("POLYMARKET_REQUEST_TIMEOUT") as string || "10000"); // 10 seconds

    logger.info(`[PolymarketService] Initialized with Gamma API: ${this.gammaApiUrl}, CLOB API: ${this.clobApiUrl}`);
  }

  async stop(): Promise<void> {
    this.clearCache();
  }

  /**
   * Fetch with timeout using AbortController
   */
  private async fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.requestTimeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if ((error as Error).name === "AbortError") {
        throw new Error(`Request timeout after ${this.requestTimeout}ms: ${url}`);
      }
      throw error;
    }
  }

  /**
   * Retry with exponential backoff
   */
  private async retryFetch<T>(
    fn: () => Promise<T>,
    retries: number = this.maxRetries
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        const isLastAttempt = attempt === retries - 1;

        if (isLastAttempt) {
          break;
        }

        // Exponential backoff: 1s, 2s, 4s
        const backoffMs = Math.pow(2, attempt) * 1000;
        logger.warn(
          `[PolymarketService] Attempt ${attempt + 1}/${retries} failed: ${lastError.message}. Retrying in ${backoffMs}ms...`
        );
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
      }
    }

    throw lastError || new Error("Retry failed with unknown error");
  }

  /**
   * Get active/trending markets from Gamma API
   */
  async getActiveMarkets(limit: number = 20): Promise<PolymarketMarket[]> {
    logger.info(`[PolymarketService] Fetching ${limit} active markets`);

    // Check cache
    if (this.marketsListCache) {
      const age = Date.now() - this.marketsListCache.timestamp;
      if (age < this.marketCacheTtl) {
        logger.debug(`[PolymarketService] Returning cached markets list (age: ${age}ms)`);
        return this.marketsListCache.data.slice(0, limit);
      }
    }

    return this.retryFetch(async () => {
      const url = `${this.gammaApiUrl}/markets?limit=${limit}&active=true&closed=false`;
      const response = await this.fetchWithTimeout(url);

      if (!response.ok) {
        throw new Error(`Gamma API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as PolymarketMarket[];

      // Update cache
      this.marketsListCache = {
        data,
        timestamp: Date.now(),
      };

      logger.info(`[PolymarketService] Fetched ${data.length} active markets`);
      return data;
    });
  }

  /**
   * Search markets by keyword or category
   */
  async searchMarkets(params: MarketSearchParams): Promise<PolymarketMarket[]> {
    const { query, category, active = true, limit = 20, offset = 0 } = params;
    logger.info(`[PolymarketService] Searching markets: query="${query}", category="${category}", limit=${limit}`);

    return this.retryFetch(async () => {
      // Build query parameters
      const queryParams = new URLSearchParams();
      queryParams.set("limit", limit.toString());
      queryParams.set("offset", offset.toString());

      if (active !== undefined) {
        queryParams.set("active", active.toString());
      }

      // Gamma API doesn't have direct search - fetch all and filter client-side
      // For production, consider using Gamma's event slugs or market tags
      const url = `${this.gammaApiUrl}/markets?${queryParams.toString()}`;
      const response = await this.fetchWithTimeout(url);

      if (!response.ok) {
        throw new Error(`Gamma API error: ${response.status} ${response.statusText}`);
      }

      let markets = await response.json() as PolymarketMarket[];

      // Client-side filtering
      if (query) {
        const lowerQuery = query.toLowerCase();
        markets = markets.filter(
          (m) =>
            m.question?.toLowerCase().includes(lowerQuery) ||
            m.description?.toLowerCase().includes(lowerQuery) ||
            m.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery))
        );
      }

      if (category) {
        const lowerCategory = category.toLowerCase();
        markets = markets.filter(
          (m) => m.category?.toLowerCase() === lowerCategory
        );
      }

      logger.info(`[PolymarketService] Found ${markets.length} markets matching search criteria`);
      return markets;
    });
  }

  /**
   * Get detailed market information by condition ID
   */
  async getMarketDetail(conditionId: string): Promise<PolymarketMarket> {
    logger.info(`[PolymarketService] Fetching market detail: ${conditionId}`);

    // Check cache
    const cached = this.marketCache.get(conditionId);
    if (cached) {
      const age = Date.now() - cached.timestamp;
      if (age < cached.ttl) {
        logger.debug(`[PolymarketService] Returning cached market (age: ${age}ms)`);
        return cached.data;
      }
    }

    return this.retryFetch(async () => {
      // Gamma API endpoint for single market (if available)
      // Otherwise, fetch from markets list and filter
      const url = `${this.gammaApiUrl}/markets`;
      const response = await this.fetchWithTimeout(url);

      if (!response.ok) {
        throw new Error(`Gamma API error: ${response.status} ${response.statusText}`);
      }

      const markets = await response.json() as PolymarketMarket[];
      const market = markets.find((m) => m.condition_id === conditionId);

      if (!market) {
        throw new Error(`Market not found: ${conditionId}`);
      }

      // Update cache
      this.marketCache.set(conditionId, {
        data: market,
        timestamp: Date.now(),
        ttl: this.marketCacheTtl,
      });

      logger.info(`[PolymarketService] Fetched market: ${market.question}`);
      return market;
    });
  }

  /**
   * Get real-time market prices from CLOB API
   */
  async getMarketPrices(conditionId: string): Promise<MarketPrices> {
    logger.info(`[PolymarketService] Fetching prices for market: ${conditionId}`);

    // Check cache
    const cached = this.priceCache.get(conditionId);
    if (cached) {
      const age = Date.now() - cached.timestamp;
      if (age < cached.ttl) {
        logger.debug(`[PolymarketService] Returning cached prices (age: ${age}ms)`);
        return cached.data;
      }
    }

    return this.retryFetch(async () => {
      // First get market to find token IDs
      const market = await this.getMarketDetail(conditionId);

      if (!market.tokens || market.tokens.length < 2) {
        throw new Error(`Market ${conditionId} has invalid token structure`);
      }

      const yesToken = market.tokens.find((t) => t.outcome === "Yes");
      const noToken = market.tokens.find((t) => t.outcome === "No");

      if (!yesToken || !noToken) {
        throw new Error(`Market ${conditionId} missing Yes/No tokens`);
      }

      // Fetch orderbooks for both tokens in parallel
      const [yesBook, noBook] = await Promise.all([
        this.getOrderBook(yesToken.token_id),
        this.getOrderBook(noToken.token_id),
      ]);

      // Extract best bid/ask prices
      const yesPrice = yesBook.asks[0]?.price || "0.50";
      const noPrice = noBook.asks[0]?.price || "0.50";

      // Calculate spread (difference between yes and no prices)
      const yesPriceNum = parseFloat(yesPrice);
      const noPriceNum = parseFloat(noPrice);
      const spread = Math.abs(yesPriceNum - noPriceNum).toFixed(4);

      const prices: MarketPrices = {
        condition_id: conditionId,
        yes_price: yesPrice,
        no_price: noPrice,
        yes_price_formatted: `${(yesPriceNum * 100).toFixed(1)}%`,
        no_price_formatted: `${(noPriceNum * 100).toFixed(1)}%`,
        spread,
        last_updated: Date.now(),
      };

      // Update cache
      this.priceCache.set(conditionId, {
        data: prices,
        timestamp: Date.now(),
        ttl: this.priceCacheTtl,
      });

      logger.info(
        `[PolymarketService] Fetched prices - YES: ${prices.yes_price_formatted}, NO: ${prices.no_price_formatted}`
      );
      return prices;
    });
  }

  /**
   * Get orderbook for a specific token
   */
  async getOrderBook(tokenId: string): Promise<OrderBook> {
    logger.debug(`[PolymarketService] Fetching orderbook for token: ${tokenId}`);

    return this.retryFetch(async () => {
      const url = `${this.clobApiUrl}/book?token_id=${tokenId}`;
      const response = await this.fetchWithTimeout(url);

      if (!response.ok) {
        throw new Error(`CLOB API error: ${response.status} ${response.statusText}`);
      }

      const orderBook = await response.json() as OrderBook;
      return orderBook;
    });
  }

  /**
   * Get available market categories
   */
  async getMarketCategories(): Promise<MarketCategory[]> {
    logger.info("[PolymarketService] Fetching market categories");

    return this.retryFetch(async () => {
      // Fetch all markets and extract unique categories
      const markets = await this.getActiveMarkets(500); // Fetch more to get all categories

      const categoryMap = new Map<string, number>();

      for (const market of markets) {
        if (market.category) {
          const count = categoryMap.get(market.category) || 0;
          categoryMap.set(market.category, count + 1);
        }
      }

      const categories: MarketCategory[] = Array.from(categoryMap.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

      logger.info(`[PolymarketService] Found ${categories.length} categories`);
      return categories;
    });
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.marketCache.clear();
    this.priceCache.clear();
    this.marketsListCache = null;
    logger.info("[PolymarketService] Cache cleared");
  }
}

export default PolymarketService;
