"use client";

import { useEffect, useState } from "react";
import { useReadContract } from "wagmi";
import { formatEther } from "viem";
import { CONTRACT_ADDRESSES, NODE_REGISTRY_ABI } from "@/lib/contracts";
import type { Node } from "@/types";

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

function getCoords(location: string) {
    const key = Object.keys(LOCATION_COORDS).find(k =>
        location.toLowerCase().includes(k.toLowerCase())
    );
    return key ? LOCATION_COORDS[key] : null;
}

function latLngToXY(lat: number, lng: number): { x: number; y: number } {
    // Proyección Robinson calibrada para la imagen world-map.png (1408x768)
    // Márgenes del óvalo: left=30, right=1378, top=18, bottom=750
    // Mapeado al viewBox 0 0 1000 500

    const mapLeft = 30;
    const mapRight = 1378;
    const mapTop = 18;
    const mapBottom = 750;
    const imgW = 1408;
    const imgH = 768;

    // Escala al viewBox 1000x500
    const scaleX = 1000 / imgW;
    const scaleY = 500 / imgH;

    // Proyección Robinson: latitud tiene distorsión vertical no lineal
    // Tabla de factores Robinson (latitud → factor Y normalizado 0-1)
    const robinsonTable: [number, number][] = [
        [-90, 1.0000], [-85, 0.9761], [-80, 0.9394], [-75, 0.8936],
        [-70, 0.8435], [-65, 0.7903], [-60, 0.7346], [-55, 0.6769],
        [-50, 0.6176], [-45, 0.5571], [-40, 0.4958], [-35, 0.4340],
        [-30, 0.3720], [-25, 0.3099], [-20, 0.2480], [-15, 0.1863],
        [-10, 0.1246], [-5, 0.0629], [0, 0.0000],
        [5, -0.0629], [10, -0.1246], [15, -0.1863], [20, -0.2480],
        [25, -0.3099], [30, -0.3720], [35, -0.4340], [40, -0.4958],
        [45, -0.5571], [50, -0.6176], [55, -0.6769], [60, -0.7346],
        [65, -0.7903], [70, -0.8435], [75, -0.8936], [80, -0.9394],
        [85, -0.9761], [90, -1.0000],
    ];

    // Interpolar factor Y de Robinson para la latitud dada
    function robinsonY(latDeg: number): number {
        for (let i = 0; i < robinsonTable.length - 1; i++) {
            const [lat0, y0] = robinsonTable[i];
            const [lat1, y1] = robinsonTable[i + 1];
            if (latDeg >= lat0 && latDeg <= lat1) {
                const t = (latDeg - lat0) / (lat1 - lat0);
                return y0 + t * (y1 - y0);
            }
        }
        return latDeg >= 0 ? -1 : 1;
    }

    // Factor Y normalizado (-1 a 1) → pixel Y en imagen
    const yFactor = robinsonY(lat);
    const centerY = (mapTop + mapBottom) / 2;
    const halfH = (mapBottom - mapTop) / 2;
    const pixelY = centerY + yFactor * halfH;

    // Longitud → pixel X (proyección Robinson es casi lineal en X)
    const centerX = (mapLeft + mapRight) / 2;
    const halfW = (mapRight - mapLeft) / 2;
    const pixelX = centerX + (lng / 180) * halfW;

    // Escalar al viewBox 1000x500
    return {
        x: pixelX * scaleX,
        y: pixelY * scaleY,
    };
}

