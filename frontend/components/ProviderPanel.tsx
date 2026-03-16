"use client";

import { useState, useEffect } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther, formatEther } from "viem";
import { CONTRACT_ADDRESSES, NODE_REGISTRY_ABI, MICRO_PAYMENT_ABI } from "@/lib/contracts";

const LOCATIONS = [
    "Mexico City, MX",
    "Guadalajara, MX",
    "Monterrey, MX",
    "São Paulo, BR",
    "Buenos Aires, AR",
    "Bogota, CO",
    "Lima, PE",
    "New York, US",
    "Los Angeles, US",
    "Chicago, US",
    "London, UK",
    "Berlin, DE",
    "Paris, FR",
    "Madrid, ES",
    "Tokyo, JP",
    "Singapore, SG",
    "Sydney, AU",
    "Dubai, AE",
    "Lagos, NG",
];

export function ProviderPanel() {
    const { address } = useAccount();

    const [location, setLocation] = useState("");
    const [bandwidth, setBandwidth] = useState("");
    const [pricePerSecond, setPricePerSecond] = useState("");
    const [earnings, setEarnings] = useState(0n);

    const { writeContract, data: txHash, isPending } = useWriteContract();
    const { isSuccess: isTxConfirmed } = useWaitForTransactionReceipt({ hash: txHash });

    const { data: nodeData, refetch: refetchNode } = useReadContract({
        address: CONTRACT_ADDRESSES.NODE_REGISTRY,
        abi: NODE_REGISTRY_ABI,
        functionName: "getNode",
        args: [address as `0x${string}`],
        query: { enabled: !!address },
    });

    const { data: pendingEarnings, refetch: refetchEarnings } = useReadContract({
        address: CONTRACT_ADDRESSES.MICRO_PAYMENT,
        abi: MICRO_PAYMENT_ABI,
        functionName: "pendingEarnings",
        args: [address as `0x${string}`],
        query: { enabled: !!address },
    });

    // Contar sesiones activas en este nodo
    const { data: totalNodes } = useReadContract({
        address: CONTRACT_ADDRESSES.NODE_REGISTRY,
        abi: NODE_REGISTRY_ABI,
        functionName: "getTotalNodes",
        query: { enabled: !!address },
    });

    const node = nodeData as any;
    const isRegistered = node && node.owner !== "0x0000000000000000000000000000000000000000";

    useEffect(() => {
        if (isTxConfirmed) {
            refetchNode();
            refetchEarnings();
        }
    }, [isTxConfirmed, refetchNode, refetchEarnings]);

    useEffect(() => {
        if (pendingEarnings) setEarnings(pendingEarnings as bigint);
    }, [pendingEarnings]);

    function handleRegisterNode() {
        if (!location || !bandwidth || !pricePerSecond) return;
        writeContract({
            address: CONTRACT_ADDRESSES.NODE_REGISTRY,
            abi: NODE_REGISTRY_ABI,
            functionName: "registerNode",
            args: [location, parseEther(pricePerSecond), BigInt(bandwidth)],
            value: parseEther("0.01"),
        });
    }

    function handleDeactivateNode() {
        writeContract({
            address: CONTRACT_ADDRESSES.NODE_REGISTRY,
            abi: NODE_REGISTRY_ABI,
            functionName: "deactivateNode",
            args: [],
        });
    }

    function handleReactivateNode() {
        writeContract({
            address: CONTRACT_ADDRESSES.NODE_REGISTRY,
            abi: NODE_REGISTRY_ABI,
            functionName: "reactivateNode",
            args: [],
        });
    }

    function handleClaimEarnings() {
        if ((pendingEarnings as bigint) > 0n) {
            writeContract({
                address: CONTRACT_ADDRESSES.MICRO_PAYMENT,
                abi: MICRO_PAYMENT_ABI,
                functionName: "claimEarnings",
                args: [],
            });
        }
        setEarnings(0n);
    }

    // ─── Estilos reutilizables ───────────────────────────────────────────────

    const cardStyle: React.CSSProperties = {
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: "8px",
        overflow: "hidden",
    };

    const labelStyle: React.CSSProperties = {
        fontSize: "10px",
        color: "#475569",
        letterSpacing: "0.1em",
        marginBottom: "6px",
        textTransform: "uppercase" as const,
    };

    const inputStyle: React.CSSProperties = {
        width: "100%",
        padding: "10px 12px",
        background: "#0f172a",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "6px",
        color: "#f1f5f9",
        fontSize: "13px",
        fontFamily: "inherit",
        outline: "none",
        boxSizing: "border-box" as const,
        appearance: "none" as const,
        WebkitAppearance: "none" as const,
        cursor: "pointer",
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "640px", width: "100%" }}>

            {/* Earnings card */}
            <div style={{
                padding: "20px",
                background: "rgba(16,185,129,0.05)",
                border: "1px solid rgba(16,185,129,0.2)",
                borderRadius: "8px",
            }}>
                <div style={{ fontSize: "10px", color: "#10b981", letterSpacing: "0.15em", marginBottom: "8px" }}>
                    PENDING EARNINGS
                </div>
                <div style={{ fontSize: "clamp(24px, 5vw, 36px)", fontWeight: "900", color: "#10b981", letterSpacing: "-0.03em" }}>
                    {parseFloat(formatEther(earnings)).toFixed(6)}
                    <span style={{ fontSize: "16px", color: "#475569", marginLeft: "8px" }}>MON</span>
                </div>
                <button
                    onClick={handleClaimEarnings}
                    disabled={earnings === 0n || isPending}
                    style={{
                        marginTop: "14px",
                        padding: "10px 20px",
                        borderRadius: "6px",
                        border: "1px solid rgba(16,185,129,0.3)",
                        background: "rgba(16,185,129,0.1)",
                        color: "#6ee7b7",
                        fontSize: "12px",
                        fontFamily: "inherit",
                        fontWeight: "700",
                        cursor: earnings === 0n || isPending ? "not-allowed" : "pointer",
                        letterSpacing: "0.1em",
                        opacity: earnings === 0n || isPending ? 0.4 : 1,
                        transition: "opacity 0.2s",
                    }}
                >
                    {isPending ? "PROCESSING..." : "CLAIM EARNINGS"}
                </button>
            </div>

            {/* Node registrado */}
            {isRegistered ? (
                <div style={cardStyle}>
                    <div style={{ padding: "12px 18px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                        <span style={{ fontSize: "10px", color: "#475569", letterSpacing: "0.15em" }}>YOUR NODE</span>
                    </div>
                    <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: "10px" }}>
                        {[
                            { label: "Location", value: node.location },
                            { label: "Bandwidth", value: `${node.bandwidth.toString()} Mbps` },
                            { label: "Price/sec", value: `${formatEther(node.pricePerSecond)} MON` },
                            { label: "Staked", value: `${formatEther(node.stakedAmount)} MON` },
                            { label: "Status", value: node.active ? "● Active" : "○ Inactive" },
                            { label: "Total Nodes", value: totalNodes ? totalNodes.toString() : "0" },
                        ].map(({ label, value }) => (
                            <div key={label} style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "4px" }}>
                                <span style={{ fontSize: "12px", color: "#475569" }}>{label}</span>
                                <span style={{
                                    fontSize: "12px",
                                    color: label === "Status"
                                        ? node.active ? "#10b981" : "#f87171"
                                        : "#cbd5e1",
                                }}>
                                    {value}
                                </span>
                            </div>
                        ))}
                    </div>
                    <div style={{ padding: "0 18px 16px" }}>
                        <button
                            onClick={node.active ? handleDeactivateNode : handleReactivateNode}
                            disabled={isPending}
                            style={{
                                width: "100%",
                                padding: "10px",
                                borderRadius: "6px",
                                border: `1px solid ${node.active ? "rgba(248,113,113,0.25)" : "rgba(16,185,129,0.25)"}`,
                                background: node.active ? "rgba(248,113,113,0.07)" : "rgba(16,185,129,0.07)",
                                color: node.active ? "#f87171" : "#6ee7b7",
                                fontSize: "12px",
                                fontFamily: "inherit",
                                fontWeight: "700",
                                cursor: isPending ? "not-allowed" : "pointer",
                                letterSpacing: "0.1em",
                                opacity: isPending ? 0.4 : 1,
                            }}
                        >
                            {isPending ? "PROCESSING..." : node.active ? "DEACTIVATE NODE" : "REACTIVATE NODE"}
                        </button>
                    </div>
                </div>

            ) : (

                /* Formulario de registro */
                <div style={cardStyle}>
                    <div style={{ padding: "12px 18px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                        <span style={{ fontSize: "10px", color: "#475569", letterSpacing: "0.15em" }}>REGISTER YOUR NODE</span>
                    </div>
                    <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: "14px" }}>

                        {/* Location — selector */}
                        <div>
                            <div style={labelStyle}>Location</div>
                            <select
                                value={location}
                                onChange={e => setLocation(e.target.value)}
                                style={inputStyle}
                            >
                                <option value="" disabled>Select your location...</option>
                                {LOCATIONS.map(loc => (
                                    <option key={loc} value={loc}>{loc}</option>
                                ))}
                            </select>
                        </div>

                        {/* Bandwidth */}
                        <div>
                            <div style={labelStyle}>Bandwidth (Mbps)</div>
                            <input
                                type="number"
                                value={bandwidth}
                                onChange={e => setBandwidth(e.target.value)}
                                placeholder="100"
                                min="1"
                                style={inputStyle}
                            />
                        </div>

                        {/* Price per second */}
                        <div>
                            <div style={labelStyle}>Price per second (MON)</div>
                            <input
                                type="number"
                                value={pricePerSecond}
                                onChange={e => setPricePerSecond(e.target.value)}
                                placeholder="0.0001"
                                step="0.0001"
                                min="0"
                                style={inputStyle}
                            />
                        </div>

                        <button
                            onClick={handleRegisterNode}
                            disabled={!location || !bandwidth || !pricePerSecond || isPending}
                            style={{
                                padding: "12px",
                                borderRadius: "6px",
                                border: "none",
                                background: "rgba(16,185,129,0.1)",
                                color: "#6ee7b7",
                                fontSize: "13px",
                                fontFamily: "inherit",
                                fontWeight: "800",
                                cursor: !location || !bandwidth || !pricePerSecond || isPending ? "not-allowed" : "pointer",
                                letterSpacing: "0.1em",
                                outline: "1px solid rgba(16,185,129,0.3)",
                                opacity: !location || !bandwidth || !pricePerSecond || isPending ? 0.4 : 1,
                                transition: "opacity 0.2s",
                                marginTop: "4px",
                            }}
                        >
                            {isPending ? "CONFIRMING..." : "REGISTER NODE · 0.01 MON stake"}
                        </button>

                        <p style={{ fontSize: "11px", color: "#334155", margin: 0, lineHeight: "1.6" }}>
                            El stake de 0.01 MON garantiza que tu nodo opera correctamente.
                            Se devuelve al desactivar el nodo.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}