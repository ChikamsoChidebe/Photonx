import { TypedDataDomain, TypedDataField } from 'ethers';
import { 
  QuoteRequest, 
  Quote, 
  Fill, 
  Cancel, 
  Replace, 
  Heartbeat, 
  ChannelState,
  SettlementRequest,
  CheckpointRequest,
  DisputeChallenge,
  CONSTANTS 
} from './types';

// ============================================================================
// EIP-712 DOMAIN CONFIGURATION
// ============================================================================

export function createDomain(chainId: number, verifyingContract: string): TypedDataDomain {
  return {
    name: CONSTANTS.EIP712_DOMAIN_NAME,
    version: CONSTANTS.EIP712_DOMAIN_VERSION,
    chainId,
    verifyingContract
  };
}

// ============================================================================
// EIP-712 TYPE DEFINITIONS
// ============================================================================

export const EIP712_TYPES = {
  // Channel State Types
  ChannelState: [
    { name: 'channelId', type: 'string' },
    { name: 'nonce', type: 'uint256' },
    { name: 'trader', type: 'address' },
    { name: 'lp', type: 'address' },
    { name: 'traderBalances', type: 'TokenAmount[]' },
    { name: 'lpBalances', type: 'TokenAmount[]' },
    { name: 'timestamp', type: 'uint256' },
    { name: 'chainId', type: 'uint256' }
  ] as TypedDataField[],

  TokenAmount: [
    { name: 'token', type: 'address' },
    { name: 'amount', type: 'uint256' }
  ] as TypedDataField[],

  // Message Types
  QuoteRequest: [
    { name: 'channelId', type: 'string' },
    { name: 'nonce', type: 'uint256' },
    { name: 'side', type: 'string' },
    { name: 'baseToken', type: 'address' },
    { name: 'quoteToken', type: 'address' },
    { name: 'quantity', type: 'uint256' },
    { name: 'maxSlippageBps', type: 'uint256' },
    { name: 'timestamp', type: 'uint256' },
    { name: 'trader', type: 'address' }
  ] as TypedDataField[],

  Quote: [
    { name: 'channelId', type: 'string' },
    { name: 'quoteId', type: 'string' },
    { name: 'requestNonce', type: 'uint256' },
    { name: 'price', type: 'uint256' },
    { name: 'quantity', type: 'uint256' },
    { name: 'side', type: 'string' },
    { name: 'expiryTimestamp', type: 'uint256' },
    { name: 'lpFeeBps', type: 'uint256' },
    { name: 'timestamp', type: 'uint256' },
    { name: 'lp', type: 'address' }
  ] as TypedDataField[],

  Fill: [
    { name: 'channelId', type: 'string' },
    { name: 'quoteId', type: 'string' },
    { name: 'fillId', type: 'string' },
    { name: 'nonce', type: 'uint256' },
    { name: 'quantity', type: 'uint256' },
    { name: 'price', type: 'uint256' },
    { name: 'timestamp', type: 'uint256' },
    { name: 'trader', type: 'address' },
    { name: 'lp', type: 'address' }
  ] as TypedDataField[],

  Cancel: [
    { name: 'channelId', type: 'string' },
    { name: 'quoteId', type: 'string' },
    { name: 'nonce', type: 'uint256' },
    { name: 'timestamp', type: 'uint256' },
    { name: 'trader', type: 'address' }
  ] as TypedDataField[],

  Replace: [
    { name: 'channelId', type: 'string' },
    { name: 'originalQuoteId', type: 'string' },
    { name: 'newQuoteRequest', type: 'QuoteRequest' },
    { name: 'nonce', type: 'uint256' },
    { name: 'timestamp', type: 'uint256' },
    { name: 'trader', type: 'address' }
  ] as TypedDataField[],

  Heartbeat: [
    { name: 'channelId', type: 'string' },
    { name: 'nonce', type: 'uint256' },
    { name: 'timestamp', type: 'uint256' },
    { name: 'sender', type: 'address' }
  ] as TypedDataField[],

  // Settlement Types
  SettlementRequest: [
    { name: 'channelId', type: 'string' },
    { name: 'finalState', type: 'ChannelState' },
    { name: 'traderSignature', type: 'bytes' },
    { name: 'lpSignature', type: 'bytes' }
  ] as TypedDataField[],

  CheckpointRequest: [
    { name: 'channelId', type: 'string' },
    { name: 'state', type: 'ChannelState' },
    { name: 'traderSignature', type: 'bytes' },
    { name: 'lpSignature', type: 'bytes' }
  ] as TypedDataField[],

  DisputeChallenge: [
    { name: 'channelId', type: 'string' },
    { name: 'challengeState', type: 'ChannelState' },
    { name: 'challengerSignature', type: 'bytes' },
    { name: 'counterpartySignature', type: 'bytes' }
  ] as TypedDataField[]
};

