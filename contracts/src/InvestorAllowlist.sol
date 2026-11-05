// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

/// @title InvestorAllowlist
/// @notice Admin-controlled list of wallets permitted to fund or hold receivable positions.
/// @dev MVP stand-in for KYC/accreditation. Removal blocks future funding and incoming
///      transfers; it does not seize an existing position.
contract InvestorAllowlist is AccessControl {
    bytes32 public constant ALLOWLIST_ADMIN_ROLE = keccak256("ALLOWLIST_ADMIN_ROLE");

    mapping(address => bool) private _allowed;

    event InvestorAdded(address indexed investor);
    event InvestorRemoved(address indexed investor);

    error ZeroAddress();

    constructor(address admin) {
        if (admin == address(0)) revert ZeroAddress();
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ALLOWLIST_ADMIN_ROLE, admin);
    }

    function isAllowed(address investor) external view returns (bool) {
        return _allowed[investor];
    }

    function add(address investor) external onlyRole(ALLOWLIST_ADMIN_ROLE) {
        if (investor == address(0)) revert ZeroAddress();
        if (!_allowed[investor]) {
            _allowed[investor] = true;
            emit InvestorAdded(investor);
        }
    }

    function remove(address investor) external onlyRole(ALLOWLIST_ADMIN_ROLE) {
        if (_allowed[investor]) {
            _allowed[investor] = false;
            emit InvestorRemoved(investor);
        }
    }
}
