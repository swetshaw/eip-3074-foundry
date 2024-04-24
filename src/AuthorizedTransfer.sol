// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import { BaseAuth } from "./BaseAuth.sol";

contract AuthorizedTransfer is BaseAuth {

    uint256 counter;

    struct Call {
        /// @dev The target address to call.
        address target;
        /// @dev The value to associate with the call.
        uint256 value;
        /// @dev The raw call data.
        bytes data;
    }

    function authorisedInvokeTransfer(Call[] calldata calls, bytes calldata commitEncoded, uint8 v, bytes32 r, bytes32 s, address owner ) public {
        // just a counter to keep track of how many times this function has been called
        counter += 1;
        authSimple({authority: owner, commit: bytes32(commitEncoded), v:v, r:r, s:s});
        for (uint i; i < calls.length; i++){
            authCallSimple(calls[i].target, calls[i].data, calls[i].value, gasleft());
        }
    }
}
