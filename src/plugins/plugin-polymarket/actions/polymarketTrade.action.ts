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
import { CdpService } from "../../plugin-cdp/services/cdp.service.ts";
import { PolymarketService } from "../services/polymarket.service.ts";

/**
 * POLYMARKET_TRADE Action
 * Buy or sell shares in a Polymarket prediction market
 * 
 * Handles queries like:
 * - "Buy 10 shares of Yes in the Bitcoin market"
 * - "Sell my position in the election market"
 * - "Place a buy order at $0.65"
 */
export const polymarketTradeAction: Action = {
  name: "POLYMARKET_TRADE",
  similes: [
    "BUY_POLYMARKET",
    "SELL_POLYMARKET",
    "TRADE_POLYMARKET",
    "POLYMARKET_ORDER",
    "PLACE_ORDER",
  ],
  description:
    "Buy or sell shares in a Polymarket prediction market",

  parameters: {
    marketSlug: {
      type: "string",
      description: "Market slug (REQUIRED)",
      required: true,
    },
    side: {
      type: "string",
      description: "Order side: 'BUY' or 'SELL' (REQUIRED)",
      required: true,
    },
    outcome: {
      type: "string",
      description: "Outcome to trade (e.g., 'Yes', 'No', or outcome name)",
      required: true,
    },
    amount: {
      type: "number",
      description: "Amount in USDC to spend (for BUY) or number of shares to sell (for SELL)",
      required: true,
    },
    price: {
      type: "number",
      description: "Limit price (0.01 to 0.99). If not provided, uses market price",
      required: false,
    },
  },

  validate: async (runtime: IAgentRuntime): Promise<boolean> => {
    const cdpService = runtime.getService(CdpService.serviceType) as CdpService;
    const polymarketService = runtime.getService(PolymarketService.serviceType) as PolymarketService;
    
    if (!cdpService) {
      logger.error("[POLYMARKET_TRADE] CDP service not available");
      return false;
    }
    
    if (!polymarketService) {
      logger.error("[POLYMARKET_TRADE] Polymarket service not available");
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
      logger.info("[POLYMARKET_TRADE] Handler called");

      // Get services
      const cdpService = runtime.getService(CdpService.serviceType) as CdpService;
      const polymarketService = runtime.getService(PolymarketService.serviceType) as PolymarketService;

      if (!cdpService || !polymarketService) {
        throw new Error("Required services not available");
      }

      // Get user's wallet
      const wallet = await getEntityWallet(
        runtime,
        message,
        "POLYMARKET_TRADE",
        callback,
      );

      if (wallet.success === false) {
        logger.error("[POLYMARKET_TRADE] Failed to get entity wallet");
        return wallet.result;
      }

 
      const accountName = wallet.metadata?.accountName as string;
      const cdpAccount = await cdpService.getOrCreateWallet(accountName);
      const walletAddress = cdpAccount.address as string;

      if (!accountName || !walletAddress) {
        throw new Error("Could not find wallet account or address");
      }

      // Extract parameters
      const composedState = await runtime.composeState(message, ["ACTION_STATE"], true);
      const params = composedState?.data?.actionParams || {};

      const marketSlug = params.marketSlug?.trim();
      const side = params.side?.toUpperCase();
      const outcome = params.outcome?.trim();
      const amount = parseFloat(params.amount);
      const price = params.price ? parseFloat(params.price) : undefined;

      // Store input parameters
      const inputParams = {
        marketSlug: marketSlug || "",
        side: side || "",
        outcome: outcome || "",
        amount,
        price,
      };

      // Validate parameters
      if (!marketSlug || !side || !outcome || !amount) {
        const errorMsg = "Missing required parameters: marketSlug, side, outcome, amount";
        logger.error(`[POLYMARKET_TRADE] ${errorMsg}`);

        const errorResult: ActionResult = {
          success: false,
          text: `❌ ${errorMsg}`,
          error: "missing_parameters",
          input: inputParams,
        } as ActionResult & { input: typeof inputParams };

        if (callback) {
          await callback({
            text: errorResult.text,
          });
        }

        return errorResult;
      }

      if (side !== "BUY" && side !== "SELL") {
        const errorMsg = "Invalid side. Must be 'BUY' or 'SELL'";
        logger.error(`[POLYMARKET_TRADE] ${errorMsg}`);

        const errorResult: ActionResult = {
          success: false,
          text: `❌ ${errorMsg}`,
          error: "invalid_side",
          input: inputParams,
        } as ActionResult & { input: typeof inputParams };

        if (callback) {
          await callback({
            text: errorResult.text,
          });
        }

        return errorResult;
      }

      if (price !== undefined && (price < 0.01 || price > 0.99)) {
        const errorMsg = "Price must be between 0.01 and 0.99";
        logger.error(`[POLYMARKET_TRADE] ${errorMsg}`);

        const errorResult: ActionResult = {
          success: false,
          text: `❌ ${errorMsg}`,
          error: "invalid_price",
          input: inputParams,
        } as ActionResult & { input: typeof inputParams };

        if (callback) {
          await callback({
            text: errorResult.text,
          });
        }

        return errorResult;
      }

      logger.info(`[POLYMARKET_TRADE] ${side} ${amount} of ${outcome} in market ${marketSlug} at ${price || 'market price'}`);

      // Get market info to find token IDs
      const market = await polymarketService.getMarketInfo(marketSlug);

      if (!market) {
        const errorMsg = `Market not found: ${marketSlug}`;
        logger.error(`[POLYMARKET_TRADE] ${errorMsg}`);

        const errorResult: ActionResult = {
          success: false,
          text: `❌ ${errorMsg}\n\n💡 Use POLYMARKET_EVENT_MARKETS to find the correct market slug.`,
          error: "market_not_found",
          input: inputParams,
        } as ActionResult & { input: typeof inputParams };

        if (callback) {
          await callback({
            text: errorResult.text,
            actions: ["POLYMARKET_EVENT_MARKETS"],
          });
        }

        return errorResult;
      }

      // Find the outcome index
      const outcomeIndex = market.outcomes.findIndex(
        (o) => o.name.toLowerCase() === outcome.toLowerCase()
      );

      if (outcomeIndex === -1) {
        const availableOutcomes = market.outcomes.map(o => o.name).join(", ");
        const errorMsg = `Outcome "${outcome}" not found. Available outcomes: ${availableOutcomes}`;
        logger.error(`[POLYMARKET_TRADE] ${errorMsg}`);

        const errorResult: ActionResult = {
          success: false,
          text: `❌ ${errorMsg}`,
          error: "outcome_not_found",
          input: inputParams,
        } as ActionResult & { input: typeof inputParams };

        if (callback) {
          await callback({
            text: errorResult.text,
          });
        }

        return errorResult;
      }

      const tokenId = market.outcomes[outcomeIndex].tokenId;
      const currentPrice = market.outcomes[outcomeIndex].price || 0.5;
      const orderPrice = price || currentPrice;

      logger.info(`[POLYMARKET_TRADE] Token ID: ${tokenId}, Price: ${orderPrice}, Tick Size: ${market.tickSize}, Neg Risk: ${market.negRisk}`);

      // Get viem wallet client for signing
      const { walletClient } = await cdpService.getViemClientsForAccount({
        accountName,
        network: "polygon",
      });

      logger.info(`[POLYMARKET_TRADE] Got wallet client for Polygon`);

      // Place order via CLOB with correct tick size from market
      const orderResult = await polymarketService.placeOrder({
        walletClient,
        walletAddress,
        tokenId,
        side,
        amount,
        price: orderPrice,
        tickSize: market.tickSize,
        negRisk: market.negRisk,
      });

      logger.info(`[POLYMARKET_TRADE] Order placed successfully: ${JSON.stringify(orderResult)}`);

      const successText = `✅ Order placed successfully!\n\n` +
        `**Market:** ${market.question}\n` +
        `**Outcome:** ${outcome}\n` +
        `**Side:** ${side}\n` +
        `**Amount:** ${amount} ${side === 'BUY' ? 'USDC' : 'shares'}\n` +
        `**Price:** $${orderPrice.toFixed(2)}\n` +
        `**Order ID:** ${orderResult.orderId}\n` +
        `**Status:** ${orderResult.status}`;

      if (callback) {
        await callback({
          text: successText,
          data: {
            orderId: orderResult.orderId,
            status: orderResult.status,
            market: market.question,
            tokenId,
            side,
            outcome,
            amount,
            price: orderPrice,
          },
        });
      }

      return {
        success: true,
        text: successText,
        data: {
          orderId: orderResult.orderId,
          status: orderResult.status,
          market: market.question,
          conditionId: market.conditionId,
          tokenId,
          side,
          outcome,
          amount,
          price: orderPrice,
        },
        values: {
          orderId: orderResult.orderId,
          status: orderResult.status,
          market: market.question,
          conditionId: market.conditionId,
          tokenId,
          side,
          outcome,
          amount,
          price: orderPrice,
        },
        input: inputParams,
      } as ActionResult & { input: typeof inputParams };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error(`[POLYMARKET_TRADE] Error: ${errorMsg}`);

      const composedState = await runtime.composeState(message, ["ACTION_STATE"], true);
      const params = composedState?.data?.actionParams || {};
      
      const failureInputParams = {
        marketSlug: params.marketSlug?.trim() || "",
        side: params.side?.toUpperCase() || "",
        outcome: params.outcome?.trim() || "",
        amount: parseFloat(params.amount),
        price: params.price ? parseFloat(params.price) : undefined,
      };

      const errorResult: ActionResult = {
        success: false,
        text: `❌ Failed to place order: ${errorMsg}`,
        error: errorMsg,
        input: failureInputParams,
      } as ActionResult & { input: typeof failureInputParams };

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
        content: { text: "Buy 10 USDC of Yes in the Bitcoin market" },
      },
      {
        name: "{{agent}}",
        content: {
          text: "I'll place a buy order for you.",
          actions: ["POLYMARKET_TRADE"],
        },
      },
    ],
  ],
};

