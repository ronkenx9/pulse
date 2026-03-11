import { expect } from "chai";
import { ethers } from "hardhat";
import { PulseGame, ReactionHandler } from "../typechain-types";

describe("PulseGame", function () {
  async function deployFixture() {
    const [owner, player1, player2, feeAddress, otherAccount] = await ethers.getSigners();

    const PulseGameFactory = await ethers.getContractFactory("PulseGame");
    const pulseGame = await PulseGameFactory.deploy(feeAddress.address);

    const ReactionHandlerFactory = await ethers.getContractFactory("ReactionHandler");
    const handler = await ReactionHandlerFactory.deploy(await pulseGame.getAddress());

    await pulseGame.setReactionHandler(await handler.getAddress());

    return { pulseGame, handler, owner, player1, player2, feeAddress, otherAccount };
  }

  describe("Deployment", function () {
    it("Should set the right feeAddress and handler", async function () {
      const { pulseGame, handler, feeAddress } = await deployFixture();
      expect(await pulseGame.feeAddress()).to.equal(feeAddress.address);
      expect(await pulseGame.reactionHandler()).to.equal(await handler.getAddress());
    });
  });

  describe("Gameplay", function () {
    it("Should create and join a duel", async function () {
      const { pulseGame, player1, player2 } = await deployFixture();
      const stake = ethers.parseEther("1");

      await expect(pulseGame.connect(player1).createDuel(player2.address, { value: stake }))
        .to.emit(pulseGame, "DuelCreated")
        .withArgs(1, player1.address, player2.address, stake);

      await expect(pulseGame.connect(player2).joinDuel(1, { value: stake }))
        .to.emit(pulseGame, "DuelJoined")
        .withArgs(1, player2.address);

      const duel = await pulseGame.getDuel(1);
      expect(duel.state).to.equal(1); // ARMED_PENDING
    });

    it("Should punish false start immediately", async function () {
      const { pulseGame, player1, player2 } = await deployFixture();
      const stake = ethers.parseEther("1");

      await pulseGame.connect(player1).createDuel(player2.address, { value: stake });
      await pulseGame.connect(player2).joinDuel(1, { value: stake });

      // player1 false starts
      const p2BalBefore = await ethers.provider.getBalance(player2.address);
      
      await expect(pulseGame.connect(player1).submitReaction(1))
        .to.emit(pulseGame, "DuelResolved")
        .withArgs(1, player2.address, player1.address, await ethers.provider.getBlockNumber() + 1, await ethers.provider.getBlockNumber() + 1);

      const duel = await pulseGame.getDuel(1);
      expect(duel.state).to.equal(3); // RESOLVED
      expect(duel.winner).to.equal(player2.address);

      const p2BalAfter = await ethers.provider.getBalance(player2.address);
      expect(p2BalAfter - p2BalBefore).to.equal(stake * 2n);
    });

    it("Should successfully resolve a legitimate reaction", async function () {
        const { pulseGame, handler, player1, player2, feeAddress } = await deployFixture();
        const stake = ethers.parseEther("1");
  
        await pulseGame.connect(player1).createDuel(player2.address, { value: stake });
        await pulseGame.connect(player2).joinDuel(1, { value: stake });
        await pulseGame.armSignal(1); // Cron does this
  
        await expect(pulseGame.connect(player1).submitReaction(1))
          .to.emit(pulseGame, "ReactionSubmitted")
          .withArgs(1, player1.address);
  
        const p1BalBefore = await ethers.provider.getBalance(player1.address);
        const feeBalBefore = await ethers.provider.getBalance(feeAddress.address);

        // Simulate Somnia Validator hooking the event
        // ReactionHandler needs standard caller access here or we just test resolveWinner dynamically
        // Wait, resolveWinner is only callable by handler
        
        // Let's call resolveWinner FROM the handler contract to test internal logic
        // Because ReactionHandler is smart contract, we can invoke pulseGame.resolveWinner via handler._onEvent if it was public... 
        // We will just mock the handler's execution in hardhat by impersonating the handler, OR we can test via pulseGame impersonation.
        // Wait, _onEvent is internal. Let's just impersonate the handler!
        
        const handlerAddress = await handler.getAddress();
        await ethers.provider.send("hardhat_impersonateAccount", [handlerAddress]);
        await ethers.provider.send("hardhat_setBalance", [handlerAddress, "0x1000000000000000000"]); // 1 ETH
        const handlerSigner = await ethers.getSigner(handlerAddress);

        await pulseGame.connect(handlerSigner).resolveWinner(1, player1.address);
        
        const p1BalAfter = await ethers.provider.getBalance(player1.address);
        const feeBalAfter = await ethers.provider.getBalance(feeAddress.address);

        const pot = stake * 2n;
        const fee = (pot * 2n) / 100n;
        const payout = pot - fee;

        expect(p1BalAfter - p1BalBefore).to.equal(payout);
        expect(feeBalAfter - feeBalBefore).to.equal(fee);

        const duel = await pulseGame.getDuel(1);
        expect(duel.state).to.equal(3); // RESOLVED
        expect(duel.winner).to.equal(player1.address);
      });
  });
});
