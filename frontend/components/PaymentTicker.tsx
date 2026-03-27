"use client";

import { useEffect, useState } from "react";
import { useReadContract } from "wagmi";
import { formatEther } from "viem";
import { CONTRACT_ADDRESSES, MICRO_PAYMENT_ABI } from "@/lib/contracts";

type Props = {
    sessionId: `0x${string}`;
};

export function PaymentTicker({ sessionId }: Props) {
    const [totalPaid, setTotalPaid] = useState(0n);
    const [bars, setBars] = useState<number[]>([]);

    const { data: accrued, refetch } = useReadContract({
        address: CONTRACT_ADDRESSES.MICRO_PAYMENT,
        abi: MICRO_PAYMENT_ABI,
        functionName: "getAccruedAmount",
        args: [sessionId],
    });

    // Refetch cada 5 segundos
    useEffect(() => {
        const interval = setInterval(() => refetch(), 5000);
        return () => clearInterval(interval);
    }, [refetch]);

    // Actualizar monto acumulado
    useEffect(() => {
        if (accrued) {
            setTotalPaid(accrued as bigint);
            setBars(prev => [...prev.slice(-7), Date.now()]);
        }
    }, [accrued]);

    return (
        <div style={{
            background: "rgba(16,185,129,0.04)",
            border: "1px solid rgba(16,185,129,0.2)",
            borderRadius: "8px",
            padding: "18px 20px",
            display: "flex",
            flexDirection: "column",
            gap: "14px",
        }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "10px", color: "#10b981", letterSpacing: "0.15em", textTransform: "uppercase" as const }}>
                    Session Cost
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <div style={{
                        width: "6px", height: "6px", borderRadius: "50%",
                        background: "#10b981",
                        animation: "blink 1.5s infinite",
                    }} />
                    <span style={{ fontSize: "10px", color: "#64748b" }}>LIVE</span>
                </div>
            </div>

            {/* Monto acumulado */}
            <div>
                <div style={{ fontSize: "10px", color: "#64748b", marginBottom: "4px" }}>
                    ACCRUED
                </div>
                <div style={{
                    fontSize: "clamp(20px, 4vw, 28px)",
                    fontWeight: "900",
                    color: "#10b981",
                    letterSpacing: "-0.02em",
                }}>
                    {parseFloat(formatEther(totalPaid)).toFixed(8)}
                    <span style={{ fontSize: "13px", color: "#64748b", marginLeft: "6px" }}>MON</span>
                </div>
            </div>

            {/* Barras visuales */}
            <div style={{ display: "flex", gap: "4px", alignItems: "flex-end", height: "28px" }}>
                {Array.from({ length: 8 }).map((_, i) => {
                    const isActive = i < bars.length;
                    return (
                        <div key={i} style={{
                            flex: 1,
                            height: isActive ? `${10 + (i % 3) * 8}px` : "4px",
                            borderRadius: "2px",
                            background: isActive ? "rgba(16,185,129,0.6)" : "rgba(255,255,255,0.06)",
                            transition: "height 0.4s ease, background 0.4s ease",
                        }} />
                    );
                })}
            </div>

            {/* Session ID */}
            <div style={{ fontSize: "10px", color: "#1e293b", letterSpacing: "0.05em" }}>
                SESSION · {sessionId.slice(0, 18)}...
            </div>

            <style>{`@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>
        </div>
    );
}