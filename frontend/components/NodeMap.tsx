"use client";

import { useEffect, useState } from "react";
import { useReadContract } from "wagmi";
import { formatEther } from "viem";
import {
    ComposableMap,
    Geographies,
    Geography,
    Marker,
    Line,
} from "react-simple-maps";
import { CONTRACT_ADDRESSES, NODE_REGISTRY_ABI } from "@/lib/contracts";
import type { Node } from "@/types";

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const LOCATION_COORDS: Record<string, [number, number]> = {
    "Mexico City": [-99.1, 19.4],
    "CDMX": [-99.1, 19.4],
    "Guadalajara": [-103.3, 20.7],
    "Monterrey": [-100.3, 25.7],
    "São Paulo": [-46.6, -23.5],
    "Buenos Aires": [-58.4, -34.6],
    "Bogota": [-74.1, 4.7],
    "Lima": [-77.0, -12.0],
    "New York": [-74.0, 40.7],
    "Los Angeles": [-118.2, 34.0],
    "Chicago": [-87.6, 41.8],
    "London": [-0.1, 51.5],
    "Berlin": [13.4, 52.5],
    "Paris": [2.3, 48.8],
    "Madrid": [-3.7, 40.4],
    "Tokyo": [139.7, 35.7],
    "Singapore": [103.8, 1.3],
    "Sydney": [151.2, -33.9],
    "Dubai": [55.3, 25.2],
    "Lagos": [3.4, 6.5],
};

function getCoords(location: string): [number, number] | null {
    const key = Object.keys(LOCATION_COORDS).find(k =>
        location.toLowerCase().includes(k.toLowerCase())
    );
    return key ? LOCATION_COORDS[key] : null;
}

const STAT_COLORS = {
    nodes: "#10b981",
    syncs: "#38bdf8",
    network: "#a78bfa",
} as const;

