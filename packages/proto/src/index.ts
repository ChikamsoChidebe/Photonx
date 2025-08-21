// ============================================================================
// PHOTONX PROTOCOL TYPES AND SCHEMAS
// ============================================================================

// Core Types
export * from './types';
export * from './eip712';

// Re-export commonly used types for convenience
export type {
  Address,
  ChainId,
  TokenAmount,
  ChannelId,
  ChannelState,
  ChannelParams,
  QuoteRequest,
  Quote,
  Fill,
  Cancel,
  Replace,
  Heartbeat,
  SettlementRequest,
  CheckpointRequest,
  DisputeChallenge,
  OpenChannelRequest,
  OpenChannelResponse,
  QuoteResponse,
  FillResponse,
  RiskParams,
  InventoryState,
  PriceSource,
  MarketData,
  PerformanceMetrics,
  TradingMetrics,
  MessageType,
  ChannelStatus,
  OrderSide,
  QuoteStatus,
  SupportedChainId
} from './types';

// Re-export error classes
export {
  PhotonXError,
  ChannelError,
  QuoteError,
  FillError,
  RiskError,
  ValidationError
} from './types';

// Re-export constants
export { CONSTANTS } from './types';

// Re-export validation schemas
export {
  AddressSchema,
  ChainIdSchema,
  TokenAmountSchema,
  ChannelIdSchema,
  QuoteRequestSchema,
  QuoteSchema,
  FillSchema
} from './types';

// Re-export EIP-712 utilities
export {
  EIP712_TYPES,
  createDomain,
  serializeQuoteRequest,
  serializeQuote,
  serializeFill,
  serializeCancel,
  serializeReplace,
  serializeHeartbeat,
  serializeChannelState,
  serializeSettlementRequest,
  serializeCheckpointRequest,
  serializeDisputeChallenge,
  splitSignature,
  joinSignature,
  computeMessageHash,
  computeChannelStateHash,
  validateSignature,
  validateNonceSequence,
  validateTimestamp,
  validateChannelParticipant,
  isQuoteRequest,
  isQuote,
  isFill,
  isCancel,
  isReplace,
  isHeartbeat
} from './eip712';

// Version information
export const VERSION = '1.0.0';
export const PROTOCOL_NAME = 'PhotonX';

// Utility functions for common operations
export function createAddress(value: string) {
  if (!/^0x[a-fA-F0-9]{40}$/.test(value)) {
    throw new Error(`Invalid address format: ${value}`);
  }
  return { value: value.toLowerCase() };
}

export function createChainId(value: number) {
  if (value <= 0) {
    throw new Error(`Invalid chain ID: ${value}`);
  }
  return { value };
}

export function createChannelId() {
  // Generate UUID v4
  const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
  return { value: uuid };
}

export function createTokenAmount(token: string, amount: bigint) {
  return {
    token: createAddress(token),
    amount
  };
}

export function formatTokenAmount(amount: any, decimals: number = 18): string {
  const divisor = BigInt(10 ** decimals);
  const whole = amount.amount / divisor;
  const fractional = amount.amount % divisor;
  
  if (fractional === 0n) {
    return whole.toString();
  }
  
  const fractionalStr = fractional.toString().padStart(decimals, '0');
  const trimmed = fractionalStr.replace(/0+$/, '');
  return `${whole}.${trimmed}`;
}

export function parseTokenAmount(value: string, decimals: number = 18): bigint {
  const [whole, fractional = ''] = value.split('.');
  const wholeBigInt = BigInt(whole || '0');
  const fractionalPadded = fractional.padEnd(decimals, '0').slice(0, decimals);
  const fractionalBigInt = BigInt(fractionalPadded || '0');
  const multiplier = BigInt(10 ** decimals);
  
  return wholeBigInt * multiplier + fractionalBigInt;
}

export function calculatePriceImpact(
  requestedAmount: bigint,
  quotedPrice: bigint,
  referencePrice: bigint
): number {
  if (referencePrice === 0n) return 0;
  
  const priceDiff = quotedPrice > referencePrice 
    ? quotedPrice - referencePrice 
    : referencePrice - quotedPrice;
    
  const impactBps = Number(priceDiff * BigInt(10000) / referencePrice);
  return impactBps;
}