// ============================================================================
// MESSAGE SERIALIZATION HELPERS
// ============================================================================

export function serializeQuoteRequest(request: QuoteRequest): Record<string, any> {
  return {
    channelId: request.channelId.value,
    nonce: request.nonce.toString(),
    side: request.side,
    baseToken: request.baseToken.value,
    quoteToken: request.quoteToken.value,
    quantity: request.quantity.toString(),
    maxSlippageBps: request.maxSlippageBps.toString(),
    timestamp: request.timestamp.toString(),
    trader: request.trader.value
  };
}

export function serializeQuote(quote: Quote): Record<string, any> {
  return {
    channelId: quote.channelId.value,
    quoteId: quote.quoteId,
    requestNonce: quote.requestNonce.toString(),
    price: quote.price.toString(),
    quantity: quote.quantity.toString(),
    side: quote.side,
    expiryTimestamp: quote.expiryTimestamp.toString(),
    lpFeeBps: quote.lpFeeBps.toString(),
    timestamp: quote.timestamp.toString(),
    lp: quote.lp.value
  };
}

export function serializeFill(fill: Fill): Record<string, any> {
  return {
    channelId: fill.channelId.value,
    quoteId: fill.quoteId,
    fillId: fill.fillId,
    nonce: fill.nonce.toString(),
    quantity: fill.quantity.toString(),
    price: fill.price.toString(),
    timestamp: fill.timestamp.toString(),
    trader: fill.trader.value,
    lp: fill.lp.value
  };
}

export function serializeCancel(cancel: Cancel): Record<string, any> {
  return {
    channelId: cancel.channelId.value,
    quoteId: cancel.quoteId,
    nonce: cancel.nonce.toString(),
    timestamp: cancel.timestamp.toString(),
    trader: cancel.trader.value
  };
}

export function serializeReplace(replace: Replace): Record<string, any> {
  return {
    channelId: replace.channelId.value,
    originalQuoteId: replace.originalQuoteId,
    newQuoteRequest: serializeQuoteRequest(replace.newQuoteRequest),
    nonce: replace.nonce.toString(),
    timestamp: replace.timestamp.toString(),
    trader: replace.trader.value
  };
}

export function serializeHeartbeat(heartbeat: Heartbeat): Record<string, any> {
  return {
    channelId: heartbeat.channelId.value,
    nonce: heartbeat.nonce.toString(),
    timestamp: heartbeat.timestamp.toString(),
    sender: heartbeat.sender.value
  };
}

export function serializeChannelState(state: ChannelState): Record<string, any> {
  return {
    channelId: state.channelId.value,
    nonce: state.nonce.toString(),
    trader: state.trader.value,
    lp: state.lp.value,
    traderBalances: state.traderBalances.map(balance => ({
      token: balance.token.value,
      amount: balance.amount.toString()
    })),
    lpBalances: state.lpBalances.map(balance => ({
      token: balance.token.value,
      amount: balance.amount.toString()
    })),
    timestamp: state.timestamp.toString(),
    chainId: state.chainId.value.toString()
  };
}

export function serializeSettlementRequest(request: SettlementRequest): Record<string, any> {
  return {
    channelId: request.channelId.value,
    finalState: serializeChannelState(request.finalState),
    traderSignature: request.traderSignature,
    lpSignature: request.lpSignature
  };
}

export function serializeCheckpointRequest(request: CheckpointRequest): Record<string, any> {
  return {
    channelId: request.channelId.value,
    state: serializeChannelState(request.state),
    traderSignature: request.traderSignature,
    lpSignature: request.lpSignature
  };
}

export function serializeDisputeChallenge(challenge: DisputeChallenge): Record<string, any> {
  return {
    channelId: challenge.channelId.value,
    challengeState: serializeChannelState(challenge.challengeState),
    challengerSignature: challenge.challengerSignature,
    counterpartySignature: challenge.counterpartySignature
  };
}

// ============================================================================
// SIGNATURE VERIFICATION HELPERS
// ============================================================================

export interface SignatureComponents {
  v: number;
  r: string;
  s: string;
}

export function splitSignature(signature: string): SignatureComponents {
  const sig = signature.slice(2); // Remove 0x prefix
  return {
    v: parseInt(sig.slice(128, 130), 16),
    r: '0x' + sig.slice(0, 64),
    s: '0x' + sig.slice(64, 128)
  };
}

