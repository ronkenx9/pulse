// This address will need to be updated after deployment
export const PULSE_GAME_ADDRESS = '0x123...';

// Simplified ABI necessary for the frontend based on the implementation
export const pulseGameAbi = [
  "function createDuel(address opponent) external payable returns (uint256)",
  "function joinDuel(uint256 duelId) external payable",
  "function getElo(address player) external view returns (uint256)",
  "function getDuel(uint256 duelId) external view returns (tuple(address player1, address player2, uint256 stake, uint256 signalBlock, address winner, uint8 state))",
  "function submitReaction(uint256 duelId) external",
  "function armSignal(uint256 duelId) external",
  "event DuelCreated(uint256 indexed duelId, address player1, address player2, uint256 stake)",
  "event DuelJoined(uint256 indexed duelId, address player2)",
  "event SignalFired(uint256 indexed duelId, uint256 timestamp)",
  "event ReactionSubmitted(uint256 indexed duelId, address player)",
  "event DuelResolved(uint256 indexed duelId, address winner, address loser, uint256 winnerBlock, uint256 loserBlock)"
];
