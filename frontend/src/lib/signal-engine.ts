/**
 * VISC Signal Engine v2.0 — Confluence scoring system.
 */
import type { Kline, MarketExtras } from "@/lib/api/binance";
import { coinName } from "@/lib/api/binance";
import { ema, rsi, macd, atr, bollinger, stochRsi, obv, adx, vwap, sma, last, prev } from "@/lib/indicators";

export const ENGINE_VERSION = "2.0.0";
/** Varsayılan yayın eşiği — /api/signal-config üzerinden değiştirilebilir */
export const SIGNAL_THRESHOLD = 80;
export const ADX_TREND_MIN = 20;

export type Direction = "LONG" | "SHORT" | "NEUTRAL";
export type Regime = "TREND" | "RANGE";
export type Risk = "LOW" | "MEDIUM" | "HIGH";
export type Quality = "REJECT" | "NORMAL" | "HIGH" | "PREMIUM";
export type HoldingType = "SCALP" | "INTRADAY" | "SWING" | "POSITION";

export interface ScoreComponent {
  module: string;
  name: string;
  points: number;
  earned: boolean;
  detail: string;
}

export interface EngineSignal {
  symbol: string;
  base: string;
  name: string;
  direction: Direction;
  score: number;
  longScore: number;
  shortScore: number;
  quality: Quality;
  regime: Regime;
  adx: number;
  isSignal: boolean;          // yayın eşiği + rejim koşulu
  price: number;
  entry: number;
  stopLoss: number;
  takeProfit: number[];
  risk: Risk;
  atrPct: number;
  riskReward: string;
  holdingType: HoldingType;
  estimatedDuration: string;  // "1-3 gün" gibi
  validForHours: number;      // entry tetiklenmezse sinyalin geçerlilik süresi
  aiScore: number | null;     // Faz 4'te OpenRouter'dan gelecek
  components: ScoreComponent[];
  indicatorValues: Record<string, string>;
  rationale: string;
  timeframe: string;
  quoteVolume24h: number;     // 1h mumlardan hesaplanan yaklaşık USDT hacmi
  generatedAt: string;
}

export interface IndicatorReading {
  name: string;
  value: string;
  signal: "BUY" | "SELL" | "NEUTRAL";
}

export function qualityOf(score: number): Quality {
  if (score >= 90) return "PREMIUM";
  if (score >= 80) return "HIGH";
  if (score >= 70) return "NORMAL";
  return "REJECT";
}

export const QUALITY_LABELS: Record<Quality, string> = {
  REJECT: "Insufficient",
  NORMAL: "Normal",
  HIGH: "High Quality",
  PREMIUM: "Premium",
};

export const HOLDING_LABELS: Record<HoldingType, string> = {
  SCALP: "Scalp",
  INTRADAY: "Intraday",
  SWING: "Swing",
  POSITION: "Position",
};

/** Sinyal tipine göre entry tetiklenme süresi (saat) — süre dolarsa EXPIRED */
export const EXPIRATION_HOURS: Record<HoldingType, number> = {
  SCALP: 0.5,
  INTRADAY: 12,
  SWING: 72,
  POSITION: 168,
};

