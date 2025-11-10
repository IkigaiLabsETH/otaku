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
 * POLYMARKET_EVENT_MARKETS Action
 * Get all markets for a specific event by ID or slug
 * 
 * Handles queries like:
 * - "Show me markets for Super Bowl Champion 2026"
 * - "What markets are in event 23656?"
 * - "Tell me about super-bowl-champion-2026-731"
 */
export const polymarketEventMarketsAction: Action = {
  name: "POLYMARKET_EVENT_MARKETS",
  similes: [
    "GET_EVENT_MARKETS",
    "EVENT_MARKETS",
    "SHOW_EVENT_MARKETS",
    "MARKETS_IN_EVENT",
    "EVENT_DETAILS",
  ],
  description:
    "Get all markets for a specific Polymarket event by event ID or slug",

  parameters: {
    eventId: {
      type: "string",
      description: "Event ID or slug (REQUIRED)",
      required: true,
    },
  },

  validate: async (runtime: IAgentRuntime): Promise<boolean> => {
    const service = runtime.getService(PolymarketService.serviceType) as PolymarketService;
    if (!service) {
      logger.error("[POLYMARKET_EVENT_MARKETS] PolymarketService not available");
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
      logger.info("[POLYMARKET_EVENT_MARKETS] Handler called");

      const service = runtime.getService(PolymarketService.serviceType) as PolymarketService;
      if (!service) {
        throw new Error("PolymarketService not available");
      }

      // Extract parameters from state
      const composedState = await runtime.composeState(message, ["ACTION_STATE"], true);
      const params = composedState?.data?.actionParams || {};

      const eventId = params.eventId?.trim();

      // Store input parameters for return
      const inputParams = { eventId: eventId || "" };

      if (!eventId) {
        const errorMsg = "Missing required parameter 'eventId'. Please provide an event ID or slug.";
        logger.error(`[POLYMARKET_EVENT_MARKETS] ${errorMsg}`);

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

      logger.info(`[POLYMARKET_EVENT_MARKETS] Fetching event: ${eventId}`);

      // Get event with all its markets
      const eventData = await service.getEventWithMarkets(eventId);

      if (!eventData) {
        const notFoundText = `❌ Event not found: "${eventId}"\n\n` +
          `💡 **Tip**: Use the POLYMARKET_EVENTS action first to get the correct event slug or ID.\n` +
          `Available events will show their slugs and IDs that you can use here.`;

        const errorResult: ActionResult = {
          success: false,
          text: notFoundText,
          error: "event_not_found",
          input: inputParams,
        } as ActionResult & { input: typeof inputParams };

        if (callback) {
          await callback({
            text: notFoundText,
            actions: ["POLYMARKET_EVENTS"],
          });
        }

        return errorResult;
      }

      const { event, markets } = eventData;

      // Success - let agent read from values
      const successText = `✅ Successfully fetched event "${event.title}" with ${markets.length} markets.`;

      if (callback) {
        await callback({
          text: successText,
          actions: ["POLYMARKET_MARKET_INFO"],
          data: { event, markets },
        });
      }

      return {
        success: true,
        text: successText,
        data: { event, markets },
        values: {
          event,
          markets,
          eventId: event.id,
          eventSlug: event.slug,
          eventTitle: event.title,
          marketCount: markets.length,
          marketSlugs: markets.map(m => m.slug),
        },
        input: inputParams,
      } as ActionResult & { input: typeof inputParams };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error(`[POLYMARKET_EVENT_MARKETS] Error: ${errorMsg}`);

      const composedState = await runtime.composeState(message, ["ACTION_STATE"], true);
      const params = composedState?.data?.actionParams || {};
      const failureInputParams = {
        eventId: params.eventId?.trim() || "",
      };

      const errorText = `❌ Failed to get event markets: ${errorMsg}\n\n` +
        `💡 **Tip**: Use the POLYMARKET_EVENTS action first to get the correct event slug or ID.\n` +
        `Available events will show their slugs and IDs that you can use here.`;

      const errorResult: ActionResult = {
        success: false,
        text: errorText,
        error: errorMsg,
        input: failureInputParams,
      } as ActionResult & { input: typeof failureInputParams };

      if (callback) {
        await callback({
          text: errorText,
          actions: ["POLYMARKET_EVENTS"],
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
        content: { text: "Show me markets for Super Bowl Champion 2026" },
      },
      {
        name: "{{agent}}",
        content: {
          text: "I'll get the markets for that event.",
          actions: ["POLYMARKET_EVENT_MARKETS"],
        },
      },
    ],
  ],
};

