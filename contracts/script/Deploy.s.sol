// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {InvoiceRegistry} from "../src/InvoiceRegistry.sol";
import {InvestorAllowlist} from "../src/InvestorAllowlist.sol";
import {ReceivableFinance} from "../src/ReceivableFinance.sol";

/// Env: PRIVATE_KEY_DEPLOYER, VERIFIER_ADDRESS, USDT, optional INVESTORS (comma-less: INVESTOR_1, INVESTOR_2)
contract Deploy is Script {
    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY_DEPLOYER");
        address admin = vm.addr(pk);
        address verifier = vm.envAddress("VERIFIER_ADDRESS");
        address usdt = vm.envAddress("USDT");

        vm.startBroadcast(pk);

        InvoiceRegistry registry = new InvoiceRegistry(admin);
        InvestorAllowlist allowlist = new InvestorAllowlist(admin);
        ReceivableFinance finance =
            new ReceivableFinance(admin, registry, allowlist, IERC20(usdt), 3 days);

        registry.grantRole(registry.VERIFIER_ROLE(), verifier);
        registry.grantRole(registry.FINANCE_ROLE(), address(finance));

        address inv1 = vm.envOr("INVESTOR_1", address(0));
        address inv2 = vm.envOr("INVESTOR_2", address(0));
        if (inv1 != address(0)) allowlist.add(inv1);
        if (inv2 != address(0)) allowlist.add(inv2);

        vm.stopBroadcast();

        console2.log("admin            ", admin);
        console2.log("InvoiceRegistry  ", address(registry));
        console2.log("InvestorAllowlist", address(allowlist));
        console2.log("ReceivableFinance", address(finance));
        console2.log("USDT             ", usdt);
    }
}