/** Strateji modülleri — toplam 100 puan. Stratejiler sayfası bu konfigürasyondan beslenir */
export const ENGINE_MODULES = [
  {
    id: "trend", name: "Trend Analysis", type: "Trend Following", icon: "TrendingUp", weight: 25,
    description: "4h EMA 50/200 alignment, price position, and 1h EMA alignment. Blocks counter-trend signal generation.",
    params: "EMA 20/50/200 @ 4h+1h",
  },
  {
    id: "momentum", name: "Momentum Analysis", type: "Momentum", icon: "Zap", weight: 15,
    description: "1h RSI zone, MACD histogram direction, and Stochastic RSI crossover for entry timing.",
    params: "RSI 14, MACD 12/26/9, StochRSI @ 1h",
  },
  {
    id: "volume", name: "Volume Analysis", type: "Volume", icon: "BarChart", weight: 15,
    description: "Is volume above the 20-period average and OBV aligned with price? Filters false breakouts.",
    params: "Vol SMA 20, OBV @ 1h",
  },
  {
    id: "volatility", name: "Volatility Analysis", type: "Volatility", icon: "Activity", weight: 10,
    description: "Is ATR-based volatility in a healthy band? No points in dead or excessively choppy markets.",
    params: "ATR 14 @ 1h, band: 0.4–3.0%",
  },
  {
    id: "structure", name: "Market Structure", type: "Market Structure", icon: "Layers", weight: 10,
    description: "4h pivot analysis: rising lows/highs (HH-HL) or falling highs/lows (LH-LL) aligned with direction?",
    params: "Fractal pivot 2/2 @ 4h",
  },
  {
    id: "liquidity", name: "Liquidity Analysis", type: "Liquidity", icon: "Droplets", weight: 10,
    description: "Is order book depth balanced with direction and spread tight? Penalizes thin markets.",
    params: "Depth 100 levels, spread < 0.06%",
  },
  {
    id: "funding", name: "Funding Analysis", type: "Derivatives", icon: "Percent", weight: 5,
    description: "Is funding overheated? Negative/neutral funding favors longs (squeeze potential).",
    params: "USDT-M funding rate",
  },
  {
    id: "oi", name: "Open Interest", type: "Derivatives", icon: "Database", weight: 5,
    description: "Is OI rising with price direction? Confirms new money supports the setup.",
    params: "OI 24h change @ 1h",
  },
  {
    id: "ai", name: "AI Confirmation", type: "AI/ML", icon: "Brain", weight: 5,
    description: "OpenRouter AI evaluates the setup contextually. Confirm/veto only — never a standalone signal source.",
    params: "Activates in Phase 4",
  },
  {
    id: "regime", name: "Regime Filter", type: "Volatility", icon: "Waves", weight: 0,
    description: "ADX trend vs range split. In ranging markets (ADX < 20) all trend signals are suppressed — gate only.",
    params: "ADX 14 @ 4h",
  },
  {
    id: "risk", name: "Risk Engine", type: "Volatility", icon: "ShieldCheck", weight: 0,
    description: "ATR-based stop-loss, 1R/2R/3R scaled take-profits, minimum 1:2 risk/reward. Levels locked after snapshot.",
    params: "ATR 14 @ 1h, SL = 1.5×ATR",
  },
] as const;

interface DirectionScore {
  score: number;
  components: ScoreComponent[];
}

function findPivots(candles: Kline[], window = 2): { highs: number[]; lows: number[] } {
  const highs: number[] = [];
  const lows: number[] = [];
  for (let i = window; i < candles.length - window; i++) {
    const isHigh = candles.slice(i - window, i + window + 1).every((c) => c.high <= candles[i].high);
    const isLow = candles.slice(i - window, i + window + 1).every((c) => c.low >= candles[i].low);
    if (isHigh) highs.push(candles[i].high);
    if (isLow) lows.push(candles[i].low);
  }
  return { highs, lows };
}

