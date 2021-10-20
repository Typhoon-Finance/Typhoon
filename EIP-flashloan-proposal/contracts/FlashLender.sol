// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "./interfaces/IERC20.sol";
import "./interfaces/IERC3156FlashBorrower.sol";
import "./interfaces/IERC3156FlashLender.sol";

import "./interfaces/IUniswapV2Router02.sol";

// Oracles
import "../node_modules/usingtellor/contracts/UsingTellor.sol";
import "./interfaces/chainlink/AggregatorV3Interface.sol";

/**
 * @author Alberto Cuesta Cañada
 * @dev Extension of {ERC20} that allows flash lending.
 */
contract FlashLender is IERC3156FlashLender, UsingTellor {

    bytes32 public constant CALLBACK_SUCCESS = keccak256("ERC3156FlashBorrower.onFlashLoan");
    mapping(address => bool) public supportedTokens;
    uint256 public fee; //  1 == 0.0001 %.

    // Custom variables
    // struct Feed {
    //     uint8   decimals;
    //     address token;
    //     address comparedTo;
    //     address priceFeed;
    // }

    address[] private _exchanges;
    mapping(address => address) private chainlinkPriceFeeds; // All pricefeeds will be compared to USD
    mapping(address => uint256) private tellorPriceFeeds; // All pricefeeds will be compared to USD
    uint256 private slippageTolerance = 20; // 20%

    /**
     * @param supportedTokens_ Token contracts supported for flash lending.
     * @param fee_ The percentage of the loan `amount` that needs to be repaid, in addition to `amount`.
     */
    constructor(
        address[] memory supportedTokens_,
        uint256 fee_,
        address[] memory chainlinkPriceFeeds_,
        uint256[] memory tellorPriceFeeds_,
        address payable tellorAddress_,
        address[] memory exchanges_
    ) UsingTellor(tellorAddress_) {
        require(supportedTokens_.length == chainlinkPriceFeeds_.length, "tokens and price feeds do not match");
        for (uint256 i = 0; i < supportedTokens_.length; i++) {
            supportedTokens[supportedTokens_[i]] = true;
        }
        fee = fee_;
        _exchanges = exchanges_;

        for (uint256 i = 0; i < chainlinkPriceFeeds_.length; i++) {
            setPriceFeedFromChainlink(supportedTokens_[i], chainlinkPriceFeeds_[i]);
        }

        for (uint256 i = 0; i < tellorPriceFeeds_.length; i++) {
            setPriceFeedFromTellor(supportedTokens_[i], tellorPriceFeeds_[i]);
        }
    }

    // *** Test ***
    // ADD this function in a FOR loop to insert pricefeed for every
    // supported token in this contract.
    function setPriceFeedFromChainlink(address token_, address priceFeed_) internal {
        chainlinkPriceFeeds[token_] = priceFeed_;
    }

    function setPriceFeedFromTellor(address token_, uint256 requestId_) internal {
        tellorPriceFeeds[token_] = requestId_;
    }

    // *** Test ***
    function getLatestPriceFromChainlink(address priceFeed_) public view returns (int256 price, uint256 timestamp) {
        (,price,,timestamp,) = AggregatorV3Interface(priceFeed_).latestRoundData();
    }

    // *** Test ***
    function getLatestPriceFromTellor(uint256 requestId_) public view returns (uint256 price, uint256 timestamp) {
        (, price, timestamp) = getCurrentValue(requestId_);
    }

    function getPricesFromExchanges(address token_, uint256 amount_, address[] memory exchanges_) internal view returns (uint256[] memory prices) {
        // Compare token price to USDC
        address USDC = 0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174; // USDC address on Polygon
        prices = new uint256[](exchanges_.length);
        address[] memory path = new address[](2);
        uint256[] memory results = new uint256[](2);
        for(uint256 i=0; exchanges_.length > i; i++) {
            path[0] = USDC;
            path[1] = token_;
            results = IUniswapV2Router02(exchanges_[i]).getAmountsOut(amount_, path);
            prices[i] = results[1]/results[0];
        }
    }

    /**
     * @dev Loan `amount` tokens to `receiver`, and takes it back plus a `flashFee` after the callback.
     * @param receiver The contract receiving the tokens, needs to implement the `onFlashLoan(address user, uint256 amount, uint256 fee, bytes calldata)` interface.
     * @param token The loan currency.
     * @param amount The amount of tokens lent.
     * @param data A data parameter to be passed on to the `receiver` for any custom use.
     */
    function flashLoan(
        IERC3156FlashBorrower receiver,
        address token,
        uint256 amount,
        bytes calldata data
    ) external override returns(bool) {
        require(
            supportedTokens[token],
            "FlashLender: Unsupported currency"
        );
        uint256 fee_ = _flashFee(amount);

        // Get prices from each oracle
        (int256 chainLinkOraclePrice,) = getLatestPriceFromChainlink(chainlinkPriceFeeds[token]);
        (uint256 tellorOraclePrice,) = getLatestPriceFromTellor(tellorPriceFeeds[token]);

        // Multiply average oracle price by slippageTolerance
        uint256 tolerance = ((uint256(chainLinkOraclePrice) + tellorOraclePrice)/2) * slippageTolerance / 100;

        require(
            IERC20(token).transfer(address(receiver), amount),
            "FlashLender: Transfer failed"
        );
        require(
            receiver.onFlashLoan(msg.sender, token, amount, fee, data) == CALLBACK_SUCCESS,
            "FlashLender: Callback failed"
        );

        // CHECK oracle pricing again to monitor prices changes
        // Get DEX prices of token and compare to slippageTolerance
        // If price from DEX is lower than slippageTolerance, REVERT transaction
        uint[] memory prices = getPricesFromExchanges(token, amount, _exchanges);
        for (uint i=0; prices.length > i; i++) {
            require(prices[i] >= tolerance, "Token price is too low!");
        }

        require(
            IERC20(token).transferFrom(address(receiver), address(this), amount + fee_),
            "FlashLender: Repay failed"
        );
        return true;
    }

    /**
     * @dev The fee to be charged for a given loan.
     * @param token The loan currency.
     * @param amount The amount of tokens lent.
     * @return The amount of `token` to be charged for the loan, on top of the returned principal.
     */
    function flashFee(
        address token,
        uint256 amount
    ) external view override returns (uint256) {
        require(
            supportedTokens[token],
            "FlashLender: Unsupported currency"
        );
        return _flashFee(amount);
    }

    /**
     * @dev The fee to be charged for a given loan. Internal function with no checks.
     * @param amount The amount of tokens lent.
     * @return The amount of `token` to be charged for the loan, on top of the returned principal.
     */
    function _flashFee(
        uint256 amount
    ) internal view returns (uint256) {
        return amount * fee / 10000;
    }

    /**
     * @dev The amount of currency available to be lent.
     * @param token The loan currency.
     * @return The amount of `token` that can be borrowed.
     */
    function maxFlashLoan(
        address token
    ) external view override returns (uint256) {
        return supportedTokens[token] ? IERC20(token).balanceOf(address(this)) : 0;
    }
}

