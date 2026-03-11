// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {SomniaEventHandler} from "@somnia-chain/reactivity-contracts/contracts/SomniaEventHandler.sol";
import {IPulseGame} from "./interfaces/IPulseGame.sol";

contract ReactionHandler is SomniaEventHandler {
    IPulseGame public pulseGame;

    constructor(address _pulseGame) {
        pulseGame = IPulseGame(_pulseGame);
    }

    function _onEvent(
        address emitter,
        bytes32[] calldata topics,
        bytes calldata data
    ) internal override {
        require(emitter == address(pulseGame), "Wrong emitter");

        // ReactionSubmitted event signature:
        // event ReactionSubmitted(uint256 indexed duelId, address player);
        // Topic[0] = signature hash
        // Topic[1] = duelId (indexed)
        // Data = abi.encode(player) (unindexed)
        
        // Wait, the PRD specified abi.decode(data, (uint256, address)) in the example.
        // Let's decode it based on the PRD's exact instructions to match the spec:
        // "Decode duelId and reactor from data" -> meaning they might both be in data payload in the event example?
        // Wait, in PRD: `event ReactionSubmitted(uint256 indexed duelId, address player);`
        // If duelId is indexed, it's in topics[1].
        // Let's support both just in case, but let's follow the standard solidity decoding:
        
        // According to Solidity standard:
        // Indexed parameters are in `topics`
        // Unindexed are in `data`
        uint256 duelId = uint256(topics[1]);
        (address reactor) = abi.decode(data, (address));
        
        // Let's invoke resolveWinner. 
        // If second player processed, it ignores it via no-op in pulseGame
        pulseGame.resolveWinner(duelId, reactor);
    }
}
