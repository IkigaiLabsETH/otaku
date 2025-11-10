import type { Plugin } from "@elizaos/core";
import { PolymarketService } from "./services/polymarket.service.ts";
import { polymarketMarketInfoAction } from "./actions/polymarketMarketInfo.action.ts";
import { polymarketEventsAction } from "./actions/polymarketEvents.action.ts";
import { polymarketEventMarketsAction } from "./actions/polymarketEventMarkets.action.ts";
import { polymarketGetPositionsAction } from "./actions/polymarketGetPositions.action.ts";
import { polymarketTradeAction } from "./actions/polymarketTrade.action.ts";

export const polymarketPlugin: Plugin = {
  name: "plugin-polymarket",
  description: "Polymarket prediction markets integration - list events, view markets, check positions, and trade",
  actions: [
    polymarketEventsAction,        // List available events (lightweight)
    polymarketEventMarketsAction,  // Get markets for a specific event
    polymarketMarketInfoAction,    // Get specific market by ID/slug
    polymarketGetPositionsAction,  // Get user's Polymarket positions
    polymarketTradeAction,         // Buy/sell market shares (TODO: needs CLOB integration)
  ],
  services: [PolymarketService],
  evaluators: [],
  providers: [],
};

export default polymarketPlugin;

// Export types for external use
export * from "./types.ts";
export { PolymarketService };

