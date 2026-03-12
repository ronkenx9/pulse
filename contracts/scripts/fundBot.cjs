const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Main wallet:", deployer.address);

    // Generate a bot wallet from a simple seed or just use a random one
    // For this demo, let's just generate a random one and log the key
    const botWallet = ethers.Wallet.createRandom().connect(ethers.provider);
    console.log("Bot address:", botWallet.address);
    console.log("Bot private key:", botWallet.privateKey);

    // Transfer 10 STMET
    const amount = ethers.parseEther("10");
    console.log(`Transferring ${ethers.formatEther(amount)} STMET to bot...`);

    const tx = await deployer.sendTransaction({
        to: botWallet.address,
        value: amount,
        gasPrice: 50_000_000_000 // Ensure it gets through
    });

    await tx.wait();
    console.log("Transfer complete.");
}

main().catch(err => {
    console.error(err);
    process.exitCode = 1;
});
