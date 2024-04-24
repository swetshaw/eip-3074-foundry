// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {Script, console} from "forge-std/Script.sol";
import {Vm} from "forge-std/Vm.sol";
import {AuthorizedTransfer} from "../src/AuthorizedTransfer.sol";
import {AuthorizedTransferTest} from "../test/AuthorizedTransfer.t.sol";

contract DeployAndTest is Script {
    function run() external {
        vm.startBroadcast();

        // Deploy the AuthorizedTransferTest contract
        AuthorizedTransferTest authorizedTransferTest = new AuthorizedTransferTest();
        console.log("AuthorizedTransferTest deployed at:", address(authorizedTransferTest));

        // Run the setup function
        authorizedTransferTest.setUp();
        console.log("Setup complete.");


        // Run the test_authorisedInvokeTransfer function
        authorizedTransferTest.test_authorisedInvokeTransfer();
        console.log("test_authorisedInvokeTransfer executed.");

        vm.stopBroadcast();
    }
}
