"use client";

import { useState, useEffect } from "react";
import { NodeMap } from "./NodeMap";
import { UserPanel } from "./UserPanel";
import { ProviderPanel } from "./ProviderPanel";
import type { Tab } from "@/types";

type Props = {
    activeTab: Tab;
};

export function Dashboard({ activeTab }: Props) {
    const [isDesktop, setIsDesktop] = useState(false);

    useEffect(() => {
        const mq = window.matchMedia("(min-width: 1024px)");
        setIsDesktop(mq.matches);
        const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
        mq.addEventListener("change", handler);
        return () => mq.removeEventListener("change", handler);
    }, []);

    // ─── Desktop: layout bento ───────────────────────────────────────────────
    if (isDesktop) {
        return (
            <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 380px",
                gridTemplateRows: "1fr 1fr",
                gap: "16px",
                padding: "16px",
                height: "calc(100vh - 97px)",
                maxWidth: "1400px",
                margin: "0 auto",
                width: "100%",
                boxSizing: "border-box",
            }}>

                {/* Network Map — ocupa toda la columna izquierda */}
                <div style={{
                    gridColumn: "1",
                    gridRow: "1 / 3",
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: "12px",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                }}>
                    <div style={{
                        padding: "12px 16px",
                        borderBottom: "1px solid rgba(255,255,255,0.06)",
                        fontSize: "10px",
                        color: "#475569",
                        letterSpacing: "0.15em",
                        flexShrink: 0,
                    }}>
                        🌐 NETWORK MAP
                    </div>
                    <div style={{ flex: 1, overflow: "auto", padding: "16px" }}>
                        <NodeMap />
                    </div>
                </div>

                {/* Use Bandwidth — columna derecha arriba */}
                <div style={{
                    gridColumn: "2",
                    gridRow: "1",
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: "12px",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                }}>
                    <div style={{
                        padding: "12px 16px",
                        borderBottom: "1px solid rgba(255,255,255,0.06)",
                        fontSize: "10px",
                        color: "#475569",
                        letterSpacing: "0.15em",
                        flexShrink: 0,
                    }}>
                        👤 USE BANDWIDTH
                    </div>
                    <div style={{ flex: 1, overflow: "auto", padding: "16px" }}>
                        <UserPanel />
                    </div>
                </div>

                {/* Provide & Earn — columna derecha abajo */}
                <div style={{
                    gridColumn: "2",
                    gridRow: "2",
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: "12px",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                }}>
                    <div style={{
                        padding: "12px 16px",
                        borderBottom: "1px solid rgba(255,255,255,0.06)",
                        fontSize: "10px",
                        color: "#475569",
                        letterSpacing: "0.15em",
                        flexShrink: 0,
                    }}>
                        ⚡ PROVIDE & EARN
                    </div>
                    <div style={{ flex: 1, overflow: "auto", padding: "16px" }}>
                        <ProviderPanel />
                    </div>
                </div>

            </div>
        );
    }

    // ─── Mobile: tabs como antes ─────────────────────────────────────────────
    return (
        <div style={{
            padding: "16px",
            maxWidth: "640px",
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