export const CONTRACT_ADDRESSES = {
    NODE_REGISTRY: process.env.NEXT_PUBLIC_NODE_REGISTRY as `0x${string}`,
    SESSION_MANAGER: process.env.NEXT_PUBLIC_SESSION_MANAGER as `0x${string}`,
    MICRO_PAYMENT: process.env.NEXT_PUBLIC_MICRO_PAYMENT as `0x${string}`,
    REPUTATION_SBT: process.env.NEXT_PUBLIC_REPUTATION_SBT as `0x${string}`,
} as const;

export const NODE_REGISTRY_ABI = [
    {
        name: "registerNode",
        type: "function",
        stateMutability: "payable",
        inputs: [
            { name: "_location", type: "string" },
            { name: "_pricePerSecond", type: "uint256" },
            { name: "_bandwidth", type: "uint256" },
        ],
        outputs: [],
    },
    {
        name: "deactivateNode",
        type: "function",
        stateMutability: "nonpayable",
        inputs: [],
        outputs: [],
    },
    {
        name: "reactivateNode",
        type: "function",
        stateMutability: "nonpayable",
        inputs: [],
        outputs: [],
    },
    {
        name: "getActiveNodes",
        type: "function",
        stateMutability: "view",
        inputs: [],
        outputs: [
            {
                name: "",
                type: "tuple[]",
                components: [
                    { name: "owner", type: "address" },
                    { name: "location", type: "string" },
                    { name: "pricePerSecond", type: "uint256" },
                    { name: "bandwidth", type: "uint256" },
                    { name: "stakedAmount", type: "uint256" },
                    { name: "active", type: "bool" },
                    { name: "registeredAt", type: "uint256" },
                ],
            },
        ],
    },
    {
        name: "getNode",
        type: "function",
        stateMutability: "view",
        inputs: [{ name: "_owner", type: "address" }],
        outputs: [
            {
                name: "",
                type: "tuple",
                components: [
                    { name: "owner", type: "address" },
                    { name: "location", type: "string" },
                    { name: "pricePerSecond", type: "uint256" },
                    { name: "bandwidth", type: "uint256" },
                    { name: "stakedAmount", type: "uint256" },
                    { name: "active", type: "bool" },
                    { name: "registeredAt", type: "uint256" },
                ],
            },
        ],
    },
    {
        name: "MIN_STAKE",
        type: "function",
        stateMutability: "view",
        inputs: [],
        outputs: [{ name: "", type: "uint256" }],
    },
    {
        name: "getTotalNodes",
        type: "function",
        stateMutability: "view",
        inputs: [],
        outputs: [{ name: "", type: "uint256" }],
    },
] as const;

export const SESSION_MANAGER_ABI = [
    {
        name: "openSession",
        type: "function",
        stateMutability: "payable",
        inputs: [{ name: "_node", type: "address" }],
        outputs: [{ name: "", type: "bytes32" }],
    },
    {
        name: "closeSession",
        type: "function",
        stateMutability: "nonpayable",
        inputs: [{ name: "_sessionId", type: "bytes32" }],
        outputs: [],
    },
    {
        name: "getActiveSession",
        type: "function",
        stateMutability: "view",
        inputs: [{ name: "_user", type: "address" }],
        outputs: [
            {
                name: "",
                type: "tuple",
                components: [
                    { name: "sessionId", type: "bytes32" },
                    { name: "user", type: "address" },
                    { name: "node", type: "address" },
                    { name: "startTime", type: "uint256" },
                    { name: "endTime", type: "uint256" },
                    { name: "deposit", type: "uint256" },
                    { name: "active", type: "bool" },
                ],
            },
        ],
    },
    {
        name: "isUserInSession",
        type: "function",
        stateMutability: "view",
        inputs: [{ name: "_user", type: "address" }],
        outputs: [{ name: "", type: "bool" }],
    },
    {
        name: "MIN_DEPOSIT",
        type: "function",
        stateMutability: "view",
        inputs: [],
        outputs: [{ name: "", type: "uint256" }],
    },
    {
        name: "activeSessionByUser",
        type: "function",
        stateMutability: "view",
        inputs: [{ name: "", type: "address" }],
        outputs: [{ name: "", type: "bytes32" }],
    },
] as const;

export const MICRO_PAYMENT_ABI = [
    {
        name: "streamPayment",
        type: "function",
        stateMutability: "nonpayable",
        inputs: [{ name: "_sessionId", type: "bytes32" }],
        outputs: [],
    },
    {
        name: "claimEarnings",
        type: "function",
        stateMutability: "nonpayable",
        inputs: [],
        outputs: [],
    },
    {
        name: "refundUnused",
        type: "function",
        stateMutability: "nonpayable",
        inputs: [{ name: "_sessionId", type: "bytes32" }],
        outputs: [],
    },
    {
        name: "getAccruedAmount",
        type: "function",
        stateMutability: "view",
        inputs: [{ name: "_sessionId", type: "bytes32" }],
        outputs: [{ name: "", type: "uint256" }],
    },
    {
        name: "pendingEarnings",
        type: "function",
        stateMutability: "view",
        inputs: [{ name: "", type: "address" }],
        outputs: [{ name: "", type: "uint256" }],
    },

    {
        name: "totalPaidPerSession",
        type: "function",
        stateMutability: "view",
        inputs: [{ name: "", type: "bytes32" }],
        outputs: [{ name: "", type: "uint256" }],
    },
] as const;