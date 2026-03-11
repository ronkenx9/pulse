import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Somnia testnet standard fee receiver or just the deployer for this test
  const feeAddress = deployer.address;

  const PulseGameFactory = await ethers.getContractFactory("PulseGame");
  const pulseGame = await PulseGameFactory.deploy(feeAddress);
  await pulseGame.waitForDeployment();
  const gameAddress = await pulseGame.getAddress();
  console.log("PulseGame deployed to:", gameAddress);

  const ReactionHandlerFactory = await ethers.getContractFactory("ReactionHandler");
  const handler = await ReactionHandlerFactory.deploy(gameAddress);
  await handler.waitForDeployment();
  const handlerAddress = await handler.getAddress();
  console.log("ReactionHandler deployed to:", handlerAddress);

  console.log("Setting reaction handler on PulseGame...");
  const tx = await pulseGame.setReactionHandler(handlerAddress);
  await tx.wait();
  console.log("Handler hooked correctly.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
