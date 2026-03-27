"use client";

import { useState, useEffect } from "react";
import {
    useAccount, useReadContract, useWriteContract,
    useWaitForTransactionReceipt
} from "wagmi";
import { parseEther, formatEther } from "viem";
import {
    CONTRACT_ADDRESSES, SESSION_MANAGER_ABI,
    NODE_REGISTRY_ABI, MICRO_PAYMENT_ABI
} from "@/lib/contracts";
import { PaymentTicker } from "./PaymentTicker";
import type { Node } from "@/types";

type Step = "idle" | "streaming" | "closing" | "refunding";

export function UserPanel() {
    const { address } = useAccount();

    const [selectedNode, setSelectedNode] = useState<`0x${string}` | null>(null);
    const [sessionId, setSessionId] = useState<`0x${string}` | null>(null);
    const [sessionStart, setSessionStart] = useState<number | null>(null);
    const [elapsed, setElapsed] = useState(0);
    const [closingId, setClosingId] = useState<`0x${string}` | null>(null);
    const [step, setStep] = useState<Step>("idle");

    const { writeContract, data: txHash, isPending } = useWriteContract();
    const { isSuccess: isTxConfirmed } = useWaitForTransactionReceipt({ hash: txHash });

    // ─── Reads ───────────────────────────────────────────────────────────────

    const { data: onChainNodes, refetch: refetchNodes } = useReadContract({
        address: CONTRACT_ADDRESSES.NODE_REGISTRY,
        abi: NODE_REGISTRY_ABI,
        functionName: "getActiveNodes",
    });

    const { data: isInSession, refetch: refetchSession } = useReadContract({
        address: CONTRACT_ADDRESSES.SESSION_MANAGER,
        abi: SESSION_MANAGER_ABI,
        functionName: "isUserInSession",
        args: [address as `0x${string}`],
        query: { enabled: !!address },
    });

    const { data: activeSessionData, refetch: refetchActiveSession } = useReadContract({
        address: CONTRACT_ADDRESSES.SESSION_MANAGER,
        abi: SESSION_MANAGER_ABI,
        functionName: "getActiveSession",
        args: [address as `0x${string}`],
        query: { enabled: !!address && !!isInSession },
    });

    const { data: totalPaidData } = useReadContract({
        address: CONTRACT_ADDRESSES.MICRO_PAYMENT,
        abi: MICRO_PAYMENT_ABI,
        functionName: "totalPaidPerSession",
        args: closingId ? [closingId] : undefined,
        query: { enabled: !!closingId },
    });

    // ─── Effects ─────────────────────────────────────────────────────────────

    // Contador de tiempo de sesión
    useEffect(() => {
        if (!sessionStart) return;
        const interval = setInterval(() => {
            setElapsed(Math.floor(Date.now() / 1000 - sessionStart));
        }, 1000);
        return () => clearInterval(interval);
    }, [sessionStart]);

    // Capturar sessionId desde el contrato
    useEffect(() => {
        if (!activeSessionData) return;
        const session = activeSessionData as any;
        if (session?.active && session?.sessionId) {
            setSessionId(session.sessionId as `0x${string}`);
            if (!sessionStart) setSessionStart(Number(session.startTime));
        }
    }, [activeSessionData]);

    // Máquina de estados: streaming → closing → refunding
    useEffect(() => {
        if (!isTxConfirmed) return;

        if (step === "streaming" && closingId) {
            setStep("closing");
            writeContract({
                address: CONTRACT_ADDRESSES.SESSION_MANAGER,
                abi: SESSION_MANAGER_ABI,
                functionName: "closeSession",
                args: [closingId],
            });
            return;
        }

        if (step === "closing" && closingId) {
            const paid = (totalPaidData as bigint) ?? 0n;
            const session = activeSessionData as any;
            const deposit = session?.deposit ?? 0n;
            const refund = deposit - paid;

            if (refund > 0n) {
                // Hay remanente — ejecutar refund
                setStep("refunding");
                writeContract({
                    address: CONTRACT_ADDRESSES.MICRO_PAYMENT,
                    abi: MICRO_PAYMENT_ABI,
                    functionName: "refundUnused",
                    args: [closingId],
                });
            } else {
                // Sin remanente — flujo completo directo
                setStep("idle");
                setClosingId(null);
                setSessionId(null);
                setSessionStart(null);
                setElapsed(0);
                refetchSession();
                refetchNodes();
                refetchActiveSession();
            }
            return;
        }

        if (step === "refunding") {
            // Flujo completo — limpiar todo
            setStep("idle");
            setClosingId(null);
            setSessionId(null);
            setSessionStart(null);
            setElapsed(0);
            refetchSession();
            refetchNodes();
            refetchActiveSession();
            return;
        }

        // tx confirmada fuera del flujo de cierre — refetch general
        refetchSession();
        refetchNodes();
        refetchActiveSession();
    }, [isTxConfirmed]);

    // ─── Handlers ────────────────────────────────────────────────────────────

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
        setClosingId(sessionId);
        setStep("streaming");
        // Paso 1: liquidar pago al proveedor
        writeContract({
            address: CONTRACT_ADDRESSES.MICRO_PAYMENT,
            abi: MICRO_PAYMENT_ABI,
            functionName: "streamPayment",
            args: [sessionId],
        });
    }

    function formatElapsed(seconds: number) {
        const m = Math.floor(seconds / 60).toString().padStart(2, "0");
        const s = (seconds % 60).toString().padStart(2, "0");
        return `${m}:${s}`;
    }

    function getButtonLabel() {
        if (!isPending && step === "idle") {
            return activeSession ? "CLOSE SESSION" : "OPEN SESSION · 0.01 MON deposit";
        }
        if (step === "streaming") return "PROCESSING PAYMENT...";
        if (step === "closing") return "CLOSING SESSION...";
        if (step === "refunding") return "REFUNDING DEPOSIT...";
        return "CONFIRMING...";
    }

    // ─── Derived state ───────────────────────────────────────────────────────

    const activeSession = isInSession as boolean | undefined;
    const nodes = (onChainNodes as Node[] | undefined) ?? [];
    const isClosing = step !== "idle";

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "640px", width: "100%" }}>

            {/* Estado de sesión */}
            <div style={{
                padding: "16px 20px",
                background: activeSession ? "rgba(16,185,129,0.07)" : "rgba(255,255,255,0.04)",
                border: `1px solid ${activeSession ? "rgba(16,185,129,0.35)" : "rgba(255,255,255,0.1)"}`,
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        background: activeSession ? "#10b981" : "#475569",
                        boxShadow: activeSession ? "0 0 8px #10b981" : "none",
                    }} />
                    <span style={{ fontSize: "12px", color: activeSession ? "#6ee7b7" : "#94a3b8" }}>
                        {activeSession ? "SESSION ACTIVE" : "NO ACTIVE SESSION"}
                    </span>
                </div>
                {activeSession && sessionStart && (
                    <span style={{ fontSize: "20px", fontWeight: "800", color: "#10b981", letterSpacing: "0.05em" }}>
                        {formatElapsed(elapsed)}
                    </span>
                )}
            </div>

            {/* Progreso de cierre */}
            {isClosing && (
                <div style={{
                    padding: "12px 18px",
                    background: "rgba(251,191,36,0.06)",
                    border: "1px solid rgba(251,191,36,0.2)",
                    borderRadius: "8px",
                    display: "flex",
                    gap: "12px",
                    alignItems: "center",
                }}>
                    {["streaming", "closing", "refunding"].map((s, i) => (
                        <div key={s} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <div style={{
                                width: "8px",
                                height: "8px",
                                borderRadius: "50%",
                                background: step === s
                                    ? "#fbbf24"
                                    : ["streaming", "closing", "refunding"].indexOf(step) > i
                                        ? "#10b981"
                                        : "#1e293b",
                                transition: "background 0.3s",
                            }} />
                            <span style={{
                                fontSize: "10px",
                                color: step === s ? "#fbbf24" : "#475569",
                                letterSpacing: "0.1em",
                            }}>
                                {s === "streaming" ? "PAYING" : s === "closing" ? "CLOSING" : "REFUNDING"}
                            </span>
                            {i < 2 && <span style={{ color: "#1e293b", fontSize: "10px" }}>→</span>}
                        </div>
                    ))}
                </div>
            )}

            {/* Selección de nodo */}
            {!activeSession && (
                <div style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "8px",
                    overflow: "hidden",
                }}>
                    <div style={{ padding: "12px 18px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                        <span style={{ fontSize: "10px", color: "#94a3b8", letterSpacing: "0.15em" }}>
                            SELECT NODE · {nodes.length} available
                        </span>
                    </div>

                    {nodes.length === 0 ? (
                        <div style={{ padding: "24px 18px", textAlign: "center" }}>
                            <span style={{ fontSize: "12px", color: "#475569" }}>
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
                                    borderBottom: "1px solid rgba(255,255,255,0.04)",
                                    background: selectedNode === node.owner
                                        ? "rgba(56,189,248,0.07)"
                                        : "transparent",
                                    transition: "background 0.15s",
                                }}
                            >
                                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                    <div style={{
                                        width: "8px",
                                        height: "8px",
                                        borderRadius: "50%",
                                        background: selectedNode === node.owner ? "#38bdf8" : "#10b981",
                                        boxShadow: selectedNode === node.owner ? "0 0 6px #38bdf8" : "0 0 6px #10b981",
                                    }} />
                                    <div>
                                        <div style={{ fontSize: "13px", color: "#f1f5f9", fontWeight: "600" }}>
                                            {node.location}
                                        </div>
                                        <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                                            {node.owner.slice(0, 10)}...{node.owner.slice(-4)}
                                        </div>
                                    </div>
                                </div>
                                <div style={{ textAlign: "right" }}>
                                    <div style={{ fontSize: "12px", color: "#38bdf8" }}>
                                        {node.bandwidth.toString()} Mbps
                                    </div>
                                    <div style={{ fontSize: "11px", color: "#64748b" }}>
                                        {formatEther(node.pricePerSecond)} MON/s
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Payment ticker */}
            {activeSession && sessionId && (
                <PaymentTicker sessionId={sessionId} />
            )}

            {/* Botón de acción */}
            <button
                onClick={activeSession ? handleCloseSession : handleOpenSession}
                disabled={(!selectedNode && !activeSession) || isPending || isClosing}
                style={{
                    padding: "14px",
                    borderRadius: "8px",
                    border: "none",
                    cursor: (!selectedNode && !activeSession) || isPending || isClosing ? "not-allowed" : "pointer",
                    fontSize: "13px",
                    fontFamily: "inherit",
                    fontWeight: "800",
                    letterSpacing: "0.1em",
                    transition: "all 0.2s",
                    background: activeSession ? "rgba(248,113,113,0.1)" : "rgba(16,185,129,0.1)",
                    color: activeSession ? "#f87171" : "#6ee7b7",
                    outline: `1px solid ${activeSession ? "rgba(248,113,113,0.3)" : "rgba(16,185,129,0.3)"}`,
                    opacity: (!selectedNode && !activeSession) || isPending || isClosing ? 0.6 : 1,
                }}
            >
                {getButtonLabel()}
            </button>

            {!activeSession && (
                <p style={{ fontSize: "11px", color: "#64748b", margin: 0, lineHeight: "1.6" }}>
                    El depósito de 0.01 MON queda en escrow. Al cerrar la sesión, se descuenta
                    el tiempo usado y el resto se reembolsa automáticamente.
                </p>
            )}
        </div>
    );
}