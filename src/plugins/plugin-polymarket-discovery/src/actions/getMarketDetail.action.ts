/**
 * GET_POLYMARKET_DETAIL Action
 *
 * Get detailed information about a specific prediction market
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

interface GetMarketDetailParams {
  conditionId?: string;
  marketId?: string;
}

type GetMarketDetailInput = {
  conditionId?: string;
};

type GetMarketDetailActionResult = ActionResult & { input: GetMarketDetailInput };

export const getMarketDetailAction: Action = {
  name: "GET_POLYMARKET_DETAIL",
  similes: [
    "POLYMARKET_DETAILS",
    "MARKET_INFO",
    "MARKET_DETAILS",
    "SHOW_MARKET",
    "POLYMARKET_INFO",
    "MARKET_INFORMATION",
  ],
  description:
    "Get detailed information about a specific Polymarket prediction market including description, odds, volume, and timeline.",

  parameters: {
    conditionId: {
      type: "string",
      description: "Market condition ID (66-character hex string starting with 0x)",
      required: true,
    },
  },

  validate: async (runtime: IAgentRuntime, _message: Memory) => {
    try {
      const service = runtime.getService(
        PolymarketService.serviceType
      ) as PolymarketService;

      if (!service) {
        logger.warn("[GET_POLYMARKET_DETAIL] Polymarket service not available");
        return false;
      }

      return true;
    } catch (error) {
      logger.error(
        "[GET_POLYMARKET_DETAIL] Error validating action:",
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
      logger.info("[GET_POLYMARKET_DETAIL] Getting market details");

      // Read parameters from state
      const composedState = await runtime.composeState(message, ["ACTION_STATE"], true);
      const params = (composedState?.data?.actionParams ?? {}) as Partial<GetMarketDetailParams>;

      // Extract condition ID (support both conditionId and marketId for flexibility)
      const conditionId = (params.conditionId || params.marketId)?.trim();

      if (!conditionId) {
        const errorMsg = "Market condition ID is required";
        logger.error(`[GET_POLYMARKET_DETAIL] ${errorMsg}`);
        const errorResult: GetMarketDetailActionResult = {
          text: ` ${errorMsg}. Please provide the market condition ID.`,
          success: false,
          error: "missing_condition_id",
          input: { conditionId },
        };
        callback?.({
          text: errorResult.text,
          content: { error: "missing_condition_id", details: errorMsg },
        });
        return errorResult;
      }

      // Validate condition ID format (should be 66 chars starting with 0x)
      if (!conditionId.startsWith("0x") || conditionId.length !== 66) {
        const errorMsg = `Invalid condition ID format: ${conditionId}. Expected 66-character hex string starting with 0x`;
        logger.error(`[GET_POLYMARKET_DETAIL] ${errorMsg}`);
        const errorResult: GetMarketDetailActionResult = {
          text: ` ${errorMsg}`,
          success: false,
          error: "invalid_condition_id",
          input: { conditionId },
        };
        callback?.({
          text: errorResult.text,
          content: { error: "invalid_condition_id", details: errorMsg },
        });
        return errorResult;
      }

      const inputParams: GetMarketDetailInput = { conditionId };

      // Get service
      const service = runtime.getService(
        PolymarketService.serviceType
      ) as PolymarketService;

      if (!service) {
        const errorMsg = "Polymarket service not available";
        logger.error(`[GET_POLYMARKET_DETAIL] ${errorMsg}`);
        const errorResult: GetMarketDetailActionResult = {
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

      // Fetch market details and prices in parallel
      logger.info(`[GET_POLYMARKET_DETAIL] Fetching details for ${conditionId}`);
      const [market, prices] = await Promise.all([
        service.getMarketDetail(conditionId),
        service.getMarketPrices(conditionId),
      ]);

      // Format response
      let text = ` **${market.question}**\n\n`;

      if (market.description) {
        text += `**Description:** ${market.description}\n\n`;
      }

      text += `**Current Odds:**\n`;
      text += `   YES: ${prices.yes_price_formatted}\n`;
      text += `   NO: ${prices.no_price_formatted}\n`;
      text += `   Spread: ${(parseFloat(prices.spread) * 100).toFixed(2)}%\n\n`;

      if (market.category) {
        text += `**Category:** ${market.category}\n`;
      }

      if (market.volume) {
        const volumeNum = parseFloat(market.volume);
        if (!isNaN(volumeNum)) {
          text += `**Trading Volume:** $${volumeNum.toLocaleString()}\n`;
        }
      }

      if (market.liquidity) {
        const liquidityNum = parseFloat(market.liquidity);
        if (!isNaN(liquidityNum)) {
          text += `**Liquidity:** $${liquidityNum.toLocaleString()}\n`;
        }
      }

      if (market.end_date_iso) {
        const endDate = new Date(market.end_date_iso);
        text += `**Closes:** ${endDate.toLocaleString()}\n`;
      }

      text += `\n**Status:**\n`;
      text += `   Active: ${market.active ? "Yes" : "No"}\n`;
      text += `   Closed: ${market.closed ? "Yes" : "No"}\n`;
      text += `   Resolved: ${market.resolved ? "Yes" : "No"}\n`;

      if (market.tags && market.tags.length > 0) {
        text += `\n**Tags:** ${market.tags.join(", ")}\n`;
      }

      text += `\n**Market ID:** \`${conditionId}\``;

      const result: GetMarketDetailActionResult = {
        text,
        success: true,
        data: {
          market: {
            condition_id: market.condition_id,
            question: market.question,
            description: market.description,
            category: market.category,
            volume: market.volume,
            liquidity: market.liquidity,
            end_date: market.end_date_iso,
            active: market.active,
            closed: market.closed,
            resolved: market.resolved,
            tags: market.tags,
          },
          prices: {
            yes_price: prices.yes_price,
            no_price: prices.no_price,
            yes_price_formatted: prices.yes_price_formatted,
            no_price_formatted: prices.no_price_formatted,
            spread: prices.spread,
          },
        },
        input: inputParams,
      };

      logger.info(`[GET_POLYMARKET_DETAIL] Successfully fetched details for ${market.question}`);
      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error(`[GET_POLYMARKET_DETAIL] Error: ${errorMsg}`);
      const errorResult: ActionResult = {
        text: ` Failed to get market details: ${errorMsg}`,
        success: false,
        error: errorMsg,
      };
      callback?.({
        text: errorResult.text,
        content: { error: "fetch_failed", details: errorMsg },
      });
      return errorResult;
    }
  },

  examples: [
    [
      {
        name: "{{user}}",
        content: {
          text: "tell me more about market 0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
        },
      },
      {
        name: "{{agent}}",
        content: {
          text: " Getting market details...",
          action: "GET_POLYMARKET_DETAIL",
          conditionId:
            "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
        },
      },
    ],
    [
      {
        name: "{{user}}",
        content: { text: "show me details for that first market" },
      },
      {
        name: "{{agent}}",
        content: {
          text: " Fetching market information...",
          action: "GET_POLYMARKET_DETAIL",
          conditionId:
            "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
        },
      },
    ],
  ],
};

export default getMarketDetailAction;
