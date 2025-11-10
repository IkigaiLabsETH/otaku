import { Service, type IAgentRuntime, logger } from "@elizaos/core";
import { ClobClient, Side, OrderType } from "@polymarket/clob-client";
import { Wallet } from "ethers";
import type {
  GammaMarket,
  SimplifiedMarket,
  MarketSearchParams,
  MarketSearchResult,
  MarketCategory,
  MarketOutcome,
  GammaEvent,
  SimplifiedEvent,
  EventSearchParams,
  EventSearchResult,
} from "../types";

const GAMMA_API_BASE = "https://gamma-api.polymarket.com";
const PUBLIC_SEARCH_ENDPOINT = `${GAMMA_API_BASE}/public-search`;
const CLOB_API_BASE = "https://clob.polymarket.com";

/**
 * Polymarket Service for interacting with Gamma API
 * Handles market data fetching, search, and filtering
 */
export class PolymarketService extends Service {
  static serviceType = "polymarket";
  capabilityDescription = "Provides access to Polymarket prediction market data via Gamma API";

  constructor(runtime: IAgentRuntime) {
    super(runtime);
  }

  static async start(runtime: IAgentRuntime): Promise<PolymarketService> {
    logger.info("*** Starting Polymarket service ***");
    const service = new PolymarketService(runtime);
    return service;
  }

  async stop(): Promise<void> {
    logger.info("*** Stopping Polymarket service ***");
  }

  /**
   * Parse outcomes from JSON string with prices
   */
  private parseOutcomes(outcomesJson: string, tokenIdsJson: string, pricesJson?: string): MarketOutcome[] {
    try {
      const outcomes = JSON.parse(outcomesJson) as string[];
      const tokenIds = JSON.parse(tokenIdsJson) as string[];
      const prices = pricesJson ? JSON.parse(pricesJson) as string[] : [];

      return outcomes.map((name, index) => ({
        name,
        tokenId: tokenIds[index] || "",
        price: prices[index] ? parseFloat(prices[index]) : undefined,
      }));
    } catch (error) {
      logger.warn(`Failed to parse outcomes: ${error}`);
      return [
        { name: "Yes", tokenId: "", price: undefined },
        { name: "No", tokenId: "", price: undefined },
      ];
    }
  }

  /**
   * Transform Gamma API market to simplified format
   */
  private transformMarket(market: GammaMarket): SimplifiedMarket {
    return {
      id: market.id,
      conditionId: market.conditionId,
      question: market.question,
      slug: market.slug,
      category: market.category || "General",
      outcomes: this.parseOutcomes(
        market.outcomes, 
        market.clobTokenIds,
        market.outcomePrices
      ),
      liquidity: market.liquidityNum || parseFloat(market.liquidity || "0"),
      volume: market.volumeNum || parseFloat(market.volume || "0"),
      active: market.active,
      closed: market.closed,
      endDate: market.endDate || null,
      image: market.image || market.icon || null,
      tags: market.tags || [],
      tickSize: market.orderPriceMinTickSize ? market.orderPriceMinTickSize.toString() : "0.01",
      negRisk: market.negRisk || false,
    };
  }

