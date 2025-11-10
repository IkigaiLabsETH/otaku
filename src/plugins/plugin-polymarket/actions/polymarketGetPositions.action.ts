import {
  type Action,
  type ActionResult,
  type HandlerCallback,
  type IAgentRuntime,
  type Memory,
  type State,
  logger,
} from "@elizaos/core";
import { getEntityWallet } from "../../../utils/entity";
import { CdpService } from "src/plugins/plugin-cdp/services/cdp.service";

/**
 * POLYMARKET_GET_POSITIONS Action
 * Get user's Polymarket positions using Polymarket subgraph
 * 
 * Handles queries like:
 * - "Show my Polymarket positions"
 * - "What markets do I have positions in?"
 * - "My Polymarket portfolio"
 */
export const polymarketGetPositionsAction: Action = {
  name: "POLYMARKET_GET_POSITIONS",
  similes: [
    "MY_POLYMARKET_POSITIONS",
    "POLYMARKET_PORTFOLIO",
    "SHOW_POSITIONS",
    "MY_MARKETS",
    "POLYMARKET_HOLDINGS",
  ],
  description:
    "Get user's current Polymarket positions and holdings",

  parameters: {},

  validate: async (runtime: IAgentRuntime): Promise<boolean> => {
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
      const cdpService = runtime.getService(CdpService.serviceType) as CdpService;
      if (!cdpService) {
        throw new Error("Required services not available");
      }
      
      logger.info("[POLYMARKET_GET_POSITIONS] Handler called");

      // Get user's wallet address from CDP
      const wallet = await getEntityWallet(
        runtime,
        message,
        "POLYMARKET_GET_POSITIONS",
        callback,
      );

      if (wallet.success === false) {
        logger.error("[POLYMARKET_GET_POSITIONS] Failed to get entity wallet");
        return wallet.result;
      }

      const accountName = wallet.metadata?.accountName as string;
      const cdpAccount = await cdpService.getOrCreateWallet(accountName);
      const walletAddress = cdpAccount.address as string;

      if (!walletAddress) {
        const errorMsg = "Could not find wallet address";
        logger.error(`[POLYMARKET_GET_POSITIONS] ${errorMsg}`);

        const errorResult: ActionResult = {
          success: false,
          text: `❌ ${errorMsg}`,
          error: "missing_wallet_address",
        } as ActionResult;

        if (callback) {
          await callback({
            text: errorResult.text,
          });
        }

        return errorResult;
      }

      logger.info(`[POLYMARKET_GET_POSITIONS] Fetching positions for wallet: ${walletAddress}`);

      // Query Polymarket Data API
      const DATA_API_URL = `https://data-api.polymarket.com/positions?user=${walletAddress.toLowerCase()}`;

      const response = await fetch(DATA_API_URL, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Data API error: ${response.status} ${response.statusText}`);
      }

      const positions = await response.json();

      if (!Array.isArray(positions) || positions.length === 0) {
        const noPositionsText = "You don't have any Polymarket positions yet.";

        if (callback) {
          await callback({
            text: noPositionsText,
          });
        }

        return {
          success: true,
          text: noPositionsText,
          data: { positions: [] },
          values: {
            positions: [],
            totalValue: 0,
            totalPnl: 0,
            positionCount: 0,
          },
        } as ActionResult;
      }

      // Calculate totals
      const totalValue = positions.reduce((sum: number, p: any) => sum + parseFloat(p.currentValue || "0"), 0);
      const totalPnl = positions.reduce((sum: number, p: any) => sum + parseFloat(p.cashPnl || "0"), 0);

      // Format positions for display
      const formattedPositions = positions.map((pos: any) => ({
        market: pos.title || pos.question,
        outcome: pos.outcome,
        size: parseFloat(pos.size),
        avgPrice: parseFloat(pos.avgPrice),
        currentValue: parseFloat(pos.currentValue || "0"),
        pnl: parseFloat(pos.cashPnl || "0"),
        conditionId: pos.conditionId,
        marketSlug: pos.slug,
        eventSlug: pos.eventSlug,
      }));

      const successText = `✅ Found ${positions.length} Polymarket positions. Total value: $${totalValue.toFixed(2)} • P&L: $${totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(2)}`;

      if (callback) {
        await callback({
          text: successText,
          data: { positions: formattedPositions, totalValue, totalPnl },
        });
      }

      return {
        success: true,
        text: successText,
        data: { positions: formattedPositions, totalValue, totalPnl },
        values: {
          positions: formattedPositions,
          totalValue,
          totalPnl,
          positionCount: positions.length,
        },
      } as ActionResult;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error(`[POLYMARKET_GET_POSITIONS] Error: ${errorMsg}`);

      const errorResult: ActionResult = {
        success: false,
        text: `❌ Failed to get Polymarket positions: ${errorMsg}`,
        error: errorMsg,
      } as ActionResult;

      if (callback) {
        await callback({
          text: errorResult.text,
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
        content: { text: "Show my Polymarket positions" },
      },
      {
        name: "{{agent}}",
        content: {
          text: "I'll check your Polymarket portfolio.",
          actions: ["POLYMARKET_GET_POSITIONS"],
        },
      },
    ],
  ],
};

