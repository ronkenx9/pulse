const { ethers } = require("hardhat");
const dotenv = require("dotenv");
dotenv.config();

async function main() {
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    console.error("PRIVATE_KEY not found in .env");
    return;
  }

  const wallet = new ethers.Wallet(privateKey, ethers.provider);
  console.log("Checking balance for address:", wallet.address);

  const balance = await ethers.provider.getBalance(wallet.address);
  console.log("Balance:", ethers.formatEther(balance), "STMET");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
