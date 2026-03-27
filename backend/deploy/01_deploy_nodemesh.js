const { network } = require("hardhat");

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log, execute } = deployments;
    const { deployer } = await getNamedAccounts();

    log("----------------------------------------------------");
    log(`Network: ${network.name}`);
    log(`Deployer: ${deployer}`);
    log("----------------------------------------------------");

    // 1. NodeRegistry
    const nodeRegistry = await deploy("NodeRegistry", {
        from: deployer,
        args: [],
        log: true,
        waitConfirmations: 1,
    });
    log(`NodeRegistry deployed at: ${nodeRegistry.address}`);

    // 2. MicroPayment (sin SessionManager aún)
    const microPayment = await deploy("MicroPayment", {
        from: deployer,
        args: [],
        log: true,
        waitConfirmations: 1,
    });
    log(`MicroPayment deployed at: ${microPayment.address}`);

    // 3. SessionManager (conoce a NodeRegistry y MicroPayment)
    const sessionManager = await deploy("SessionManager", {
        from: deployer,
        args: [nodeRegistry.address, microPayment.address],
        log: true,
        waitConfirmations: 1,
    });
    log(`SessionManager deployed at: ${sessionManager.address}`);

    // 4. Inicializar MicroPayment con la address de SessionManager
    await execute(
        "MicroPayment",
        { from: deployer, log: true },
        "initialize",
        sessionManager.address,
        nodeRegistry.address
    );
    log(`MicroPayment initialized with SessionManager: ${sessionManager.address}`);

    // 5. ReputationSBT
    const reputationSBT = await deploy("ReputationSBT", {
        from: deployer,
        args: [],
        log: true,
        waitConfirmations: 1,
    });
    log(`ReputationSBT deployed at: ${reputationSBT.address}`);

    log("----------------------------------------------------");
    log("Deployment complete. Update frontend/.env.local:");
    log(`NEXT_PUBLIC_NODE_REGISTRY=${nodeRegistry.address}`);
    log(`NEXT_PUBLIC_SESSION_MANAGER=${sessionManager.address}`);
    log(`NEXT_PUBLIC_MICRO_PAYMENT=${microPayment.address}`);
    log(`NEXT_PUBLIC_REPUTATION_SBT=${reputationSBT.address}`);
    log("----------------------------------------------------");
};

module.exports.tags = ["all", "nodemesh"];