  /**
   * Search events (NOT individual markets) using /public-search endpoint
   * When users ask "Find Bitcoin markets", they mean Bitcoin EVENTS
   */
  async searchMarkets(params: MarketSearchParams): Promise<MarketSearchResult> {
    try {
      const url = new URL(PUBLIC_SEARCH_ENDPOINT);

      // Add query parameters
      if (params.query) {
        url.searchParams.append("q", params.query);
      }

      // Pagination (API uses 1-indexed pages)
      const page = Math.floor((params.offset || 0) / (params.limit || 20)) + 1;
      url.searchParams.append("page", String(page));
      url.searchParams.append("limit_per_type", String(params.limit || 20));

      // Type filter - SEARCH EVENTS ONLY (events contain markets)
      url.searchParams.append("type", "events");

      // Status filters
      const status = params.closed ? "closed" : params.active === false ? "inactive" : "active";
      url.searchParams.append("events_status", status);

      // Sorting
      if (params.sortBy) {
        switch (params.sortBy) {
          case "volume":
            url.searchParams.append("sort", "volume_24hr");
            break;
          case "liquidity":
            url.searchParams.append("sort", "liquidity");
            break;
          case "newest":
            url.searchParams.append("sort", "newest");
            break;
          case "endingSoon":
            url.searchParams.append("sort", "end_date");
            break;
        }
      } else {
        url.searchParams.append("sort", "volume_24hr");
      }

      // Presets for events
      url.searchParams.append("presets", "EventsTitle");
      url.searchParams.append("presets", "Events");

      logger.info(`[PolymarketService] Searching events: ${url.toString()}`);

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Gamma API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const events = data.events || [];
      const pagination = data.pagination || { hasMore: false, totalResults: 0 };

      // Transform events to get their markets
      const allMarkets: SimplifiedMarket[] = [];
      for (const event of events) {
        const transformedEvent = this.transformEvent(event);
        // Add all markets from this event
        allMarkets.push(...transformedEvent.markets);
      }

      // Apply additional filters if needed
      let filteredMarkets = allMarkets;

      if (params.category) {
        filteredMarkets = filteredMarkets.filter(
          (m: SimplifiedMarket) => m.category.toLowerCase() === params.category!.toLowerCase()
        );
      }

      if (params.minLiquidity !== undefined) {
        filteredMarkets = filteredMarkets.filter(
          (m: SimplifiedMarket) => m.liquidity >= params.minLiquidity!
        );
      }

      if (params.minVolume !== undefined) {
        filteredMarkets = filteredMarkets.filter(
          (m: SimplifiedMarket) => m.volume >= params.minVolume!
        );
      }

      if (params.endDateMin || params.endDateMax) {
        filteredMarkets = filteredMarkets.filter((m: SimplifiedMarket) => {
          if (!m.endDate) return false;
          const endDate = new Date(m.endDate);
          if (params.endDateMin && endDate < new Date(params.endDateMin)) {
            return false;
          }
          if (params.endDateMax && endDate > new Date(params.endDateMax)) {
            return false;
          }
          return true;
        });
      }

      const limit = params.limit || 20;
      const offset = params.offset || 0;

      return {
        markets: filteredMarkets,
        total: pagination.totalResults || filteredMarkets.length,
        limit,
        offset,
        hasMore: pagination.hasMore || false,
      };
    } catch (error) {
      logger.error(`[PolymarketService] Search markets failed: ${error}`);
      throw error;
    }
  }

  /**
   * Get market by condition ID or slug
   */
  async getMarketInfo(identifier: string): Promise<SimplifiedMarket | null> {
    try {
      const url = new URL(`${GAMMA_API_BASE}/markets`);

      // Check if identifier is a condition ID (0x...) or slug
      if (identifier.startsWith("0x")) {
        url.searchParams.append("condition_ids", identifier);
      } else {
        url.searchParams.append("slug", identifier);
      }

      logger.info(`[PolymarketService] Fetching market: ${identifier}`);

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Gamma API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const markets = Array.isArray(data) ? data : [];

      if (markets.length === 0) {
        logger.warn(`[PolymarketService] Market not found: ${identifier}`);
        return null;
      }

      return this.transformMarket(markets[0]);
    } catch (error) {
      logger.error(`[PolymarketService] Get market info failed: ${error}`);
      throw error;
    }
  }

