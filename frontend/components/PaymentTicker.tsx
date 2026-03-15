"use client";

import { useEffect, useState } from "react";
import { useReadContract, useWriteContract } from "wagmi";
import { formatEther } from "viem";
import { CONTRACT_ADDRESSES, MICRO_PAYMENT_ABI } from "@/lib/contracts";

type Props = {
    sessionId: `0x${string}`;
};

export function PaymentTicker({ sessionId }: Props) {
    const [ticks, setTicks] = useState<number[]>([]);
    const [totalPaid, setTotalPaid] = useState(0n);

    const { writeContract, isPending } = useWriteContract();

    // Leer monto acumulado desde el contrato
    const { data: accrued, refetch } = useReadContract({
        address: CONTRACT_ADDRESSES.MICRO_PAYMENT,
        abi: MICRO_PAYMENT_ABI,
        functionName: "getAccruedAmount",
        args: [sessionId],
    });

    // Refetch cada 5 segundos
    useEffect(() => {
        const interval = setInterval(() => {
            refetch();
        }, 5000);
        return () => clearInterval(interval);
    }, [refetch]);

    // Actualizar total acumulado
    useEffect(() => {
        if (accrued) setTotalPaid(accrued as bigint);
    }, [accrued]);

    // Animación visual de ticks
    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now();
            setTicks(prev => [...prev.slice(-6), now]);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    function handleStreamPayment() {
        writeContract({
            address: CONTRACT_ADDRESSES.MICRO_PAYMENT,
            abi: MICRO_PAYMENT_ABI,
            functionName: "streamPayment",
            args: [sessionId],
        });
    }

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
                <span style={{ fontSize: "10px", color: "#10b981", letterSpacing: "0.15em" }}>
                    PAYMENT STREAM
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <div style={{
                        width: "6px", height: "6px", borderRadius: "50%",
                        background: "#10b981",
                        animation: "blink 1.5s infinite",
                    }} />
                    <span style={{ fontSize: "10px", color: "#475569" }}>LIVE</span>
                </div>
            </div>

            {/* Monto acumulado */}
            <div>
                <div style={{ fontSize: "10px", color: "#475569", marginBottom: "4px" }}>
                    ACCRUED
                </div>
                <div style={{ fontSize: "28px", fontWeight: "900", color: "#10b981", letterSpacing: "-0.02em" }}>
                    {formatEther(totalPaid).slice(0, 10)}
                    <span style={{ fontSize: "14px", color: "#475569", marginLeft: "6px" }}>MON</span>
                </div>
            </div>

            {/* Ticks visuales */}
            <div style={{ display: "flex", gap: "6px", alignItems: "flex-end", height: "32px" }}>
                {Array.from({ length: 8 }).map((_, i) => {
                    const isActive = i < ticks.length;
                    const height = isActive ? `${12 + Math.random() * 20}px` : "6px";
                    return (
                        <div
                            key={i}
                            style={{
                                flex: 1,
                                height,
                                borderRadius: "2px",
                                background: isActive
                                    ? "rgba(16,185,129,0.7)"
                                    : "rgba(255,255,255,0.05)",
                                transition: "height 0.3s ease, background 0.3s ease",
                            }}
                        />
                    );
                })}
            </div>

            {/* Session ID */}
            <div style={{ fontSize: "10px", color: "#1e293b" }}>
                {sessionId.slice(0, 16)}...
            </div>

            {/* Botón stream manual */}
            <button
                onClick={handleStreamPayment}
                disabled={isPending}
                style={{
                    padding: "10px",
                    borderRadius: "6px",
                    border: "1px solid rgba(16,185,129,0.25)",
                    background: "rgba(16,185,129,0.08)",
                    color: "#6ee7b7",
                    fontSize: "11px",
                    fontFamily: "inherit",
                    fontWeight: "700",
                    cursor: isPending ? "not-allowed" : "pointer",
                    letterSpacing: "0.1em",
                    opacity: isPending ? 0.4 : 1,
                    transition: "opacity 0.2s",
                }}
            >
                {isPending ? "PROCESSING..." : "TRIGGER PAYMENT · on-chain"}
            </button>

            <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
      `}</style>
        </div>
    );
}