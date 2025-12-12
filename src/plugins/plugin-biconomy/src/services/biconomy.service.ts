import { IAgentRuntime, logger, Service } from "@elizaos/core";
import { type WalletClient, type TypedDataDomain } from "viem";
import {
  type ComposeFlow,
  type ExecuteResponse,
  type PayloadToSign,
  type QuoteRequest,
  type QuoteResponse,
  type SupertxStatus,
  BICONOMY_SUPPORTED_CHAINS,
  CHAIN_ID_TO_NAME
} from "../types";

/**
 * CDP Account interface - minimal interface for signing
 * Note: The domain type is made flexible to support both viem and CDP SDK types
 */
interface CdpAccount {
  address: string;
  signTypedData: (params: {
    domain: {
      name?: string;
      version?: string;
      chainId?: number | bigint;
      verifyingContract?: `0x${string}`;
      salt?: `0x${string}`;
    };
    types: Record<string, Array<{ name: string; type: string }>>;
    primaryType: string;
    message: Record<string, unknown>;
  }) => Promise<`0x${string}`>;
}

const BICONOMY_API_URL = "https://api.biconomy.io";
const EXPLORER_URL = "https://meescan.biconomy.io";

/**
 * Biconomy Service
 * Provides integration with Biconomy's Supertransaction API for multi-chain
 * portfolio operations, swaps, and cross-chain transfers.
 */
export class BiconomyService extends Service {
  static serviceType = "biconomy_supertransaction" as const;

  private apiKey?: string;

  constructor(runtime: IAgentRuntime) {
    super(runtime);
  }

  get capabilityDescription(): string {
    return "Multi-chain portfolio rebalancing and cross-chain operations via Biconomy Supertransaction API. Supports intent-based swaps, bridging, and complex multi-token operations across Ethereum, Base, Arbitrum, Polygon, Optimism, BSC, and more.";
  }

  static async start(runtime: IAgentRuntime): Promise<BiconomyService> {
    logger.info("[BICONOMY SERVICE] Starting Biconomy Supertransaction service");
    const service = new BiconomyService(runtime);
    await service.initialize(runtime);
    return service;
  }

  async stop(): Promise<void> {
    logger.info("[BICONOMY SERVICE] Stopping Biconomy service");
  }

  async initialize(runtime: IAgentRuntime): Promise<void> {
    this.apiKey = runtime.getSetting("BICONOMY_API_KEY");
    if (!this.apiKey) {
      logger.warn("[BICONOMY SERVICE] No BICONOMY_API_KEY found. Some features may be limited.");
    }
    logger.info("[BICONOMY SERVICE] Initialized successfully");
  }

