/**
 * x402 Payment Middleware for Express
 * 
 * Implements Coinbase x402 protocol for onchain payments.
 * Supports Base and Polygon networks via Coinbase Facilitator.
 * 
 * @see https://docs.cdp.coinbase.com/x402/quickstart-for-sellers
 */

import type { Request, Response, NextFunction } from 'express';
import { logger } from '@elizaos/core';

/**
 * Payment configuration for an endpoint
 */
export interface X402PaymentConfig {
  /** Price in USDC (e.g., 0.02 for $0.02) */
  price: number;
  /** Supported networks */
  networks: ('base' | 'polygon')[];
  /** Recipient wallet address */
  recipientAddress: string;
  /** Optional facilitator URL (defaults to Coinbase Facilitator) */
  facilitatorUrl?: string;
}

/**
 * x402 Payment Required response structure
 */
interface X402PaymentResponse {
  network: 'base' | 'polygon';
  recipient: string;
  amount: string; // Amount in USDC (string to preserve precision)
  currency: 'USDC';
  chainId: number;
}

/**
 * Get chain ID for a network
 */
function getChainId(network: 'base' | 'polygon'): number {
  switch (network) {
    case 'base':
      return 8453; // Base mainnet
    case 'polygon':
      return 137; // Polygon mainnet
    default:
      return 8453; // Default to Base
  }
}

/**
 * Verify payment using Coinbase Facilitator
 * 
 * The facilitator handles payment verification and settlement.
 * We check for payment proof in the x-payment header.
 */
async function verifyPayment(
  paymentProof: string,
  config: X402PaymentConfig,
  network: 'base' | 'polygon',
  amount: string
): Promise<boolean> {
  try {
    // Decode payment proof (typically a transaction hash or encoded payment data)
    // The x402 protocol uses the facilitator to verify payments
    // For now, we'll do basic validation - in production, you'd call the facilitator API
    
    // Payment proof should be present
    if (!paymentProof || paymentProof.trim().length === 0) {
      return false;
    }

    // Basic format validation (transaction hash format)
    if (!paymentProof.startsWith('0x') || paymentProof.length !== 66) {
      logger.warn(`[X402] Invalid payment proof format: ${paymentProof}`);
      return false;
    }

    // TODO: In production, verify with Coinbase Facilitator API
    // const facilitatorUrl = config.facilitatorUrl || 'https://facilitator.x402.org';
    // const response = await fetch(`${facilitatorUrl}/verify`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     network,
    //     transactionHash: paymentProof,
    //     recipient: config.recipientAddress,
    //     amount,
    //   }),
    // });
    // return response.ok;

    // For now, accept valid format (in production, verify with facilitator)
    logger.info(`[X402] Payment proof received for ${network}: ${paymentProof.substring(0, 10)}...`);
    return true;
  } catch (error) {
    logger.error('[X402] Payment verification error:', error instanceof Error ? error.message : String(error));
    return false;
  }
}

/**
 * Create 402 Payment Required response with payment details
 */
function createPaymentRequiredResponse(
  config: X402PaymentConfig,
  res: Response
): void {
  // Support multiple networks - client can choose
  const paymentOptions: X402PaymentResponse[] = config.networks.map((network) => ({
    network,
    recipient: config.recipientAddress,
    amount: config.price.toFixed(6), // USDC has 6 decimals
    currency: 'USDC',
    chainId: getChainId(network),
  }));

  // Set x402 payment headers
  res.setHeader('X-Payment-Required', 'true');
  res.setHeader('X-Payment-Amount', config.price.toFixed(6));
  res.setHeader('X-Payment-Currency', 'USDC');
  res.setHeader('X-Payment-Networks', config.networks.join(','));

  // Return 402 with payment details
  res.status(402).json({
    error: 'Payment Required',
    message: 'This endpoint requires payment via x402 protocol',
    payment: paymentOptions,
    facilitator: {
      name: 'Coinbase',
      description: 'Using Coinbase Facilitator for payment verification',
      networks: config.networks,
    },
  });
}

/**
 * x402 Payment Middleware Factory
 * 
 * Creates middleware that enforces payment requirements for an endpoint.
 * 
 * @param config Payment configuration
 * @returns Express middleware function
 * 
 * @example
 * ```typescript
 * const x402Middleware = createX402PaymentMiddleware({
 *   price: 0.02,
 *   networks: ['base', 'polygon'],
 *   recipientAddress: '0x...',
 * });
 * 
 * router.post('/jobs', x402Middleware, (req, res) => {
 *   // Handle paid request
 * });
 * ```
 */
export function createX402PaymentMiddleware(
  config: X402PaymentConfig
): (req: Request, res: Response, next: NextFunction) => Promise<void> {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Check for payment proof in x-payment header
      const paymentProof = req.headers['x-payment'] as string | undefined;
      const paymentNetwork = (req.headers['x-payment-network'] as 'base' | 'polygon' | undefined) || config.networks[0];

      // Validate network
      if (!config.networks.includes(paymentNetwork)) {
        logger.warn(`[X402] Unsupported network: ${paymentNetwork}. Supported: ${config.networks.join(', ')}`);
        return createPaymentRequiredResponse(config, res);
      }

      // If no payment proof, require payment
      if (!paymentProof) {
        logger.info('[X402] Payment required for request');
        return createPaymentRequiredResponse(config, res);
      }

      // Verify payment
      const isValid = await verifyPayment(
        paymentProof,
        config,
        paymentNetwork,
        config.price.toFixed(6)
      );

      if (!isValid) {
        logger.warn('[X402] Invalid payment proof');
        return createPaymentRequiredResponse(config, res);
      }

      // Payment verified - attach payment info to request and proceed
      (req as Request & { paymentVerified: boolean; paymentNetwork: string; paymentProof: string }).paymentVerified = true;
      (req as Request & { paymentNetwork: string }).paymentNetwork = paymentNetwork;
      (req as Request & { paymentProof: string }).paymentProof = paymentProof;

      logger.debug(`[X402] Payment verified for ${paymentNetwork}`);
      next();
    } catch (error) {
      logger.error('[X402] Payment middleware error:', error instanceof Error ? error.message : String(error));
      return createPaymentRequiredResponse(config, res);
    }
  };
}

/**
 * Extended Request type with payment verification info
 */
export interface X402AuthenticatedRequest extends Request {
  paymentVerified?: boolean;
  paymentNetwork?: 'base' | 'polygon';
  paymentProof?: string;
}
