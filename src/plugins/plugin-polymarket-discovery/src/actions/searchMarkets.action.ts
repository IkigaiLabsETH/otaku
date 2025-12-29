/**
 * SEARCH_POLYMARKETS Action
 *
 * Search for prediction markets by keyword or category
 */

import {
  type Action,
  type IAgentRuntime,
  type Memory,
  type State,
  type HandlerCallback,
  type ActionResult,
  logger,
} from "@elizaos/core";
import { PolymarketService } from "../services/polymarket.service";

interface SearchMarketsParams {
  query?: string;
  category?: string;
  limit?: string | number;
}

type SearchMarketsInput = {
  query?: string;
  category?: string;
  limit?: number;
};

type SearchMarketsActionResult = ActionResult & { input: SearchMarketsInput };

export const searchMarketsAction: Action = {
  name: "SEARCH_POLYMARKETS",
  similes: [
    "FIND_POLYMARKET",
    "SEARCH_PREDICTIONS",
    "FIND_PREDICTIONS",
    "POLYMARKET_SEARCH",
    "QUERY_POLYMARKET",
    "LOOK_FOR_MARKETS",
  ],
  description:
    "Search for prediction markets on Polymarket by keyword or category. Useful for finding markets about specific topics or events.",

  parameters: {
    query: {
      type: "string",
      description: "Search keywords (e.g., 'bitcoin', 'election', 'AI')",
      required: false,
    },
    category: {
      type: "string",
      description: "Market category (e.g., 'crypto', 'politics', 'sports')",
      required: false,
    },
    limit: {
      type: "number",
      description: "Maximum number of results to return (default: 10, max: 50)",
      required: false,
    },
  },

  validate: async (runtime: IAgentRuntime, _message: Memory) => {
    try {
      const service = runtime.getService(
        PolymarketService.serviceType
      ) as PolymarketService;

      if (!service) {
        logger.warn("[SEARCH_POLYMARKETS] Polymarket service not available");
        return false;
      }

      return true;
    } catch (error) {
      logger.error(
        "[SEARCH_POLYMARKETS] Error validating action:",
        error instanceof Error ? error.message : String(error)
      );
      return false;
    }
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    _state?: State,
    _options?: Record<string, unknown>,
    callback?: HandlerCallback
  ): Promise<ActionResult> => {
    try {
      logger.info("[SEARCH_POLYMARKETS] Searching markets");

      // Read parameters from state
      const composedState = await runtime.composeState(message, ["ACTION_STATE"], true);
      const params = (composedState?.data?.actionParams ?? {}) as Partial<SearchMarketsParams>;

      // Extract search parameters
      const query = params.query?.trim();
      const category = params.category?.trim();

      // Parse limit
      let limit = 10;
      if (params.limit) {
        const parsedLimit =
          typeof params.limit === "string" ? parseInt(params.limit, 10) : params.limit;
        if (!isNaN(parsedLimit) && parsedLimit > 0) {
          limit = Math.min(parsedLimit, 50);
        }
      }

      // Validate at least one search criteria
      if (!query && !category) {
        const errorMsg = "Please provide either a search query or category";
        logger.error(`[SEARCH_POLYMARKETS] ${errorMsg}`);
        const errorResult: SearchMarketsActionResult = {
          text: ` ${errorMsg}`,
          success: false,
          error: "missing_criteria",
          input: { query, category, limit },
        };
        callback?.({
          text: errorResult.text,
          content: { error: "missing_criteria", details: errorMsg },
        });
        return errorResult;
      }

      const inputParams: SearchMarketsInput = { limit };
      if (query) inputParams.query = query;
      if (category) inputParams.category = category;

      // Get service
      const service = runtime.getService(
        PolymarketService.serviceType
      ) as PolymarketService;

      if (!service) {
        const errorMsg = "Polymarket service not available";
        logger.error(`[SEARCH_POLYMARKETS] ${errorMsg}`);
        const errorResult: SearchMarketsActionResult = {
          text: ` ${errorMsg}`,
          success: false,
          error: "service_unavailable",
          input: inputParams,
        };
        callback?.({
          text: errorResult.text,
          content: { error: "service_unavailable", details: errorMsg },
        });
        return errorResult;
      }

      // Perform search
      logger.info(
        `[SEARCH_POLYMARKETS] Searching with query="${query || 'none'}", category="${category || 'none'}"`
      );
      const markets = await service.searchMarkets({
        query,
        category,
        active: true,
        limit,
      });

      if (markets.length === 0) {
        const searchDesc = query
          ? `matching "${query}"`
          : category
            ? `in category "${category}"`
            : "matching your criteria";
        const result: SearchMarketsActionResult = {
          text: ` No prediction markets found ${searchDesc}.`,
          success: true,
          data: { markets: [], count: 0 },
          input: inputParams,
        };
        return result;
      }

      // Fetch prices for all markets in parallel
      logger.info(`[SEARCH_POLYMARKETS] Fetching prices for ${markets.length} markets`);
      const marketsWithPrices = await Promise.all(
        markets.map(async (market) => {
          try {
            const prices = await service.getMarketPrices(market.condition_id);
            return { market, prices };
          } catch (error) {
            logger.warn(
              `[SEARCH_POLYMARKETS] Failed to fetch prices for ${market.condition_id}: ${error instanceof Error ? error.message : String(error)}`
            );
            return {
              market,
              prices: {
                yes_price: "0.50",
                no_price: "0.50",
                yes_price_formatted: "50.0%",
                no_price_formatted: "50.0%",
                spread: "0.0000",
                last_updated: Date.now(),
                condition_id: market.condition_id,
              },
            };
          }
        })
      );

      // Format response
      const searchDesc = query
        ? `"${query}"`
        : category
          ? `category "${category}"`
          : "your search";
      let text = ` **Polymarket Search Results**\n\n`;
      text += `Found ${marketsWithPrices.length} markets for ${searchDesc}:\n\n`;

      marketsWithPrices.forEach(({ market, prices }, index) => {
        text += `**${index + 1}. ${market.question}**\n`;
        text += `   YES: ${prices.yes_price_formatted} | NO: ${prices.no_price_formatted}\n`;

        if (market.category) {
          text += `   Category: ${market.category}\n`;
        }

        if (market.volume) {
          const volumeNum = parseFloat(market.volume);
          if (!isNaN(volumeNum)) {
            text += `   Volume: $${volumeNum.toLocaleString()}\n`;
          }
        }

        text += "\n";
      });

      text +=
        "_Use GET_POLYMARKET_DETAIL to get more information about a specific market._";

      const result: SearchMarketsActionResult = {
        text,
        success: true,
        data: {
          markets: marketsWithPrices.map(({ market, prices }) => ({
            condition_id: market.condition_id,
            question: market.question,
            category: market.category,
            volume: market.volume,
            yes_price: prices.yes_price,
            no_price: prices.no_price,
            yes_price_formatted: prices.yes_price_formatted,
            no_price_formatted: prices.no_price_formatted,
          })),
          count: marketsWithPrices.length,
          search_query: query,
          search_category: category,
        },
        input: inputParams,
      };

      logger.info(`[SEARCH_POLYMARKETS] Successfully found ${marketsWithPrices.length} markets`);
      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error(`[SEARCH_POLYMARKETS] Error: ${errorMsg}`);
      const errorResult: ActionResult = {
        text: ` Failed to search markets: ${errorMsg}`,
        success: false,
        error: errorMsg,
      };
      callback?.({
        text: errorResult.text,
        content: { error: "search_failed", details: errorMsg },
      });
      return errorResult;
    }
  },

  examples: [
    [
      {
        name: "{{user}}",
        content: { text: "search polymarket for bitcoin predictions" },
      },
      {
        name: "{{agent}}",
        content: {
          text: " Searching for Bitcoin-related markets...",
          action: "SEARCH_POLYMARKETS",
          query: "bitcoin",
        },
      },
    ],
    [
      {
        name: "{{user}}",
        content: { text: "find prediction markets about AI" },
      },
      {
        name: "{{agent}}",
        content: {
          text: " Looking for AI prediction markets...",
          action: "SEARCH_POLYMARKETS",
          query: "AI",
        },
      },
    ],
    [
      {
        name: "{{user}}",
        content: { text: "show me crypto prediction markets" },
      },
      {
        name: "{{agent}}",
        content: {
          text: " Finding crypto markets...",
          action: "SEARCH_POLYMARKETS",
          category: "crypto",
        },
      },
    ],
  ],
};

export default searchMarketsAction;