  /**
   * Get a quote for a supertransaction
   */
  async getQuote(request: QuoteRequest): Promise<QuoteResponse> {
    try {
      logger.info(`[BICONOMY SERVICE] Getting quote for ${request.mode} mode`);
      
      const response = await fetch(`${BICONOMY_API_URL}/v1/quote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(this.apiKey && { "X-API-Key": this.apiKey }),
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorText = await response.text();
        
        // Check for 412 (authorization required for EIP-7702)
        if (response.status === 412) {
          const errorData = JSON.parse(errorText);
          throw new Error(`Authorization required: ${JSON.stringify(errorData.authorizations)}`);
        }
        
        throw new Error(`Quote request failed: ${response.status} ${errorText}`);
      }

      const quote = (await response.json()) as QuoteResponse;
      
      logger.info(`[BICONOMY SERVICE] Quote received - type: ${quote.quoteType}, payloads to sign: ${quote.payloadToSign.length}`);
      logger.debug(`[BICONOMY SERVICE] Returned data: ${JSON.stringify(quote.returnedData)}`);
      
      return quote;
    } catch (error) {
      const err = error as Error;
      logger.error(`[BICONOMY SERVICE] Failed to get quote: ${err.message}`);
      throw new Error(`Failed to get Biconomy quote: ${err.message}`);
    }
  }

  /**
   * Sign payloads based on quote type
   * 
   * @param quote - Quote response from Biconomy API
   * @param cdpAccount - CDP account object for signing (preferred)
   * @param walletClient - Viem wallet client (fallback for non-CDP wallets)
   * @param account - Account address (required if using walletClient)
   */
  async signPayloads(
    quote: QuoteResponse,
    cdpAccount?: CdpAccount,
    walletClient?: WalletClient,
    account?: { address: `0x${string}` }
  ): Promise<PayloadToSign[]> {
    const signedPayloads: PayloadToSign[] = [];

    // Validate that we have either CDP account or wallet client
    if (!cdpAccount && !walletClient) {
      throw new Error("Either cdpAccount or walletClient must be provided");
    }
    if (walletClient && !account) {
      throw new Error("account address is required when using walletClient");
    }

    for (const payload of quote.payloadToSign) {
      let signature: string;

      switch (quote.quoteType) {
        case "permit":
        case "simple":
          // EIP-712 typed data signing
          if (cdpAccount) {
            // Use CDP account's native signTypedData method (preferred)
            // This signs on Coinbase's servers, not through RPC
            logger.info(`[BICONOMY SERVICE] Signing typed data using CDP account native method`);
            signature = await cdpAccount.signTypedData({
              domain: payload.signablePayload.domain as TypedDataDomain,
              types: payload.signablePayload.types as Record<string, Array<{ name: string; type: string }>>,
              primaryType: payload.signablePayload.primaryType,
              message: payload.signablePayload.message as Record<string, unknown>,
            });
          } else if (walletClient && account) {
            // Fallback to viem wallet client (for non-CDP wallets)
            logger.info(`[BICONOMY SERVICE] Signing typed data using viem wallet client`);
            signature = await walletClient.signTypedData({
              account: account.address,
              domain: payload.signablePayload.domain as TypedDataDomain,
              types: payload.signablePayload.types as Record<string, Array<{ name: string; type: string }>>,
              primaryType: payload.signablePayload.primaryType,
              message: payload.signablePayload.message,
            });
          } else {
            throw new Error("No valid signer available");
          }
          break;

        case "onchain":
          // For onchain type, we need to send an approval transaction first
          // The signature field will contain the tx hash
          throw new Error("Onchain approval not yet implemented - token does not support EIP-2612");

        default:
          throw new Error(`Unknown quote type: ${quote.quoteType}`);
      }

      signedPayloads.push({
        ...payload,
        signature,
      });
    }

    return signedPayloads;
  }

  /**
   * Execute a supertransaction
   */
  async execute(
    quote: QuoteResponse,
    signedPayloads: PayloadToSign[]
  ): Promise<ExecuteResponse> {
    try {
      logger.info(`[BICONOMY SERVICE] Executing supertransaction for ${quote.ownerAddress}`);

      const executeRequest = {
        ...quote,
        payloadToSign: signedPayloads,
      };

      const response = await fetch(`${BICONOMY_API_URL}/v1/execute`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(this.apiKey && { "X-API-Key": this.apiKey }),
        },
        body: JSON.stringify(executeRequest),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Execute request failed: ${response.status} ${errorText}`);
      }

      const result = (await response.json()) as ExecuteResponse;
      
      if (result.success && result.supertxHash) {
        logger.info(`[BICONOMY SERVICE] Supertransaction executed: ${result.supertxHash}`);
        logger.info(`[BICONOMY SERVICE] Track at: ${EXPLORER_URL}/details/${result.supertxHash}`);
      } else {
        logger.error(`[BICONOMY SERVICE] Execution failed: ${result.error}`);
      }

      return result;
    } catch (error) {
      const err = error as Error;
      logger.error(`[BICONOMY SERVICE] Failed to execute: ${err.message}`);
      throw new Error(`Failed to execute Biconomy supertransaction: ${err.message}`);
    }
  }

  /**
   * Get status of a supertransaction
   */
  async getStatus(supertxHash: string): Promise<SupertxStatus> {
    try {
      logger.info(`[BICONOMY SERVICE] Getting status for ${supertxHash}`);

      const response = await fetch(`https://network.biconomy.io/v1/explorer/${supertxHash}`, {
        headers: {
          "Content-Type": "application/json",
          ...(this.apiKey && { "X-API-Key": this.apiKey }),
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Status request failed: ${response.status} ${errorText}`);
      }

      const status = (await response.json()) as SupertxStatus;
      logger.info(`[BICONOMY SERVICE] Status: ${status.status}`);
      
      return status;
    } catch (error) {
      const err = error as Error;
      logger.error(`[BICONOMY SERVICE] Failed to get status: ${err.message}`);
      throw new Error(`Failed to get supertransaction status: ${err.message}`);
    }
  }

  /**
   * Execute a full flow: get quote, sign, execute
   * 
   * @param request - Quote request
   * @param cdpAccount - CDP account for signing (preferred - signs on Coinbase servers)
   * @param walletClient - Viem wallet client (fallback for non-CDP wallets)
   * @param account - Account address (required if using walletClient)
   * @param onProgress - Progress callback
   */
  async executeIntent(
    request: QuoteRequest,
    cdpAccount?: CdpAccount,
    walletClient?: WalletClient,
    account?: { address: `0x${string}` },
    onProgress?: (status: string) => void
  ): Promise<ExecuteResponse> {
    try {
      // Step 1: Get quote
      onProgress?.("Getting quote from Biconomy...");
      const quote = await this.getQuote(request);

      // Step 2: Sign payloads
      onProgress?.(`Signing ${quote.payloadToSign.length} payload(s)...`);
      const signedPayloads = await this.signPayloads(quote, cdpAccount, walletClient, account);

      // Step 3: Execute
      onProgress?.("Executing supertransaction...");
      const result = await this.execute(quote, signedPayloads);

      if (result.success) {
        onProgress?.(`Success! Transaction: ${result.supertxHash}`);
      } else {
        onProgress?.(`Failed: ${result.error}`);
      }

      return result;
    } catch (error) {
      const err = error as Error;
      logger.error(`[BICONOMY SERVICE] Intent execution failed: ${err.message}`);
      throw error;
    }
  }

  /**
   * Build a simple intent flow (single input to single output)
   */
  buildSimpleIntentFlow(
    srcChainId: number,
    dstChainId: number,
    srcToken: string,
    dstToken: string,
    amount: string,
    slippage: number = 0.01
  ): ComposeFlow {
    return {
      type: "/instructions/intent-simple",
      data: {
        srcChainId,
        dstChainId,
        srcToken,
        dstToken,
        amount,
        slippage,
      },
      batch: true,
    };
  }

  /**
   * Build a withdrawal instruction to transfer output tokens from the Nexus/Smart Account back to EOA
   * This is REQUIRED for EOA mode - without it, funds remain in the Smart Account
   * 
   * Uses 'runtimeErc20Balance' to transfer the full balance at execution time
   * @see https://docs.biconomy.io/supertransaction-api/execution-modes/eoa
   */
  buildWithdrawalInstruction(
    tokenAddress: string,
    chainId: number,
    recipientAddress: string
  ): ComposeFlow {
    return {
      type: "/instructions/build",
      data: {
        functionSignature: "function transfer(address to, uint256 value)",
        args: [
          recipientAddress,
          {
            type: "runtimeErc20Balance",
            tokenAddress: tokenAddress,
            constraints: { gte: "1" }, // Ensure at least 1 wei to transfer
          },
        ],
        to: tokenAddress,
        chainId: chainId,
        gasLimit: "100000", // Standard ERC20 transfer gas
      },
    };
  }

  /**
   * Build a multi-position intent flow
   */
  buildMultiIntentFlow(
    inputPositions: Array<{ chainId: number; tokenAddress: string; amount: string }>,
    targetPositions: Array<{ chainId: number; tokenAddress: string; weight: number }>,
    slippage: number = 0.01
  ): ComposeFlow {
    return {
      type: "/instructions/intent",
      data: {
        slippage,
        inputPositions: inputPositions.map((p) => ({
          chainToken: {
            chainId: p.chainId,
            tokenAddress: p.tokenAddress,
          },
          amount: p.amount,
        })),
        targetPositions: targetPositions.map((p) => ({
          chainToken: {
            chainId: p.chainId,
            tokenAddress: p.tokenAddress,
          },
          weight: p.weight,
        })),
      },
    };
  }

  /**
   * Get explorer URL for a supertransaction
   */
  getExplorerUrl(supertxHash: string): string {
    return `${EXPLORER_URL}/details/${supertxHash}`;
  }

  /**
   * Get supported chains
   */
  getSupportedChains(): Record<string, number> {
    return BICONOMY_SUPPORTED_CHAINS;
  }

  /**
   * Resolve chain name to chain ID
   */
  resolveChainId(chainName: string): number | null {
    const normalized = chainName.toLowerCase().trim();
    return BICONOMY_SUPPORTED_CHAINS[normalized] ?? null;
  }

  /**
   * Get chain name from chain ID
   */
  getChainName(chainId: number): string {
    return CHAIN_ID_TO_NAME[chainId] || `Chain ${chainId}`;
  }
}

export default BiconomyService;
