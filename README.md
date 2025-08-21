# PhotonX - Gasless Cross-Chain RFQ Orderbook with State Channels

PhotonX is a state-channel powered RFQ (request-for-quote) DEX that makes frequent trading actions instant and gasless, while batching on-chain settlement for trustless finality. Built for Yellow Network Hackathon 2025.

## 🚀 Key Features

- **Instant Quotes**: Sub-200ms quote round-trip via ERC-7824 state channels
- **Gasless Trading**: 10+ trades with only 2 wallet signatures (open + settle)
- **Cross-Chain**: Seamless trading across multiple chains with abstracted UX
- **Pro-Grade RFQ**: Request-for-quote orderbook familiar to institutional traders
- **90%+ Gas Savings**: Batch settlement reduces on-chain transactions by 90%+

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Trader UI     │    │    LP Engine     │    │  Settlement     │
│   (Next.js)     │    │   (Node.js)      │    │   Relayer       │
└─────────┬───────┘    └─────────┬────────┘    └─────────┬───────┘
          │                      │                       │
          └──────────────────────┼───────────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │   Channel Coordinator   │
                    │   (ERC-7824 Manager)    │
                    └────────────┬────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │   Smart Contracts       │
                    │ (Settlement + Custody)  │
                    └─────────────────────────┘
```

## 📁 Project Structure

```
photonx/
├── apps/
│   ├── web/                 # Next.js trader & LP dashboards
│   ├── coordinator/         # Node.js state channel coordinator
│   └── relayer/            # Settlement batch submitter
├── packages/
│   ├── proto/              # TypeScript types & EIP-712 schemas
│   └── sdk/                # PhotonX SDK for integrations
├── contracts/              # Solidity contracts
└── infra/                  # Docker & deployment configs
```

## 🔧 Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- MetaMask or compatible wallet

### Installation
```bash
# Clone and install dependencies
git clone <repo-url>
cd photonx
npm install

# Start local development environment
docker-compose up -d
npm run dev

# Deploy contracts to local testnet
npm run contracts:deploy:local
```

### Demo Flow
1. **Open Channel**: Connect wallet, deposit tokens (1 signature)
2. **Trade Burst**: Place 10 RFQs, see instant fills (0 signatures)
3. **Settle**: Batch settle all trades (1 signature)
4. **Verify**: Check Etherscan for single settlement transaction

## 🎯 Success Metrics

- **Latency**: Median quote round-trip < 200ms
- **Gas Savings**: ≥90% fewer transactions vs AMM baseline
- **UX**: 1 signature to open, 1 to settle, 10+ trades in between

## 🏆 Yellow Network Hackathon Alignment

- **ERC-7824 State Channels**: Core architecture uses Yellow's state channel standard
- **Real DeFi Utility**: Solves actual trading friction (gas, latency, UX)
- **Technical Excellence**: Comprehensive implementation with security, testing, metrics
- **Scalability**: SDK-ready for dApp integrations

## 📊 Demo Metrics Dashboard

Live metrics during demo:
- Quote response time (ms)
- Trades per settlement ratio
- Gas saved counter
- Cross-chain transaction flow

## 🔐 Security Model

- **Nonce Monotonicity**: Prevents replay attacks
- **EIP-712 Signatures**: Domain separation and type safety
- **Dispute Resolution**: Challenge mechanism for invalid states
- **Risk Management**: LP exposure limits and circuit breakers

## 🚀 Deployment

### Testnet
```bash
npm run deploy:testnet
```

### Mainnet
```bash
npm run deploy:mainnet
```

## 📖 Documentation

- [Architecture Deep Dive](./docs/architecture.md)
- [API Reference](./docs/api.md)
- [Security Analysis](./docs/security.md)
- [Integration Guide](./docs/integration.md)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📄 License

MIT License - see [LICENSE](./LICENSE) file for details.

---

**Built for Yellow Network Hackathon 2025** 🟡