  /**
   * Get markets with flexible filtering - uses /markets endpoint
   * Always returns results sorted by volume (high to low)
   */
  async getMarkets(params: {
    limit?: number;
    closed?: boolean;
    minLiquidity?: number;
    minVolume?: number;
    category?: string;
  }): Promise<SimplifiedMarket[]> {
    try {
      const url = new URL(`${GAMMA_API_BASE}/markets`);

      // Filters
      url.searchParams.append("closed", String(params.closed ?? false));
      url.searchParams.append("limit", String(params.limit || 100)); // Get more to filter
      url.searchParams.append("offset", "0");

      // Sort by volume descending
      url.searchParams.append("order", "volume");
      url.searchParams.append("ascending", "false");

      // Add API-level filters if supported
      if (params.category) {
        url.searchParams.append("category", params.category);
      }

      logger.info(`[PolymarketService] Fetching markets with filters: ${url.toString()}`);

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Gamma API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      let markets = Array.isArray(data) ? data : [];

      // Transform markets
      let transformedMarkets = markets.map((m: GammaMarket) =>
        this.transformMarket(m)
      );

      // Apply client-side filters
      if (params.category) {
        transformedMarkets = transformedMarkets.filter(
          (m: SimplifiedMarket) => m.category.toLowerCase() === params.category!.toLowerCase()
        );
      }

      if (params.minLiquidity !== undefined) {
        transformedMarkets = transformedMarkets.filter(
          (m: SimplifiedMarket) => m.liquidity >= params.minLiquidity!
        );
      }

      if (params.minVolume !== undefined) {
        transformedMarkets = transformedMarkets.filter(
          (m: SimplifiedMarket) => m.volume >= params.minVolume!
        );
      }

      // Already sorted by volume from API, but ensure it
      transformedMarkets.sort((a, b) => b.volume - a.volume);

      // Apply limit after filtering
      const limit = params.limit || 10;
      return transformedMarkets.slice(0, limit);
    } catch (error) {
      logger.error(`[PolymarketService] Get markets failed: ${error}`);
      throw error;
    }
  }

  /**
   * Transform Gamma API event to simplified format
   */
  private transformEvent(event: GammaEvent): SimplifiedEvent {
    const markets = event.markets
      ? event.markets.map((m) => this.transformMarket(m))
      : [];

    return {
      id: event.id,
      title: event.title,
      slug: event.slug,
      description: event.description || null,
      image: event.image || event.icon || null,
      startDate: event.startDate || null,
      endDate: event.endDate || null,
      marketCount: event.marketCount || markets.length,
      liquidity: event.liquidityNum || parseFloat(event.liquidity || "0"),
      volume: event.volumeNum || parseFloat(event.volume || "0"),
      active: event.active ?? true,
      closed: event.closed ?? false,
      markets,
      tags: event.tags || [],
    };
  }

  /**
   * Search events with filters and pagination using /public-search endpoint
   */
  async searchEvents(params: EventSearchParams): Promise<EventSearchResult> {
    try {
      const url = new URL(PUBLIC_SEARCH_ENDPOINT);

      // Add query parameters
      if (params.query) {
        url.searchParams.append("q", params.query);
      }

      // Pagination (API uses 1-indexed pages)
      const page = Math.floor((params.offset || 0) / (params.limit || 20)) + 1;
      url.searchParams.append("page", String(page));
      url.searchParams.append("limit_per_type", String(params.limit || 20));

      // Type filter
      url.searchParams.append("type", "events");

      // Status filters
      const status = params.closed ? "closed" : params.active === false ? "inactive" : "active";
      url.searchParams.append("events_status", status);

      if (params.archived !== undefined) {
        url.searchParams.append("archived", String(params.archived));
      }

      // Sorting
      if (params.sortBy) {
        switch (params.sortBy) {
          case "volume":
            url.searchParams.append("sort", "volume_24hr");
            break;
          case "liquidity":
            url.searchParams.append("sort", "liquidity");
            break;
          case "newest":
            url.searchParams.append("sort", "newest");
            break;
          case "endingSoon":
            url.searchParams.append("sort", "end_date");
            break;
        }
      } else {
        url.searchParams.append("sort", "volume_24hr");
      }

      // Presets
      url.searchParams.append("presets", "EventsTitle");
      url.searchParams.append("presets", "Events");

      logger.info(`[PolymarketService] Searching events: ${url.toString()}`);

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Gamma API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const events = data.events || [];
      const pagination = data.pagination || { hasMore: false, totalResults: 0 };

      const transformedEvents = events.map((e: GammaEvent) =>
        this.transformEvent(e)
      );

      const limit = params.limit || 20;
      const offset = params.offset || 0;

      return {
        events: transformedEvents,
        total: pagination.totalResults || transformedEvents.length,
        limit,
        offset,
        hasMore: pagination.hasMore || false,
      };
    } catch (error) {
      logger.error(`[PolymarketService] Search events failed: ${error}`);
      throw error;
    }
  }

