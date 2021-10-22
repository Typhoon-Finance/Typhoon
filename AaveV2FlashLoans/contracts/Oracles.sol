// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;
pragma abicoder v2;

import "usingtellor/contracts/UsingTellor.sol";
import "./interfaces/chainlink/AggregatorV3Interface.sol";

contract Oracles {
    /**
        The aim of this contract is to use multiple oracles
        for reference and price checks.

        Oracles include: Tellor, Chainlink, etc.
    */

    constructor(address payable _tellorAddress) UsingTellor(_tellorAddress) {}

    function getPriceFeedFromChainlink(address _priceFeedAddress) public view returns (int) {
        AggregatorV3Interface priceFeed = AggregatorV3Interface(_priceFeedAddress);

        // Get latest price feed data based on address

    }

    function getPriceFeedFromTellor() public view returns (int) {
        
    }
}