export function NodeMap() {
    const [selected, setSelected] = useState<string | null>(null);
    const [tick, setTick] = useState(0);

    const { data: onChainNodes, refetch } = useReadContract({
        address: CONTRACT_ADDRESSES.NODE_REGISTRY,
        abi: NODE_REGISTRY_ABI,
        functionName: "getActiveNodes",
    });

    useEffect(() => {
        const interval = setInterval(() => { refetch(); setTick(p => p + 1); }, 10000);
        return () => clearInterval(interval);
    }, [refetch]);

    const nodes = (onChainNodes as Node[] | undefined) ?? [];
    const mappableNodes = nodes
        .map(n => ({ node: n, coords: getCoords(n.location) }))
        .filter((n): n is { node: Node; coords: { lat: number; lng: number } } => n.coords !== null);
    const unmappableNodes = nodes.filter(n => !getCoords(n.location));

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "12px" }}>
                {[
                    { label: "ACTIVE NODES", value: nodes.length, color: "#10b981" },
                    { label: "ON-CHAIN SYNCS", value: tick, color: "#38bdf8" },
                    { label: "NETWORK", value: "Monad Testnet", color: "#a78bfa" },
                ].map(s => (
                    <div key={s.label} style={{
                        padding: "14px 18px",
                        background: "rgba(255,255,255,0.02)",
                        border: `1px solid ${s.color}25`,
                        borderRadius: "8px",
                    }}>
                        <div style={{ fontSize: "10px", color: "#94a3b8", letterSpacing: "0.15em", marginBottom: "6px" }}>{s.label}</div>
                        <div style={{ fontSize: "20px", fontWeight: "800", color: s.color }}>{s.value}</div>
                    </div>
                ))}
            </div>

            {/* Mapa */}
            <div style={{
                background: "#0a0f1a",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "12px",
                overflow: "hidden",
                position: "relative",
            }}>
                <div style={{ position: "relative", width: "100%", background: "#0a0f1a" }}>
                    {/* Mapamundi PNG como fondo */}
                    <img
                        src="/world-map.png"
                        alt="world map"
                        style={{
                            width: "100%",
                            display: "block",
                            opacity: 0.3,
                            filter: "invert(1) hue-rotate(180deg) saturate(1.5) brightness(0.8)",
                        }}
                    />

                    {/* Nodos superpuestos */}
                    <svg
                        viewBox="0 0 1000 500"
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "100%",
                            height: "100%",
                        }}
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <defs>
                            <filter id="glow">
                                <feGaussianBlur stdDeviation="3" result="blur" />
                                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                            </filter>
                        </defs>

                        {/* Líneas entre nodos */}
                        {mappableNodes.map(({ node: nA, coords: cA }, i) =>
                            mappableNodes.slice(i + 1).map(({ node: nB, coords: cB }) => {
                                const a = latLngToXY(cA.lat, cA.lng);
                                const b = latLngToXY(cB.lat, cB.lng);
                                return (
                                    <line key={`${nA.owner}-${nB.owner}`}
                                        x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                                        stroke="rgba(16,185,129,0.35)" strokeWidth="1" strokeDasharray="4 4" />
                                );
                            })
                        )}

                        {/* Nodos */}
                        {mappableNodes.map(({ node, coords }) => {
                            const { x, y } = latLngToXY(coords.lat, coords.lng);
                            const isSelected = selected === node.owner;
                            return (
                                <g key={node.owner}
                                    onClick={() => setSelected(isSelected ? null : node.owner)}
                                    style={{ cursor: "pointer" }}
                                    filter="url(#glow)"
                                >
                                    <circle cx={x} cy={y} r="16" fill="none" stroke="#10b981" strokeWidth="1" opacity="0.2">
                                        <animate attributeName="r" values="8;22" dur="2.5s" repeatCount="indefinite" />
                                        <animate attributeName="opacity" values="0.3;0" dur="2.5s" repeatCount="indefinite" />
                                    </circle>
                                    {isSelected && (
                                        <circle cx={x} cy={y} r="14" fill="none" stroke="#38bdf8" strokeWidth="1.5" opacity="0.8" />
                                    )}
                                    <circle cx={x} cy={y} r="5"
                                        fill={isSelected ? "#38bdf8" : "#10b981"}
                                        stroke={isSelected ? "#7dd3fc" : "#6ee7b7"}
                                        strokeWidth="1.5"
                                    />
                                    <text x={x} y={y - 10} textAnchor="middle"
                                        fill="#94a3b8" fontSize="8" fontFamily="monospace">
                                        {node.location.split(",")[0]}
                                    </text>
                                </g>
                            );
                        })}

                        {nodes.length === 0 && (
                            <text x="500" y="250" textAnchor="middle"
                                fill="#475569" fontSize="13" fontFamily="monospace">
                                No active nodes on-chain yet
                            </text>
                        )}
                    </svg>
                </div>

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
                                <div key={label} style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", gap: "12px" }}>
                                    <span style={{ fontSize: "11px", color: "#64748b" }}>{label}</span>
                                    <span style={{ fontSize: "11px", color: "#e2e8f0" }}>{value}</span>
                                </div>
                            ))}
                        </div>
                    );
                })()}
            </div>

            {/* Nodos sin coordenadas */}
            {unmappableNodes.length > 0 && (
                <div style={{
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: "8px", overflow: "hidden",
                }}>
                    <div style={{ padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                        <span style={{ fontSize: "10px", color: "#94a3b8", letterSpacing: "0.15em" }}>
                            NODES · LOCATION NOT MAPPED
                        </span>
                    </div>
                    {unmappableNodes.map(node => (
                        <div key={node.owner} style={{
                            display: "flex", justifyContent: "space-between",
                            padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,0.03)",
                        }}>
                            <span style={{ fontSize: "12px", color: "#e2e8f0" }}>{node.location}</span>
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