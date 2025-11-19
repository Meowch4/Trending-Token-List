"use client";
import React from "react";
import { useTrendingTokens } from "@/hooks/useTrendingTokens";
import TokenList from "@/components/TokenList";

export default function Page() {
  // set mock: false to use real WS (may require VPN)
  const { tokens, connected, error, reconnect } = useTrendingTokens({ mock: false });

  return (
    <main style={{ maxWidth: 920, margin: "32px auto", padding: 16 }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h1 style={{ margin: 0 }}>🔥 Trending Tokens</h1>
        <div style={{ fontSize: 13, color: connected ? "rgba(70,193,127,1)" : "rgba(255,255,255,0.6)" }}>
          {connected ? "Connected" : (error ? "Disconnected" : "Connecting...")}
          {error ? <button onClick={reconnect} style={{ marginLeft: 12 }}>Reconnect</button> : null}
        </div>
      </header>

      <TokenList tokens={tokens} />
    </main>
  );
}
