import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { networks, monadTestnet } from "./chains";

export const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID || "";

if (!projectId) {
    console.warn("NEXT_PUBLIC_REOWN_PROJECT_ID is not set");
}

export const wagmiAdapter = new WagmiAdapter({
    projectId,
    networks,
});

export const appKitConfig = {
    projectId,
    networks,
    adapters: [wagmiAdapter],
    defaultNetwork: monadTestnet,
    metadata: {
        name: "NodeMesh",
        description: "Decentralized bandwidth network on Monad",
        url: "https://localhost:3000",
        icons: [],
    },
};