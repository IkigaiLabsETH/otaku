import {
  type Action,
  type ActionResult,
  type HandlerCallback,
  type IAgentRuntime,
  logger,
  type Memory,
  type State,
} from "@elizaos/core";
import { parseUnits, type PublicClient, formatUnits } from "viem";
import { getEntityWallet } from "../../../../utils/entity";
import { CdpService } from "../../../plugin-cdp/services/cdp.service";
import { CdpNetwork } from "../../../plugin-cdp/types";
import {
  getTokenDecimals,
  getHardcodedTokens,
} from "../../../plugin-relay/src/utils/token-resolver";
import { BiconomyService } from "../services/biconomy.service";
import { type QuoteRequest, type ComposeFlow, BICONOMY_SUPPORTED_CHAINS } from "../types";
import { validateBiconomyService } from "../utils/actionHelpers";
import {
  resolveTokenForBiconomy,
  isNativeToken,
  NATIVE_TOKEN_ADDRESS,
} from "../utils/token-resolver";

// ERC20 ABI for balanceOf
const ERC20_ABI = [
  {
    constant: true,
    inputs: [{ name: "_owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "balance", type: "uint256" }],
    type: "function",
  },
] as const;

// CDP network mapping (chain ID -> CDP network name)
const CDP_NETWORK_MAP: Record<number, CdpNetwork> = {
  1: "ethereum",
  8453: "base",
  10: "optimism",
  42161: "arbitrum",
  137: "polygon",
};

const resolveCdpNetworkFromChainId = (chainId: number): CdpNetwork => {
  const network = CDP_NETWORK_MAP[chainId];
  if (!network) {
    throw new Error(`CDP wallet does not support chain ID ${chainId}`);
  }
  return network;
};

// Get chain name from chain ID
const getChainNameFromId = (chainId: number): string => {
  const map: Record<number, string> = {
    1: "ethereum",
    8453: "base",
    10: "optimism",
    42161: "arbitrum",
    137: "polygon",
  };
  return map[chainId] || "unknown";
};

interface TokenBalance {
  chainId: number;
  chainName: string;
  tokenAddress: `0x${string}`;
  tokenSymbol: string;
  balance: bigint;
  decimals: number;
  isNative: boolean;
  valueUSD?: number;
}

/**
 * Get all token balances from a Nexus account on a specific chain
 * Checks common tokens (USDC, USDT, DAI, WETH, native token) + any additional tokens
 */
async function getNexusTokenBalances(
  publicClient: PublicClient,
  nexusAddress: `0x${string}`,
  chainId: number,
  chainName: string,
): Promise<TokenBalance[]> {
  const balances: TokenBalance[] = [];
  
  logger.info(`[BICONOMY_AUTO_WITHDRAW] Scanning tokens on ${chainName} (${chainId}) for Nexus ${nexusAddress}`);

  // Get hardcoded tokens for this chain
  const hardcodedTokens = getHardcodedTokens(chainName);
  
  // Priority tokens to check (most common/valuable tokens first)
  const priorityTokens = ["usdc", "usdt", "dai", "weth", "usdc.e", "usdce"];
  
  // Check native token balance first
  try {
    const nativeBalance = await publicClient.getBalance({ address: nexusAddress });
    if (nativeBalance > 0n) {
      const nativeSymbol = chainName === "polygon" ? "POL" : "ETH";
      logger.info(`[BICONOMY_AUTO_WITHDRAW] Found native ${nativeSymbol} balance: ${formatUnits(nativeBalance, 18)}`);
      balances.push({
        chainId,
        chainName,
        tokenAddress: NATIVE_TOKEN_ADDRESS as `0x${string}`,
        tokenSymbol: nativeSymbol,
        balance: nativeBalance,
        decimals: 18,
        isNative: true,
      });
    }
  } catch (error) {
    logger.warn(`[BICONOMY_AUTO_WITHDRAW] Error checking native balance: ${(error as Error).message}`);
  }

  // Check priority ERC20 tokens
  for (const symbol of priorityTokens) {
    const address = hardcodedTokens[symbol];
    if (!address) continue;

    try {
      const balance = await publicClient.readContract({
        address: address as `0x${string}`,
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: [nexusAddress],
      }) as bigint;

      if (balance > 0n) {
        const decimals = await getTokenDecimals(address, chainName);
        const balanceFormatted = formatUnits(balance, decimals);
        logger.info(`[BICONOMY_AUTO_WITHDRAW] Found ${symbol.toUpperCase()} balance: ${balanceFormatted}`);
        
        balances.push({
          chainId,
          chainName,
          tokenAddress: address as `0x${string}`,
          tokenSymbol: symbol.toUpperCase(),
          balance,
          decimals,
          isNative: false,
        });
      }
    } catch (error) {
      logger.debug(`[BICONOMY_AUTO_WITHDRAW] Error checking ${symbol}: ${(error as Error).message}`);
    }
  }

  // Check other hardcoded tokens
  for (const [symbol, address] of Object.entries(hardcodedTokens)) {
    if (priorityTokens.includes(symbol)) continue; // Already checked

    try {
      const balance = await publicClient.readContract({
        address: address as `0x${string}`,
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: [nexusAddress],
      }) as bigint;

      if (balance > 0n) {
        const decimals = await getTokenDecimals(address, chainName);
        const balanceFormatted = formatUnits(balance, decimals);
        logger.info(`[BICONOMY_AUTO_WITHDRAW] Found ${symbol.toUpperCase()} balance: ${balanceFormatted}`);
        
        balances.push({
          chainId,
          chainName,
          tokenAddress: address as `0x${string}`,
          tokenSymbol: symbol.toUpperCase(),
          balance,
          decimals,
          isNative: false,
        });
      }
    } catch (error) {
      logger.debug(`[BICONOMY_AUTO_WITHDRAW] Error checking ${symbol}: ${(error as Error).message}`);
    }
  }

  return balances;
}

/**
 * Filter spam tokens based on minimum thresholds
 * Filters out tokens with very low balance (likely spam/dust)
 */
function filterSpamTokens(balances: TokenBalance[]): TokenBalance[] {
  const SPAM_THRESHOLDS: Record<string, bigint> = {
    // Stablecoins: minimum $0.01 (0.01 tokens)
    USDC: parseUnits("0.01", 6),
    USDT: parseUnits("0.01", 6),
    DAI: parseUnits("0.01", 18),
    "USDC.E": parseUnits("0.01", 6),
    USDCE: parseUnits("0.01", 6),
    
    // WETH: minimum 0.0001 ETH (~$0.30 at $3000/ETH)
    WETH: parseUnits("0.0001", 18),
    
    // Native tokens: minimum 0.0001 (same as WETH)
    ETH: parseUnits("0.0001", 18),
    POL: parseUnits("0.01", 18), // POL is cheaper, use higher threshold
  };

  const filtered = balances.filter((balance) => {
    const threshold = SPAM_THRESHOLDS[balance.tokenSymbol] || parseUnits("0.0001", balance.decimals);
    
    if (balance.balance < threshold) {
      logger.info(
        `[BICONOMY_AUTO_WITHDRAW] Filtering out ${balance.tokenSymbol} on ${balance.chainName}: balance ${formatUnits(balance.balance, balance.decimals)} below threshold ${formatUnits(threshold, balance.decimals)}`
      );
      return false;
    }
    
    return true;
  });

  logger.info(`[BICONOMY_AUTO_WITHDRAW] Filtered ${balances.length - filtered.length} spam tokens, ${filtered.length} legitimate tokens remaining`);
  return filtered;
}

/**
 * Find a suitable funding token from user's EOA balance
 * Checks hardcoded tokens (USDC, USDT, DAI, etc.) and returns the first one with balance
 */
async function findFundingTokenWithBalance(
  publicClient: PublicClient,
  userAddress: `0x${string}`,
  chainName: string,
): Promise<{ symbol: string; address: `0x${string}` } | null> {
  const hardcodedTokens = getHardcodedTokens(chainName);
  const priorityOrder = ["usdc", "usdt", "dai", "usdce", "usdc.e"];
  
  // Check priority tokens first
  for (const symbol of priorityOrder) {
    const address = hardcodedTokens[symbol];
    if (!address) continue;
    
    try {
      const balance = await publicClient.readContract({
        address: address as `0x${string}`,
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: [userAddress],
      }) as bigint;
      
      const decimals = await getTokenDecimals(address, chainName);
      const minAmount = parseUnits("1", decimals); // Require at least 1 token for funding
      
      if (balance >= minAmount) {
        logger.info(`[BICONOMY_AUTO_WITHDRAW] Found funding token: ${symbol.toUpperCase()} with balance ${formatUnits(balance, decimals)}`);
        return { symbol, address: address as `0x${string}` };
      }
    } catch (error) {
      logger.debug(`[BICONOMY_AUTO_WITHDRAW] Error checking ${symbol}: ${(error as Error).message}`);
    }
  }
  
  // Check other tokens
  for (const [symbol, address] of Object.entries(hardcodedTokens)) {
    if (priorityOrder.includes(symbol)) continue;
    
    try {
      const balance = await publicClient.readContract({
        address: address as `0x${string}`,
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: [userAddress],
      }) as bigint;
      
      const decimals = await getTokenDecimals(address, chainName);
      const minAmount = parseUnits("1", decimals);
      
      if (balance >= minAmount) {
        logger.info(`[BICONOMY_AUTO_WITHDRAW] Found funding token: ${symbol.toUpperCase()} with balance ${formatUnits(balance, decimals)}`);
        return { symbol, address: address as `0x${string}` };
      }
    } catch (error) {
      logger.debug(`[BICONOMY_AUTO_WITHDRAW] Error checking ${symbol}: ${(error as Error).message}`);
    }
  }
  
  return null;
}

/**
 * Biconomy Auto Withdraw Action
 * 
 * Scans all supported chains for tokens in the user's Nexus Smart Account,
 * filters out spam tokens, and withdraws all legitimate tokens to the user's EOA.
 */
export const biconomyAutoWithdrawAction: Action = {
  name: "BICONOMY_AUTO_WITHDRAW",
  description: `Automatically scan all Biconomy Nexus Smart Accounts across supported chains (Ethereum, Base, Arbitrum, Optimism, Polygon) for available tokens, filter out spam/dust tokens, and withdraw all legitimate tokens to your main wallet.
This action will:
1. Check your Nexus account on each supported chain
2. Scan for common tokens (USDC, USDT, DAI, WETH, native tokens, etc.)
3. Filter out spam tokens (tokens with very low value/balance)
4. Withdraw all legitimate tokens back to your EOA wallet
No parameters needed - fully automatic!`,
  similes: [
    "AUTO_WITHDRAW_BICONOMY",
    "SWEEP_NEXUS_ACCOUNTS",
    "WITHDRAW_ALL_CHAINS",
    "CLEANUP_NEXUS_WALLETS",
  ],

  parameters: {
    fundingAmount: {
      type: "string",
      description: "Amount of funding token to use per chain for orchestration fees (e.g., '2'). System will auto-find USDC/USDT/DAI. Default: 2",
      required: false,
    },
    withdrawAddress: {
      type: "string",
      description: "Address to withdraw all tokens to. Default: user's EOA address",
      required: false,
    },
  },

  validate: async (runtime: IAgentRuntime, message: Memory, state?: State) => {
    return validateBiconomyService(runtime, "BICONOMY_AUTO_WITHDRAW", state, message);
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state?: State,
    options?: { [key: string]: unknown },
    callback?: HandlerCallback
  ): Promise<ActionResult> => {
    logger.info("[BICONOMY_AUTO_WITHDRAW] Handler invoked");

    try {
      // Get services
      const biconomyService = runtime.getService<BiconomyService>(BiconomyService.serviceType);
      if (!biconomyService) {
        callback?.({ text: "❌ Biconomy service not initialized" });
        return { text: "❌ Biconomy service not initialized", success: false, error: "service_unavailable" };
      }

      const cdpService = runtime.getService?.("CDP_SERVICE") as unknown as CdpService;
      if (!cdpService) {
        callback?.({ text: "❌ CDP service not available" });
        return { text: "❌ CDP service not available", success: false, error: "service_unavailable" };
      }

      // Extract parameters
      const composedState = await runtime.composeState(message, ["ACTION_STATE"], true);
      const params = (composedState?.data?.actionParams || {}) as any;

      const fundingAmountPerChain = (params?.fundingAmount?.trim() || "2") as string;
      const withdrawAddressParam = params?.withdrawAddress?.trim() as string | undefined;

      callback?.({ text: "🔍 Starting auto-withdrawal scan across all chains..." });

      // Get user wallet
      const wallet = await getEntityWallet(runtime as any, message, "BICONOMY_AUTO_WITHDRAW", callback);
      if (wallet.success === false) {
        return wallet.result;
      }

      const accountName = wallet.metadata?.accountName as string;
      if (!accountName) {
        callback?.({ text: "❌ Could not resolve user wallet" });
        return { text: "❌ Could not resolve user wallet", success: false, error: "missing_wallet" };
      }

      // Get a CDP client for the default chain (Base) to get the user address
      const defaultCdpNetwork = "base";
      const defaultViemClient = await cdpService.getViemClientsForAccount({
        accountName,
        network: defaultCdpNetwork,
      });
      const userAddress = defaultViemClient.address as `0x${string}`;
      const withdrawAddress = (withdrawAddressParam || userAddress) as `0x${string}`;

      logger.info(`[BICONOMY_AUTO_WITHDRAW] User address: ${userAddress}, Withdraw to: ${withdrawAddress}`);

      // Scan all supported chains
      const supportedChains = Object.entries(BICONOMY_SUPPORTED_CHAINS);
      let totalTokensFound = 0;
      const allBalances: TokenBalance[] = [];
      const chainsWithBalances: string[] = [];

      for (const [chainName, chainId] of supportedChains) {
        try {
          callback?.({ text: `🔍 Scanning ${chainName} (${chainId})...` });
          
          // Get Nexus address for this chain
          const nexusAddress = await biconomyService.getNexusAddress(userAddress, chainId);
          if (!nexusAddress) {
            logger.info(`[BICONOMY_AUTO_WITHDRAW] No Nexus account found on ${chainName}, skipping`);
            continue;
          }

          logger.info(`[BICONOMY_AUTO_WITHDRAW] Found Nexus account on ${chainName}: ${nexusAddress}`);

          // Get viem client for this chain
          const cdpNetwork = resolveCdpNetworkFromChainId(chainId);
          const viemClient = await cdpService.getViemClientsForAccount({
            accountName,
            network: cdpNetwork,
          });
          const publicClient = viemClient.publicClient;

          // Get all token balances on this chain
          const balances = await getNexusTokenBalances(publicClient, nexusAddress, chainId, chainName);
          
          if (balances.length > 0) {
            totalTokensFound += balances.length;
            allBalances.push(...balances);
            chainsWithBalances.push(chainName);
            callback?.({ text: `✅ Found ${balances.length} token(s) on ${chainName}` });
          } else {
            callback?.({ text: `ℹ️ No tokens found on ${chainName}` });
          }
        } catch (error) {
          logger.error(`[BICONOMY_AUTO_WITHDRAW] Error scanning ${chainName}: ${(error as Error).message}`);
          callback?.({ text: `⚠️ Error scanning ${chainName}: ${(error as Error).message}` });
        }
      }

      if (allBalances.length === 0) {
        callback?.({ text: "ℹ️ No tokens found in any Nexus accounts" });
        return { 
          text: "ℹ️ No tokens found in any Nexus accounts", 
          success: true,
          data: { chainsScanned: supportedChains.length, tokensFound: 0 }
        };
      }

      callback?.({ text: `📊 Found ${totalTokensFound} total token(s) across ${chainsWithBalances.length} chain(s)` });

      // Filter spam tokens
      callback?.({ text: "🧹 Filtering spam tokens..." });
      const legitimateBalances = filterSpamTokens(allBalances);

      if (legitimateBalances.length === 0) {
        callback?.({ text: "ℹ️ All tokens filtered as spam/dust. No withdrawals needed." });
        return {
          text: "ℹ️ All tokens filtered as spam/dust. No withdrawals needed.",
          success: true,
          data: { 
            chainsScanned: supportedChains.length, 
            tokensFound: totalTokensFound,
            tokensFiltered: totalTokensFound,
          }
        };
      }

      callback?.({ text: `✅ ${legitimateBalances.length} legitimate token(s) to withdraw` });

      // Group balances by chain for batch processing
      const balancesByChain = legitimateBalances.reduce((acc, balance) => {
        if (!acc[balance.chainId]) {
          acc[balance.chainId] = [];
        }
        acc[balance.chainId].push(balance);
        return acc;
      }, {} as Record<number, TokenBalance[]>);

      // Build withdrawal instructions and execute per chain
      const results: any[] = [];
      
      for (const [chainIdStr, balances] of Object.entries(balancesByChain)) {
        const chainId = Number(chainIdStr);
        const chainName = getChainNameFromId(chainId);
        
        try {
          callback?.({ text: `\n💰 Withdrawing ${balances.length} token(s) from ${chainName}...` });

          // Get viem client for this chain
          const cdpNetwork = resolveCdpNetworkFromChainId(chainId);
          const viemClient = await cdpService.getViemClientsForAccount({
            accountName,
            network: cdpNetwork,
          });
          const publicClient = viemClient.publicClient;
          const walletClient = viemClient.walletClient;
          const cdpAccount = viemClient.cdpAccount;

          // Find funding token on this chain
          const fundingTokenInfo = await findFundingTokenWithBalance(publicClient, userAddress, chainName);
          if (!fundingTokenInfo) {
            callback?.({ text: `⚠️ No funding token found on ${chainName}, skipping withdrawals for this chain` });
            continue;
          }

          const { symbol: fundingTokenSymbol, address: fundingTokenAddress } = fundingTokenInfo;
          logger.info(`[BICONOMY_AUTO_WITHDRAW] Using funding token on ${chainName}: ${fundingTokenSymbol}`);

          // Build withdrawal instructions for all tokens on this chain
          const withdrawalFlows: ComposeFlow[] = [];
          
          for (const balance of balances) {
            logger.info(
              `[BICONOMY_AUTO_WITHDRAW] Creating withdrawal for ${balance.tokenSymbol} on ${chainName}: ${formatUnits(balance.balance, balance.decimals)}`
            );

            if (balance.isNative) {
              // Native token withdrawal - MUST use fixed amount, not runtime balance
              // Biconomy API rejects runtimeErc20Balance with zero address (native token)
              const flow = biconomyService.buildNativeWithdrawalInstruction(
                chainId,
                withdrawAddress,
                balance.balance.toString() // Use the actual balance we already fetched
              );
              withdrawalFlows.push(flow);
            } else {
              // ERC20 token withdrawal using runtime balance
              const flow = biconomyService.buildWithdrawalInstruction(
                balance.tokenAddress,
                chainId,
                withdrawAddress
              );
              withdrawalFlows.push(flow);
            }
          }

          // Get funding token decimals and amount
          const fundingDecimals = await getTokenDecimals(fundingTokenAddress, chainName);
          const fundingAmountWei = parseUnits(fundingAmountPerChain, fundingDecimals);

          // Build quote request
          const quoteRequest: QuoteRequest = {
            mode: "eoa",
            ownerAddress: userAddress,
            composeFlows: withdrawalFlows,
            fundingTokens: [
              {
                tokenAddress: fundingTokenAddress,
                chainId: chainId,
                amount: fundingAmountWei.toString(),
              },
            ],
          };

          callback?.({ text: `🔄 Getting quote for ${chainName} (funding: ${fundingAmountPerChain} ${fundingTokenSymbol})...` });

          // Execute - getting a quote means the withdrawals are valid and will succeed
          const result = await biconomyService.executeIntent(
            quoteRequest,
            cdpAccount,
            walletClient,
            { address: userAddress },
            publicClient,
            (status) => callback?.({ text: `[${chainName}] ${status}` })
          );

          if (result.success && result.supertxHash) {
            const explorerUrl = biconomyService.getExplorerUrl(result.supertxHash);
            const tokensList = balances.map(b => `${formatUnits(b.balance, b.decimals)} ${b.tokenSymbol}`).join(", ");
            callback?.({ text: `✅ **${chainName}**: Withdrew ${balances.length} token(s) (${tokensList}) - [Track Transaction](${explorerUrl})` });
            
            results.push({
              chain: chainName,
              chainId,
              success: true,
              supertxHash: result.supertxHash,
              explorerUrl,
              tokensWithdrawn: balances.length,
              tokens: balances.map(b => ({
                symbol: b.tokenSymbol,
                amount: formatUnits(b.balance, b.decimals),
                address: b.tokenAddress,
              })),
            });
          } else {
            const errorMsg = result.error || "Unknown error";
            callback?.({ text: `❌ ${chainName} withdrawals failed: ${errorMsg}` });
            results.push({
              chain: chainName,
              chainId,
              success: false,
              error: errorMsg,
            });
          }
        } catch (error) {
          const err = error as Error;
          logger.error(`[BICONOMY_AUTO_WITHDRAW] Error withdrawing from ${chainName}: ${err.message}`);
          callback?.({ text: `❌ Error withdrawing from ${chainName}: ${err.message}` });
          results.push({
            chain: chainName,
            chainId,
            success: false,
            error: err.message,
          });
        }
      }

      // Summary
      const successfulWithdrawals = results.filter(r => r.success).length;
      const failedWithdrawals = results.filter(r => !r.success).length;
      const totalTokensWithdrawn = results
        .filter(r => r.success)
        .reduce((sum, r) => sum + (r.tokensWithdrawn || 0), 0);
      
      let summaryText = `\n✅ **Auto-Withdrawal Complete**\n\n`;
      summaryText += `**Scanned:** ${supportedChains.length} chains\n`;
      summaryText += `**Found:** ${totalTokensFound} tokens (filtered ${totalTokensFound - legitimateBalances.length} spam)\n`;
      summaryText += `**Withdrawn:** ${totalTokensWithdrawn} tokens from ${successfulWithdrawals} chain(s)\n`;
      
      if (failedWithdrawals > 0) {
        summaryText += `**Failed:** ${failedWithdrawals} chain(s)\n`;
      }
      
      // Add detailed breakdown by chain
      if (results.length > 0) {
        summaryText += `\n**Details:**\n`;
        for (const result of results.filter(r => r.success)) {
          summaryText += `- **${result.chain}**: `;
          if (result.tokens && result.tokens.length > 0) {
            const tokenList = result.tokens.map(t => `${t.amount} ${t.symbol}`).join(", ");
            summaryText += `${tokenList}\n`;
          } else {
            summaryText += `${result.tokensWithdrawn} token(s)\n`;
          }
        }
      }
      
      summaryText += `\n**Withdraw Address:** \`${withdrawAddress}\`\n`;

      callback?.({ text: summaryText, actions: ["BICONOMY_AUTO_WITHDRAW"], source: message.content.source });
      
      return {
        text: summaryText,
        success: successfulWithdrawals > 0,
        data: {
          chainsScanned: supportedChains.length,
          tokensFound: totalTokensFound,
          tokensFiltered: totalTokensFound - legitimateBalances.length,
          tokensWithdrawn: totalTokensWithdrawn,
          chainsWithdrawn: successfulWithdrawals,
          chainsFailed: failedWithdrawals,
          results,
        }
      };
    } catch (error) {
      const err = error as Error;
      logger.error(`[BICONOMY_AUTO_WITHDRAW] Error: ${err.message}`);
      callback?.({ text: `❌ Error: ${err.message}` });
      return { text: `❌ Error: ${err.message}`, success: false, error: "handler_error" };
    }
  },

  examples: [
    [
      {
        name: "{{user}}",
        content: { text: "Withdraw all my tokens from Biconomy Nexus accounts" },
      },
      {
        name: "{{agent}}",
        content: { text: "Scanning all chains for tokens in your Nexus accounts...", action: "BICONOMY_AUTO_WITHDRAW" },
      },
    ],
    [
      {
        name: "{{user}}",
        content: { text: "Clean up my Biconomy smart wallets and withdraw everything" },
      },
      {
        name: "{{agent}}",
        content: { text: "Auto-withdrawing all tokens from Nexus accounts across all chains...", action: "BICONOMY_AUTO_WITHDRAW" },
      },
    ],
    [
      {
        name: "{{user}}",
        content: { text: "Sweep all my Nexus companion wallets" },
      },
      {
        name: "{{agent}}",
        content: { text: "Sweeping all Nexus accounts and withdrawing tokens...", action: "BICONOMY_AUTO_WITHDRAW" },
      },
    ],
  ],
};

export default biconomyAutoWithdrawAction;
