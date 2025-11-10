import {
  type Action,
  type ActionResult,
  type HandlerCallback,
  type IAgentRuntime,
  type Memory,
  type State,
  logger,
} from "@elizaos/core";
import { PolymarketService } from "../services/polymarket.service.ts";

/**
 * POLYMARKET_MARKET_INFO Action
 * Get detailed information about a specific market by ID or slug
 * 
 * Handles queries like:
 * - "Tell me about market 0x123..."
 * - "Show me will-trump-win market"
 * - "Get details for market ID xyz"
 */
export const polymarketMarketInfoAction: Action = {
  name: "POLYMARKET_MARKET_INFO",
  similes: [
    "GET_MARKET_INFO",
    "MARKET_INFO",
    "SHOW_MARKET",
    "GET_MARKET",
    "MARKET_DETAILS",
  ],
  description:
    "Get detailed information about a specific Polymarket prediction market by market ID or slug",

  parameters: {
    marketId: {
      type: "string",
      description: "Market condition ID (0x...) or slug (REQUIRED)",
      required: true,
    },
  },

  validate: async (runtime: IAgentRuntime): Promise<boolean> => {
    const service = runtime.getService(PolymarketService.serviceType) as PolymarketService;
    if (!service) {
      logger.error("[POLYMARKET_MARKET_INFO] PolymarketService not available");
      return false;
    }
    return true;
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    _state?: State,
    _options?: Record<string, unknown>,
    callback?: HandlerCallback
  ): Promise<ActionResult> => {
    try {
      logger.info("[POLYMARKET_MARKET_INFO] Handler called");

      const service = runtime.getService(PolymarketService.serviceType) as PolymarketService;
      if (!service) {
        throw new Error("PolymarketService not available");
      }

      // Extract parameters from state
      const composedState = await runtime.composeState(message, ["ACTION_STATE"], true);
      const params = composedState?.data?.actionParams || {};

      const marketId = params.marketId?.trim();

      // Store input parameters for return
      const inputParams = { marketId: marketId || "" };

      if (!marketId) {
        const errorMsg = "Missing required parameter 'marketId'. Please provide a condition ID (0x...) or market slug.";
        logger.error(`[POLYMARKET_MARKET_INFO] ${errorMsg}`);

        const errorResult: ActionResult = {
          success: false,
          text: errorMsg,
          error: "missing_required_parameter",
          input: inputParams,
        } as ActionResult & { input: typeof inputParams };

        if (callback) {
          await callback({
            text: `❌ ${errorMsg}`,
          });
        }

        return errorResult;
      }

      logger.info(`[POLYMARKET_MARKET_INFO] Fetching market: ${marketId}`);

      const market = await service.getMarketInfo(marketId);

      if (!market) {
        const notFoundText = `❌ Market not found: "${marketId}"\n\n` +
          `💡 **Tip**: Use the POLYMARKET_EVENT_MARKETS action first to get the correct market slug or ID.`;

        const errorResult: ActionResult = {
          success: false,
          text: notFoundText,
          error: "market_not_found",
          input: inputParams,
        } as ActionResult & { input: typeof inputParams };

        if (callback) {
          await callback({
            text: notFoundText,
            actions: ["POLYMARKET_EVENT_MARKETS"],
          });
        }

        return errorResult;
      }

      // Success - let agent read from values
      const successText = `✅ Successfully fetched market "${marketId}".`;

      if (callback) {
        await callback({
          text: successText,
          data: { market },
        });
      }

      return {
        success: true,
        text: successText,
        data: market,
        values: {
          market,
          conditionId: market.conditionId,
          question: market.question,
          category: market.category,
          outcomes: market.outcomes,
          volume: market.volume,
          liquidity: market.liquidity,
          active: market.active,
          closed: market.closed,
        },
        input: inputParams,
      } as ActionResult & { input: typeof inputParams };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error(`[POLYMARKET_MARKET_INFO] Error: ${errorMsg}`);

      const composedState = await runtime.composeState(message, ["ACTION_STATE"], true);
      const params = composedState?.data?.actionParams || {};
      const failureInputParams = {
        marketId: params.marketId?.trim() || "",
      };

      const errorText = `❌ Failed to get market info: ${errorMsg}\n\n` +
        `💡 **Tip**: Use the POLYMARKET_EVENT_MARKETS action first to see all markets in an event.\n` +
        `Markets are grouped under events, so you can browse the event's markets to find the correct market slug.`;

      const errorResult: ActionResult = {
        success: false,
        text: errorText,
        error: errorMsg,
        input: failureInputParams,
      } as ActionResult & { input: typeof failureInputParams };

      if (callback) {
        await callback({
          text: errorText,
          actions: ["POLYMARKET_EVENT_MARKETS"],
          content: { error: "action_failed", details: errorMsg },
        });
      }

      return errorResult;
    }
  },

  examples: [
    [
      {
        name: "{{user}}",
        content: { text: "Tell me about market 0x123..." },
      },
      {
        name: "{{agent}}",
        content: {
          text: "I'll get the details for that market.",
          actions: ["POLYMARKET_MARKET_INFO"],
        },
      },
    ],
  ],
};

