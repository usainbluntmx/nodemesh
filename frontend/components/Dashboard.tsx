"use client";

import { NodeMap } from "./NodeMap";
import { UserPanel } from "./UserPanel";
import { ProviderPanel } from "./ProviderPanel";
import type { Tab } from "@/types";

type Props = {
    activeTab: Tab;
};

export function Dashboard({ activeTab }: Props) {
    return (
        <div style={{
            padding: "16px",
            maxWidth: "900px",
            margin: "0 auto",
            width: "100%",
            boxSizing: "border-box",
        }}>
            {activeTab === "map" && <NodeMap />}
            {activeTab === "user" && <UserPanel />}
            {activeTab === "provider" && <ProviderPanel />}
        </div>
    );
}