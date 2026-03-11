# PULSE — Real-Time On-Chain Reflex Duels

**PULSE** is a 1v1 real-time reflex duel game deployed on the Somnia Testnet. Two players stake tokens. A signal fires as an on-chain event. The frontend is notified via Somnia Reactivity WebSocket push (zero polling). First player whose `submitReaction()` transaction lands on-chain wins. Resolution is triggered asynchronously by a Solidity event handler contract watching `ReactionSubmitted`. No backend. No oracle. No centralised timer.

The game mechanic is a direct demonstration of **Somnia Reactivity**. The architecture IS the feature.

## Architecture

*   **PulseGame.sol**: The core state machine, governing stakes, ELO ratings, and false-start logic.
*   **ReactionHandler.sol**: Implements `SomniaEventHandler`. It catches `ReactionSubmitted` events and processes the duel resolution asynchronously via validators.
*   **Frontend**: Built with React, Vite, and viem. It utilizes maximalist CRT aesthetics, the Web Audio API for sound feedback, and the Somnia Reactivity SDK for zero-latency, push-based game state updates.

## Setup Instructions

### Contracts 
The smart contracts are located in `/contracts`. They utilize Hardhat. 

1. `cd contracts`
2. `npm install`
3. Create a `.env` file and set your `PRIVATE_KEY`.
4. Run `npx hardhat test` to execute the E2E False Start constraint testing.
5. Deploy: `npx hardhat run scripts/deploy.ts --network somniaTestnet`

### Frontend
The frontend is a Vite React TypeScript application.

1. `cd frontend`
2. `npm install`
3. Update `src/lib/contracts.ts` with your deployed `PulseGame` address.
4. Run `npm run dev` to start the local development server.

## Security Assumptions & Known Limitations

**Cron delay predictability:** The random delay for `armSignal()` is generated client-side in TypeScript and submitted via `sdk.createCronSubscription()`. A sophisticated opponent could observe the cron payload in the mempool or network tab and pre-time their reaction. This is a known limitation accepted for the purposes of this hackathon to showcase the Somnia Cron SDK. Production implementation would use an on-chain VRF (e.g., Chainlink VRF or Somnia-native equivalent) to generate the delay unpredictably.

**Block timestamp resolution:** `block.timestamp` is identical for all transactions within the same block. Winner determination in PULSE is based purely on transaction inclusion order (first `ReactionSubmitted` event caught by ReactionHandler), not timestamps. Timestamps are stored for display purposes only.

**False start scripts:** The false start penalty (instant loss, full pot to opponent) economically disincentivises reaction-spamming scripts. Players who spam `submitReaction` before `SignalFired` lose their full stake.

**ReactionHandler access:** `resolveWinner()` should be callable only by the ReactionHandler contract address (which is enforced via `onlyHandler` modifier).
