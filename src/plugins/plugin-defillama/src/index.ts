import type { Plugin } from "@elizaos/core";
import { DefiLlamaService } from "./services/defillama.service";
import { getProtocolTvlAction } from "./actions/getProtocolTvl.action";
import { getYieldRatesAction } from "./actions/getYieldRates.action";

export const defiLlamaPlugin: Plugin = {
  name: "plugin-defillama",
  description: "DeFiLlama integration: protocol TVL lookups and yield opportunities",
  actions: [getProtocolTvlAction, getYieldRatesAction],
  evaluators: [],
  providers: [],
  services: [DefiLlamaService],
};

export default defiLlamaPlugin;
export { DefiLlamaService, getProtocolTvlAction, getYieldRatesAction };


