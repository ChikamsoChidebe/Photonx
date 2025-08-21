import { ethers } from "hardhat";

async function main() {
  console.log("Deploying PhotonX contracts...");

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  // Deploy SettlementManager
  console.log("\nDeploying SettlementManager...");
  const SettlementManager = await ethers.getContractFactory("SettlementManager");
  const settlementManager = await SettlementManager.deploy(
    deployer.address, // admin
    deployer.address, // coordinator
    deployer.address  // fee recipient
  );
  await settlementManager.waitForDeployment();
  const settlementAddress = await settlementManager.getAddress();
  console.log("SettlementManager deployed to:", settlementAddress);

  // Deploy CustodyVault
  console.log("\nDeploying CustodyVault...");
  const CustodyVault = await ethers.getContractFactory("CustodyVault");
  const custodyVault = await CustodyVault.deploy(
    deployer.address, // admin
    deployer.address, // vault manager
    deployer.address, // fee recipient
    deployer.address  // treasury
  );
  await custodyVault.waitForDeployment();
  const vaultAddress = await custodyVault.getAddress();
  console.log("CustodyVault deployed to:", vaultAddress);

  // Deploy mock ERC20 tokens for testing
  console.log("\nDeploying test tokens...");
  const MockERC20 = await ethers.getContractFactory("MockERC20");
  
  const usdc = await MockERC20.deploy("USD Coin", "USDC", 6);
  await usdc.waitForDeployment();
  const usdcAddress = await usdc.getAddress();
  console.log("USDC deployed to:", usdcAddress);

  const weth = await MockERC20.deploy("Wrapped Ether", "WETH", 18);
  await weth.waitForDeployment();
  const wethAddress = await weth.getAddress();
  console.log("WETH deployed to:", wethAddress);

  // Setup initial configuration
  console.log("\nSetting up initial configuration...");
  
  // Add supported tokens to vault
  await custodyVault.addSupportedToken(
    usdcAddress,
    ethers.parseUnits("1", 6), // min deposit: 1 USDC
    ethers.parseUnits("1000000", 6) // max deposit: 1M USDC
  );
  
  await custodyVault.addSupportedToken(
    wethAddress,
    ethers.parseUnits("0.001", 18), // min deposit: 0.001 WETH
    ethers.parseUnits("1000", 18) // max deposit: 1000 WETH
  );

  console.log("Configuration complete!");

  // Output deployment summary
  console.log("\n=== DEPLOYMENT SUMMARY ===");
  console.log("Network:", await ethers.provider.getNetwork());
  console.log("Deployer:", deployer.address);
  console.log("SettlementManager:", settlementAddress);
  console.log("CustodyVault:", vaultAddress);
  console.log("USDC Token:", usdcAddress);
  console.log("WETH Token:", wethAddress);
  console.log("==========================");

  // Save addresses to file
  const addresses = {
    network: (await ethers.provider.getNetwork()).name,
    chainId: (await ethers.provider.getNetwork()).chainId,
    deployer: deployer.address,
    contracts: {
      SettlementManager: settlementAddress,
      CustodyVault: vaultAddress,
      USDC: usdcAddress,
      WETH: wethAddress
    },
    deployedAt: new Date().toISOString()
  };

  const fs = require('fs');
  fs.writeFileSync('deployed-addresses.json', JSON.stringify(addresses, null, 2));
  console.log("\nAddresses saved to deployed-addresses.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });