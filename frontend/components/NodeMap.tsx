"use client";

import { useEffect, useState } from "react";
import { useReadContract } from "wagmi";
import { formatEther } from "viem";
import { CONTRACT_ADDRESSES, NODE_REGISTRY_ABI } from "@/lib/contracts";
import type { Node } from "@/types";

// Coordenadas reales por ciudad — se expande conforme crezca la red
const LOCATION_COORDS: Record<string, { lat: number; lng: number }> = {
    "Mexico City": { lat: 19.4, lng: -99.1 },
    "CDMX": { lat: 19.4, lng: -99.1 },
    "Guadalajara": { lat: 20.7, lng: -103.3 },
    "Monterrey": { lat: 25.7, lng: -100.3 },
    "São Paulo": { lat: -23.5, lng: -46.6 },
    "Buenos Aires": { lat: -34.6, lng: -58.4 },
    "Bogota": { lat: 4.7, lng: -74.1 },
    "Lima": { lat: -12.0, lng: -77.0 },
    "New York": { lat: 40.7, lng: -74.0 },
    "Los Angeles": { lat: 34.0, lng: -118.2 },
    "Chicago": { lat: 41.8, lng: -87.6 },
    "London": { lat: 51.5, lng: -0.1 },
    "Berlin": { lat: 52.5, lng: 13.4 },
    "Paris": { lat: 48.8, lng: 2.3 },
    "Madrid": { lat: 40.4, lng: -3.7 },
    "Tokyo": { lat: 35.7, lng: 139.7 },
    "Singapore": { lat: 1.3, lng: 103.8 },
    "Sydney": { lat: -33.9, lng: 151.2 },
    "Dubai": { lat: 25.2, lng: 55.3 },
    "Lagos": { lat: 6.5, lng: 3.4 },
};

function getCoords(location: string): { lat: number; lng: number } | null {
    const key = Object.keys(LOCATION_COORDS).find(k =>
        location.toLowerCase().includes(k.toLowerCase())
    );
    return key ? LOCATION_COORDS[key] : null;
}

function latLngToXY(lat: number, lng: number) {
    const x = ((lng + 180) / 360) * 800;
    const y = ((90 - lat) / 180) * 400;
    return { x, y };
}

