"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { Dashboard } from "@/components/Dashboard";
import type { Tab } from "@/types";

export default function Home() {
  const { address, isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState<Tab>("map");

  if (!isConnected) {
    return (
      <main style={{
        background: "#060a0f",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'JetBrains Mono', monospace",
        gap: "24px",
        padding: "24px",
      }}>
        <div style={{ textAlign: "center" }}>
          <h1 style={{
            fontSize: "clamp(36px, 8vw, 56px)",
            fontWeight: "900",
            letterSpacing: "-0.04em",
            lineHeight: "1",
            background: "linear-gradient(135deg, #fff 0%, #38bdf8 45%, #10b981 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            margin: "0 0 8px",
          }}>
            NODEMESH
          </h1>
          <p style={{ color: "#475569", fontSize: "clamp(11px, 2vw, 13px)", margin: 0 }}>
            Decentralized bandwidth network · Powered by Monad
          </p>
        </div>

        <appkit-button />
      </main>
    );
  }

  return (
    <main style={{
      background: "#060a0f",
      minHeight: "100vh",
      fontFamily: "'JetBrains Mono', monospace",
      display: "flex",
      flexDirection: "column",
    }}>
      {/* Header */}
      <header style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 16px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        flexWrap: "wrap",
        gap: "8px",
      }}>
        <h1 style={{
          fontSize: "clamp(16px, 3vw, 20px)",
          fontWeight: "900",
          letterSpacing: "-0.03em",
          background: "linear-gradient(135deg, #fff 0%, #38bdf8 45%, #10b981 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          margin: 0,
        }}>
          NODEMESH
        </h1>

        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <span style={{
            fontSize: "11px",
            color: "#475569",
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
            padding: "5px 10px",
            borderRadius: "4px",
          }}>
            {address?.slice(0, 6)}...{address?.slice(-4)}
          </span>
          <appkit-button />
        </div>
      </header>

      {/* Tabs */}
      <nav style={{
        display: "flex",
        gap: "4px",
        padding: "10px 16px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        overflowX: "auto",
        WebkitOverflowScrolling: "touch" as any,
      }}>
        {([
          { id: "map", label: "🌐 Network" },
          { id: "user", label: "👤 Use" },
          { id: "provider", label: "⚡ Earn" },
        ] as { id: Tab; label: string }[]).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "8px 14px",
              borderRadius: "6px",
              border: "none",
              cursor: "pointer",
              fontSize: "clamp(11px, 2vw, 12px)",
              fontFamily: "inherit",
              fontWeight: "600",
              whiteSpace: "nowrap",
              transition: "all 0.2s",
              background: activeTab === tab.id ? "rgba(16,185,129,0.15)" : "transparent",
              color: activeTab === tab.id ? "#6ee7b7" : "#475569",
              outline: activeTab === tab.id ? "1px solid rgba(16,185,129,0.3)" : "none",
            }}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Dashboard */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        <Dashboard activeTab={activeTab} />
      </div>
    </main>
  );
}