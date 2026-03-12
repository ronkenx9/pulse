// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

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

        // ReactionSubmitted(uint256 indexed duelId, address player)
        // Topic[0]: sig
        // Topic[1]: duelId
        // Data: abi.encode(player)
        
        uint256 duelId = uint256(topics[1]);
        address reactor = abi.decode(data, (address));
        
        // resolveWinner handles DuelState.RESOLVED no-op internally
        pulseGame.resolveWinner(duelId, reactor);
    }
}
