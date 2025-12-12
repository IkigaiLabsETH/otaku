import {
  type Action,
  type IAgentRuntime,
  logger,
  type Memory,
  type State,
  type HandlerCallback,
  type ActionResult,
} from "@elizaos/core";
import { parseUnits } from "viem";
import { BiconomyService } from "../services/biconomy.service";
import { CdpService } from "../../../plugin-cdp/services/cdp.service";
import { type QuoteRequest, CHAIN_ID_TO_NAME } from "../types";
import { CdpNetwork } from "../../../plugin-cdp/types";
import { getEntityWallet } from "../../../../utils/entity";
import { 
  resolveTokenToAddress, 
  getTokenDecimals 
} from "../../../plugin-relay/src/utils/token-resolver";

// CDP network mapping
const CDP_NETWORK_MAP: Record<string, CdpNetwork> = {
  ethereum: "ethereum",
  base: "base",
  optimism: "optimism",
  arbitrum: "arbitrum",
  polygon: "polygon",
  "base-sepolia": "base-sepolia",
};

const resolveCdpNetwork = (chainName: string): CdpNetwork => {
  const network = CDP_NETWORK_MAP[chainName.toLowerCase().trim()];
  if (!network) {
    throw new Error(`CDP wallet does not support signing transactions on ${chainName}`);
  }
  return network;
};

/**
 * MEE Supertransaction Rebalance Action
 * 
 * Enables gasless portfolio rebalancing and multi-output operations using Biconomy's
 * MEE (Modular Execution Environment). Supports:
 * - Single token to multiple target tokens (portfolio split)
 * - Cross-chain distribution with weight-based allocation
 * - Gas paid from input token - no native gas required
 */
