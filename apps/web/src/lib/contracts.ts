import { ethers } from 'ethers';

// Contract addresses for different networks
export const CONTRACTS = {
  1: { // Ethereum Mainnet
    SETTLEMENT: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    CUSTODY_VAULT: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512'
  },
  137: { // Polygon
    SETTLEMENT: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    CUSTODY_VAULT: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512'
  },
  42161: { // Arbitrum
    SETTLEMENT: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    CUSTODY_VAULT: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512'
  },
  8453: { // Base
    SETTLEMENT: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    CUSTODY_VAULT: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512'
  },
  31337: { // Local Hardhat
    SETTLEMENT: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    CUSTODY_VAULT: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512'
  }
};

// ERC-20 Token addresses
export const TOKENS = {
  1: { // Ethereum
    USDC: '0xA0b86a33E6441b8435b662303c0f479c6E1C4c8e',
    WETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    WBTC: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599'
  },
  137: { // Polygon
    USDC: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
    WETH: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
    WMATIC: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270'
  },
  42161: { // Arbitrum
    USDC: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8',
    WETH: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
    ARB: '0x912CE59144191C1204E64559FE8253a0e49E6548'
  },
  8453: { // Base
    USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    WETH: '0x4200000000000000000000000000000000000006'
  }
};

// Network configurations
export const NETWORKS = {
  1: {
    name: 'Ethereum',
    symbol: 'ETH',
    rpc: 'https://mainnet.infura.io/v3/',
    explorer: 'https://etherscan.io'
  },
  137: {
    name: 'Polygon',
    symbol: 'MATIC',
    rpc: 'https://polygon-rpc.com',
    explorer: 'https://polygonscan.com'
  },
  42161: {
    name: 'Arbitrum',
    symbol: 'ETH',
    rpc: 'https://arb1.arbitrum.io/rpc',
    explorer: 'https://arbiscan.io'
  },
  8453: {
    name: 'Base',
    symbol: 'ETH',
    rpc: 'https://mainnet.base.org',
    explorer: 'https://basescan.org'
  }
};

export function getContractAddress(chainId: number, contract: 'SETTLEMENT' | 'CUSTODY_VAULT'): string {
  return CONTRACTS[chainId as keyof typeof CONTRACTS]?.[contract] || CONTRACTS[1][contract];
}

export function getTokenAddress(chainId: number, token: string): string {
  const networkTokens = TOKENS[chainId as keyof typeof TOKENS];
  if (!networkTokens) return '';
  return (networkTokens as any)[token] || '';
}

export function getNetworkInfo(chainId: number) {
  return NETWORKS[chainId as keyof typeof NETWORKS] || NETWORKS[1];
}