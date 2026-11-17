/**
 * Binance public API katmanı.
 * API key gerektirmez — spot piyasa verisi tamamen açıktır.
 * REST: ilk yükleme + 60 sn'de bir tam liste yenileme (gainers/losers için)
 * WebSocket: izleme listesindeki coinler için canlı fiyat akışı
 */

export interface TickerData {
  symbol: string;    // BTCUSDT
  base: string;      // BTC
  name: string;      // Bitcoin
  price: number;
  change24h: number; // yüzde
  volume24h: number; // quote (USDT) hacim
  high24h: number;
  low24h: number;
}

const COIN_NAMES: Record<string, string> = {
  BTC: "Bitcoin", ETH: "Ethereum", BNB: "BNB", SOL: "Solana",
  XRP: "Ripple", ADA: "Cardano", AVAX: "Avalanche", DOGE: "Dogecoin",
  DOT: "Polkadot", LINK: "Chainlink", POL: "Polygon", TRX: "Tron",
  LTC: "Litecoin", NEAR: "Near", ATOM: "Cosmos", UNI: "Uniswap",
  SHIB: "Shiba Inu", APT: "Aptos", ARB: "Arbitrum", OP: "Optimism",
  SUI: "Sui", INJ: "Injective", TON: "Toncoin", PEPE: "Pepe",
  FIL: "Filecoin", RNDR: "Render", SEI: "Sei", TIA: "Celestia",
};

/** Platformda takip edilen ana coinler */
export const WATCHLIST = [
  "BTCUSDT", "ETHUSDT", "BNBUSDT", "SOLUSDT", "XRPUSDT", "ADAUSDT",
  "AVAXUSDT", "DOGEUSDT", "DOTUSDT", "LINKUSDT", "POLUSDT", "TRXUSDT",
];

interface RawTicker {
  symbol: string;
  lastPrice: string;
  priceChangePercent: string;
  quoteVolume: string;
  highPrice: string;
  lowPrice: string;
}

function toTicker(raw: RawTicker): TickerData {
  const base = raw.symbol.replace(/USDT$/, "");
  return {
    symbol: raw.symbol,
    base,
    name: COIN_NAMES[base] ?? base,
    price: parseFloat(raw.lastPrice),
    change24h: parseFloat(raw.priceChangePercent),
    volume24h: parseFloat(raw.quoteVolume),
    high24h: parseFloat(raw.highPrice),
    low24h: parseFloat(raw.lowPrice),
  };
}

/** Kaldıraçlı token'lar ve stablecoin pariteleri gainers/losers listesini kirletmesin */
const LEVERAGED = /(UP|DOWN|BULL|BEAR)USDT$/;
const STABLE_PAIRS = new Set([
  "USDCUSDT", "FDUSDUSDT", "TUSDUSDT", "BUSDUSDT", "DAIUSDT",
  "EURUSDT", "USDPUSDT", "AEURUSDT", "EURIUSDT", "XUSDUSDT", "USD1USDT",
]);

export async function fetchAllTickers(): Promise<RawTicker[]> {
  const res = await fetch("https://api.binance.com/api/v3/ticker/24hr");
  if (!res.ok) throw new Error(`Binance API error: ${res.status}`);
  return res.json();
}

export function extractWatchlist(all: RawTicker[]): Record<string, TickerData> {
  const map: Record<string, TickerData> = {};
  for (const raw of all) {
    if (WATCHLIST.includes(raw.symbol)) map[raw.symbol] = toTicker(raw);
  }
  return map;
}

export function extractMovers(all: RawTicker[]): { gainers: TickerData[]; losers: TickerData[] } {
  const candidates = all
    .filter(
      (r) =>
        r.symbol.endsWith("USDT") &&
        !LEVERAGED.test(r.symbol) &&
        !STABLE_PAIRS.has(r.symbol) &&
        parseFloat(r.quoteVolume) > 20_000_000
    )
    .map(toTicker);

  const sorted = [...candidates].sort((a, b) => b.change24h - a.change24h);
  return {
    gainers: sorted.slice(0, 5),
    losers: sorted.slice(-5).reverse(),
  };
}

export interface Kline {
  time: number;   // saniye (unix)
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number; // base asset hacmi
}

