import { ethers } from "hardhat";

async function main() {
  console.log("Deploying PhotonX Simple Token...");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  // Deploy SimpleToken
  const SimpleToken = await ethers.getContractFactory("SimpleToken");
  const token = await SimpleToken.deploy();
  await token.waitForDeployment();
  
  const tokenAddress = await token.getAddress();
  console.log("SimpleToken deployed to:", tokenAddress);

  // Get some info
  const name = await token.name();
  const symbol = await token.symbol();
  const balance = await token.balanceOf(deployer.address);
  
  console.log("Token Name:", name);
  console.log("Token Symbol:", symbol);
  console.log("Deployer Balance:", ethers.formatEther(balance), "tokens");

  console.log("\n=== DEPLOYMENT COMPLETE ===");
  console.log("Contract Address:", tokenAddress);
  console.log("Network: Hardhat Local");
  console.log("Chain ID: 31337");
  console.log("============================");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });