# 🚀 PhotonX Setup Instructions

## Quick Start (5 minutes)

### 1. Start Local Blockchain
```bash
cd contracts
npx hardhat node
```
Keep this terminal running.

### 2. Deploy Contracts (New Terminal)
```bash
npm run contracts:deploy:local
```

### 3. Start Web App (New Terminal)
```bash
npm run web:dev
```

### 4. Connect MetaMask
1. Open http://localhost:3000
2. Click "Connect Wallet"
3. Add Hardhat Network to MetaMask:
   - Network Name: `Hardhat Local`
   - RPC URL: `http://localhost:8545`
   - Chain ID: `31337`
   - Currency: `ETH`

### 5. Import Test Account
Import this private key to MetaMask:
```
0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

## ✅ You're Ready!
- Real wallet connection ✅
- Live price data ✅
- Quote generation ✅
- Trade execution ✅
- 100% FREE ✅

Visit http://localhost:3000 and start trading!