// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title NodeRegistry
 * @notice Registro de proveedores de bandwidth para NodeMesh
 */
contract NodeRegistry {
    // ─── Structs ────────────────────────────────────────────────────────────

    struct Node {
        address owner;
        string  location;      // ej: "Mexico City, MX"
        uint256 pricePerSecond; // en wei
        uint256 bandwidth;     // en Mbps
        uint256 stakedAmount;
        bool    active;
        uint256 registeredAt;
    }

    // ─── State ──────────────────────────────────────────────────────────────

    uint256 public constant MIN_STAKE = 0.01 ether;

    mapping(address => Node) public nodes;
    address[] public nodeList;

    // ─── Events ─────────────────────────────────────────────────────────────

    event NodeRegistered(address indexed owner, string location, uint256 pricePerSecond);
    event NodeDeactivated(address indexed owner);
    event NodeReactivated(address indexed owner);

    // ─── Errors ─────────────────────────────────────────────────────────────

    error InsufficientStake();
    error NodeAlreadyRegistered();
    error NodeNotFound();
    error NotNodeOwner();

    // ─── Functions ──────────────────────────────────────────────────────────

    function registerNode(
        string calldata _location,
        uint256 _pricePerSecond,
        uint256 _bandwidth
    ) external payable {
        if (msg.value < MIN_STAKE)          revert InsufficientStake();
        if (nodes[msg.sender].owner != address(0)) revert NodeAlreadyRegistered();

        nodes[msg.sender] = Node({
            owner:          msg.sender,
            location:       _location,
            pricePerSecond: _pricePerSecond,
            bandwidth:      _bandwidth,
            stakedAmount:   msg.value,
            active:         true,
            registeredAt:   block.timestamp
        });

        nodeList.push(msg.sender);

        emit NodeRegistered(msg.sender, _location, _pricePerSecond);
    }

    function deactivateNode() external {
        if (nodes[msg.sender].owner == address(0)) revert NodeNotFound();
        if (nodes[msg.sender].owner != msg.sender) revert NotNodeOwner();

        nodes[msg.sender].active = false;
        emit NodeDeactivated(msg.sender);
    }

    function reactivateNode() external {
        if (nodes[msg.sender].owner == address(0)) revert NodeNotFound();
        if (nodes[msg.sender].owner != msg.sender) revert NotNodeOwner();

        nodes[msg.sender].active = true;
        emit NodeReactivated(msg.sender);
    }

    function getActiveNodes() external view returns (Node[] memory) {
        uint256 count = 0;
        for (uint256 i = 0; i < nodeList.length; i++) {
            if (nodes[nodeList[i]].active) count++;
        }

        Node[] memory active = new Node[](count);
        uint256 idx = 0;
        for (uint256 i = 0; i < nodeList.length; i++) {
            if (nodes[nodeList[i]].active) {
                active[idx++] = nodes[nodeList[i]];
            }
        }
        return active;
    }

    function getNode(address _owner) external view returns (Node memory) {
        if (nodes[_owner].owner == address(0)) revert NodeNotFound();
        return nodes[_owner];
    }

    function getTotalNodes() external view returns (uint256) {
        return nodeList.length;
    }
}