function scoreDirection(dir: "LONG" | "SHORT", k4h: Kline[], k1h: Kline[], extras: MarketExtras): DirectionScore {
  const sign = dir === "LONG" ? 1 : -1;
  const closes4h = k4h.map((c) => c.close);
  const closes1h = k1h.map((c) => c.close);
  const price = last(closes1h);

  const ema50_4h = last(ema(closes4h, 50));
  const ema200_4h = last(ema(closes4h, 200));
  const ema20_1h = last(ema(closes1h, 20));
  const ema50_1h = last(ema(closes1h, 50));
  const rsi1h = last(rsi(closes1h, 14));
  const macd1h = macd(closes1h);
  const hist = last(macd1h.histogram);
  const histPrev = prev(macd1h.histogram);
  const stoch = stochRsi(closes1h);
  const stochK = last(stoch.k);
  const stochD = last(stoch.d);
  const volSma = last(sma(k1h.map((c) => c.volume), 20));
  const lastVol = k1h[k1h.length - 1].volume;
  const obvArr = obv(k1h);
  const obvEma = ema(obvArr, 10);
  const obvRising = last(obvEma) > prev(obvEma, 3);
  const atrVal = last(atr(k1h, 14));
  const atrPct = (atrVal / price) * 100;
  const pivots = findPivots(k4h.slice(-60));
  const price24hAgo = closes1h[closes1h.length - 25] ?? closes1h[0];
  const priceChange24h = ((price - price24hAgo) / price24hAgo) * 100;

  const c: ScoreComponent[] = [];
  const add = (module: string, name: string, points: number, earned: boolean, detail: string) =>
    c.push({ module, name, points, earned, detail });

  // ── Trend (25) — 4h + 1h hizalanma
  add("trend", "Price vs EMA200 (4h)", 10, sign * (price - ema200_4h) > 0,
    `Price ${price > ema200_4h ? "above" : "below"} EMA200`);
  add("trend", "EMA50/200 alignment (4h)", 10, sign * (ema50_4h - ema200_4h) > 0,
    `EMA50 ${ema50_4h > ema200_4h ? ">" : "<"} EMA200`);
  add("trend", "EMA20/50 alignment (1h)", 5, sign * (ema20_1h - ema50_1h) > 0,
    `1h short-term slope ${ema20_1h > ema50_1h ? "up" : "down"}`);

  // ── Momentum (15) — 1h
  const rsiOk = dir === "LONG" ? rsi1h > 50 && rsi1h < 72 : rsi1h < 50 && rsi1h > 28;
  add("momentum", "RSI zone", 6, rsiOk, `RSI(14) = ${rsi1h.toFixed(1)}`);
  add("momentum", "MACD histogram", 6, sign * hist > 0 && sign * (hist - histPrev) > 0,
    `Histogram ${hist > 0 ? "positive" : "negative"}, ${sign * (hist - histPrev) > 0 ? "strengthening" : "weakening"}`);
  add("momentum", "StochRSI cross", 3, sign * (stochK - stochD) > 0,
    `K=${isNaN(stochK) ? "—" : stochK.toFixed(0)}, D=${isNaN(stochD) ? "—" : stochD.toFixed(0)}`);

  // ── Volume (15) — 1h
  add("volume", "Volume > average", 9, lastVol > volSma, `Last volume ${lastVol > volSma ? "above" : "below"} SMA20`);
  add("volume", "OBV direction", 6, dir === "LONG" ? obvRising : !obvRising, `OBV ${obvRising ? "rising" : "falling"}`);

  // ── Volatility (10) — healthy band
  const volOk = atrPct >= 0.4 && atrPct <= 3.0;
  add("volatility", "ATR healthy band", 10, volOk,
    `ATR ${atrPct.toFixed(2)}% ${volOk ? "(healthy)" : atrPct < 0.4 ? "(dead market)" : "(excessive chop)"}`);

  // ── Market structure (10) — 4h pivots
  let structureOk = false;
  let structureDetail = "Insufficient pivot data";
  if (pivots.highs.length >= 2 && pivots.lows.length >= 2) {
    const [hPrev, hLast] = pivots.highs.slice(-2);
    const [lPrev, lLast] = pivots.lows.slice(-2);
    if (dir === "LONG") {
      structureOk = hLast > hPrev && lLast > lPrev;
      structureDetail = structureOk ? "Higher highs and higher lows (HH-HL)" : "Structure does not support upside";
    } else {
      structureOk = hLast < hPrev && lLast < lPrev;
      structureDetail = structureOk ? "Lower highs and lower lows (LH-LL)" : "Structure does not support downside";
    }
  }
  add("structure", "Pivot structure (4h)", 10, structureOk, structureDetail);

  // ── Liquidity (10) — order book
  if (extras.depthRatio !== null && extras.spreadPct !== null) {
    const depthOk = dir === "LONG" ? extras.depthRatio >= 1.1 : extras.depthRatio <= 0.9;
    add("liquidity", "Depth balance", 6, depthOk,
      `Bid/Ask ratio ${extras.depthRatio.toFixed(2)} ${depthOk ? "(aligned with direction)" : "(neutral/counter)"}`);
    add("liquidity", "Tight spread", 4, extras.spreadPct <= 0.06,
      `Spread ${extras.spreadPct.toFixed(3)}%`);
  } else {
    add("liquidity", "Depth balance", 6, false, "Order book data unavailable");
    add("liquidity", "Tight spread", 4, false, "Order book data unavailable");
  }

  // ── Funding (5) — overheating check
  if (extras.fundingRate !== null) {
    const f = extras.fundingRate;
    const fundingOk = dir === "LONG" ? f <= 0.0003 : f >= -0.0003;
    add("funding", "Funding favorable", 5, fundingOk,
      `Funding ${(f * 100).toFixed(4)}% ${fundingOk ? (dir === "LONG" && f < 0 ? "(negative — squeeze potential)" : "(not overheated)") : "(overheated)"}`);
  } else {
    add("funding", "Funding favorable", 5, false, "Funding data unavailable");
  }

  // ── Open Interest (5) — participation confirm
  if (extras.oiChange24hPct !== null) {
    const oiOk = extras.oiChange24hPct > 0.5 && (dir === "LONG" ? priceChange24h > 0 : priceChange24h < 0);
    add("oi", "OI participation", 5, oiOk,
      `OI 24h ${extras.oiChange24hPct >= 0 ? "+" : ""}${extras.oiChange24hPct.toFixed(1)}%, price ${priceChange24h >= 0 ? "+" : ""}${priceChange24h.toFixed(1)}%`);
  } else {
    add("oi", "OI participation", 5, false, "OI data unavailable");
  }

  // ── AI (5) — OpenRouter in Phase 4
  add("ai", "AI confirmation", 5, false, "AI confirmation module activates in Phase 4");

  return { score: c.reduce((acc, x) => acc + (x.earned ? x.points : 0), 0), components: c };
}

function estimateHolding(adxVal: number, atrPct: number): { type: HoldingType; duration: string; estHours: number } {
  // Hedef TP2 = 3×ATR uzaklıkta. Net ilerleme hızı trend gücü ve volatiliteyle artar (heuristik).
  const speed = (0.12 + (Math.min(adxVal, 60) / 100) * 0.35) * (0.7 + Math.min(atrPct, 4) / 4);
  const estHours = Math.min(240, Math.max(2, 3 / Math.max(speed, 0.05)));

  const lowH = Math.max(1, Math.round(estHours * 0.6));
  const highH = Math.round(estHours * 1.6);

  let type: HoldingType;
  if (estHours <= 0.5) type = "SCALP";
  else if (estHours <= 8) type = "INTRADAY";
  else if (estHours <= 120) type = "SWING";
  else type = "POSITION";

  let duration: string;
  if (highH < 24) {
    duration = `${lowH}-${highH} hours`;
  } else {
    const lowD = Math.max(1, Math.floor(lowH / 24));
    const highD = Math.max(lowD, Math.ceil(highH / 24));
    duration = lowD === highD ? `~${lowD} days` : `${lowD}-${highD} days`;
  }

  return { type, duration, estHours };
}

function buildRationale(sig: EngineSignal): string {
  if (sig.regime === "RANGE") {
    return `${sig.base} is in a ranging market (ADX ${sig.adx.toFixed(0)}). Trend signals are suppressed — best to wait until a clear direction forms.`;
  }
  const byModule = (m: string) => sig.components.filter((x) => x.module === m && x.earned);
  const parts: string[] = [];
  const isLong = sig.direction === "LONG";

  if (byModule("trend").length >= 2) parts.push(isLong ? "4h trend is bullish (positive EMA stack)" : "4h trend is bearish (negative EMA stack)");
  if (byModule("momentum").length >= 2) parts.push(isLong ? "momentum indicators support buying" : "momentum favors sellers");
  if (byModule("volume").length >= 1) parts.push("volume confirmation present");
  if (byModule("structure").length >= 1) parts.push(isLong ? "market structure is building higher lows" : "market structure is building lower highs");
  if (byModule("liquidity").length >= 2) parts.push("order book depth aligns with direction");

  const fundingComp = sig.components.find((x) => x.module === "funding" && x.earned);
  if (fundingComp && fundingComp.detail.includes("squeeze")) parts.push("negative funding increases short squeeze probability");

  const oiComp = sig.components.find((x) => x.module === "oi" && x.earned);
  if (oiComp) parts.push("rising open interest confirms new money entering");

  if (parts.length === 0) {
    return `Criteria do not form sufficient confluence for ${sig.base} (score ${sig.score}/100).`;
  }

  const body = parts.join(", ") + ".";
  const capitalized = body.charAt(0).toUpperCase() + body.slice(1);
  const tail = sig.isSignal
    ? ` Score ${sig.score}/100 (${QUALITY_LABELS[sig.quality]}). Expected hold: ${HOLDING_LABELS[sig.holdingType]} — ${sig.estimatedDuration}. ATR-based stop and scaled TP levels are locked in the snapshot.`
    : ` However, score ${sig.score}/100 is below the publish threshold — not a trade signal, watchlist only.`;
  return capitalized + tail;
}

/** Bir sembolü 4h + 1h verisi ve türev/likidite ekleriyle analiz eder */
export function analyzeSymbol(
  symbol: string,
  k4h: Kline[],
  k1h: Kline[],
  extras: MarketExtras,
  publishThreshold: number = SIGNAL_THRESHOLD
): EngineSignal {
  const base = symbol.replace(/USDT$/, "");
  const price = k1h[k1h.length - 1].close;

  const longR = scoreDirection("LONG", k4h, k1h, extras);
  const shortR = scoreDirection("SHORT", k4h, k1h, extras);

  const adxVal = last(adx(k4h, 14));
  const regime: Regime = !isNaN(adxVal) && adxVal >= ADX_TREND_MIN ? "TREND" : "RANGE";

  const isLong = longR.score >= shortR.score;
  const winner = isLong ? longR : shortR;
  const isSignal = winner.score >= publishThreshold && regime === "TREND";
  const direction: Direction = isSignal
    ? (isLong ? "LONG" : "SHORT")
    : winner.score >= 50
      ? (isLong ? "LONG" : "SHORT")
      : "NEUTRAL";

  const atrVal = last(atr(k1h, 14));
  const atrPct = (atrVal / price) * 100;
  const risk: Risk = atrPct < 1.2 ? "LOW" : atrPct < 2.5 ? "MEDIUM" : "HIGH";

  const sign = isLong ? 1 : -1;
  const r = 1.5 * atrVal;
  const entry = price;
  const stopLoss = entry - sign * r;
  const takeProfit = [entry + sign * r, entry + sign * 2 * r, entry + sign * 3 * r];

  const holding = estimateHolding(isNaN(adxVal) ? 20 : adxVal, atrPct);
  const quoteVolume24h = k1h.slice(-24).reduce((acc, c) => acc + c.volume * c.close, 0);

  // Snapshot'a kilitlenen indikatör değerleri
  const closes1h = k1h.map((c) => c.close);
  const closes4h = k4h.map((c) => c.close);
  const indicatorValues: Record<string, string> = {
    "RSI (1h)": last(rsi(closes1h, 14)).toFixed(1),
    "MACD Hist (1h)": last(macd(closes1h).histogram).toFixed(4),
    "EMA50 (4h)": last(ema(closes4h, 50)).toFixed(2),
    "EMA200 (4h)": last(ema(closes4h, 200)).toFixed(2),
    "ATR (1h)": atrVal.toFixed(4),
    "ADX (4h)": isNaN(adxVal) ? "—" : adxVal.toFixed(1),
    "VWAP (1h)": vwap(k1h, 24).toFixed(2),
    "BB Mid (1h)": last(bollinger(closes1h).middle).toFixed(2),
    "Funding": extras.fundingRate !== null ? `${(extras.fundingRate * 100).toFixed(4)}%` : "—",
    "OI Δ24h": extras.oiChange24hPct !== null ? `${extras.oiChange24hPct.toFixed(1)}%` : "—",
    "Depth B/A": extras.depthRatio !== null ? extras.depthRatio.toFixed(2) : "—",
  };

  const sig: EngineSignal = {
    symbol, base, name: coinName(base),
    direction,
    score: winner.score,
    longScore: longR.score,
    shortScore: shortR.score,
    quality: qualityOf(winner.score),
    regime,
    adx: isNaN(adxVal) ? 0 : adxVal,
    isSignal,
    price, entry, stopLoss, takeProfit,
    risk, atrPct,
    riskReward: "1:2",
    holdingType: holding.type,
    estimatedDuration: holding.duration,
    validForHours: EXPIRATION_HOURS[holding.type],
    aiScore: null,
    components: winner.components,
    indicatorValues,
    rationale: "",
    timeframe: "4h/1h",
    quoteVolume24h,
    generatedAt: new Date().toISOString(),
  };
  sig.rationale = buildRationale(sig);
  return sig;
}

