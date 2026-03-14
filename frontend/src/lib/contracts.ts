import { parseAbi } from 'viem';

// Deployed to Somnia Testnet (chain 50312) — 2026-03-12
export const PULSE_GAME_ADDRESS = '0x38D37af6807D4629F2956e4c4DCe385719Ab25ee';
export const REACTION_HANDLER_ADDRESS = '0xC1c3F7358bb01A95Ab9700e665E84306e72e468C';

// Simplified ABI necessary for the frontend based on the implementation
export const pulseGameAbi = parseAbi([
  "function createDuel(address opponent) external payable returns (uint256)",
  "function joinDuel(uint256 duelId) external payable",
  "function getElo(address player) external view returns (uint256)",
  "function getDuel(uint256 duelId) external view returns (address player1, address player2, uint256 stake, uint256 signalBlock, address winner, uint8 state)",
  "function getRecord(address player) external view returns (uint256 wins, uint256 losses, uint256 duelsPlayed)",
  "function submitReaction(uint256 duelId) external",
  "function armSignal(uint256 duelId) external",
  "function duelCount() external view returns (uint256)",
  "function cancelDuel(uint256 duelId) external",
  "event DuelCreated(uint256 indexed duelId, address player1, address player2, uint256 stake)",
  "event DuelJoined(uint256 indexed duelId, address player2)",
  "event SignalFired(uint256 indexed duelId, uint256 timestamp)",
  "event ReactionSubmitted(uint256 indexed duelId, address player)",
  "event DuelResolved(uint256 indexed duelId, address winner, address loser, uint256 winnerBlock, uint256 loserBlock)"
]);
