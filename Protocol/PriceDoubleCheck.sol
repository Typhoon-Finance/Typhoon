
contract PriceDoubleCheck {

    // constructor setting up tellor stuff?

    function priceDoubleCheck (
        string[]   memory tokens,
        uint256[]  memory prices,
        uint256[]  memory riskTolerance,
        bool              ignoreUnrecognizedTokens
    )
    public 
    returns (bool) {
    // returns (ResponseData) {s

        // call tellor for price info of the inputs tokens

        // for each price, compare original and doubleCheck price, get % difference

        return true;
    }

    //   example solidity usage:
    // 
    // priceDoubleCheck(["WETH", "WBTC", "MATIC", "WETH"], [ 1.234, 0.45345, 3.12343 ], [ 5, 20, 5 ]);

}