/** Coin analiz sayfasındaki gösterge paneli — seçili zaman diliminin verisiyle */
export function evaluateIndicators(candles: Kline[]): IndicatorReading[] {
  const closes = candles.map((c) => c.close);
  const price = last(closes);
  const fmt = (v: number) => (isNaN(v) ? "—" : price < 1 ? v.toFixed(6) : v >= 1000 ? v.toLocaleString("en-US", { maximumFractionDigits: 0 }) : v.toFixed(2));

  const rsiV = last(rsi(closes, 14));
  const macdR = macd(closes);
  const hist = last(macdR.histogram);
  const e20 = last(ema(closes, 20));
  const e50 = last(ema(closes, 50));
  const e200 = last(ema(closes, 200));
  const vwapV = vwap(candles, 24);
  const atrV = last(atr(candles, 14));
  const bb = bollinger(closes);
  const bbU = last(bb.upper);
  const bbL = last(bb.lower);
  const bbM = last(bb.middle);
  const stoch = stochRsi(closes);
  const stochK = last(stoch.k);
  const stochD = last(stoch.d);
  const volSmaV = last(sma(candles.map((c) => c.volume), 20));
  const lastVol = candles[candles.length - 1].volume;
  const obvArr = obv(candles);
  const obvEmaArr = ema(obvArr, 10);
  const obvRising = last(obvEmaArr) > prev(obvEmaArr, 3);
  const adxV = last(adx(candles, 14));

  const emaSig = (e: number): "BUY" | "SELL" | "NEUTRAL" =>
    isNaN(e) ? "NEUTRAL" : price > e ? "BUY" : "SELL";

  const bbPos = isNaN(bbM) ? "—" : price > bbU ? "Above Upper Band" : price < bbL ? "Below Lower Band" : price > bbM ? "Upper Half" : "Lower Half";

  return [
    {
      name: "RSI (14)", value: isNaN(rsiV) ? "—" : rsiV.toFixed(1),
      signal: isNaN(rsiV) ? "NEUTRAL" : rsiV > 70 ? "SELL" : rsiV < 30 ? "BUY" : rsiV > 55 ? "BUY" : rsiV < 45 ? "SELL" : "NEUTRAL",
    },
    {
      name: "MACD", value: isNaN(hist) ? "—" : hist > 0 ? "Bullish" : "Bearish",
      signal: isNaN(hist) ? "NEUTRAL" : hist > 0 ? "BUY" : "SELL",
    },
    { name: "EMA 20",  value: fmt(e20),  signal: emaSig(e20)  },
    { name: "EMA 50",  value: fmt(e50),  signal: emaSig(e50)  },
    { name: "EMA 200", value: fmt(e200), signal: emaSig(e200) },
    {
      name: "VWAP", value: fmt(vwapV),
      signal: isNaN(vwapV) ? "NEUTRAL" : price > vwapV * 1.001 ? "BUY" : price < vwapV * 0.999 ? "SELL" : "NEUTRAL",
    },
    { name: "ATR (14)", value: fmt(atrV), signal: "NEUTRAL" },
    {
      name: "Bollinger", value: bbPos,
      signal: isNaN(bbM) ? "NEUTRAL" : price > bbU ? "SELL" : price < bbL ? "BUY" : "NEUTRAL",
    },
    {
      name: "Stoch RSI", value: isNaN(stochK) ? "—" : stochK.toFixed(1),
      signal: isNaN(stochK) || isNaN(stochD) ? "NEUTRAL" : stochK > 80 ? "SELL" : stochK < 20 ? "BUY" : stochK > stochD ? "BUY" : "SELL",
    },
    {
      name: "Volume", value: isNaN(volSmaV) ? "—" : lastVol > volSmaV * 1.2 ? "High" : lastVol < volSmaV * 0.8 ? "Low" : "Normal",
      signal: isNaN(volSmaV) ? "NEUTRAL" : lastVol > volSmaV ? "BUY" : "NEUTRAL",
    },
    {
      name: "OBV", value: obvRising ? "Rising" : "Falling",
      signal: obvRising ? "BUY" : "SELL",
    },
    {
      name: "ADX (14)", value: isNaN(adxV) ? "—" : adxV.toFixed(1),
      signal: isNaN(adxV) ? "NEUTRAL" : adxV >= 25 ? "BUY" : "NEUTRAL",
    },
  ];
}
