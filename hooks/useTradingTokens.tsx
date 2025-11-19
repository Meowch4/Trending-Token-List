// src/hooks/useTrendingTokens.ts
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import pako from "pako";
import type { TrendingToken } from "@/types/trendings";

const WS_URL = "wss://web-t.pinkpunk.io/ws";

/**
 * version 2:
 * - version 1 features
 * - add gzip decompressData
 * - handle compressed string / ArrayBuffer / Blob
 */
export function useTrendingTokens(opts?: { mock?: boolean }) {
  const mock = opts?.mock ?? false;
  const wsRef = useRef<WebSocket | null>(null);

  const [map, setMap] = useState<Record<string, TrendingToken>>({});
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** 解压函数：ISO-8859-1 → gzip → UTF-8 */
  const decompressData = useCallback((s: string) => {
    const bytes = new Uint8Array(s.length);
    for (let i = 0; i < s.length; i++) bytes[i] = s.charCodeAt(i) & 0xff;
    const out = pako.inflate(bytes);
    return new TextDecoder("utf-8").decode(out);
  }, []);

  /** 处理 JSON 对象 */
  const handleJson = useCallback((json: any) => {
    if (!json) return;

    // 初始快照
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

    // 增量数据
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

  /** 处理原始 WS 数据：尝试 JSON → gzip 解压 */
  const handleRaw = useCallback(
    (raw: any) => {
      // Plain JSON
      if (typeof raw === "string" && raw.trim().startsWith("{")) {
        try {
          const j = JSON.parse(raw);
          handleJson(j);
          return;
        } catch {}
      }

      // ISO-8859-1 gzip string
      if (typeof raw === "string") {
        try {
          const txt = decompressData(raw);
          const j = JSON.parse(txt);
          handleJson(j);
          return;
        } catch {}
      }

      // ArrayBuffer
      if (raw instanceof ArrayBuffer) {
        try {
          const bytes = new Uint8Array(raw);
          let s = "";
          for (let i = 0; i < bytes.length; i++)
            s += String.fromCharCode(bytes[i]);
          const txt = decompressData(s);
          const j = JSON.parse(txt);
          handleJson(j);
          return;
        } catch {}
      }

      // Blob
      if (raw instanceof Blob) {
        const reader = new FileReader();
        reader.onload = () => {
          const text = String(reader.result ?? "");
          try {
            if (text.trim().startsWith("{")) {
              handleJson(JSON.parse(text));
            } else {
              const txt = decompressData(text);
              handleJson(JSON.parse(txt));
            }
          } catch {}
        };
        reader.readAsText(raw);
      }
    },
    [decompressData, handleJson]
  );

  /** 建立 WebSocket 连接 */
  const connect = useCallback(() => {
    if (mock) {
      setConnected(true);
      setError(null);
      const seed = {
        btc: { pair: "btc", baseSymbol: "BTC", priceUsd: 60000 },
        eth: { pair: "eth", baseSymbol: "ETH", priceUsd: 3500 },
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
        ws.send(
          JSON.stringify({
            topic: "trending",
            event: "sub",
            chainId: "56",
            compression: 0,
          })
        );
      };

      ws.onmessage = (ev) => handleRaw(ev.data);

      ws.onerror = () => setError("WebSocket error");
      ws.onclose = () => setConnected(false);
    } catch {
      setError("Failed to create WebSocket");
    }
  }, [mock, handleRaw]);

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
