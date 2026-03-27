// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface ISessionManager {
    struct Session {
        bytes32 sessionId;
        address user;
        address node;
        uint256 startTime;
        uint256 endTime;
        uint256 deposit;
        bool    active;
    }
    function getSession(bytes32 _sessionId) external view returns (Session memory);
}

interface INodeRegistry {
    struct Node {
        address owner;
        string  location;
        uint256 pricePerSecond;
        uint256 bandwidth;
        uint256 stakedAmount;
        bool    active;
        uint256 registeredAt;
    }
    function getNode(address _owner) external view returns (Node memory);
}

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

/**
 * @title MicroPayment
 * @notice Micropagos por sesión con settlement en CETES (Etherfuse)
 */
contract MicroPayment {

    // ─── State ──────────────────────────────────────────────────────────────

    ISessionManager public sessionManager;
    INodeRegistry   public nodeRegistry;

    address public owner;

    // Token CETES de Etherfuse en Monad Testnet
    address public constant CETES_TOKEN = 0x955dBA7d1117B9D9f749957a1fF19DB8D7e7df35;

    // Rate: 1 MON = 15.655017 CETES (rate Etherfuse: 1 USDC = 15.655017 CETES)
    // Expresado como numerador/denominador para evitar decimales
    // 1 MON → 15655017 CETES (con 6 decimales) si CETES tiene 6 decimales
    // Usamos escala de 1e6 para precisión
    uint256 public cetesRateNumerator   = 350502; // 15.655017 * 1e6
    uint256 public cetesRateDenominator = 1000000;  // 1e6

    uint256 public constant PAYMENT_INTERVAL = 5; // segundos

    mapping(bytes32 => uint256) public lastPaymentTime;
    mapping(bytes32 => uint256) public totalPaidPerSession;

    // Earnings en CETES por proveedor
    mapping(address => uint256) public cetesEarnings;

    // ─── Events ─────────────────────────────────────────────────────────────

    event Initialized(address sessionManager, address nodeRegistry);
    event PaymentSettled(bytes32 indexed sessionId, address indexed node, uint256 monAmount, uint256 cetesAmount);
    event EarningsClaimed(address indexed node, uint256 cetesAmount);
    event UnusedRefunded(bytes32 indexed sessionId, address indexed user, uint256 amount);
    event RateUpdated(uint256 numerator, uint256 denominator);

    // ─── Errors ─────────────────────────────────────────────────────────────

    error NotOwner();
    error AlreadyInitialized();
    error SessionNotActive();
    error SessionStillActive();
    error NotSessionUser();
    error NothingToClaim();
    error InsufficientCETES();
    error TransferFailed();

    // ─── Constructor ────────────────────────────────────────────────────────

    constructor() {
        owner = msg.sender;
    }

    // ─── Init ────────────────────────────────────────────────────────────────

    function initialize(address _sessionManager, address _nodeRegistry) external {
        if (msg.sender != owner)                   revert NotOwner();
        if (address(sessionManager) != address(0)) revert AlreadyInitialized();

        sessionManager = ISessionManager(_sessionManager);
        nodeRegistry   = INodeRegistry(_nodeRegistry);

        emit Initialized(_sessionManager, _nodeRegistry);
    }

    // ─── Admin ───────────────────────────────────────────────────────────────

    function updateRate(uint256 _numerator, uint256 _denominator) external {
        if (msg.sender != owner) revert NotOwner();
        cetesRateNumerator   = _numerator;
        cetesRateDenominator = _denominator;
        emit RateUpdated(_numerator, _denominator);
    }

    // ─── Core ────────────────────────────────────────────────────────────────

    /**
     * @notice Liquida el pago al proveedor en CETES y cierra el ciclo de pagos.
     *         Combina streamPayment + conversión MON→CETES en una sola tx.
     */
    function settleAndPay(bytes32 _sessionId) external {
        ISessionManager.Session memory session = sessionManager.getSession(_sessionId);

        if (!session.active) revert SessionNotActive();

        INodeRegistry.Node memory node = nodeRegistry.getNode(session.node);

        // Calcular monto a pagar
        uint256 lastPaid = lastPaymentTime[_sessionId];
        uint256 lastRef  = lastPaid == 0 ? session.startTime : lastPaid;
        uint256 elapsed  = block.timestamp - lastRef;
        uint256 monAmount = elapsed * node.pricePerSecond;

        uint256 remaining = session.deposit - totalPaidPerSession[_sessionId];
        if (monAmount > remaining) monAmount = remaining;
        if (monAmount == 0) return;

        // Convertir MON → CETES
        uint256 cetesAmount = (monAmount * cetesRateNumerator) / cetesRateDenominator;

        // Verificar que el contrato tiene suficientes CETES
        uint256 cetesBalance = IERC20(CETES_TOKEN).balanceOf(address(this));
        if (cetesBalance < cetesAmount) revert InsufficientCETES();

        // Registrar pago
        lastPaymentTime[_sessionId]      = block.timestamp;
        totalPaidPerSession[_sessionId] += monAmount;

        // Acreditar CETES al proveedor
        cetesEarnings[session.node] += cetesAmount;

        emit PaymentSettled(_sessionId, session.node, monAmount, cetesAmount);
    }

    /**
     * @notice El proveedor reclama sus CETES acumulados.
     */
    function claimEarnings() external {
        uint256 amount = cetesEarnings[msg.sender];
        if (amount == 0) revert NothingToClaim();

        cetesEarnings[msg.sender] = 0;

        bool success = IERC20(CETES_TOKEN).transfer(msg.sender, amount);
        if (!success) revert TransferFailed();

        emit EarningsClaimed(msg.sender, amount);
    }

    /**
     * @notice Reembolsa MON no utilizado al usuario tras cerrar sesión.
     */
    function refundUnused(bytes32 _sessionId) external {
        ISessionManager.Session memory session = sessionManager.getSession(_sessionId);

        if (session.active)             revert SessionStillActive();
        if (session.user != msg.sender) revert NotSessionUser();

        uint256 paid   = totalPaidPerSession[_sessionId];
        uint256 refund = session.deposit - paid;

        if (refund == 0) return;

        totalPaidPerSession[_sessionId] = session.deposit;

        (bool success, ) = payable(msg.sender).call{value: refund}("");
        if (!success) revert TransferFailed();

        emit UnusedRefunded(_sessionId, msg.sender, refund);
    }

    /**
     * @notice Calcula CETES que recibirá el proveedor al cerrar la sesión actual.
     */
    function getAccruedCETES(bytes32 _sessionId) external view returns (uint256) {
        ISessionManager.Session memory session = sessionManager.getSession(_sessionId);
        if (!session.active) return 0;

        INodeRegistry.Node memory node = nodeRegistry.getNode(session.node);
        uint256 lastPaid = lastPaymentTime[_sessionId];
        uint256 lastRef  = lastPaid == 0 ? session.startTime : lastPaid;
        uint256 elapsed  = block.timestamp - lastRef;
        uint256 monAmount = elapsed * node.pricePerSecond;

        uint256 remaining = session.deposit - totalPaidPerSession[_sessionId];
        if (monAmount > remaining) monAmount = remaining;

        return (monAmount * cetesRateNumerator) / cetesRateDenominator;
    }

    /**
     * @notice View del balance de CETES pendiente del proveedor.
     */
    function pendingCETES(address _node) external view returns (uint256) {
        return cetesEarnings[_node];
    }

    receive() external payable {}
}