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

function latLngToXY(lat: number, lng: number) {
    const x = ((lng + 180) / 360) * 1000;
    const y = ((90 - lat) / 180) * 500;
    return { x, y };
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
                <svg
                    viewBox="0 0 1000 500"
                    style={{ width: "100%", display: "block" }}
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <defs>
                        <filter id="glow">
                            <feGaussianBlur stdDeviation="3" result="blur" />
                            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                        </filter>
                    </defs>

                    {/* Fondo */}
                    <rect width="1000" height="500" fill="#0a0f1a" />

                    {/* Mapa del mundo — Natural Earth simplified paths */}
                    <g fill="#0f2235" stroke="#1e3a5f" strokeWidth="0.5" opacity="0.9">
                        {/* América del Norte */}
                        <path d="M120,60 L180,55 L220,70 L240,90 L230,120 L210,140 L190,160 L170,180 L155,200 L140,220 L130,200 L115,180 L100,160 L90,140 L95,110 L105,85 Z" />
                        {/* México y América Central */}
                        <path d="M140,220 L170,215 L190,225 L200,240 L190,255 L175,265 L160,260 L148,248 L140,235 Z" />
                        {/* América del Sur */}
                        <path d="M165,265 L210,260 L245,270 L265,295 L270,330 L260,365 L240,390 L215,405 L190,400 L170,385 L158,360 L152,330 L155,300 L160,278 Z" />
                        {/* Europa */}
                        <path d="M430,60 L480,55 L510,65 L520,80 L510,100 L490,110 L465,108 L445,100 L430,85 Z" />
                        {/* España y Portugal */}
                        <path d="M430,95 L460,90 L470,105 L460,118 L440,120 L428,108 Z" />
                        {/* Gran Bretaña */}
                        <path d="M450,55 L465,52 L468,65 L458,72 L448,65 Z" />
                        {/* África */}
                        <path d="M450,130 L510,125 L545,140 L560,170 L558,210 L545,250 L520,285 L495,300 L468,295 L448,275 L435,245 L430,210 L432,175 L440,150 Z" />
                        {/* Asia Central */}
                        <path d="M520,60 L620,55 L680,65 L700,85 L690,110 L660,125 L620,120 L580,115 L550,100 L525,80 Z" />
                        {/* Asia del Sur */}
                        <path d="M580,120 L640,115 L670,130 L675,160 L660,185 L635,195 L605,190 L585,170 L578,145 Z" />
                        {/* Asia del Este */}
                        <path d="M680,65 L760,60 L800,75 L810,100 L795,130 L765,145 L730,140 L700,125 L685,100 Z" />
                        {/* Japón */}
                        <path d="M800,85 L820,80 L828,95 L818,108 L805,105 Z" />
                        {/* Sudeste Asiático */}
                        <path d="M680,155 L730,150 L750,165 L745,190 L720,200 L695,195 L680,178 Z" />
                        {/* Australia */}
                        <path d="M750,290 L830,282 L875,295 L890,325 L880,360 L855,378 L820,380 L785,368 L762,345 L752,315 Z" />
                        {/* Nueva Zelanda */}
                        <path d="M880,340 L895,335 L900,350 L890,362 L878,355 Z" />
                        {/* Rusia */}
                        <path d="M510,40 L700,32 L820,38 L840,55 L820,65 L760,60 L680,55 L580,52 L510,58 Z" />
                        {/* Groenlandia */}
                        <path d="M270,18 L320,14 L340,28 L330,45 L305,50 L278,40 Z" />
                        {/* Canadá */}
                        <path d="M95,35 L200,28 L265,38 L270,55 L240,65 L200,68 L155,62 L110,55 Z" />
                        {/* Indonesia */}
                        <path d="M720,210 L760,205 L775,218 L770,230 L748,235 L725,228 Z" />
                        <path d="M775,218 L810,212 L822,225 L815,238 L798,240 L780,232 Z" />
                    </g>

                    {/* Grid sutil */}
                    {Array.from({ length: 11 }).map((_, i) => (
                        <line key={`v${i}`} x1={i * 100} y1="0" x2={i * 100} y2="500"
                            stroke="rgba(56,189,248,0.04)" strokeWidth="0.5" />
                    ))}
                    {Array.from({ length: 6 }).map((_, i) => (
                        <line key={`h${i}`} x1="0" y1={i * 100} x2="1000" y2={i * 100}
                            stroke="rgba(56,189,248,0.04)" strokeWidth="0.5" />
                    ))}

                    {/* Ecuador */}
                    <line x1="0" y1="250" x2="1000" y2="250"
                        stroke="rgba(56,189,248,0.08)" strokeWidth="0.5" strokeDasharray="4 4" />

                    {/* Líneas entre nodos */}
                    {mappableNodes.map(({ node: nA, coords: cA }, i) =>
                        mappableNodes.slice(i + 1).map(({ node: nB, coords: cB }) => {
                            const a = latLngToXY(cA.lat, cA.lng);
                            const b = latLngToXY(cB.lat, cB.lng);
                            return (
                                <line key={`${nA.owner}-${nB.owner}`}
                                    x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                                    stroke="rgba(16,185,129,0.2)" strokeWidth="0.8" strokeDasharray="4 4" />
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