/** Binance kline (mum) verisi çeker. interval: 1m, 5m, 15m, 1h, 4h, 1d, 1w */
export async function fetchKlines(symbol: string, interval: string, limit = 250): Promise<Kline[]> {
  const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Binance klines error: ${res.status} (${symbol} ${interval})`);
  const raw: (string | number)[][] = await res.json();
  return raw.map((k) => ({
    time: Math.floor(Number(k[0]) / 1000),
    open: parseFloat(String(k[1])),
    high: parseFloat(String(k[2])),
    low: parseFloat(String(k[3])),
    close: parseFloat(String(k[4])),
    volume: parseFloat(String(k[5])),
  }));
}

export function coinName(base: string): string {
  return COIN_NAMES[base] ?? base;
}

// ── Türev piyasası ve likidite verileri (sinyal motoru — server tarafında kullanılır) ──

export interface MarketExtras {
  fundingRate: number | null;    // son funding oranı (örn. 0.0001 = %0.01)
  oiChange24hPct: number | null; // open interest 24 saatlik değişim (%)
  depthRatio: number | null;     // alış/satış defter derinliği oranı (>1 = alıcı baskın)
  spreadPct: number | null;      // best bid/ask spread (%)
}

/** Funding rate — Binance USDT-M futures public API */
export async function fetchFundingRate(symbol: string): Promise<number | null> {
  try {
    const res = await fetch(`https://fapi.binance.com/fapi/v1/premiumIndex?symbol=${symbol}`);
    if (!res.ok) return null;
    const json = await res.json();
    const rate = parseFloat(json?.lastFundingRate);
    return isNaN(rate) ? null : rate;
  } catch {
    return null;
  }
}

/** Open interest 24 saatlik değişim (%) — 1h periyot, 25 veri noktası */
export async function fetchOiChange24h(symbol: string): Promise<number | null> {
  try {
    const res = await fetch(`https://fapi.binance.com/futures/data/openInterestHist?symbol=${symbol}&period=1h&limit=25`);
    if (!res.ok) return null;
    const json: { sumOpenInterest: string }[] = await res.json();
    if (!Array.isArray(json) || json.length < 2) return null;
    const first = parseFloat(json[0].sumOpenInterest);
    const lastV = parseFloat(json[json.length - 1].sumOpenInterest);
    if (!first || isNaN(lastV)) return null;
    return ((lastV - first) / first) * 100;
  } catch {
    return null;
  }
}

/** Emir defteri derinliği — bid/ask notional oranı ve spread */
export async function fetchDepth(symbol: string): Promise<{ depthRatio: number; spreadPct: number } | null> {
  try {
    const res = await fetch(`https://api.binance.com/api/v3/depth?symbol=${symbol}&limit=100`);
    if (!res.ok) return null;
    const json: { bids: [string, string][]; asks: [string, string][] } = await res.json();
    const notional = (levels: [string, string][]) =>
      levels.reduce((acc, [p, q]) => acc + parseFloat(p) * parseFloat(q), 0);
    const bidN = notional(json.bids);
    const askN = notional(json.asks);
    if (!bidN || !askN) return null;
    const bestBid = parseFloat(json.bids[0][0]);
    const bestAsk = parseFloat(json.asks[0][0]);
    const mid = (bestBid + bestAsk) / 2;
    return { depthRatio: bidN / askN, spreadPct: ((bestAsk - bestBid) / mid) * 100 };
  } catch {
    return null;
  }
}

/** Bir sembol için tüm ek piyasa verilerini paralel çeker — hata durumunda null alanlar */
export async function fetchMarketExtras(symbol: string): Promise<MarketExtras> {
  const [funding, oi, depth] = await Promise.all([
    fetchFundingRate(symbol),
    fetchOiChange24h(symbol),
    fetchDepth(symbol),
  ]);
  return {
    fundingRate: funding,
    oiChange24hPct: oi,
    depthRatio: depth?.depthRatio ?? null,
    spreadPct: depth?.spreadPct ?? null,
  };
}

export type TickerUpdate = Pick<TickerData, "symbol" | "price" | "change24h" | "high24h" | "low24h" | "volume24h">;

/**
 * İzleme listesi için canlı miniTicker akışı açar.
 * Dönen fonksiyon çağrıldığında bağlantı kapanır (cleanup).
 */
export function openTickerStream(
  symbols: string[],
  onUpdate: (update: TickerUpdate) => void
): () => void {
  const streams = symbols.map((s) => `${s.toLowerCase()}@miniTicker`).join("/");
  const ws = new WebSocket(`wss://stream.binance.com:9443/stream?streams=${streams}`);

  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);
      const d = msg?.data;
      if (!d?.s) return;
      const open = parseFloat(d.o);
      const close = parseFloat(d.c);
      onUpdate({
        symbol: d.s,
        price: close,
        change24h: open > 0 ? ((close - open) / open) * 100 : 0,
        high24h: parseFloat(d.h),
        low24h: parseFloat(d.l),
        volume24h: parseFloat(d.q),
      });
    } catch {
      // bozuk mesajı yoksay
    }
  };

  return () => {
    ws.onmessage = null;
    ws.close();
  };
}
