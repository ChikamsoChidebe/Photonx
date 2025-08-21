import { z } from 'zod';

// ============================================================================
// CORE TYPES
// ============================================================================

export interface Address {
  readonly value: string;
}

export interface ChainId {
  readonly value: number;
}

export interface TokenAmount {
  readonly token: Address;
  readonly amount: bigint;
}

export interface ChannelId {
  readonly value: string;
}

// ============================================================================
// CHANNEL STATE TYPES
// ============================================================================

export interface ChannelState {
  readonly channelId: ChannelId;
  readonly nonce: bigint;
  readonly trader: Address;
  readonly lp: Address;
  readonly traderBalances: TokenAmount[];
  readonly lpBalances: TokenAmount[];
  readonly timestamp: bigint;
  readonly chainId: ChainId;
}

export interface ChannelParams {
  readonly trader: Address;
  readonly lp: Address;
  readonly tokenIn: Address;
  readonly tokenOut: Address;
  readonly traderDeposit: bigint;
  readonly lpDeposit: bigint;
  readonly chainId: ChainId;
  readonly timeout: bigint;
}

// ============================================================================
// MESSAGE TYPES
// ============================================================================

export interface QuoteRequest {
  readonly channelId: ChannelId;
  readonly nonce: bigint;
  readonly side: 'BUY' | 'SELL';
  readonly baseToken: Address;
  readonly quoteToken: Address;
  readonly quantity: bigint;
  readonly maxSlippageBps: number;
  readonly timestamp: bigint;
  readonly trader: Address;
}

export interface Quote {
  readonly channelId: ChannelId;
  readonly quoteId: string;
  readonly requestNonce: bigint;
  readonly price: bigint; // Price in quote token per base token (scaled by 1e18)
  readonly quantity: bigint;
  readonly side: 'BUY' | 'SELL';
  readonly expiryTimestamp: bigint;
  readonly lpFeeBps: number;
  readonly timestamp: bigint;
  readonly lp: Address;
}

export interface Fill {
  readonly channelId: ChannelId;
  readonly quoteId: string;
  readonly fillId: string;
  readonly nonce: bigint;
  readonly quantity: bigint;
  readonly price: bigint;
  readonly timestamp: bigint;
  readonly trader: Address;
  readonly lp: Address;
}

export interface Cancel {
  readonly channelId: ChannelId;
  readonly quoteId: string;
  readonly nonce: bigint;
  readonly timestamp: bigint;
  readonly trader: Address;
}

export interface Replace {
  readonly channelId: ChannelId;
  readonly originalQuoteId: string;
  readonly newQuoteRequest: QuoteRequest;
  readonly nonce: bigint;
  readonly timestamp: bigint;
  readonly trader: Address;
}

export interface Heartbeat {
  readonly channelId: ChannelId;
  readonly nonce: bigint;
  readonly timestamp: bigint;
  readonly sender: Address;
}

// ============================================================================
// SETTLEMENT TYPES
// ============================================================================

export interface SettlementRequest {
  readonly channelId: ChannelId;
  readonly finalState: ChannelState;
  readonly traderSignature: string;
  readonly lpSignature: string;
}

export interface CheckpointRequest {
  readonly channelId: ChannelId;
  readonly state: ChannelState;
  readonly traderSignature: string;
  readonly lpSignature: string;
}

export interface DisputeChallenge {
  readonly channelId: ChannelId;
  readonly challengeState: ChannelState;
  readonly challengerSignature: string;
  readonly counterpartySignature: string;
}

// ============================================================================
// API TYPES
// ============================================================================

export interface OpenChannelRequest {
  readonly trader: Address;
  readonly lp: Address;
  readonly tokenIn: Address;
  readonly tokenOut: Address;
  readonly traderDeposit: bigint;
  readonly lpDeposit: bigint;
  readonly chainId: ChainId;
}

export interface OpenChannelResponse {
  readonly channelId: ChannelId;
  readonly initialState: ChannelState;
  readonly domainSeparator: string;
  readonly eip712Types: Record<string, any>;
}

export interface QuoteResponse {
  readonly quote: Quote;
  readonly signature: string;
}

export interface FillResponse {
  readonly fill: Fill;
  readonly newState: ChannelState;
  readonly traderSignature: string;
  readonly lpSignature: string;
}

// ============================================================================
// RISK MANAGEMENT TYPES
// ============================================================================

export interface RiskParams {
  readonly lp: Address;
  readonly pair: string;
  readonly maxNotional: bigint;
  readonly maxExposure: bigint;
  readonly spreadBps: number;
  readonly maxOrderSize: bigint;
  readonly dailyVolumeLimit: bigint;
}

export interface InventoryState {
  readonly lp: Address;
  readonly token: Address;
  readonly available: bigint;
  readonly reserved: bigint;
  readonly target: bigint;
  readonly lastUpdate: bigint;
}

// ============================================================================
// PRICING TYPES
// ============================================================================

export interface PriceSource {
  readonly source: string;
  readonly price: bigint;
  readonly timestamp: bigint;
  readonly confidence: number;
}

export interface MarketData {
  readonly pair: string;
  readonly midPrice: bigint;
  readonly bid: bigint;
  readonly ask: bigint;
  readonly spread: number;
  readonly volume24h: bigint;
  readonly volatility: number;
  readonly timestamp: bigint;
}

