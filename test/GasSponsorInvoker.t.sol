// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import {Test} from "forge-std/Test.sol";
import "forge-std/console.sol";
import {VmSafe} from "forge-std/Vm.sol";

import {GasSponsorInvoker} from "../src/GasSponsorInvoker.sol";
import {SenderRecorder} from "../src/SenderRecorder.sol";

contract GasSponsorInvokerTest is Test {
    GasSponsorInvoker public gasSponsorInvoker;
    SenderRecorder public senderRecorder;

    VmSafe.Wallet public authority;

    function setUp() public {
        authority = vm.createWallet("authority");
        gasSponsorInvoker = new GasSponsorInvoker();
        senderRecorder = new SenderRecorder();
    }

    function test_invoke() external {

        address initial_sender = senderRecorder.lastSender();

        assertEq(initial_sender, address(0));

        uint256 nonce = vm.getNonce(authority);

        bytes32 commitEncoded = keccak256("commit");

        bytes32 digest = gasSponsorInvoker.getDigest(commitEncoded, nonce);
        (uint8 _v, bytes32 _r, bytes32 _s) = vm.sign(authority.privateKey, digest);

        bytes memory data = abi.encodeWithSelector(
            SenderRecorder.recordSender.selector
        );

        gasSponsorInvoker.sponsorCall(
            authority.addr,
            commitEncoded,
            _v,
            _r,
            _s,
            address(senderRecorder),
            data
        );

        assertEq(senderRecorder.lastSender(), authority.addr);
    }
}
