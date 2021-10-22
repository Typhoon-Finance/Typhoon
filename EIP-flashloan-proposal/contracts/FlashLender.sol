// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "hardhat/console.sol";

import "./interfaces/IERC20.sol";
import "./interfaces/IERC3156FlashBorrower.sol";
import "./interfaces/IERC3156FlashLender.sol";

import "./interfaces/IUniswapV2Router02.sol";
import "./interfaces/IUniswapV2Factory.sol";
import "./interfaces/IUniswapV2Pair.sol";

// Oracles
import "usingtellor/contracts/UsingTellor.sol";
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
    function getLatestPriceFromChainlink(address priceFeed_) public view returns (int256 price) {
        (,price,,,) = AggregatorV3Interface(priceFeed_).latestRoundData();
        price = price / 10**2;
    }

    // *** Test ***
    function getLatestPriceFromTellor(uint256 requestId_) public view returns (uint256 price) {
        (, price,) = getCurrentValue(requestId_);
    }

    function getPricesFromExchanges(address token_, uint256 amount_, address[] memory exchanges_) internal view returns (uint256[] memory prices) {
        // Get pair address from factory
        // Uniswap = 0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f
        // Sushi = 0xC0AEe478e3658e2610c5F7A4A2E1777cE9e4f2Ac
        // use price0/1Cumulative() to get price

        // Compare token price to USDC
        address USDC = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48; // USDC address on Mainnet
        prices = new uint256[](exchanges_.length);
        address pairAddress;
        for(uint256 i=0; exchanges_.length > i; i++) {
            // Get Pair
            pairAddress = IUniswapV2Factory(exchanges_[i]).getPair(USDC, token_);
            uint tokenPrice = IUniswapV2Pair(pairAddress).price1CumulativeLast();
            uint usdcPrice = IUniswapV2Pair(pairAddress).price0CumulativeLast();
            prices[i] = (tokenPrice / usdcPrice) / 10**18;
            console.log("DAI price from DEXes: ", prices[i]);
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
        int256 chainLinkOraclePrice = getLatestPriceFromChainlink(chainlinkPriceFeeds[token]);
        uint256 tellorOraclePrice = getLatestPriceFromTellor(tellorPriceFeeds[token]);

        // Multiply average oracle price by slippageTolerance
        uint256 tolerance = ((uint256(chainLinkOraclePrice) + tellorOraclePrice)/2) * (100 - slippageTolerance) / 100;
        console.log("DAI price from Tellor: ", tellorOraclePrice);

        console.log("Slippage tolerance price: ", tolerance);

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

        require(
            IERC20(token).transferFrom(address(receiver), address(this), amount + fee_),
            "FlashLender: Repay failed"
        );

        console.log("Repaid successfully!");

        uint[] memory prices = getPricesFromExchanges(token, amount, _exchanges);
        for (uint i=0; prices.length > i; i++) {
            require(prices[i] >= tolerance, "Token price is too low!");
        }

        console.log("Token price didn't get REKT'd!!");

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

    // HELPER - This function is ONLY for testing
    // ***** DELETE BEFORE DEPLOYMENT *****
    function swapETHForDAI() external payable {
        IUniswapV2Router02 router = IUniswapV2Router02(0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D);
        
        address[] memory path = new address[](2);
        path[0] = router.WETH();
        path[1] = 0x6B175474E89094C44Da98b954EedeAC495271d0F;

        router.swapExactETHForTokens{value: msg.value}(0, path, msg.sender, block.timestamp);
    }
}

