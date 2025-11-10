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
 * POLYMARKET_EVENTS Action
 * List available event groups (lightweight - only title, slug, ID)
 * 
 * Returns a clean list of events so agent can show user what's available
 * User can then pick an event to see its markets
 * 
 * Handles queries like:
 * - "What events are on Polymarket?"
 * - "Show me available events"
 * - "What's happening on Polymarket?"
 * - "List events"
 */
export const polymarketEventsAction: Action = {
  name: "POLYMARKET_EVENTS",
  similes: [
    "LIST_EVENTS",
    "SHOW_EVENTS",
    "GET_EVENTS",
    "AVAILABLE_EVENTS",
    "WHATS_ON_POLYMARKET",
    "POLYMARKET_LIST",
  ],
  description:
    "List available Polymarket event groups with their titles and slugs (lightweight, no market details)",

  parameters: {},

  validate: async (runtime: IAgentRuntime): Promise<boolean> => {
    const service = runtime.getService(PolymarketService.serviceType) as PolymarketService;
    if (!service) {
      logger.error("[POLYMARKET_EVENTS] PolymarketService not available");
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
      logger.info("[POLYMARKET_EVENTS] Handler called");

      const service = runtime.getService(PolymarketService.serviceType) as PolymarketService;
      if (!service) {
        throw new Error("PolymarketService not available");
      }

      logger.info(`[POLYMARKET_EVENTS] Fetching events`);

      const events = await service.getEventsList();

      if (events.length === 0) {
        const noResultsText = "No events available at the moment.";

        if (callback) {
          await callback({
            text: noResultsText,
          });
        }

        return {
          success: true,
          text: noResultsText,
          data: [],
          values: {
            events: [],
            count: 0,
          },
        } as ActionResult;
      }

      // Success - let agent read from values
      const successText = `✅ Successfully fetched ${events.length} events from Polymarket.`;

      if (callback) {
        await callback({
          text: successText,
          actions: ["POLYMARKET_EVENT_MARKETS"],
          data: { events },
        });
      }

      return {
        success: true,
        text: successText,
        data: events,
        values: {
          events,
          eventTitles: events.map(e => e.title),
          eventSlugs: events.map(e => e.slug),
          eventIds: events.map(e => e.id),
          count: events.length,
        },
      } as ActionResult;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error(`[POLYMARKET_EVENTS] Error: ${errorMsg}`);

      const errorResult: ActionResult = {
        success: false,
        text: `Failed to get events: ${errorMsg}`,
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
        content: { text: "What events are on Polymarket?" },
      },
      {
        name: "{{agent}}",
        content: {
          text: "I'll show you the available event groups.",
          actions: ["POLYMARKET_EVENTS"],
        },
      },
    ],
  ],
};

