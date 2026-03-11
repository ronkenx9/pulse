// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IPulseGame} from "./interfaces/IPulseGame.sol";

contract PulseGame is IPulseGame {
    uint256 public duelCount;
    address public reactionHandler;
    address public feeAddress;

    mapping(uint256 => Duel) public duels;
    mapping(address => uint256) public elo;
    mapping(address => DuelRecord) public records;

    event DuelCreated(uint256 indexed duelId, address player1, address player2, uint256 stake);
    event DuelJoined(uint256 indexed duelId, address player2);
    event SignalFired(uint256 indexed duelId, uint256 timestamp);
    event ReactionSubmitted(uint256 indexed duelId, address player);
    event DuelResolved(uint256 indexed duelId, address winner, address loser, uint256 winnerBlock, uint256 loserBlock);

    modifier onlyHandler() {
        require(msg.sender == reactionHandler, "Only handler");
        _;
    }

    constructor(address _feeAddress) {
        feeAddress = _feeAddress;
    }

    function setReactionHandler(address _handler) external {
        require(reactionHandler == address(0), "Handler already set");
        reactionHandler = _handler;
    }

    function getElo(address player) external view returns (uint256) {
        uint256 current = elo[player];
        return current == 0 ? 100000 : current; // Scaled by 100
    }

    function getDuel(uint256 duelId) external view returns (Duel memory) {
        return duels[duelId];
    }

    function getRecord(address player) external view returns (DuelRecord memory) {
        return records[player];
    }

    function createDuel(address opponent) external payable returns (uint256) {
        require(msg.value > 0, "Stake must be > 0");
        uint256 duelId = ++duelCount;

        duels[duelId] = Duel({
            player1: msg.sender,
            player2: opponent,
            stake: msg.value,
            signalBlock: 0,
            winner: address(0),
            state: DuelState.OPEN
        });

        emit DuelCreated(duelId, msg.sender, opponent, msg.value);
        return duelId;
    }

    function joinDuel(uint256 duelId) external payable {
        Duel storage duel = duels[duelId];
        require(duel.state == DuelState.OPEN, "Duel not open");
        require(msg.sender == duel.player2 || duel.player2 == address(0), "Not your duel");
        require(msg.value == duel.stake, "Incorrect stake");

        if (duel.player2 == address(0)) {
            duel.player2 = msg.sender;
        }

        duel.state = DuelState.ARMED_PENDING;
        emit DuelJoined(duelId, msg.sender);
    }

    function armSignal(uint256 duelId) external {
        Duel storage duel = duels[duelId];
        require(duel.state == DuelState.ARMED_PENDING, "Not pending");
        
        duel.state = DuelState.ARMED;
        duel.signalBlock = block.number;

        emit SignalFired(duelId, block.timestamp);
    }

    function getOpponent(uint256 duelId, address player) internal view returns (address) {
        Duel storage duel = duels[duelId];
        if (player == duel.player1) return duel.player2;
        if (player == duel.player2) return duel.player1;
        return address(0);
    }

    function submitReaction(uint256 duelId) external {
        Duel storage duel = duels[duelId];
        require(msg.sender == duel.player1 || msg.sender == duel.player2, "Not a player");

        if (duel.state == DuelState.ARMED_PENDING) {
            // FALSE START
            duel.state = DuelState.RESOLVED;
            duel.winner = getOpponent(duelId, msg.sender);
            uint256 pot = duel.stake * 2;
            payable(duel.winner).transfer(pot);
            
            _updateElo(duel.winner, msg.sender);
            
            emit DuelResolved(duelId, duel.winner, msg.sender, block.number, block.number);
            return;
        }

        require(duel.state == DuelState.ARMED, "Duel not armed");
        emit ReactionSubmitted(duelId, msg.sender);
    }

    function resolveWinner(uint256 duelId, address winner) external onlyHandler {
        Duel storage duel = duels[duelId];
        if (duel.state == DuelState.RESOLVED) return; // Second reaction no-ops
        require(duel.state == DuelState.ARMED, "Not armed");

        address loser = getOpponent(duelId, winner);
        require(loser != address(0), "Invalid winner");

        duel.state = DuelState.RESOLVED;
        duel.winner = winner;

        uint256 pot = duel.stake * 2;
        uint256 fee = (pot * 2) / 100; // 2% fee
        uint256 payout = pot - fee;

        payable(winner).transfer(payout);
        payable(feeAddress).transfer(fee);

        _updateElo(winner, loser);

        emit DuelResolved(duelId, winner, loser, block.number, 0); // Loser block isn't known here natively unless tracked, using 0 or keeping simple
    }

    function cancelDuel(uint256 duelId) external {
        Duel storage duel = duels[duelId];
        require(duel.state == DuelState.OPEN, "Cannot cancel");
        require(msg.sender == duel.player1, "Not owner");
        
        duel.state = DuelState.CANCELLED;
        payable(duel.player1).transfer(duel.stake);
    }

    function _updateElo(address winner, address loser) internal {
        uint256 eloW = elo[winner] == 0 ? 100000 : elo[winner];
        uint256 eloL = elo[loser] == 0 ? 100000 : elo[loser];

        // Simplified Elo logic for solidity (since exponent is hard, 
        // using fixed delta or simplified linear approximation for demo)
        // A full Elo calculation requires exponentiation not native to EVM.
        // For the sake of this prototype, we'll implement a simplified fixed-K swap
        // A player gains K points on win, scaled by relative difference.
        
        uint256 K = 3200; // K=32 * 100
        
        // Very rough linear approximation for Expected Score since we can't do floating point 10^(...)
        // In a real app we'd use PRBMath or an oracle, but this is a pure EVM state representation.
        uint256 diff = eloW > eloL ? eloW - eloL : eloL - eloW;
        uint256 expectedDelta = diff > 40000 ? 1600 : (diff * 1600) / 40000;
        
        uint256 delta;
        if (eloW >= eloL) {
            delta = K - expectedDelta;
        } else {
            delta = K + expectedDelta;
        }

        elo[winner] = eloW + delta;
        elo[loser] = eloL >= delta ? eloL - delta : 0;

        records[winner].wins++;
        records[winner].duelsPlayed++;
        records[loser].losses++;
        records[loser].duelsPlayed++;
    }
}
