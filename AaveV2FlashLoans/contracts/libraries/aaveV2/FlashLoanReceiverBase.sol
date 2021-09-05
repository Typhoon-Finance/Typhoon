// SPDX-License-Identifier: agpl-3.0
pragma solidity ^0.8.0;

import {SafeMath} from '../SafeMath.sol';
import {IERC20} from '../../interfaces/IERC20.sol';
import {SafeERC20} from '../SafeERC20.sol';
import {IFlashLoanReceiver} from '../../interfaces/aaveV2/IFlashLoanReceiver.sol';
import {ILendingPoolAddressesProvider} from '../interfaces/aaveV2/ILendingPoolAddressesProvider.sol';
import {ILendingPool} from '../../interfaces/aaveV2/ILendingPool.sol';

abstract contract FlashLoanReceiverBase is IFlashLoanReceiver {
  using SafeERC20 for IERC20;
  using SafeMath for uint256;

  ILendingPoolAddressesProvider public immutable override ADDRESSES_PROVIDER;
  ILendingPool public immutable override LENDING_POOL;

  constructor(ILendingPoolAddressesProvider provider) {
    ADDRESSES_PROVIDER = provider;
    LENDING_POOL = ILendingPool(provider.getLendingPool());
  }
}