// ============================================================================
// METRICS TYPES
// ============================================================================

export interface PerformanceMetrics {
  readonly quoteRoundTripMs: number;
  readonly fillConfirmMs: number;
  readonly tradesPerSettlement: number;
  readonly gassSavedEstimate: bigint;
  readonly disputesTriggered: number;
  readonly uptimePercent: number;
}

export interface TradingMetrics {
  readonly totalVolume: bigint;
  readonly totalTrades: number;
  readonly averageTradeSize: bigint;
  readonly totalFees: bigint;
  readonly uniqueTraders: number;
  readonly activeLPs: number;
}

// ============================================================================
// ZOD VALIDATION SCHEMAS
// ============================================================================

export const AddressSchema = z.object({
  value: z.string().regex(/^0x[a-fA-F0-9]{40}$/)
});

export const ChainIdSchema = z.object({
  value: z.number().positive()
});

export const TokenAmountSchema = z.object({
  token: AddressSchema,
  amount: z.bigint().nonnegative()
});

export const ChannelIdSchema = z.object({
  value: z.string().uuid()
});

export const QuoteRequestSchema = z.object({
  channelId: ChannelIdSchema,
  nonce: z.bigint().nonnegative(),
  side: z.enum(['BUY', 'SELL']),
  baseToken: AddressSchema,
  quoteToken: AddressSchema,
  quantity: z.bigint().positive(),
  maxSlippageBps: z.number().min(0).max(10000),
  timestamp: z.bigint().positive(),
  trader: AddressSchema
});

export const QuoteSchema = z.object({
  channelId: ChannelIdSchema,
  quoteId: z.string().uuid(),
  requestNonce: z.bigint().nonnegative(),
  price: z.bigint().positive(),
  quantity: z.bigint().positive(),
  side: z.enum(['BUY', 'SELL']),
  expiryTimestamp: z.bigint().positive(),
  lpFeeBps: z.number().min(0).max(10000),
  timestamp: z.bigint().positive(),
  lp: AddressSchema
});

export const FillSchema = z.object({
  channelId: ChannelIdSchema,
  quoteId: z.string().uuid(),
  fillId: z.string().uuid(),
  nonce: z.bigint().nonnegative(),
  quantity: z.bigint().positive(),
  price: z.bigint().positive(),
  timestamp: z.bigint().positive(),
  trader: AddressSchema,
  lp: AddressSchema
});

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type MessageType = 
  | 'QUOTE_REQUEST'
  | 'QUOTE'
  | 'FILL'
  | 'CANCEL'
  | 'REPLACE'
  | 'HEARTBEAT'
  | 'CHECKPOINT'
  | 'SETTLEMENT';

export type ChannelStatus = 
  | 'OPENING'
  | 'ACTIVE'
  | 'CHECKPOINTING'
  | 'SETTLING'
  | 'CLOSED'
  | 'DISPUTED';

export type OrderSide = 'BUY' | 'SELL';

export type QuoteStatus = 
  | 'PENDING'
  | 'QUOTED'
  | 'FILLED'
  | 'PARTIALLY_FILLED'
  | 'CANCELLED'
  | 'EXPIRED';

// ============================================================================
// ERROR TYPES
// ============================================================================

export class PhotonXError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: any
  ) {
    super(message);
    this.name = 'PhotonXError';
  }
}

export class ChannelError extends PhotonXError {
  constructor(message: string, details?: any) {
    super(message, 'CHANNEL_ERROR', details);
  }
}

export class QuoteError extends PhotonXError {
  constructor(message: string, details?: any) {
    super(message, 'QUOTE_ERROR', details);
  }
}

export class FillError extends PhotonXError {
  constructor(message: string, details?: any) {
    super(message, 'FILL_ERROR', details);
  }
}

export class RiskError extends PhotonXError {
  constructor(message: string, details?: any) {
    super(message, 'RISK_ERROR', details);
  }
}

export class ValidationError extends PhotonXError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', details);
  }
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const CONSTANTS = {
  // Timing
  QUOTE_EXPIRY_MS: 30_000, // 30 seconds
  HEARTBEAT_INTERVAL_MS: 10_000, // 10 seconds
  CHANNEL_TIMEOUT_MS: 3600_000, // 1 hour
  DISPUTE_WINDOW_MS: 86400_000, // 24 hours
  
  // Limits
  MAX_SLIPPAGE_BPS: 1000, // 10%
  MAX_FEE_BPS: 500, // 5%
  MIN_TRADE_SIZE: BigInt(1e15), // 0.001 tokens (assuming 18 decimals)
  MAX_TRADE_SIZE: BigInt(1e24), // 1M tokens
  
  // Precision
  PRICE_PRECISION: BigInt(1e18),
  BPS_PRECISION: 10000,
  
  // Gas
  ESTIMATED_GAS_PER_TRADE: 150_000n,
  SETTLEMENT_GAS_ESTIMATE: 200_000n,
  
  // Network
  SUPPORTED_CHAINS: [1, 137, 8453, 42161] as const, // Ethereum, Polygon, Base, Arbitrum
  
  // Protocol
  PROTOCOL_VERSION: '1.0.0',
  EIP712_DOMAIN_NAME: 'PhotonX',
  EIP712_DOMAIN_VERSION: '1'
} as const;

export type SupportedChainId = typeof CONSTANTS.SUPPORTED_CHAINS[number];