  /**
   * Get event by ID with all its markets
   */
  async getEventInfo(eventId: string): Promise<SimplifiedEvent | null> {
    try {
      const url = new URL(`${GAMMA_API_BASE}/events/${eventId}`);

      logger.info(`[PolymarketService] Fetching event: ${eventId}`);

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Gamma API error: ${response.status} ${response.statusText}`);
      }

      const event = await response.json();
      return this.transformEvent(event);
    } catch (error) {
      logger.error(`[PolymarketService] Get event info failed: ${error}`);
      throw error;
    }
  }

  /**
   * Get trending events with their markets (filtered)
   * - Only includes events that have at least one non-closed market
   * - Only includes markets with at least $1000 liquidity
   * - Sorted by event volume
   */
  async getTrendingWithMarkets(limit: number = 10): Promise<Array<{
    event: SimplifiedEvent;
    markets: SimplifiedMarket[];
  }>> {
    try {
      const url = new URL(`${GAMMA_API_BASE}/events`);

      // Filters
      url.searchParams.append("closed", "false");
      url.searchParams.append("limit", String(1000 * 2)); // Get more to filter
      url.searchParams.append("offset", "0");

      // Sort by volume descending
      url.searchParams.append("order", "volume");
      url.searchParams.append("ascending", "false");

      logger.info(`[PolymarketService] Fetching trending events with markets: ${url.toString()}`);

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Gamma API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const events = Array.isArray(data) ? data : [];

      const result: Array<{ event: SimplifiedEvent; markets: SimplifiedMarket[] }> = [];

      for (const eventData of events) {
        const transformedEvent = this.transformEvent(eventData);
        
        // Filter markets: not closed AND at least $1000 liquidity
        const filteredMarkets = transformedEvent.markets.filter(
          (market) => !market.closed && market.liquidity >= 1000
        );

        // Only include event if it has at least one qualifying market
        if (filteredMarkets.length > 0) {
          result.push({
            event: transformedEvent,
            markets: filteredMarkets,
          });

          // Stop once we have enough events
          if (result.length >= limit) {
            break;
          }
        }
      }

      return result;
    } catch (error) {
      logger.error(`[PolymarketService] Get trending with markets failed: ${error}`);
      throw error;
    }
  }

  /**
   * Get lightweight list of events (no markets included)
   * Returns only: id, slug, title, volume, liquidity, marketCount
   */
  async getEventsList(): Promise<Array<{
    id: string;
    slug: string;
    title: string;
    volume: number;
    liquidity: number;
    marketCount: number;
  }>> {
    try {
      const url = new URL(`${GAMMA_API_BASE}/events`);

      // Filters
      url.searchParams.append("closed", "false");
      url.searchParams.append("offset", "0");

      // Sort by volume descending
      url.searchParams.append("order", "volume");
      url.searchParams.append("ascending", "false");

      logger.info(`[PolymarketService] Fetching events list: ${url.toString()}`);

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Gamma API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const events = Array.isArray(data) ? data : [];

      // Return lightweight event data (no markets)
      return events.map((e: GammaEvent) => ({
        id: e.id,
        slug: e.slug,
        title: e.title,
        volume: e.volumeNum || parseFloat(e.volume || "0"),
        liquidity: e.liquidityNum || parseFloat(e.liquidity || "0"),
        marketCount: e.marketCount || (e.markets ? e.markets.length : 0),
      }));
    } catch (error) {
      logger.error(`[PolymarketService] Get events list failed: ${error}`);
      throw error;
    }
  }

  /**
   * Get event with all its markets by ID or slug
   * Supports both /events/:id and /events/slug/:slug
   */
  async getEventWithMarkets(identifier: string): Promise<{
    event: SimplifiedEvent;
    markets: SimplifiedMarket[];
  } | null> {
    try {
      // Try by ID first, then by slug
      let url: URL;
      
      // Check if it's a numeric ID
      if (/^\d+$/.test(identifier)) {
        url = new URL(`${GAMMA_API_BASE}/events/${identifier}`);
      } else {
        // It's a slug
        url = new URL(`${GAMMA_API_BASE}/events/slug/${identifier}`);
      }

      logger.info(`[PolymarketService] Fetching event with markets: ${url.toString()}`);

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Gamma API error: ${response.status} ${response.statusText}`);
      }