export function calculateFee(amount: bigint, feeBps: number): bigint {
  return amount * BigInt(feeBps) / BigInt(10000);
}

export function isExpired(timestamp: bigint, expiryMs: number = 30000): boolean {
  const now = BigInt(Date.now());
  const age = Number(now - timestamp);
  return age > expiryMs;
}

export function getCurrentTimestamp(): bigint {
  return BigInt(Date.now());
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`;
  return `${(ms / 3600000).toFixed(1)}h`;
}

export function formatAddress(address: string, length: number = 8): string {
  if (address.length <= length + 2) return address;
  const start = address.slice(0, 2 + length / 2);
  const end = address.slice(-length / 2);
  return `${start}...${end}`;
}

export function formatNumber(value: number | bigint, decimals: number = 2): string {
  const num = typeof value === 'bigint' ? Number(value) : value;
  
  if (num >= 1e9) return `${(num / 1e9).toFixed(decimals)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(decimals)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(decimals)}K`;
  
  return num.toFixed(decimals);
}

// Type guards for runtime type checking
export function isValidAddress(value: any): boolean {
  return value && 
    typeof value === 'object' && 
    typeof value.value === 'string' &&
    /^0x[a-fA-F0-9]{40}$/.test(value.value);
}

export function isValidChainId(value: any): boolean {
  return value && 
    typeof value === 'object' && 
    typeof value.value === 'number' &&
    value.value > 0;
}

export function isValidChannelId(value: any): boolean {
  return value && 
    typeof value === 'object' && 
    typeof value.value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value.value);
}

export function isValidTokenAmount(value: any): boolean {
  return value && 
    typeof value === 'object' && 
    isValidAddress(value.token) &&
    typeof value.amount === 'bigint' &&
    value.amount >= 0n;
}

// Helper for creating mock data in tests
export function createMockChannelState(overrides: any = {}): any {
  const defaultState: any = {
    channelId: createChannelId(),
    nonce: 0n,
    trader: createAddress('0x1234567890123456789012345678901234567890'),
    lp: createAddress('0x0987654321098765432109876543210987654321'),
    traderBalances: [
      createTokenAmount('0xA0b86a33E6441e6e80A7181a0a2d0b4B0a0b86a3', BigInt(1000e18))
    ],
    lpBalances: [
      createTokenAmount('0xB0b86a33E6441e6e80A7181a0a2d0b4B0a0b86a3', BigInt(1000e18))
    ],
    timestamp: getCurrentTimestamp(),
    chainId: createChainId(1)
  };

  return { ...defaultState, ...overrides };
}

export function createMockQuoteRequest(overrides: any = {}): any {
  const defaultRequest: any = {
    channelId: createChannelId(),
    nonce: 1n,
    side: 'BUY',
    baseToken: createAddress('0xA0b86a33E6441e6e80A7181a0a2d0b4B0a0b86a3'),
    quoteToken: createAddress('0xB0b86a33E6441e6e80A7181a0a2d0b4B0a0b86a3'),
    quantity: BigInt(100e18),
    maxSlippageBps: 100, // 1%
    timestamp: getCurrentTimestamp(),
    trader: createAddress('0x1234567890123456789012345678901234567890')
  };

  return { ...defaultRequest, ...overrides };
}

export function createMockQuote(overrides: any = {}): any {
  const defaultQuote: any = {
    channelId: createChannelId(),
    quoteId: crypto.randomUUID(),
    requestNonce: 1n,
    price: BigInt(2000e18), // 2000 quote tokens per base token
    quantity: BigInt(100e18),
    side: 'BUY',
    expiryTimestamp: getCurrentTimestamp() + BigInt(30000),
    lpFeeBps: 30, // 0.3%
    timestamp: getCurrentTimestamp(),
    lp: createAddress('0x0987654321098765432109876543210987654321')
  };

  return { ...defaultQuote, ...overrides };
}