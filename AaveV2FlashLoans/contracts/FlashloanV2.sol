// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;
pragma abicoder v2;

import { FlashLoanReceiverBase } from "./libraries/aaveV2/FlashLoanReceiverBase.sol";
import { IERC20 } from "./interfaces/IERC20.sol";
import { ILendingPool } from "./interfaces/aaveV2/ILendingPool.sol";
import { ILendingPoolAddressesProvider } from "./interfaces/aaveV2/ILendingPoolAddressesProvider.sol";
import { SafeMath } from "./libraries/SafeMath.sol";

import { IUniswapV2Router02 } from "./interfaces/uniswap/IUniswapV2Router02.sol";

import { IWETH } from "./interfaces/aaveV2/IWETH.sol";


contract FlashloanV2 is FlashLoanReceiverBase {
    using SafeMath for uint256;

    constructor(ILendingPoolAddressesProvider _addressProvider) FlashLoanReceiverBase(_addressProvider) {
        // No additional logic
    }

    /**
        This function is called after your contract has received the flash loaned amount
     */
    function executeOperation(
        address[] calldata assets,
        uint256[] calldata amounts,
        uint256[] calldata premiums,
        address initiator,
        bytes calldata params
    )
        external
        override
        returns (bool)
    {
        //
        // This contract now has the funds requested.
        // Your logic goes here.
        //

        // Decode abi in params to get _exchanges from flashloanCall()
        (address[] memory exchanges, address[] memory tokens) = abi.decode(params);
        require(tokens[0] == assets[0], "Initial token addresses do not match");
        require(tokens[tokens.length - 1] == assets[0], "Last token address does not match token owed");

        // Set function variables for swap in FOR loop
        // FOR loop will swap based on token and exchange path from decoded params
        uint amountsIn = amounts[0];
        uint amountsOut = 0;
        address[] memory path = new address[](2);
        for(uint i=0; exchanges.length > i; i++) {
            if (tokens[i + 1]) {
                path[0] = tokens[i];
                path[1] = tokens[i + 1];

                amountsOut = _swap(path, amountsIn, exchanges[i]);
                amountsIn = amountsOut;
            }
        }

        // At the end of your logic above, this contract owes
        // the flashloaned amounts + premiums.
        // Therefore ensure your contract has enough to repay
        // these amounts.

        // Approve the LendingPool contract allowance to *pull* the owed amount
        uint amountOwing = amounts[0].add(premiums[0]);
        require(returnAmount > amountOwing, "Not enough earned to pay back lending pool");
        IERC20(assets[0]).approve(address(LENDING_POOL), amountOwing);
        
        // Return any profit to user after repayment of flashloan
        uint profit = returnAmount.sub(amountOwing);
        IERC20(assets[0]).transfer(initiator, profit);

        return true;
    }

    // Use a DEX aggregator on client side to decide router addresses (e.g. CoinGecko, 1inch, Paraswap, etc.)
    function flashloanCall(address[] memory _tokens, uint256 _amount, address[] memory _exchanges) public {
        address receiverAddress = address(this);

        address[] memory assets = new address[](1);
        assets[0] = _tokens[0];

        uint256[] memory amounts = new uint256[](1);
        amounts[0] = _amount;

        // 0 = no debt, 1 = stable, 2 = variable
        uint256[] memory modes = new uint256[](1);
        modes[0] = 0;

        address onBehalfOf = msg.sender;

        // Convert _exchanges into bytes and put in params
        // This will determine number of swaps and which swap function to call
        // within executeOperation()

        // bytes memory params = ""; // <=== ADD HERE!
        bytes memory params = abi.encode(_exchanges, _tokens);
        uint16 referralCode = 0;

        LENDING_POOL.flashLoan(
            receiverAddress,
            assets,
            amounts,
            modes,
            onBehalfOf,
            params,
            referralCode
        );
    }

    function _swap(address[] memory _path, uint256 _amountIn, address _routerAddress) internal returns (uint256 tokenOut) {
        IERC20(_path[0]).approve(_routerAddress, _amountIn);
        tokenOut = IUniswapV2Router02(_routerAddress).swapExactTokensForTokens(_amountIn, 0, _path, address(this), block.timestamp)[1];
    }
    
    function getBalance(address _assetAddress) external view returns (uint256) {
        return IERC20(_assetAddress).balanceOf(address(this));
    }
}
