export type Node = {
    owner: `0x${string}`;
    location: string;
    pricePerSecond: bigint;
    bandwidth: bigint;
    stakedAmount: bigint;
    active: boolean;
    registeredAt: bigint;
};

export type Session = {
    sessionId: `0x${string}`;
    user: `0x${string}`;
    node: `0x${string}`;
    startTime: bigint;
    endTime: bigint;
    deposit: bigint;
    active: boolean;
};

export type Tab = "map" | "user" | "provider";