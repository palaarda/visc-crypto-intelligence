/**
 * Teknik indikatör hesaplamaları — saf fonksiyonlar, deterministik.
 * Sinyal motoru ve coin analiz paneli bu modülü kullanır.
 */
import type { Kline } from "@/lib/api/binance";

export function sma(values: number[], period: number): number[] {
  const out: number[] = new Array(values.length).fill(NaN);
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i];
    if (i >= period) sum -= values[i - period];
    if (i >= period - 1) out[i] = sum / period;
  }
  return out;
}

export function ema(values: number[], period: number): number[] {
  const out: number[] = new Array(values.length).fill(NaN);
  if (values.length < period) return out;
  const k = 2 / (period + 1);
  let prev = values.slice(0, period).reduce((a, b) => a + b, 0) / period;
  out[period - 1] = prev;
  for (let i = period; i < values.length; i++) {
    prev = values[i] * k + prev * (1 - k);
    out[i] = prev;
  }
  return out;
}

/** RSI — Wilder smoothing */
export function rsi(closes: number[], period = 14): number[] {
  const out: number[] = new Array(closes.length).fill(NaN);
  if (closes.length <= period) return out;

  let avgGain = 0;
  let avgLoss = 0;
  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) avgGain += diff;
    else avgLoss -= diff;
  }
  avgGain /= period;
  avgLoss /= period;
  out[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);

  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    out[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  }
  return out;
}

export interface MacdResult {
  line: number[];
  signal: number[];
  histogram: number[];
}

export function macd(closes: number[], fast = 12, slow = 26, signalPeriod = 9): MacdResult {
  const emaFast = ema(closes, fast);
  const emaSlow = ema(closes, slow);
  const line = closes.map((_, i) =>
    isNaN(emaFast[i]) || isNaN(emaSlow[i]) ? NaN : emaFast[i] - emaSlow[i]
  );

  // Sinyal çizgisi: MACD çizgisinin EMA'sı (NaN'ler atlanarak)
  const validStart = line.findIndex((v) => !isNaN(v));
  const validLine = line.slice(validStart);
  const signalValid = ema(validLine, signalPeriod);
  const signal = new Array(validStart).fill(NaN).concat(signalValid);
  const histogram = line.map((v, i) =>
    isNaN(v) || isNaN(signal[i]) ? NaN : v - signal[i]
  );
  return { line, signal, histogram };
}

/** ATR — Wilder smoothing */
export function atr(candles: Kline[], period = 14): number[] {
  const out: number[] = new Array(candles.length).fill(NaN);
  if (candles.length <= period) return out;

  const trs: number[] = [NaN];
  for (let i = 1; i < candles.length; i++) {
    const c = candles[i];
    const prevClose = candles[i - 1].close;
    trs.push(Math.max(c.high - c.low, Math.abs(c.high - prevClose), Math.abs(c.low - prevClose)));
  }

  let prev = trs.slice(1, period + 1).reduce((a, b) => a + b, 0) / period;
  out[period] = prev;
  for (let i = period + 1; i < candles.length; i++) {
    prev = (prev * (period - 1) + trs[i]) / period;
    out[i] = prev;
  }
  return out;
}

export interface BollingerResult {
  upper: number[];
  middle: number[];
  lower: number[];
}

export function bollinger(closes: number[], period = 20, mult = 2): BollingerResult {
  const middle = sma(closes, period);
  const upper: number[] = new Array(closes.length).fill(NaN);
  const lower: number[] = new Array(closes.length).fill(NaN);
  for (let i = period - 1; i < closes.length; i++) {
    const slice = closes.slice(i - period + 1, i + 1);
    const mean = middle[i];
    const variance = slice.reduce((acc, v) => acc + (v - mean) ** 2, 0) / period;
    const std = Math.sqrt(variance);
    upper[i] = mean + mult * std;
    lower[i] = mean - mult * std;
  }
  return { upper, middle, lower };
}

export interface StochRsiResult {
  k: number[];
  d: number[];
}

