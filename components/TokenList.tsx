"use client";
import React, { useMemo, useState } from "react";
import type { TrendingToken } from "@/types/trendings";
import TokenRow from "./TokenRow";

export default function TokenList({ tokens }: { tokens: TrendingToken[] }) {
  const [sortKey, setSortKey] = useState<
    "priceChange24h" | "priceUsd" | "volumeUsd24h"
  >("priceChange24h");

  const sorted = useMemo(() => {
    return [...tokens].sort((a, b) => {
      const av = (a[sortKey] ?? 0) as number;
      const bv = (b[sortKey] ?? 0) as number;
      return bv - av;
    });
  }, [tokens, sortKey]);

  return (
    <div className="rounded-lg overflow-hidden bg-[rgba(255,255,255,0.02)]">
      {/* Header */}
      <div
        className="
          flex justify-between
          px-4 py-3
          border-b border-[rgba(60,43,47,0.12)]
        "
      >
        <div className="font-bold">Trending</div>

        <div className="flex gap-2">
          <button
            className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            onClick={() => setSortKey("priceChange24h")}
          >
            24h
          </button>

          <button
            className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            onClick={() => setSortKey("priceUsd")}
          >
            Price
          </button>

          <button
            className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            onClick={() => setSortKey("volumeUsd24h")}
          >
            Vol
          </button>
        </div>
      </div>

      {/* List */}
      {sorted.length === 0 ? (
        <div className="p-6 text-center text-[rgba(255,255,255,0.6)]">
          Loading…
        </div>
      ) : (
        sorted.map((t) => (
          <TokenRow
            key={t.pair ?? t.baseToken ?? t.baseSymbol}
            token={t}
          />
        ))
      )}
    </div>
  );
}