export function joinSignature(components: SignatureComponents): string {
  const r = components.r.slice(2);
  const s = components.s.slice(2);
  const v = components.v.toString(16).padStart(2, '0');
  return '0x' + r + s + v;
}

// ============================================================================
// HASH COMPUTATION HELPERS
// ============================================================================

import { keccak256, toUtf8Bytes } from 'ethers';

export function computeMessageHash(
  domain: TypedDataDomain,
  types: Record<string, TypedDataField[]>,
  primaryType: string,
  message: Record<string, any>
): string {
  // This is a simplified version - in production, use ethers.utils._TypedDataEncoder
  const domainHash = keccak256(toUtf8Bytes(JSON.stringify(domain)));
  const messageHash = keccak256(toUtf8Bytes(JSON.stringify(message)));
  return keccak256(toUtf8Bytes(domainHash + messageHash));
}

export function computeChannelStateHash(state: ChannelState): string {
  const serialized = serializeChannelState(state);
  return keccak256(toUtf8Bytes(JSON.stringify(serialized)));
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

export function validateSignature(
  signature: string,
  expectedSigner: string,
  messageHash: string
): boolean {
  // Implementation would use ethers.utils.verifyMessage or similar
  // This is a placeholder for the actual signature verification logic
  return signature.length === 132 && expectedSigner.length === 42;
}

export function validateNonceSequence(
  currentNonce: bigint,
  newNonce: bigint
): boolean {
  return newNonce === currentNonce + 1n;
}

export function validateTimestamp(
  timestamp: bigint,
  maxAge: number = CONSTANTS.QUOTE_EXPIRY_MS
): boolean {
  const now = BigInt(Date.now());
  const age = Number(now - timestamp);
  return age >= 0 && age <= maxAge;
}

export function validateChannelParticipant(
  participant: string,
  allowedParticipants: string[]
): boolean {
  return allowedParticipants.includes(participant.toLowerCase());
}

// ============================================================================
// MESSAGE TYPE GUARDS
// ============================================================================

export function isQuoteRequest(message: any): message is QuoteRequest {
  return message && 
    typeof message.channelId === 'object' &&
    typeof message.nonce === 'bigint' &&
    ['BUY', 'SELL'].includes(message.side) &&
    typeof message.baseToken === 'object' &&
    typeof message.quoteToken === 'object' &&
    typeof message.quantity === 'bigint' &&
    typeof message.maxSlippageBps === 'number' &&
    typeof message.timestamp === 'bigint' &&
    typeof message.trader === 'object';
}

export function isQuote(message: any): message is Quote {
  return message &&
    typeof message.channelId === 'object' &&
    typeof message.quoteId === 'string' &&
    typeof message.requestNonce === 'bigint' &&
    typeof message.price === 'bigint' &&
    typeof message.quantity === 'bigint' &&
    ['BUY', 'SELL'].includes(message.side) &&
    typeof message.expiryTimestamp === 'bigint' &&
    typeof message.lpFeeBps === 'number' &&
    typeof message.timestamp === 'bigint' &&
    typeof message.lp === 'object';
}

export function isFill(message: any): message is Fill {
  return message &&
    typeof message.channelId === 'object' &&
    typeof message.quoteId === 'string' &&
    typeof message.fillId === 'string' &&
    typeof message.nonce === 'bigint' &&
    typeof message.quantity === 'bigint' &&
    typeof message.price === 'bigint' &&
    typeof message.timestamp === 'bigint' &&
    typeof message.trader === 'object' &&
    typeof message.lp === 'object';
}

export function isCancel(message: any): message is Cancel {
  return message &&
    typeof message.channelId === 'object' &&
    typeof message.quoteId === 'string' &&
    typeof message.nonce === 'bigint' &&
    typeof message.timestamp === 'bigint' &&
    typeof message.trader === 'object';
}

export function isReplace(message: any): message is Replace {
  return message &&
    typeof message.channelId === 'object' &&
    typeof message.originalQuoteId === 'string' &&
    isQuoteRequest(message.newQuoteRequest) &&
    typeof message.nonce === 'bigint' &&
    typeof message.timestamp === 'bigint' &&
    typeof message.trader === 'object';
}

export function isHeartbeat(message: any): message is Heartbeat {
  return message &&
    typeof message.channelId === 'object' &&
    typeof message.nonce === 'bigint' &&
    typeof message.timestamp === 'bigint' &&
    typeof message.sender === 'object';
}

// ============================================================================
// EXPORT ALL TYPES FOR EXTERNAL USE
// ============================================================================

export {
  QuoteRequest,
  Quote,
  Fill,
  Cancel,
  Replace,
  Heartbeat,
  ChannelState,
  SettlementRequest,
  CheckpointRequest,
  DisputeChallenge
} from './types';