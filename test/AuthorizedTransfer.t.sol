// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import {Test} from "forge-std/Test.sol";
import "forge-std/console.sol";
import {VmSafe} from "forge-std/Vm.sol";
import {ERC20} from "solady/tokens/ERC20.sol";

import {AuthorizedTransfer} from "../src/AuthorizedTransfer.sol";

contract AuthorizedTransferTest is Test {
    AuthorizedTransfer public   authorizedTransfer;

    uint256 fundedEOAPK = 0xa11ce;
    address fundedEOA = vm.addr(fundedEOAPK);
    
    address receiver = makeAddr("receiver");

    Token token = new Token();

    function setUp() public {
        uint amount = 10e18;
        token.mint(fundedEOA, amount);
    }

    function test_authorisedInvokeTransfer() external {
        authorizedTransfer = new AuthorizedTransfer();

        bytes32 commitEncoded = bytes32(abi.encode("commit"));

        bytes32 digest = authorizedTransfer.getDigest(commitEncoded);
        (uint8 _v, bytes32 _r, bytes32 _s) = vm.sign(fundedEOAPK, digest);

        AuthorizedTransfer.Call memory call = AuthorizedTransfer.Call({
            target: address(token),
            value: 0,
            data: abi.encodeWithSelector(
                ERC20.transfer.selector,
                receiver,
                1e18
            )
        });

        AuthorizedTransfer.Call[] memory calls = new AuthorizedTransfer.Call[](
            1
        );
       
       calls[0] = call;

        authorizedTransfer.authorisedInvokeTransfer(calls, abi.encode("commit"), _v, _r, _s, fundedEOA);
        assertEq(token.balanceOf(receiver), 1e18);
    }
}

contract Token is ERC20 {
    function mint(address to, uint value) public {
        _mint(to, value);
    }

    function name() public view override returns (string memory) {
        return "test";
    }

    function symbol() public view override returns (string memory) {
        return "TEST";
    }
}
