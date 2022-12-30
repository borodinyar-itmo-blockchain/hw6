// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.6.12;

import {FlashLoanReceiverBase} from "@aave/protocol-v2/contracts/flashloan/base/FlashLoanReceiverBase.sol";
import {ILendingPoolAddressesProvider} from "@aave/protocol-v2/contracts/interfaces/ILendingPoolAddressesProvider.sol";
import {IUniswapV2Router02} from "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";

contract Flashloan is FlashLoanReceiverBase {

    address public router;
    address[] public path;

    constructor(address _addressProvider, address _router, address[] memory _path) FlashLoanReceiverBase(ILendingPoolAddressesProvider(_addressProvider)) public {
        require(_path.length >= 3, "Flashloan: path must be at least 3");
        require(_path[0] == _path[_path.length - 1], "Flashloan: path must start and end with the same token");

        router = _router;
        path = _path;
    }

    function executeOperation(
        address[] calldata assets,
        uint256[] calldata amounts,
        uint256[] calldata premiums,
        address initiator,
        bytes calldata /*params*/
    ) external override returns (bool) {

        require(assets.length == 1, "Flashloan: can only flashloan one asset at a time");
        require(amounts.length == 1, "Flashloan: can only flashloan one amount at a time");
        require(premiums.length == 1, "Flashloan: can only flashloan one premium at a time");
        require(assets[0] == path[0], "Flashloan: asset must be the same as the first token in the path");

        SafeERC20.safeApprove(IERC20(assets[0]), router, amounts[0]);
        IUniswapV2Router02(router).swapExactTokensForTokens(amounts[0], 0, path, address(this), block.timestamp);

        uint amountOwing = amounts[0].add(premiums[0]);
        SafeERC20.safeApprove(IERC20(assets[0]), address(LENDING_POOL), amountOwing);

        return true;
    }


    function flashLoanCall(uint256 _amount) public {
        address receiverAddress = address(this);

        address[] memory assets = new address[](1);
        assets[0] = path[0];

        uint256[] memory amounts = new uint256[](1);
        amounts[0] = _amount;

        // 0 = no debt, 1 = stable, 2 = variable
        uint256[] memory modes = new uint256[](1);
        modes[0] = 0;

        address onBehalfOf = address(0);
        bytes memory params = "";
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
}