export function NodeMap() {
    const [selected, setSelected] = useState<string | null>(null);
    const [tick, setTick] = useState(0);

    const { data: onChainNodes, refetch } = useReadContract({
        address: CONTRACT_ADDRESSES.NODE_REGISTRY,
        abi: NODE_REGISTRY_ABI,
        functionName: "getActiveNodes",
    });

    useEffect(() => {
        const interval = setInterval(() => {
            refetch();
            setTick(p => p + 1);
        }, 10000);
        return () => clearInterval(interval);
    }, [refetch]);

    const nodes = (onChainNodes as Node[] | undefined) ?? [];

    const mappableNodes = nodes
        .map(n => ({ node: n, coords: getCoords(n.location) }))
        .filter((n): n is { node: Node; coords: [number, number] } => n.coords !== null);

    const unmappableNodes = nodes.filter(n => !getCoords(n.location));
    const selectedNode = mappableNodes.find(n => n.node.owner === selected);

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

            {/* ── Stats ─────────────────────────────────────────────── */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "12px" }}>
                {[
                    { label: "ACTIVE NODES", value: nodes.length, color: STAT_COLORS.nodes },
                    { label: "ON-CHAIN SYNCS", value: tick, color: STAT_COLORS.syncs },
                    { label: "NETWORK", value: "Monad Testnet", color: STAT_COLORS.network },
                ].map(s => (
                    <div key={s.label} style={{
                        padding: "14px 18px",
                        background: "rgba(255,255,255,0.04)",
                        border: `1px solid ${s.color}35`,
                        borderRadius: "8px",
                    }}>
                        <div style={{
                            fontSize: "10px",
                            color: "#94a3b8",
                            letterSpacing: "0.15em",
                            marginBottom: "6px",
                            textTransform: "uppercase" as const,
                        }}>
                            {s.label}
                        </div>
                        <div style={{ fontSize: "20px", fontWeight: "800", color: s.color }}>
                            {s.value}
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Mapa ──────────────────────────────────────────────── */}
            <div style={{
                background: "#0d1424",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "12px",
                overflow: "hidden",
                position: "relative",
            }}>
                <ComposableMap
                    projection="geoNaturalEarth1"
                    projectionConfig={{ scale: 147 }}
                    style={{ width: "100%", height: "auto", background: "#0d1424" }}
                >
                    <Geographies geography={GEO_URL}>
                        {({ geographies }: { geographies: any[] }) =>
                            geographies.map((geo: any) => (
                                <Geography
                                    key={geo.rsmKey}
                                    geography={geo}
                                    style={{
                                        default: { fill: "#1a3a5c", stroke: "#2a5a8c", strokeWidth: 0.5, outline: "none" },
                                        hover: { fill: "#1a3a5c", stroke: "#2a5a8c", strokeWidth: 0.5, outline: "none" },
                                        pressed: { fill: "#1a3a5c", stroke: "#2a5a8c", strokeWidth: 0.5, outline: "none" },
                                    }}
                                />
                            ))
                        }
                    </Geographies>

                    {/* Líneas entre nodos */}
                    {mappableNodes.map(({ node: nA, coords: cA }, i) =>
                        mappableNodes.slice(i + 1).map(({ node: nB, coords: cB }) => (
                            <Line
                                key={`${nA.owner}-${nB.owner}`}
                                from={cA}
                                to={cB}
                                stroke="rgba(16,185,129,0.3)"
                                strokeWidth={0.8}
                                strokeDasharray="4 4"
                            />
                        ))
                    )}

                    {/* Nodos */}
                    {mappableNodes.map(({ node, coords }) => {
                        const isSelected = selected === node.owner;
                        return (
                            <Marker
                                key={node.owner}
                                coordinates={coords}
                                onClick={() => setSelected(isSelected ? null : node.owner)}
                            >
                                {/* Pulso */}
                                <circle r="10" fill="none" stroke="#10b981" strokeWidth="1" opacity="0.3">
                                    <animate attributeName="r" values="5;18" dur="2.5s" repeatCount="indefinite" />
                                    <animate attributeName="opacity" values="0.4;0" dur="2.5s" repeatCount="indefinite" />
                                </circle>

                                {/* Ring seleccionado */}
                                {isSelected && (
                                    <circle r="10" fill="none" stroke="#38bdf8" strokeWidth="1.5" opacity="0.9" />
                                )}

                                {/* Punto principal */}
                                <circle
                                    r="4"
                                    fill={isSelected ? "#38bdf8" : "#10b981"}
                                    stroke={isSelected ? "#bfdbfe" : "#6ee7b7"}
                                    strokeWidth="1.5"
                                    style={{ cursor: "pointer" }}
                                />

                                {/* Etiqueta */}
                                <text
                                    y={-10}
                                    textAnchor="middle"
                                    fill="#cbd5e1"
                                    fontSize="5"
                                    fontFamily="monospace"
                                    style={{ pointerEvents: "none" }}
                                >
                                    {node.location.split(",")[0]}
                                </text>
                            </Marker>
                        );
                    })}
                </ComposableMap>

                {/* Panel de detalle del nodo seleccionado */}
                {selectedNode && (
                    <div style={{
                        position: "absolute",
                        bottom: "16px",
                        right: "16px",
                        background: "rgba(6,10,15,0.97)",
                        border: "1px solid rgba(56,189,248,0.35)",
                        borderRadius: "8px",
                        padding: "14px 18px",
                        minWidth: "220px",
                        backdropFilter: "blur(8px)",
                    }}>
                        <div style={{
                            fontSize: "10px",
                            color: "#38bdf8",
                            letterSpacing: "0.15em",
                            marginBottom: "10px",
                            textTransform: "uppercase" as const,
                        }}>
                            Node Details
                        </div>
                        {[
                            { label: "Location", value: selectedNode.node.location },
                            { label: "Owner", value: `${selectedNode.node.owner.slice(0, 8)}...${selectedNode.node.owner.slice(-4)}` },
                            { label: "Bandwidth", value: `${selectedNode.node.bandwidth.toString()} Mbps` },
                            { label: "Price", value: `${formatEther(selectedNode.node.pricePerSecond)} MON/s` },
                            { label: "Status", value: "● Active" },
                        ].map(({ label, value }) => (
                            <div key={label} style={{
                                display: "flex",
                                justifyContent: "space-between",
                                marginBottom: "6px",
                                gap: "12px",
                            }}>
                                <span style={{ fontSize: "11px", color: "#94a3b8" }}>{label}</span>
                                <span style={{
                                    fontSize: "11px",
                                    color: label === "Status" ? "#10b981" : "#f1f5f9",
                                    fontWeight: label === "Status" ? "700" : "400",
                                }}>
                                    {value}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Nodos sin coordenadas ─────────────────────────────── */}
            {unmappableNodes.length > 0 && (
                <div style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "8px",
                    overflow: "hidden",
                }}>
                    <div style={{
                        padding: "10px 16px",
                        borderBottom: "1px solid rgba(255,255,255,0.08)",
                    }}>
                        <span style={{
                            fontSize: "10px",
                            color: "#94a3b8",
                            letterSpacing: "0.15em",
                            textTransform: "uppercase" as const,
                        }}>
                            Nodes · Location Not Mapped
                        </span>
                    </div>
                    {unmappableNodes.map(node => (
                        <div key={node.owner} style={{
                            display: "flex",
                            justifyContent: "space-between",
                            padding: "10px 16px",
                            borderBottom: "1px solid rgba(255,255,255,0.04)",
                        }}>
                            <span style={{ fontSize: "12px", color: "#f1f5f9" }}>{node.location}</span>
                            <span style={{ fontSize: "11px", color: "#64748b" }}>
                                {node.owner.slice(0, 8)}...{node.owner.slice(-4)}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}