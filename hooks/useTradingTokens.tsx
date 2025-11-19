"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import pako from "pako";
import type { TrendingToken } from "@/types/trendings";

const WS_URL = "wss://web-t.pinkpunk.io/ws";

/**
 * version: add reconnect/backoff + auto-reconnect
 */
export function useTrendingTokens(opts?: { mock?: boolean }) {
  const mock = opts?.mock ?? false;
  const wsRef = useRef<WebSocket | null>(null);

  const [map, setMap] = useState<Record<string, TrendingToken>>({});
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reconnectTimer = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);

  const scheduleReconnect = useCallback(() => {
    if (mock) return;

    if (reconnectTimer.current) clearTimeout(reconnectTimer.current);

    const base = 1500;
    const delay = Math.min(
      base * Math.pow(2, reconnectAttempts.current),
      30000
    );

    reconnectTimer.current = setTimeout(() => {
      reconnectAttempts.current++;
      connect();
    }, delay);
  }, [mock]);

  /** gzip 解压 */
  const decompressData = useCallback((s: string) => {
    const bytes = new Uint8Array(s.length);
    for (let i = 0; i < s.length; i++) bytes[i] = s.charCodeAt(i) & 0xff;
    const out = pako.inflate(bytes);
    return new TextDecoder("utf-8").decode(out);
  }, []);

  /** ping → pong */
  const sendPong = useCallback((ts: string | number) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    try {
      wsRef.current.send(
        JSON.stringify({
          topic: "pong",
          event: "sub",
          pong: String(ts),
          interval: "",
          pair: "",
          chainId: "",
          compression: 1,
        })
      );
    } catch {}
  }, []);

  /** 处理 JSON 数据 */
  const handleJson = useCallback(
    (json: any) => {
      if (!json) return;

      // 心跳 ping
      if (json.topic === "ping" || json.ping) {
        const ts = json.ping ?? json.t ?? Date.now();
        sendPong(ts);
        return;
      }

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

      // 增量更新
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
    },
    [sendPong]
  );

  /** 处理原始 WS 数据 */
  const handleRaw = useCallback(
    (raw: any) => {
      // plain JSON
      if (typeof raw === "string" && raw.trim().startsWith("{")) {
        try {
          handleJson(JSON.parse(raw));
          return;
        } catch {}
      }

      // gzip string
      if (typeof raw === "string") {
        try {
          const txt = decompressData(raw);
          handleJson(JSON.parse(txt));
          return;
        } catch {}
      }

      // ArrayBuffer
      if (raw instanceof ArrayBuffer) {
        try {
          const arr = new Uint8Array(raw);
          let s = "";
          for (let i = 0; i < arr.length; i++)
            s += String.fromCharCode(arr[i]);
          const txt = decompressData(s);
          handleJson(JSON.parse(txt));
          return;
        } catch {}
      }

      // Blob
      if (raw instanceof Blob) {
        const reader = new FileReader();
        reader.onload = () => {
          const txt = String(reader.result ?? "");
          try {
            if (txt.trim().startsWith("{")) {
              handleJson(JSON.parse(txt));
            } else {
              const unzipped = decompressData(txt);
              handleJson(JSON.parse(unzipped));
            }
          } catch {}
        };
        reader.readAsText(raw);
      }
    },
    [decompressData, handleJson]
  );

  /** 连接 */
  const connect = useCallback(() => {
    if (mock) {
      setConnected(true);
      setError(null);
      reconnectAttempts.current = 0;
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
        reconnectAttempts.current = 0;

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

      ws.onclose = () => {
        setConnected(false);
        scheduleReconnect();
      };
    } catch {
      setError("Failed to create WebSocket");
    }
  }, [mock, handleRaw, scheduleReconnect]);

  useEffect(() => {
    connect();
    return () => {
      try {
        wsRef.current?.close();
      } catch {}
    };
  }, [connect]);

  const tokens = Object.values(map);

  const reconnect = useCallback(() => {
    try {
      wsRef.current?.close();
    } catch {}
    connect();
  }, [connect]);

  return { tokens, connected, error, reconnect };
}
