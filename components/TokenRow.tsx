"use client";
import React from "react";
import type { TrendingToken } from "@/types/trendings";

export default function TokenRow({ token }: { token: TrendingToken }) {
  const up = (token.priceChange24h ?? 0) > 0;

  return (
    <div
      className="
        flex justify-between items-center
        px-4 py-3
        border-b border-[rgba(60,43,47,0.12)]
      "
    >
      <div className="flex items-center gap-3">
        <div className="font-bold">{token.baseSymbol ?? token.pair}</div>
        <div className="text-xs text-[var(--color-text-secondary)]">
          {token.baseName}
        </div>
      </div>

      <div className="text-right">
        <div className="font-semibold">
          ${(token.priceUsd ?? 0).toLocaleString(undefined, {
            maximumFractionDigits: 6,
          })}
        </div>

        <div
          className={`
            text-xs
            ${up ? "text-[var(--color-up)]" : "text-[var(--color-down)]"}
          `}
        >
          {((token.priceChange24h ?? 0) * 100).toFixed(2)}%
        </div>
      </div>
    </div>
  );
}
