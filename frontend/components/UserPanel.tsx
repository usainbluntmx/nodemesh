"use client";

import { useState, useEffect } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther, formatEther } from "viem";
import { CONTRACT_ADDRESSES, SESSION_MANAGER_ABI, NODE_REGISTRY_ABI } from "@/lib/contracts";
import { PaymentTicker } from "./PaymentTicker";
import type { Node } from "@/types";

export function UserPanel() {
    const { address } = useAccount();
    const [selectedNode, setSelectedNode] = useState<`0x${string}` | null>(null);
    const [sessionId, setSessionId] = useState<`0x${string}` | null>(null);
    const [sessionStart, setSessionStart] = useState<number | null>(null);
    const [elapsed, setElapsed] = useState(0);

    const { writeContract, data: txHash, isPending } = useWriteContract();
    const { isSuccess: isTxConfirmed } = useWaitForTransactionReceipt({ hash: txHash });

    // Leer nodos activos del contrato
    const { data: onChainNodes, refetch: refetchNodes } = useReadContract({
        address: CONTRACT_ADDRESSES.NODE_REGISTRY,
        abi: NODE_REGISTRY_ABI,
        functionName: "getActiveNodes",
    });

    // Leer si el usuario ya tiene sesión activa
    const { data: isInSession, refetch: refetchSession } = useReadContract({
        address: CONTRACT_ADDRESSES.SESSION_MANAGER,
        abi: SESSION_MANAGER_ABI,
        functionName: "isUserInSession",
        args: [address as `0x${string}`],
        query: { enabled: !!address },
    });

    // Contador de tiempo de sesión activa
    useEffect(() => {
        if (!sessionStart) return;
        const interval = setInterval(() => {
            setElapsed(Math.floor((Date.now() / 1000) - sessionStart));
        }, 1000);
        return () => clearInterval(interval);
    }, [sessionStart]);

    // Refetch tras confirmar tx
    useEffect(() => {
        if (isTxConfirmed) {
            refetchSession();
            refetchNodes();
        }
    }, [isTxConfirmed, refetchSession, refetchNodes]);

    function handleOpenSession() {
        if (!selectedNode) return;
        writeContract({
            address: CONTRACT_ADDRESSES.SESSION_MANAGER,
            abi: SESSION_MANAGER_ABI,
            functionName: "openSession",
            args: [selectedNode],
            value: parseEther("0.01"),
        });
        setSessionStart(Math.floor(Date.now() / 1000));
    }

    function handleCloseSession() {
        if (!sessionId) return;
        writeContract({
            address: CONTRACT_ADDRESSES.SESSION_MANAGER,
            abi: SESSION_MANAGER_ABI,
            functionName: "closeSession",
            args: [sessionId],
        });
        setSessionId(null);
        setSessionStart(null);
        setElapsed(0);
    }

    function formatElapsed(seconds: number) {
        const m = Math.floor(seconds / 60).toString().padStart(2, "0");
        const s = (seconds % 60).toString().padStart(2, "0");
        return `${m}:${s}`;
    }

    const activeSession = isInSession as boolean | undefined;
    const nodes = (onChainNodes as Node[] | undefined) ?? [];

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "640px" }}>

            {/* Estado de sesión */}
            <div style={{
                padding: "16px 20px",
                background: activeSession ? "rgba(16,185,129,0.07)" : "rgba(255,255,255,0.02)",
                border: `1px solid ${activeSession ? "rgba(16,185,129,0.35)" : "rgba(255,255,255,0.06)"}`,
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{
                        width: "8px", height: "8px", borderRadius: "50%",
                        background: activeSession ? "#10b981" : "#475569",
                        boxShadow: activeSession ? "0 0 8px #10b981" : "none",
                    }} />
                    <span style={{ fontSize: "12px", color: activeSession ? "#6ee7b7" : "#475569" }}>
                        {activeSession ? "SESSION ACTIVE" : "NO ACTIVE SESSION"}
                    </span>
                </div>
                {activeSession && sessionStart && (
                    <span style={{ fontSize: "20px", fontWeight: "800", color: "#10b981", letterSpacing: "0.05em" }}>
                        {formatElapsed(elapsed)}
                    </span>
                )}
            </div>

            {/* Selección de nodo */}
            {!activeSession && (
                <div style={{
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: "8px",
                    overflow: "hidden",
                }}>
                    <div style={{ padding: "12px 18px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                        <span style={{ fontSize: "10px", color: "#475569", letterSpacing: "0.15em" }}>
                            SELECT NODE · {nodes.length} available
                        </span>
                    </div>

                    {nodes.length === 0 ? (
                        <div style={{ padding: "24px 18px", textAlign: "center" }}>
                            <span style={{ fontSize: "12px", color: "#334155" }}>
                                No active nodes found. Register one in Provide & Earn.
                            </span>
                        </div>
                    ) : (
                        nodes.map((node) => (
                            <div
                                key={node.owner}
                                onClick={() => setSelectedNode(node.owner)}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    padding: "14px 18px",
                                    cursor: "pointer",
                                    borderBottom: "1px solid rgba(255,255,255,0.03)",
                                    background: selectedNode === node.owner
                                        ? "rgba(56,189,248,0.07)"
                                        : "transparent",
                                    transition: "background 0.15s",
                                }}
                            >
                                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                    <div style={{
                                        width: "8px", height: "8px", borderRadius: "50%",
                                        background: selectedNode === node.owner ? "#38bdf8" : "#1e4d3a",
                                        border: `1px solid ${selectedNode === node.owner ? "#38bdf8" : "#10b981"}`,
                                    }} />
                                    <div>
                                        <div style={{ fontSize: "13px", color: "#f1f5f9", fontWeight: "600" }}>
                                            {node.location}
                                        </div>
                                        <div style={{ fontSize: "11px", color: "#475569", marginTop: "2px" }}>
                                            {node.owner.slice(0, 10)}...{node.owner.slice(-4)}
                                        </div>
                                    </div>
                                </div>
                                <div style={{ textAlign: "right" }}>
                                    <div style={{ fontSize: "12px", color: "#38bdf8" }}>
                                        {node.bandwidth.toString()} Mbps
                                    </div>
                                    <div style={{ fontSize: "11px", color: "#475569" }}>
                                        {formatEther(node.pricePerSecond)} MON/s
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Payment ticker activo */}
            {activeSession && sessionId && (
                <PaymentTicker sessionId={sessionId} />
            )}

            {/* Botón de acción */}
            <button
                onClick={activeSession ? handleCloseSession : handleOpenSession}
                disabled={(!selectedNode && !activeSession) || isPending}
                style={{
                    padding: "14px",
                    borderRadius: "8px",
                    border: "none",
                    cursor: (!selectedNode && !activeSession) || isPending ? "not-allowed" : "pointer",
                    fontSize: "13px",
                    fontFamily: "inherit",
                    fontWeight: "800",
                    letterSpacing: "0.1em",
                    transition: "all 0.2s",
                    background: activeSession ? "rgba(248,113,113,0.1)" : "rgba(16,185,129,0.1)",
                    color: activeSession ? "#f87171" : "#6ee7b7",
                    outline: `1px solid ${activeSession ? "rgba(248,113,113,0.3)" : "rgba(16,185,129,0.3)"}`,
                    opacity: ((!selectedNode && !activeSession) || isPending) ? 0.4 : 1,
                }}
            >
                {isPending
                    ? "CONFIRMING..."
                    : activeSession
                        ? "CLOSE SESSION"
                        : "OPEN SESSION · 0.01 MON deposit"}
            </button>

            {!activeSession && (
                <p style={{ fontSize: "11px", color: "#334155", margin: 0, lineHeight: "1.6" }}>
                    El depósito de 0.01 MON queda en escrow. Al cerrar la sesión, se descuenta
                    el tiempo usado y el resto se reembolsa automáticamente.
                </p>
            )}
        </div>
    );
}