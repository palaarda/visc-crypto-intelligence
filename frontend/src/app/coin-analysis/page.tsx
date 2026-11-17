"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Activity, ChevronDown, Brain, Target, Minus, Clock } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { TradingViewChart } from "@/components/charts/TradingViewChart";
import { useBinanceMarket } from "@/hooks/useMarketData";
import { useSignals } from "@/hooks/useSignals";
import { WATCHLIST, fetchKlines } from "@/lib/api/binance";
import { evaluateIndicators, SIGNAL_THRESHOLD, QUALITY_LABELS, HOLDING_LABELS, type IndicatorReading } from "@/lib/signal-engine";
import { formatPrice, formatPercent, formatNumber } from "@/lib/utils";
import { Card, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { color, marketColor, mono, insetSurface } from "@/lib/design";

const timeframes = [
  { label: "1m",  tv: "1"   },
  { label: "5m",  tv: "5"   },
  { label: "15m", tv: "15"  },
  { label: "1h",  tv: "60"  },
  { label: "4h",  tv: "240" },
  { label: "1d",  tv: "D"   },
  { label: "1w",  tv: "W"   },
];

const signalMeta = {
  BUY:     { label: "BUY",  variant: "success" as const },
  SELL:    { label: "SELL", variant: "danger" as const },
  NEUTRAL: { label: "NEUTRAL", variant: "outline" as const },
};

export default function CoinAnalysisPage() {
  const { tickers } = useBinanceMarket();
  const { signals } = useSignals();
  const [selectedSymbol, setSelectedSymbol] = useState("BTCUSDT");
  const [selectedTf, setSelectedTf] = useState(timeframes[3]); // 1h
  const [coinMenuOpen, setCoinMenuOpen] = useState(false);
  const [indicators, setIndicators] = useState<IndicatorReading[]>([]);
  const [indicatorsLoading, setIndicatorsLoading] = useState(true);

  const watchCoins = WATCHLIST.map((s) => tickers[s]).filter(Boolean);
  const selected = tickers[selectedSymbol];
  const engine = signals.find((s) => s.symbol === selectedSymbol);

  // Seçili coin + zaman dilimi için gerçek indikatör hesaplaması
  useEffect(() => {
    let alive = true;
    setIndicatorsLoading(true);
    fetchKlines(selectedSymbol, selectedTf.label, 250)
      .then((klines) => {
        if (!alive) return;
        setIndicators(evaluateIndicators(klines));
        setIndicatorsLoading(false);
      })
      .catch(() => {
        if (alive) setIndicatorsLoading(false);
      });
    const interval = setInterval(() => {
      fetchKlines(selectedSymbol, selectedTf.label, 250)
        .then((klines) => { if (alive) setIndicators(evaluateIndicators(klines)); })
        .catch(() => {});
    }, 60_000);
    return () => { alive = false; clearInterval(interval); };
  }, [selectedSymbol, selectedTf.label]);

  const buyCount     = indicators.filter((i) => i.signal === "BUY").length;
  const sellCount    = indicators.filter((i) => i.signal === "SELL").length;
  const neutralCount = indicators.filter((i) => i.signal === "NEUTRAL").length;

  const dirColor = engine?.direction === "LONG" ? color.success : engine?.direction === "SHORT" ? color.danger : color.warning;
  const DirIcon = engine?.direction === "LONG" ? TrendingUp : engine?.direction === "SHORT" ? TrendingDown : Minus;

  return (
    <DashboardLayout>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
        {/* Coin selector */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setCoinMenuOpen(!coinMenuOpen)}
            style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", borderRadius: "10px", backgroundColor: color.card, border: `1px solid ${color.border}`, cursor: "pointer" }}
          >
            <div style={{ width: "28px", height: "28px", borderRadius: "50%", backgroundColor: "rgba(0,229,168,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: "11px", fontWeight: 700, color: "#00E5A8" }}>{selectedSymbol.charAt(0)}</span>
            </div>
            <div style={{ textAlign: "left" }}>
              <p style={{ fontSize: "14px", fontWeight: 700, color: "#FFFFFF" }}>{selected ? `${selected.base}/USDT` : selectedSymbol}</p>
              <p style={{ fontSize: "11px", color: selected && selected.change24h >= 0 ? "#00E5A8" : "#FF4D6D" }}>
                {selected ? formatPercent(selected.change24h) : "—"}
              </p>
            </div>
            <ChevronDown size={14} color="#A7B1C2" />
          </button>

          {coinMenuOpen && (
            <>
              <div style={{ position: "fixed", inset: 0, zIndex: 40 }} onClick={() => setCoinMenuOpen(false)} />
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ position: "absolute", right: 0, top: "52px", width: "260px", borderRadius: "16px", backgroundColor: "#141B2D", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 16px 48px rgba(0,0,0,0.5)", zIndex: 50, overflow: "hidden" }}
              >
                <div style={{ padding: "8px", maxHeight: "320px", overflowY: "auto" }}>
                  {watchCoins.map((coin) => (
                    <button
                      key={coin.symbol}
                      onClick={() => { setSelectedSymbol(coin.symbol); setCoinMenuOpen(false); }}
                      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "10px 12px", borderRadius: "10px", backgroundColor: selectedSymbol === coin.symbol ? "rgba(0,229,168,0.08)" : "transparent", cursor: "pointer", border: "none", transition: "background 0.12s", textAlign: "left" }}
                      onMouseEnter={(e) => { if (selectedSymbol !== coin.symbol) e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.04)"; }}
                      onMouseLeave={(e) => { if (selectedSymbol !== coin.symbol) e.currentTarget.style.backgroundColor = "transparent"; }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{ width: "26px", height: "26px", borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <span style={{ fontSize: "9px", fontWeight: 700, color: "#FFFFFF" }}>{coin.base.charAt(0)}</span>
                        </div>
                        <div>
                          <p style={{ fontSize: "13px", fontWeight: 600, color: "#FFFFFF" }}>{coin.base}</p>
                          <p style={{ fontSize: "10px", color: "#A7B1C2" }}>{coin.name}</p>
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <p style={{ fontSize: "12px", fontWeight: 700, color: "#FFFFFF", fontFamily: "monospace" }}>${formatPrice(coin.price)}</p>
                        <p style={{ fontSize: "10px", color: coin.change24h >= 0 ? "#00E5A8" : "#FF4D6D" }}>{formatPercent(coin.change24h)}</p>
                      </div>
                    </button>
                  ))}
                  {watchCoins.length === 0 && (
                    <p style={{ padding: "16px", fontSize: "12px", color: "#A7B1C2", textAlign: "center" }}>Loading...</p>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </div>
      </div>

      {/* Price Info Bar — canlı */}
      <div style={{ display: "flex", alignItems: "center", gap: "24px", padding: "12px 16px", borderRadius: "12px", backgroundColor: "#141B2D", border: "1px solid rgba(255,255,255,0.09)", marginBottom: "16px", overflowX: "auto", flexWrap: "wrap" }}>
        <div>
          <p style={{ fontSize: "11px", color: "#A7B1C2" }}>Price</p>
          <p style={{ fontSize: "20px", fontWeight: 700, fontFamily: "monospace", color: "#FFFFFF" }}>
            {selected ? `$${formatPrice(selected.price)}` : "—"}
          </p>
        </div>
        <div>
          <p style={{ fontSize: "11px", color: "#A7B1C2" }}>24h Change</p>
          <p style={{ fontSize: "14px", fontWeight: 700, color: selected && selected.change24h >= 0 ? "#00E5A8" : "#FF4D6D" }}>
            {selected ? formatPercent(selected.change24h) : "—"}
          </p>
        </div>
        <div>
          <p style={{ fontSize: "11px", color: "#A7B1C2" }}>24h Volume</p>
          <p style={{ fontSize: "14px", fontWeight: 700, color: "#FFFFFF" }}>
            {selected ? `$${formatNumber(selected.volume24h)}` : "—"}
          </p>
        </div>
        <div>
          <p style={{ fontSize: "11px", color: "#A7B1C2" }}>24h High</p>
          <p style={{ fontSize: "14px", fontWeight: 700, color: "#00E5A8" }}>
            {selected ? `$${formatPrice(selected.high24h)}` : "—"}
          </p>
        </div>
        <div>
          <p style={{ fontSize: "11px", color: "#A7B1C2" }}>24h Low</p>
          <p style={{ fontSize: "14px", fontWeight: 700, color: "#FF4D6D" }}>
            {selected ? `$${formatPrice(selected.low24h)}` : "—"}
          </p>
        </div>
        {/* Timeframes */}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "4px", flexWrap: "wrap" }}>
          {timeframes.map((tf) => (
            <button
              key={tf.label}
              onClick={() => setSelectedTf(tf)}
              style={{
                padding: "5px 10px", borderRadius: "8px", fontSize: "12px", fontWeight: 600,
                cursor: "pointer", border: "none", transition: "all 0.15s",
                backgroundColor: selectedTf.label === tf.label ? "#00E5A8" : "rgba(255,255,255,0.06)",
                color: selectedTf.label === tf.label ? "#0B0F19" : "#A7B1C2",
              }}
              onMouseEnter={(e) => { if (selectedTf.label !== tf.label) { e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "#FFFFFF"; } }}
              onMouseLeave={(e) => { if (selectedTf.label !== tf.label) { e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "#A7B1C2"; } }}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: "16px", marginBottom: "16px" }}>
        {/* TradingView Chart */}
        <div style={{ backgroundColor: "#141B2D", border: "1px solid rgba(255,255,255,0.09)", borderRadius: "16px", overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
            <span style={{ fontSize: "13px", fontWeight: 600, color: "#FFFFFF" }}>
              {selected ? selected.base : selectedSymbol.replace("USDT", "")}/USDT — {selectedTf.label}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div className="pulse-live" style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#00E5A8" }} />
              <span style={{ fontSize: "11px", color: "#00E5A8" }}>TradingView Live</span>
            </div>
          </div>
          <TradingViewChart symbol={selectedSymbol} interval={selectedTf.tv} height={460} />
        </div>

        {/* Right Panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {/* Motor Analizi — gerçek */}
          <div style={{ backgroundColor: "#141B2D", border: `1px solid ${engine ? `${dirColor}33` : "rgba(255,255,255,0.09)"}`, borderRadius: "16px", padding: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
              <p style={{ fontSize: "11px", fontWeight: 600, color: "#A7B1C2", textTransform: "uppercase", letterSpacing: "0.08em" }}>Engine Analysis — 4h/1h</p>
              <Target size={14} color={engine ? dirColor : "#A7B1C2"} />
            </div>
            {!engine ? (
              <p style={{ fontSize: "12px", color: "#5C6884" }}>Loading engine scan...</p>
            ) : (
              <>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 700, backgroundColor: `${dirColor}1F`, color: dirColor, border: `1px solid ${dirColor}40` }}>
                    <DirIcon size={11} /> {engine.direction === "NEUTRAL" ? "NEUTRAL" : engine.direction}
                  </span>
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "#FFFFFF" }}>
                    {engine.regime === "TREND" ? "Trend" : "Range"} · ADX {engine.adx.toFixed(0)}
                  </span>
                </div>
                <div style={{ marginBottom: "10px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span style={{ fontSize: "11px", color: "#A7B1C2" }}>Confluence Score</span>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: engine.score >= SIGNAL_THRESHOLD ? "#00E5A8" : "#F7B500" }}>
                      {engine.score}/100 · {QUALITY_LABELS[engine.quality]}
                    </span>
                  </div>
                  <div style={{ height: "6px", backgroundColor: "rgba(255,255,255,0.07)", borderRadius: "3px", overflow: "hidden" }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${engine.score}%` }} transition={{ delay: 0.3, duration: 1 }}
                      style={{ height: "100%", borderRadius: "3px", background: engine.score >= SIGNAL_THRESHOLD ? "linear-gradient(90deg, #00E5A8, #00B8D4)" : "linear-gradient(90deg, #F7B500, #fb923c)" }} />
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px", fontSize: "10px", color: "#A7B1C2" }}>
                  <Clock size={11} color="#60a5fa" />
                  <span>Expected hold: <strong style={{ color: "#FFFFFF" }}>{HOLDING_LABELS[engine.holdingType]}</strong> — {engine.estimatedDuration}</span>
                </div>
                {engine.isSignal && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", marginBottom: "10px", fontSize: "11px", fontFamily: "monospace" }}>
                    <div style={{ padding: "6px 8px", borderRadius: "8px", backgroundColor: "rgba(255,77,109,0.08)" }}>
                      <span style={{ color: "#A7B1C2", fontSize: "9px", display: "block" }}>Stop Loss</span>
                      <span style={{ color: "#FF4D6D", fontWeight: 700 }}>${formatPrice(engine.stopLoss)}</span>
                    </div>
                    <div style={{ padding: "6px 8px", borderRadius: "8px", backgroundColor: "rgba(0,229,168,0.08)" }}>
                      <span style={{ color: "#A7B1C2", fontSize: "9px", display: "block" }}>TP1</span>
                      <span style={{ color: "#00E5A8", fontWeight: 700 }}>${formatPrice(engine.takeProfit[0])}</span>
                    </div>
                  </div>
                )}
                <p style={{ fontSize: "12px", color: "#A7B1C2", lineHeight: 1.6 }}>{engine.rationale}</p>
              </>
            )}
          </div>

          {/* Signal summary — seçili TF göstergelerinden */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
            {[
              { count: buyCount,     label: "BUY",  bg: "rgba(0,229,168,0.1)",  border: "rgba(0,229,168,0.22)",  color: "#00E5A8" },
              { count: neutralCount, label: "NEUTRAL", bg: "rgba(247,181,0,0.1)",  border: "rgba(247,181,0,0.22)",  color: "#F7B500" },
              { count: sellCount,    label: "SELL", bg: "rgba(255,77,109,0.1)", border: "rgba(255,77,109,0.22)", color: "#FF4D6D" },
            ].map((item) => (
              <div key={item.label} style={{ borderRadius: "10px", padding: "10px 6px", textAlign: "center", backgroundColor: item.bg, border: `1px solid ${item.border}` }}>
                <p style={{ fontSize: "22px", fontWeight: 700, color: item.color, fontFamily: "monospace" }}>{indicatorsLoading ? "—" : item.count}</p>
                <p style={{ fontSize: "10px", fontWeight: 700, color: item.color, marginTop: "2px" }}>{item.label}</p>
              </div>
            ))}
          </div>

          {/* AI Score — Faz 4'te OpenRouter'a bağlanacak */}
          <div style={{ backgroundColor: "rgba(167,139,250,0.06)", border: "1px solid rgba(167,139,250,0.2)", borderRadius: "16px", padding: "16px", textAlign: "center" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
              <p style={{ fontSize: "11px", fontWeight: 600, color: "#A7B1C2", textTransform: "uppercase", letterSpacing: "0.08em" }}>AI Commentary</p>
              <Brain size={14} color="#a78bfa" />
            </div>
            <p style={{ fontSize: "36px", fontWeight: 700, color: "#a78bfa", fontFamily: "monospace" }}>—</p>
            <p style={{ fontSize: "11px", color: "#A7B1C2", marginTop: "6px" }}>AI Analysis Module</p>
            <span style={{ display: "inline-block", marginTop: "8px", padding: "3px 10px", borderRadius: "20px", fontSize: "10px", fontWeight: 600, backgroundColor: "rgba(167,139,250,0.12)", color: "#a78bfa", border: "1px solid rgba(167,139,250,0.25)" }}>
              Phase 4 — Coming Soon
            </span>
          </div>
        </div>
      </div>

      {/* Technical Indicators — gerçek hesaplama, seçili TF */}
      <div style={{ backgroundColor: "#141B2D", border: "1px solid rgba(255,255,255,0.09)", borderRadius: "16px", padding: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
          <p style={{ fontSize: "11px", fontWeight: 600, color: "#A7B1C2", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Technical Indicators — {selectedTf.label} <span style={{ color: "#5C6884", textTransform: "none", letterSpacing: 0 }}>(real-time calculation)</span>
          </p>
          <Activity size={14} color="#A7B1C2" />
        </div>
        {indicatorsLoading && indicators.length === 0 ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "8px" }} className="indicators-grid">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} style={{ height: "76px", borderRadius: "10px", backgroundColor: "rgba(255,255,255,0.04)" }} />
            ))}
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "8px" }} className="indicators-grid">
            {indicators.map((ind, i) => {
              const meta = signalMeta[ind.signal];
              return (
                <motion.div
                  key={ind.name}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.03 }}
                  style={{ ...insetSurface, padding: "12px" }}
                >
                  <p style={{ fontSize: "10px", color: color.muted, fontWeight: 500, marginBottom: "5px" }}>{ind.name}</p>
                  <p style={{ fontSize: "13px", fontWeight: 500, color: color.text, ...mono }}>{ind.value}</p>
                  <div style={{ marginTop: "6px" }}><Badge variant={meta.variant}>{meta.label}</Badge></div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 1280px) {
          .indicators-grid { grid-template-columns: repeat(4, 1fr) !important; }
        }
        @media (max-width: 768px) {
          .indicators-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </DashboardLayout>
  );
}