export function stochRsi(closes: number[], rsiPeriod = 14, stochPeriod = 14, kSmooth = 3, dSmooth = 3): StochRsiResult {
  const rsiVals = rsi(closes, rsiPeriod);
  const rawK: number[] = new Array(closes.length).fill(NaN);

  for (let i = 0; i < closes.length; i++) {
    if (isNaN(rsiVals[i])) continue;
    const start = i - stochPeriod + 1;
    if (start < 0) continue;
    const window = rsiVals.slice(start, i + 1).filter((v) => !isNaN(v));
    if (window.length < stochPeriod) continue;
    const min = Math.min(...window);
    const max = Math.max(...window);
    rawK[i] = max === min ? 50 : ((rsiVals[i] - min) / (max - min)) * 100;
  }

  const smooth = (vals: number[], period: number): number[] => {
    const out: number[] = new Array(vals.length).fill(NaN);
    for (let i = 0; i < vals.length; i++) {
      const start = i - period + 1;
      if (start < 0) continue;
      const window = vals.slice(start, i + 1);
      if (window.some(isNaN)) continue;
      out[i] = window.reduce((a, b) => a + b, 0) / period;
    }
    return out;
  };

  const k = smooth(rawK, kSmooth);
  const d = smooth(k, dSmooth);
  return { k, d };
}

export function obv(candles: Kline[]): number[] {
  const out: number[] = [0];
  for (let i = 1; i < candles.length; i++) {
    const prev = out[i - 1];
    const diff = candles[i].close - candles[i - 1].close;
    out.push(diff > 0 ? prev + candles[i].volume : diff < 0 ? prev - candles[i].volume : prev);
  }
  return out;
}

/** ADX — trend gücü (Wilder). > 25 güçlü trend, < 20 yatay piyasa */
export function adx(candles: Kline[], period = 14): number[] {
  const len = candles.length;
  const out: number[] = new Array(len).fill(NaN);
  if (len <= period * 2) return out;

  const plusDM: number[] = [0];
  const minusDM: number[] = [0];
  const trs: number[] = [0];

  for (let i = 1; i < len; i++) {
    const upMove = candles[i].high - candles[i - 1].high;
    const downMove = candles[i - 1].low - candles[i].low;
    plusDM.push(upMove > downMove && upMove > 0 ? upMove : 0);
    minusDM.push(downMove > upMove && downMove > 0 ? downMove : 0);
    trs.push(Math.max(
      candles[i].high - candles[i].low,
      Math.abs(candles[i].high - candles[i - 1].close),
      Math.abs(candles[i].low - candles[i - 1].close),
    ));
  }

  // Wilder smoothing
  let smTR = trs.slice(1, period + 1).reduce((a, b) => a + b, 0);
  let smPlus = plusDM.slice(1, period + 1).reduce((a, b) => a + b, 0);
  let smMinus = minusDM.slice(1, period + 1).reduce((a, b) => a + b, 0);

  const dxs: number[] = new Array(len).fill(NaN);
  for (let i = period + 1; i < len; i++) {
    smTR = smTR - smTR / period + trs[i];
    smPlus = smPlus - smPlus / period + plusDM[i];
    smMinus = smMinus - smMinus / period + minusDM[i];
    const pdi = (smPlus / smTR) * 100;
    const mdi = (smMinus / smTR) * 100;
    const sum = pdi + mdi;
    dxs[i] = sum === 0 ? 0 : (Math.abs(pdi - mdi) / sum) * 100;
  }

  // ADX = DX'in Wilder ortalaması
  const firstDx = period * 2;
  let adxVal = dxs.slice(period + 1, firstDx + 1).reduce((a, b) => a + b, 0) / period;
  out[firstDx] = adxVal;
  for (let i = firstDx + 1; i < len; i++) {
    adxVal = (adxVal * (period - 1) + dxs[i]) / period;
    out[i] = adxVal;
  }
  return out;
}

/** Son N mumun hacim ağırlıklı ortalama fiyatı */
export function vwap(candles: Kline[], lookback = 24): number {
  const slice = candles.slice(-lookback);
  let pv = 0;
  let vol = 0;
  for (const c of slice) {
    const typical = (c.high + c.low + c.close) / 3;
    pv += typical * c.volume;
    vol += c.volume;
  }
  return vol === 0 ? NaN : pv / vol;
}

export const last = (arr: number[]): number => arr[arr.length - 1];
export const prev = (arr: number[], n = 1): number => arr[arr.length - 1 - n];