export function NodeMap() {
    const [selected, setSelected] = useState<string | null>(null);
    const [tick, setTick] = useState(0);

    // Leer nodos reales del contrato
    const { data: onChainNodes, refetch } = useReadContract({
        address: CONTRACT_ADDRESSES.NODE_REGISTRY,
        abi: NODE_REGISTRY_ABI,
        functionName: "getActiveNodes",
    });

    // Refetch cada 10 segundos
    useEffect(() => {
        const interval = setInterval(() => {
            refetch();
            setTick(prev => prev + 1);
        }, 10000);
        return () => clearInterval(interval);
    }, [refetch]);

    const nodes = (onChainNodes as Node[] | undefined) ?? [];

    // Solo nodos con coordenadas conocidas aparecen en el mapa
    const mappableNodes = nodes
        .map(node => ({ node, coords: getCoords(node.location) }))
        .filter((n): n is { node: Node; coords: { lat: number; lng: number } } => n.coords !== null);

    // Nodos sin coordenadas conocidas — se listan abajo
    const unmappableNodes = nodes.filter(node => !getCoords(node.location));

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

            {/* Stats bar */}
            <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "12px",
            }}>
                {[
                    { label: "ACTIVE NODES", value: nodes.length, color: "#10b981" },
                    { label: "ON-CHAIN SYNCS", value: tick, color: "#38bdf8" },
                    { label: "NETWORK", value: "Monad Testnet", color: "#a78bfa" },
                ].map((stat) => (
                    <div key={stat.label} style={{
                        padding: "14px 18px",
                        background: "rgba(255,255,255,0.02)",
                        border: `1px solid ${stat.color}25`,
                        borderRadius: "8px",
                    }}>
                        <div style={{ fontSize: "10px", color: "#475569", letterSpacing: "0.15em", marginBottom: "6px" }}>
                            {stat.label}
                        </div>
                        <div style={{ fontSize: "20px", fontWeight: "800", color: stat.color }}>
                            {stat.value}
                        </div>
                    </div>
                ))}
            </div>

            {/* Mapa SVG */}
            <div style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "12px",
                overflow: "hidden",
                position: "relative",
            }}>
                <svg viewBox="0 0 800 400" style={{ width: "100%", display: "block" }}>
                    {/* Fondo */}
                    <rect width="800" height="400" fill="#0a0f1a" />

                    {/* Grid */}
                    {Array.from({ length: 9 }).map((_, i) => (
                        <line key={`v${i}`} x1={i * 100} y1="0" x2={i * 100} y2="400"
                            stroke="rgba(56,189,248,0.04)" strokeWidth="1" />
                    ))}
                    {Array.from({ length: 5 }).map((_, i) => (
                        <line key={`h${i}`} x1="0" y1={i * 100} x2="800" y2={i * 100}
                            stroke="rgba(56,189,248,0.04)" strokeWidth="1" />
                    ))}

                    {/* Líneas entre nodos reales */}
                    {mappableNodes.map(({ node: nodeA, coords: coordsA }, i) =>
                        mappableNodes.slice(i + 1).map(({ node: nodeB, coords: coordsB }) => {
                            const a = latLngToXY(coordsA.lat, coordsA.lng);
                            const b = latLngToXY(coordsB.lat, coordsB.lng);
                            return (
                                <line
                                    key={`${nodeA.owner}-${nodeB.owner}`}
                                    x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                                    stroke="rgba(16,185,129,0.15)"
                                    strokeWidth="1"
                                    strokeDasharray="4 4"
                                />
                            );
                        })
                    )}

                    {/* Nodos reales */}
                    {mappableNodes.map(({ node, coords }) => {
                        const { x, y } = latLngToXY(coords.lat, coords.lng);
                        const isSelected = selected === node.owner;

                        return (
                            <g
                                key={node.owner}
                                onClick={() => setSelected(isSelected ? null : node.owner)}
                                style={{ cursor: "pointer" }}
                            >
                                {/* Pulso permanente en nodos activos */}
                                <circle cx={x} cy={y} r="14" fill="none"
                                    stroke="#10b981" strokeWidth="1" opacity="0.3">
                                    <animate attributeName="r" values="8;20" dur="2s" repeatCount="indefinite" />
                                    <animate attributeName="opacity" values="0.3;0" dur="2s" repeatCount="indefinite" />
                                </circle>

                                {/* Seleccionado */}
                                {isSelected && (
                                    <circle cx={x} cy={y} r="14" fill="none"
                                        stroke="#38bdf8" strokeWidth="1.5" opacity="0.7" />
                                )}

                                {/* Nodo */}
                                <circle
                                    cx={x} cy={y} r="6"
                                    fill={isSelected ? "#38bdf8" : "#10b981"}
                                    stroke={isSelected ? "#7dd3fc" : "#6ee7b7"}
                                    strokeWidth="1.5"
                                />

                                {/* Etiqueta */}
                                <text x={x} y={y - 12} textAnchor="middle"
                                    fill="#94a3b8" fontSize="9" fontFamily="monospace">
                                    {node.location.split(",")[0]}
                                </text>
                            </g>
                        );
                    })}

                    {/* Estado vacío */}
                    {mappableNodes.length === 0 && (
                        <text x="400" y="200" textAnchor="middle"
                            fill="#334155" fontSize="13" fontFamily="monospace">
                            No active nodes on-chain yet
                        </text>
                    )}
                </svg>

                {/* Panel de detalle */}
                {selected && (() => {
                    const found = mappableNodes.find(n => n.node.owner === selected);
                    if (!found) return null;
                    const { node } = found;
                    return (
                        <div style={{
                            position: "absolute", bottom: "16px", right: "16px",
                            background: "rgba(6,10,15,0.95)",
                            border: "1px solid rgba(56,189,248,0.3)",
                            borderRadius: "8px", padding: "14px 18px", minWidth: "220px",
                        }}>
                            <div style={{ fontSize: "10px", color: "#38bdf8", letterSpacing: "0.15em", marginBottom: "10px" }}>
                                NODE DETAILS
                            </div>
                            {[
                                { label: "Location", value: node.location },
                                { label: "Owner", value: `${node.owner.slice(0, 8)}...${node.owner.slice(-4)}` },
                                { label: "Bandwidth", value: `${node.bandwidth.toString()} Mbps` },
                                { label: "Price", value: `${formatEther(node.pricePerSecond)} MON/s` },
                                { label: "Status", value: "● Active" },
                            ].map(({ label, value }) => (
                                <div key={label} style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                                    <span style={{ fontSize: "11px", color: "#475569" }}>{label}</span>
                                    <span style={{ fontSize: "11px", color: "#cbd5e1" }}>{value}</span>
                                </div>
                            ))}
                        </div>
                    );
                })()}
            </div>

            {/* Nodos sin coordenadas mapeadas */}
            {unmappableNodes.length > 0 && (
                <div style={{
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: "8px", overflow: "hidden",
                }}>
                    <div style={{ padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                        <span style={{ fontSize: "10px", color: "#475569", letterSpacing: "0.15em" }}>
                            NODES · LOCATION NOT MAPPED
                        </span>
                    </div>
                    {unmappableNodes.map(node => (
                        <div key={node.owner} style={{
                            display: "flex", justifyContent: "space-between",
                            padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,0.03)",
                        }}>
                            <span style={{ fontSize: "12px", color: "#cbd5e1" }}>{node.location}</span>
                            <span style={{ fontSize: "11px", color: "#475569" }}>
                                {node.owner.slice(0, 8)}...{node.owner.slice(-4)}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}