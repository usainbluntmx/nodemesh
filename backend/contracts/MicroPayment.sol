// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./SessionManager.sol";

/**
 * @title MicroPayment
 * @notice Maneja el streaming de micropagos por segundo de sesión activa
 */
contract MicroPayment {
    // ─── State ──────────────────────────────────────────────────────────────

    SessionManager public immutable sessionManager;

    uint256 public constant PAYMENT_INTERVAL = 5; // segundos

    mapping(bytes32 => uint256) public lastPaymentTime;
    mapping(address => uint256) public pendingEarnings;
    mapping(bytes32 => uint256) public totalPaidPerSession;

    // ─── Events ─────────────────────────────────────────────────────────────

    event PaymentStreamed(bytes32 indexed sessionId, address indexed node, uint256 amount);
    event EarningsClaimed(address indexed node, uint256 amount);
    event UnusedRefunded(bytes32 indexed sessionId, address indexed user, uint256 amount);

    // ─── Errors ─────────────────────────────────────────────────────────────

    error SessionNotActive();
    error IntervalNotElapsed();
    error InsufficientDeposit();
    error NothingToClaim();
    error SessionStillActive();
    error NotSessionUser();
    error TransferFailed();

    // ─── Constructor ────────────────────────────────────────────────────────

    constructor(address _sessionManager) {
        sessionManager = SessionManager(_sessionManager);
    }

    // ─── Functions ──────────────────────────────────────────────────────────

    function streamPayment(bytes32 _sessionId) external {
        SessionManager.Session memory session = sessionManager.getSession(_sessionId);

        if (!session.active) revert SessionNotActive();

        uint256 lastPaid = lastPaymentTime[_sessionId];
        uint256 lastRef = lastPaid == 0 ? session.startTime : lastPaid;

        if (block.timestamp < lastRef + PAYMENT_INTERVAL) revert IntervalNotElapsed();

        NodeRegistry.Node memory node = sessionManager.registry().getNode(session.node);
        uint256 elapsed = block.timestamp - lastRef;
        uint256 amount  = elapsed * node.pricePerSecond;

        uint256 remaining = session.deposit - totalPaidPerSession[_sessionId];
        if (remaining == 0) revert InsufficientDeposit();

        if (amount > remaining) amount = remaining;

        lastPaymentTime[_sessionId]       = block.timestamp;
        totalPaidPerSession[_sessionId]  += amount;
        pendingEarnings[session.node]    += amount;

        emit PaymentStreamed(_sessionId, session.node, amount);
    }

    function claimEarnings() external {
        uint256 amount = pendingEarnings[msg.sender];
        if (amount == 0) revert NothingToClaim();

        pendingEarnings[msg.sender] = 0;

        (bool success, ) = payable(msg.sender).call{value: amount}("");
        if (!success) revert TransferFailed();

        emit EarningsClaimed(msg.sender, amount);
    }

    function refundUnused(bytes32 _sessionId) external {
        SessionManager.Session memory session = sessionManager.getSession(_sessionId);

        if (session.active)            revert SessionStillActive();
        if (session.user != msg.sender) revert NotSessionUser();

        uint256 paid      = totalPaidPerSession[_sessionId];
        uint256 refund    = session.deposit - paid;
        if (refund == 0) revert NothingToClaim();

        totalPaidPerSession[_sessionId] = session.deposit;

        (bool success, ) = payable(msg.sender).call{value: refund}("");
        if (!success) revert TransferFailed();

        emit UnusedRefunded(_sessionId, msg.sender, refund);
    }

    function getAccruedAmount(bytes32 _sessionId) external view returns (uint256) {
        SessionManager.Session memory session = sessionManager.getSession(_sessionId);
        if (!session.active) return 0;

        NodeRegistry.Node memory node = sessionManager.registry().getNode(session.node);
        uint256 lastPaid  = lastPaymentTime[_sessionId];
        uint256 lastRef = lastPaid == 0 ? session.startTime : lastPaid;
uint256 elapsed = block.timestamp - lastRef;

        return elapsed * node.pricePerSecond;
    }

    receive() external payable {}
}