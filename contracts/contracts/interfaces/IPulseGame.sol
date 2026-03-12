// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

interface IPulseGame {
    enum DuelState { OPEN, ARMED_PENDING, ARMED, RESOLVED, CANCELLED }

    struct DuelRecord {
        uint256 wins;
        uint256 losses;
        uint256 duelsPlayed;
        uint256[] signalBlocks;
    }

    struct Duel {
        address player1;
        address player2;
        uint256 stake;
        uint256 signalBlock;
        address winner;
        DuelState state;
    }

    function resolveWinner(uint256 duelId, address winner) external;
}
