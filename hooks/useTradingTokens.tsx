// src/hooks/useTrendingTokens.ts
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { TrendingToken } from "@/types/trendings";

const WS_URL = "wss://web-t.pinkpunk.io/ws";

/**
 * version 1:
 * - connect to WS
 * - subscribe trending
 * - handle plain JSON messages
 * - no gzip decode
 * - no heartbeat
 * - no reconnect
 * - no batching
 */
export function useTrendingTokens(opts?: { mock?: boolean }) {
  const mock = opts?.mock ?? false;
  const wsRef = useRef<WebSocket | null>(null);

  const [map, setMap] = useState<Record<string, TrendingToken>>({});
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subscribeTrending = useCallback(() => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    try {
      wsRef.current.send(
        JSON.stringify({
          topic: "trending",
          event: "sub",
          interval: "",
          pair: "",
          chainId: "56",
          compression: 0,
        })
      );
    } catch {}
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleJson = useCallback((json: any) => {
    if (!json) return;

    // initial snapshot
    if (json.msg === "success" && Array.isArray(json.data)) {
      const newMap: Record<string, TrendingToken> = {};
      for (const item of json.data) {
        const id =
          item.pair ??
          item.baseToken ??
          item.baseSymbol ??
          String(Math.random());
        newMap[id] = item;
      }
      setMap(newMap);
      return;
    }

    // incremental updates
    if (json.topic === "trending" && Array.isArray(json.data)) {
      setMap((prev) => {
        const copy = { ...prev };
        for (const item of json.data) {
          const id =
            item.pair ??
            item.baseToken ??
            item.baseSymbol ??
            String(Math.random());
          copy[id] = { ...(copy[id] ?? {}), ...item };
        }
        return copy;
      });
    }
  }, []);

  const connect = useCallback(() => {
    if (mock) {
      // simple mock mode
      setConnected(true);
      setError(null);
      const seed = {
        btc: {
          pair: "btc",
          baseSymbol: "BTC",
          priceUsd: 60000,
          priceChange24h: 0.012,
        },
        eth: {
          pair: "eth",
          baseSymbol: "ETH",
          priceUsd: 3500,
          priceChange24h: -0.003,
        },
      } as Record<string, TrendingToken>;
      setMap(seed);
      return;
    }

    try {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        setError(null);
        subscribeTrending();
      };

      ws.onmessage = (ev) => {
        if (typeof ev.data === "string") {
          try {
            const json = JSON.parse(ev.data);
            handleJson(json);
          } catch {
            // ignore
          }
        }
      };

      ws.onerror = () => {
        setError("WebSocket error");
      };

      ws.onclose = () => {
        setConnected(false);
      };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      setError("Failed to create WebSocket");
    }
  }, [mock, subscribeTrending, handleJson]);

  useEffect(() => {
    connect();
    return () => {
      try {
        wsRef.current?.close();
      } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tokens = Object.values(map);

  const reconnect = useCallback(() => {
    try {
      wsRef.current?.close();
    } catch {}
    connect();
  }, [connect]);

  return { tokens, connected, error, reconnect };
}