      const eventData = await response.json();
      const transformedEvent = this.transformEvent(eventData);

      // Filter markets: not closed AND at least $1000 liquidity
      const filteredMarkets = transformedEvent.markets.filter(
        (market) => !market.closed && market.liquidity >= 1000
      );

      return {
        event: transformedEvent,
        markets: filteredMarkets,
      };
    } catch (error) {
      logger.error(`[PolymarketService] Get event with markets failed: ${error}`);
      throw error;
    }
  }

  /**
   * Place an order on Polymarket CLOB using official client
   * @param walletClient - Viem wallet client for signing (will be converted to ethers)
   * @param params - Order parameters
   */
  async placeOrder(params: {
    walletClient: any;
    walletAddress: string;
    tokenId: string;
    side: "BUY" | "SELL";
    amount: number; // In shares
    price: number; // 0.01 to 0.99
    tickSize: string; // From market data (e.g., "0.01", "0.001")
    negRisk: boolean; // From market data
  }): Promise<{ orderId: string; status: string }> {
    try {
      const { walletClient, walletAddress, tokenId, side, amount, price, tickSize, negRisk } = params;

      logger.info(`[PolymarketService] Placing ${side} order: ${amount} shares @ $${price} for token ${tokenId} (tick: ${tickSize}, negRisk: ${negRisk})`);

      // Create ethers-compatible signer wrapper around viem wallet
      const ethersSigner = {
        getAddress: async () => walletAddress,
        signMessage: async (message: string | Uint8Array) => {
          return await walletClient.signMessage({ 
            message: typeof message === 'string' ? message : { raw: message }
          });
        },
        signTypedData: async (domain: any, types: any, value: any) => {
          return await walletClient.signTypedData({
            domain,
            types,
            primaryType: Object.keys(types)[0],
            message: value,
          });
        },
        _signTypedData: async (domain: any, types: any, value: any) => {
          return await walletClient.signTypedData({
            domain,
            types,
            primaryType: Object.keys(types)[0],
            message: value,
          });
        },
      };

      // Derive API credentials from wallet signature
      logger.info(`[PolymarketService] Deriving API credentials from wallet signature...`);
      
      let apiCreds: any;
      
      try {
        // Create temporary client for deriving credentials
        // SignatureType: 0 = EOA (regular wallet), 1 = POLY_PROXY (Magic/Email), 2 = GNOSIS_SAFE
        const tempClient = new ClobClient(
          CLOB_API_BASE,
          137, // Polygon chain ID
          ethersSigner as any,
          undefined, // No API creds yet
          0, // SignatureType.EOA - for standard wallet (not Magic/Proxy wallet)
          walletAddress // funder address
        );

        // Derive existing API key (GET /auth/derive-api-key)
        logger.info(`[PolymarketService] Attempting to derive API key...`);
        apiCreds = await tempClient.deriveApiKey();
        logger.info(`[PolymarketService] Successfully derived API key from wallet signature`);
      } catch (deriveError) {
        const errorMsg = `Failed to derive Polymarket API credentials: ${deriveError instanceof Error ? deriveError.message : String(deriveError)}`;
        logger.error(`[PolymarketService] ${errorMsg}`);
        throw new Error(errorMsg);
      }

      // Create CLOB client with API credentials
      const clobClient = new ClobClient(
        CLOB_API_BASE,
        137, // Polygon chain ID
        ethersSigner as any,
        apiCreds,
        0, // SignatureType.EOA - for standard wallet
        walletAddress // funder address
      );

      logger.info(`[PolymarketService] CLOB client ready with API credentials`);

      // Create and post order in one call
      const result = await clobClient.createAndPostOrder(
        {
          tokenID: tokenId,
          price: price, // number
          side: side === "BUY" ? Side.BUY : Side.SELL,
          size: amount, // number
        },
        {
          tickSize: tickSize as any, // Use market's tick size (cast to any for compatibility)
          negRisk: negRisk, // Use market's negRisk flag
        },
        OrderType.GTC // Good-Till-Cancelled
      );

      // Check if result is actually a Cloudflare error (HTML response)
      if (result && typeof result === 'object' && 'error' in result) {
        const errorStr = String(result.error || '');
        if (errorStr.includes('Cloudflare') || errorStr.includes('<!DOCTYPE html>')) {
          throw new Error('Cloudflare blocked the order request. Polymarket CLOB trading is not available from this environment. Consider using the Polymarket web interface directly.');
        }
      }

      logger.info(`[PolymarketService] Order posted successfully: ${JSON.stringify(result)}`);

      return {
        orderId: result.orderID || result.id || "unknown",
        status: result.status || "success",
      };
    } catch (error) {
      // Check if error is Cloudflare-related
      const errorMsg = error instanceof Error ? error.message : String(error);
      if (errorMsg.includes('403') || errorMsg.includes('Cloudflare') || errorMsg.includes('Forbidden')) {
        logger.error(`[PolymarketService] Cloudflare blocked the request - automated trading not available from this IP/environment`);
        throw new Error('Polymarket trading is blocked by Cloudflare protection. This typically happens when:\n\n' +
          '1. Your IP is flagged as automated/VPS traffic\n' +
          '2. Missing browser-like characteristics\n' +
          '3. TLS fingerprinting detected non-browser client\n\n' +
          'Solutions:\n' +
          '- Use Polymarket web interface directly for trading\n' +
          '- Try from a residential IP (not VPS/cloud)\n' +
          '- Contact Polymarket support for API access whitelist\n' +
          '- Consider using a proxy service that can bypass Cloudflare\n\n' +
          'Note: Read-only features (market search, prices) still work fine.');
      }
      
      logger.error(`[PolymarketService] Place order failed: ${error}`);
      throw error;
    }
  }

  /**
   * Get order book for a specific token using CLOB client
   */
  async getOrderBook(tokenId: string): Promise<{
    bids: Array<{ price: number; size: number }>;
    asks: Array<{ price: number; size: number }>;
  }> {
    try {
      // Create CLOB client (no wallet needed for read-only)
      const clobClient = new ClobClient(
        CLOB_API_BASE,
        137, // Polygon chain ID
      );

      const book = await clobClient.getOrderBook(tokenId);

      return {
        bids: (book.bids || []).map((b: any) => ({
          price: parseFloat(b.price),
          size: parseFloat(b.size),
        })),
        asks: (book.asks || []).map((a: any) => ({
          price: parseFloat(a.price),
          size: parseFloat(a.size),
        })),
      };
    } catch (error) {
      logger.error(`[PolymarketService] Get order book failed: ${error}`);
      throw error;
    }
  }
}

