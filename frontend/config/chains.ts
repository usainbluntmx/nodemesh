import type { AppKitNetwork } from "@reown/appkit/networks";

export const monadTestnet = {
    id: 10143,
    name: "Monad Testnet",
    nativeCurrency: {
        name: "MON",
        symbol: "MON",
        decimals: 18,
    },
    rpcUrls: {
        default: {
            http: ["https://testnet-rpc.monad.xyz"],
        },
    },
    blockExplorers: {
        default: {
            name: "Monad Explorer",
            url: "https://testnet.monadscan.com/",
        },
    },
    testnet: true,
} as const satisfies AppKitNetwork;

// Solo Monad Testnet
export const networks: [AppKitNetwork, ...AppKitNetwork[]] = [monadTestnet];