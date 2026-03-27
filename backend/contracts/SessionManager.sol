// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./NodeRegistry.sol";

interface IMicroPayment {
    function initialize(address _sessionManager, address _nodeRegistry) external;
}

/**
 * @title SessionManager
 * @notice Gestiona el ciclo de vida de sesiones VPN en NodeMesh
 */
contract SessionManager {
    // ─── Structs ────────────────────────────────────────────────────────────

    struct Session {
        bytes32 sessionId;
        address user;
        address node;
        uint256 startTime;
        uint256 endTime;
        uint256 deposit;
        bool    active;
    }

    // ─── State ──────────────────────────────────────────────────────────────

    NodeRegistry public immutable registry;
    address      public immutable microPayment;

    uint256 public constant MIN_DEPOSIT = 0.001 ether;

    mapping(bytes32 => Session) public sessions;
    mapping(address => bytes32) public activeSessionByUser;

    // ─── Events ─────────────────────────────────────────────────────────────

    event SessionOpened(bytes32 indexed sessionId, address indexed user, address indexed node, uint256 deposit);
    event SessionClosed(bytes32 indexed sessionId, address indexed user, uint256 duration);

    // ─── Errors ─────────────────────────────────────────────────────────────

    error InsufficientDeposit();
    error NodeNotActive();
    error UserAlreadyInSession();
    error SessionNotFound();
    error NotSessionOwner();
    error SessionAlreadyClosed();
    error TransferFailed();

    // ─── Constructor ────────────────────────────────────────────────────────

    constructor(address _registry, address _microPayment) {
        registry     = NodeRegistry(_registry);
        microPayment = _microPayment;
    }

    // ─── Functions ──────────────────────────────────────────────────────────

    function openSession(address _node) external payable returns (bytes32) {
        if (msg.value < MIN_DEPOSIT)                       revert InsufficientDeposit();
        if (activeSessionByUser[msg.sender] != bytes32(0)) revert UserAlreadyInSession();

        NodeRegistry.Node memory node = registry.getNode(_node);
        if (!node.active) revert NodeNotActive();

        bytes32 sessionId = keccak256(
            abi.encodePacked(msg.sender, _node, block.timestamp, block.prevrandao)
        );

        sessions[sessionId] = Session({
            sessionId: sessionId,
            user:      msg.sender,
            node:      _node,
            startTime: block.timestamp,
            endTime:   0,
            deposit:   msg.value,
            active:    true
        });

        activeSessionByUser[msg.sender] = sessionId;

        // Enviar depósito a MicroPayment
        (bool ok, ) = payable(microPayment).call{value: msg.value}("");
        if (!ok) revert TransferFailed();

        emit SessionOpened(sessionId, msg.sender, _node, msg.value);
        return sessionId;
    }

    function closeSession(bytes32 _sessionId) external {
        Session storage session = sessions[_sessionId];

        if (session.user == address(0)) revert SessionNotFound();
        if (session.user != msg.sender)  revert NotSessionOwner();
        if (!session.active)             revert SessionAlreadyClosed();

        session.active  = false;
        session.endTime = block.timestamp;

        activeSessionByUser[msg.sender] = bytes32(0);

        uint256 duration = session.endTime - session.startTime;
        emit SessionClosed(_sessionId, msg.sender, duration);
    }

    function getSession(bytes32 _sessionId) external view returns (Session memory) {
        if (sessions[_sessionId].user == address(0)) revert SessionNotFound();
        return sessions[_sessionId];
    }

    function getActiveSession(address _user) external view returns (Session memory) {
        bytes32 sessionId = activeSessionByUser[_user];
        if (sessionId == bytes32(0)) revert SessionNotFound();
        return sessions[sessionId];
    }

    function isUserInSession(address _user) external view returns (bool) {
        return activeSessionByUser[_user] != bytes32(0);
    }
}