"use client";
import { useEffect, useRef } from "react";

interface TradingViewChartProps {
  /** Binance sembolü, örn: BTCUSDT */
  symbol: string;
  /** TradingView interval: 1, 5, 15, 60, 240, D, W */
  interval?: string;
  height?: number;
}

/**
 * TradingView Advanced Chart (ücretsiz embed widget).
 * Gerçek zamanlı TradingView grafiği — indikatörler, çizim araçları dahil.
 */
export function TradingViewChart({ symbol, interval = "60", height = 460 }: TradingViewChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = "";

    const widgetDiv = document.createElement("div");
    widgetDiv.className = "tradingview-widget-container__widget";
    widgetDiv.style.height = "100%";
    widgetDiv.style.width = "100%";
    container.appendChild(widgetDiv);

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: `BINANCE:${symbol}`,
      interval,
      timezone: "Europe/Istanbul",
      theme: "dark",
      style: "1",
      locale: "tr",
      backgroundColor: "#141B2D",
      gridColor: "rgba(255,255,255,0.04)",
      hide_top_toolbar: false,
      hide_legend: false,
      allow_symbol_change: false,
      save_image: false,
      calendar: false,
      hide_volume: false,
      support_host: "https://www.tradingview.com",
    });
    container.appendChild(script);

    return () => {
      container.innerHTML = "";
    };
  }, [symbol, interval]);

  return (
    <div
      ref={containerRef}
      className="tradingview-widget-container"
      style={{ height, width: "100%" }}
    />
  );
}