export const meeSupertransactionRebalanceAction: Action = {
  name: "MEE_SUPERTRANSACTION_REBALANCE",
  description: `Execute gasless multi-chain portfolio rebalancing via Biconomy MEE Supertransaction. Use this for:
- Splitting one token into multiple tokens across chains (e.g., "Split 1000 USDC into 60% WETH on Base and 40% USDT on Optimism")
- Cross-chain portfolio distribution with weight-based allocation
- Gasless rebalancing - gas is paid from the input token, no native gas needed
Supports: Ethereum, Base, Arbitrum, Polygon, Optimism, BSC, Scroll, Gnosis, and more.`,
  similes: [
    "MEE_REBALANCE",
    "SUPERTRANSACTION_REBALANCE",
    "PORTFOLIO_REBALANCE",
    "SPLIT_TOKENS",
    "MULTI_CHAIN_REBALANCE",
    "GASLESS_REBALANCE",
  ],

  parameters: {
    inputToken: {
      type: "string",
      description: "Input token symbol or address (e.g., 'usdc', 'eth', '0x...')",
      required: true,
    },
    inputChain: {
      type: "string",
      description: "Input chain name (ethereum, base, arbitrum, polygon, optimism, bsc)",
      required: true,
    },
    inputAmount: {
      type: "string",
      description: "Amount to use in human-readable format (e.g., '1000' for 1000 USDC)",
      required: true,
    },
    targetTokens: {
      type: "string",
      description: "Target token symbols or addresses, comma-separated (e.g., 'weth,usdt')",
      required: true,
    },
    targetChains: {
      type: "string",
      description: "Target chain names, comma-separated, matching targetTokens order (e.g., 'base,optimism')",
      required: true,
    },
    targetWeights: {
      type: "string",
      description: "Target weights as decimals summing to 1.0, comma-separated (e.g., '0.6,0.4' for 60%/40%)",
      required: true,
    },
    slippage: {
      type: "number",
      description: "Slippage tolerance (0-1, e.g., 0.01 for 1%). Default: 0.01",
      required: false,
    },
  },

  validate: async (runtime: IAgentRuntime, message: Memory, state?: State) => {
    try {
      const biconomyService = runtime.getService(BiconomyService.serviceType) as BiconomyService;
      if (!biconomyService) {
        logger.warn("[MEE_SUPERTX_REBALANCE] MEE service not available");
        return false;
      }
      return true;
    } catch (error) {
      logger.error("[MEE_SUPERTX_REBALANCE] Validation error:", (error as Error).message);
      return false;
    }
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state?: State,
    options?: { [key: string]: unknown },
    callback?: HandlerCallback
  ): Promise<ActionResult> => {
    logger.info("[MEE_SUPERTX_REBALANCE] Handler invoked");

    try {
      // Get services
      const biconomyService = runtime.getService<BiconomyService>(BiconomyService.serviceType);
      if (!biconomyService) {
        const errorMsg = "MEE service not initialized";
        logger.error(`[MEE_SUPERTX_REBALANCE] ${errorMsg}`);
        callback?.({ text: `❌ ${errorMsg}` });
        return { text: `❌ ${errorMsg}`, success: false, error: "service_unavailable" };
      }

      const cdpService = runtime.getService?.("CDP_SERVICE") as unknown as CdpService;
      if (!cdpService || typeof cdpService.getViemClientsForAccount !== "function") {
        const errorMsg = "CDP service not available";
        logger.error(`[MEE_SUPERTX_REBALANCE] ${errorMsg}`);
        callback?.({ text: `❌ ${errorMsg}` });
        return { text: `❌ ${errorMsg}`, success: false, error: "service_unavailable" };
      }

      // Extract parameters from state
      const composedState = await runtime.composeState(message, ["ACTION_STATE"], true);
      const params = composedState?.data?.actionParams || {};

      // Validate required parameters
      const inputToken = params?.inputToken?.toLowerCase().trim();
      const inputChain = params?.inputChain?.toLowerCase().trim();
      const inputAmount = params?.inputAmount?.trim();
      const targetTokens = params?.targetTokens?.toLowerCase().trim();
      const targetChains = params?.targetChains?.toLowerCase().trim();
      const targetWeights = params?.targetWeights?.trim();
      const slippage = params?.slippage ?? 0.01;

      // Input parameters object for response
      const inputParams = {
        inputToken,
        inputChain,
        inputAmount,
        targetTokens,
        targetChains,
        targetWeights,
        slippage,
      };

      // Validation
      if (!inputToken || !inputChain || !inputAmount) {
        const errorMsg = "Missing required input parameters (inputToken, inputChain, inputAmount)";
        callback?.({ text: `❌ ${errorMsg}` });
        return { text: `❌ ${errorMsg}`, success: false, error: "missing_parameters", input: inputParams } as ActionResult & { input: typeof inputParams };
      }

      if (!targetTokens || !targetChains || !targetWeights) {
        const errorMsg = "Missing required target parameters (targetTokens, targetChains, targetWeights)";
        callback?.({ text: `❌ ${errorMsg}` });
        return { text: `❌ ${errorMsg}`, success: false, error: "missing_parameters", input: inputParams } as ActionResult & { input: typeof inputParams };
      }

      // Parse target arrays
      const tokens = targetTokens.split(",").map((t: string) => t.trim());
      const chains = targetChains.split(",").map((c: string) => c.trim());
      const weights = targetWeights.split(",").map((w: string) => parseFloat(w.trim()));

      if (tokens.length !== chains.length || tokens.length !== weights.length) {
        const errorMsg = "Target arrays must have the same length (tokens, chains, weights)";
        callback?.({ text: `❌ ${errorMsg}` });
        return { text: `❌ ${errorMsg}`, success: false, error: "invalid_parameters", input: inputParams } as ActionResult & { input: typeof inputParams };
      }

      // Validate weights sum to 1.0
      const weightSum = weights.reduce((sum: number, w: number) => sum + w, 0);
      if (Math.abs(weightSum - 1.0) > 0.001) {
        const errorMsg = `Target weights must sum to 1.0 (got ${weightSum.toFixed(3)})`;
        callback?.({ text: `❌ ${errorMsg}` });
        return { text: `❌ ${errorMsg}`, success: false, error: "invalid_weights", input: inputParams } as ActionResult & { input: typeof inputParams };
      }

      // Resolve chain IDs
      const inputChainId = biconomyService.resolveChainId(inputChain);
      if (!inputChainId) {
        const errorMsg = `Unsupported input chain: ${inputChain}`;
        callback?.({ text: `❌ ${errorMsg}` });
        return { text: `❌ ${errorMsg}`, success: false, error: "unsupported_chain", input: inputParams } as ActionResult & { input: typeof inputParams };
      }

      const targetChainIds = chains.map((c: string) => biconomyService.resolveChainId(c));
      for (let i = 0; i < targetChainIds.length; i++) {
        if (!targetChainIds[i]) {
          const errorMsg = `Unsupported target chain: ${chains[i]}`;
          callback?.({ text: `❌ ${errorMsg}` });
          return { text: `❌ ${errorMsg}`, success: false, error: "unsupported_chain", input: inputParams } as ActionResult & { input: typeof inputParams };
        }
      }

      // Get user wallet
      const wallet = await getEntityWallet(runtime as any, message, "MEE_SUPERTX_REBALANCE", callback);
      if (wallet.success === false) {
        logger.warn("[MEE_SUPERTX_REBALANCE] Entity wallet verification failed");
        return { ...wallet.result, input: inputParams } as ActionResult & { input: typeof inputParams };
      }

      const accountName = wallet.metadata?.accountName as string;
      if (!accountName) {
        const errorMsg = "Could not resolve user wallet";
        callback?.({ text: `❌ ${errorMsg}` });
        return { text: `❌ ${errorMsg}`, success: false, error: "missing_wallet", input: inputParams } as ActionResult & { input: typeof inputParams };
      }

      // Get viem clients and CDP account
      const cdpNetwork = resolveCdpNetwork(inputChain);
      const viemClient = await cdpService.getViemClientsForAccount({
        accountName,
        network: cdpNetwork,
      });

      const userAddress = viemClient.address as `0x${string}`;
      const cdpAccount = viemClient.cdpAccount; // Use CDP account for native EIP-712 signing

      // Resolve token addresses using CoinGecko (same as CDP/Relay)
      const inputTokenAddress = await resolveTokenToAddress(inputToken, inputChain);
      if (!inputTokenAddress) {
        const errorMsg = `Cannot resolve input token: ${inputToken} on ${inputChain}`;
        callback?.({ text: `❌ ${errorMsg}` });
        return { text: `❌ ${errorMsg}`, success: false, error: "token_resolution_failed", input: inputParams } as ActionResult & { input: typeof inputParams };
      }

      const targetTokenAddresses: string[] = [];
      for (let i = 0; i < tokens.length; i++) {
        const address = await resolveTokenToAddress(tokens[i], chains[i]);
        if (!address) {
          const errorMsg = `Cannot resolve target token: ${tokens[i]} on ${chains[i]}`;
          callback?.({ text: `❌ ${errorMsg}` });
          return { text: `❌ ${errorMsg}`, success: false, error: "token_resolution_failed", input: inputParams } as ActionResult & { input: typeof inputParams };
        }
        targetTokenAddresses.push(address);
      }

      // Get token decimals from CoinGecko
      const decimals = await getTokenDecimals(inputTokenAddress, inputChain);
      const amountInWei = parseUnits(inputAmount, decimals);

      // Build compose flow for rebalancing
      const rebalanceFlow = biconomyService.buildMultiIntentFlow(
        [{ chainId: inputChainId, tokenAddress: inputTokenAddress, amount: amountInWei.toString() }],
        targetChainIds.map((chainId: number | undefined, i: number) => ({
          chainId: chainId!,
          tokenAddress: targetTokenAddresses[i],
          weight: weights[i],
        })),
        slippage
      );

      // Build withdrawal instructions for each target token to transfer back to EOA
      // Without these, tokens remain in the Biconomy Nexus/Smart Account
      const withdrawalFlows = targetChainIds.map((chainId: number | undefined, i: number) =>
        biconomyService.buildWithdrawalInstruction(
          targetTokenAddresses[i],
          chainId!,
          userAddress
        )
      );

      // Build quote request - using EOA mode since CDP wallets are EOAs
      // Includes rebalance + withdrawals to send all output tokens directly to user's EOA
      const quoteRequest: QuoteRequest = {
        mode: "eoa",
        ownerAddress: userAddress,
        composeFlows: [rebalanceFlow, ...withdrawalFlows], // Rebalance then withdraw all outputs
        // For EOA mode, we need to specify funding tokens
        fundingTokens: [
          {
            tokenAddress: inputTokenAddress,
            chainId: inputChainId,
            amount: amountInWei.toString(),
          },
        ],
        // Use input token to pay for gas (gasless from user perspective)
        feeToken: {
          address: inputTokenAddress,
          chainId: inputChainId,
        },
      };

      callback?.({ text: `🔄 Getting quote from MEE...` });

      // Execute the intent using CDP account for native EIP-712 signing
      // This bypasses the RPC and signs directly on Coinbase servers
      const result = await biconomyService.executeIntent(
        quoteRequest,
        cdpAccount, // CDP account for native signing
        undefined,  // No walletClient needed
        undefined,  // No account needed
        (status) => callback?.({ text: status })
      );

      if (result.success && result.supertxHash) {
        const explorerUrl = biconomyService.getExplorerUrl(result.supertxHash);
        
        // Build target description
        const targetDesc = tokens.map((t: string, i: number) => 
          `${(weights[i] * 100).toFixed(0)}% ${t.toUpperCase()} on ${chains[i]}`
        ).join(", ");

        const responseText = `
✅ **MEE Supertransaction Rebalance Executed**

**Input:** ${inputAmount} ${inputToken.toUpperCase()} on ${inputChain}
**Output:** ${targetDesc}
**Slippage:** ${(slippage * 100).toFixed(1)}%
**Gas:** Paid from input token

**Supertx Hash:** \`${result.supertxHash}\`
**Track:** [MEE Explorer](${explorerUrl})
        `.trim();

        callback?.({
          text: responseText,
          actions: ["MEE_SUPERTRANSACTION_REBALANCE"],
          source: message.content.source,
        });

        return {
          text: responseText,
          success: true,
          data: {
            supertxHash: result.supertxHash,
            explorerUrl,
            input: inputParams,
          },
        };
      } else {
        const errorMsg = result.error || "Unknown execution error";
        callback?.({ text: `❌ Execution failed: ${errorMsg}` });
        return {
          text: `❌ Execution failed: ${errorMsg}`,
          success: false,
          error: "execution_failed",
          input: inputParams,
        } as ActionResult;
      }
    } catch (error) {
      const err = error as Error;
      logger.error(`[MEE_SUPERTX_REBALANCE] Handler error: ${err.message}`);
      callback?.({ text: `❌ Error: ${err.message}` });
      return {
        text: `❌ Error: ${err.message}`,
        success: false,
        error: "handler_error",
      };
    }
  },

  examples: [
    [
      {
        name: "{{user}}",
        content: {
          text: "Split 1000 USDC on Base into 60% WETH on Base and 40% USDT on Optimism",
        },
      },
      {
        name: "{{agent}}",
        content: {
          text: "I'll execute this gasless portfolio split via MEE Supertransaction...",
          action: "MEE_SUPERTRANSACTION_REBALANCE",
        },
      },
    ],
    [
      {
        name: "{{user}}",
        content: {
          text: "Rebalance my 0.5 ETH on Ethereum to 50% USDC on Base and 50% USDC on Arbitrum",
        },
      },
      {
        name: "{{agent}}",
        content: {
          text: "Executing gasless multi-chain rebalance via MEE Supertransaction...",
          action: "MEE_SUPERTRANSACTION_REBALANCE",
        },
      },
    ],
  ],
};

export default meeSupertransactionRebalanceAction;

