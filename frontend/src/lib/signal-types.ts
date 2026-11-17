/**
 * Sinyal yaşam döngüsü tipleri — client ve server tarafında ortak kullanılır.
 *
 * SignalSnapshot: yayın anında kilitlenen, ASLA değiştirilmeyen alanlar.
 * SignalRecord:   snapshot + güncellenebilir durum/istatistik alanları.
 */
import type { Direction, Risk, Quality, HoldingType, Regime, ScoreComponent } from "@/lib/signal-engine";

export type SignalStatus =
  | "WAITING"    // yayınlandı, entry henüz tetiklenmedi
  | "ACTIVE"     // entry tetiklendi, pozisyon açık
  | "TP1_HIT"
  | "TP2_HIT"
  | "TP3_HIT"
  | "CLOSED"     // tüm hedefler alındı
  | "STOPPED"    // stop-loss çalıştı
  | "EXPIRED";   // entry tetiklenmeden süre doldu

export const STATUS_LABELS: Record<SignalStatus, string> = {
  WAITING: "Waiting",
  ACTIVE: "Active",
  TP1_HIT: "TP1 Hit",
  TP2_HIT: "TP2 Hit",
  TP3_HIT: "TP3 Hit",
  CLOSED: "Closed",
  STOPPED: "Stopped Out",
  EXPIRED: "Expired",
};

export const OPEN_STATUSES: SignalStatus[] = ["WAITING", "ACTIVE", "TP1_HIT", "TP2_HIT"];

/** Yayın anında kilitlenen immutable alanlar */
export interface SignalSnapshot {
  id: string;
  symbol: string;
  base: string;
  name: string;
  direction: Exclude<Direction, "NEUTRAL">;
  entry: number;
  stopLoss: number;
  takeProfit: number[];      // TP1, TP2, TP3
  confidence: number;        // confluence skoru (0-100)
  aiScore: number | null;
  quality: Quality;
  riskReward: string;
  risk: Risk;
  atrPct: number;
  holdingType: HoldingType;
  estimatedDuration: string;
  expiresAt: string;         // entry tetiklenmezse bu tarihte EXPIRED
  signalReason: string;      // yayın anındaki açıklama
  marketConditions: {
    regime: Regime;
    adx: number;
    quoteVolume24h: number;
  };
  indicatorValues: Record<string, string>;
  components: ScoreComponent[];
  strategyVersion: string;
  timeframe: string;
  generatedAt: string;
}

/** Snapshot + güncellenebilir durum alanları */
export interface SignalRecord {
  snapshot: SignalSnapshot;
  status: SignalStatus;
  entryTriggeredAt: string | null;
  tp1HitAt: string | null;
  tp2HitAt: string | null;
  tp3HitAt: string | null;
  stoppedAt: string | null;
  closedAt: string | null;
  expiredAt: string | null;
  /** Kapalıysa realize PnL, açıksa anlık PnL (%). 1/3 kademeli çıkış varsayımıyla */
  pnl: number | null;
  maxProfitPct: number;
  maxDrawdownPct: number;
  tradeDurationMin: number | null;
  lastCheckedAt: string;
  /** Arşivlenen sinyaller monitör edilmez ve PnL özetine dahil edilmez */
  archived?: boolean;
  archivedAt?: string | null;
  /** Arşiv anındaki durum — çıkışta geri yüklenir (arşiv/çıkarma durumu değiştirmez) */
  statusAtArchive?: SignalStatus | null;
  /** Arşivde geçirilen toplam süre (ms) — bekleyen sinyallerin geçerliliğini uzatır */
  archivePauseMs?: number;
}

/** Aktif liste — arşivlenmemiş kayıtlar (PnL ve operasyon metrikleri için) */
export function isPnlEligible(r: SignalRecord): boolean {
  return !r.archived;
}

export interface AuditEntry {
  time: string;
  symbol: string;
  direction: Direction;
  score: number;
  decision: "PUBLISHED" | "REJECTED";
  reasons: string[];
  quality: Quality;
}

export interface SignalConfig {
  publishThreshold: number;   // varsayılan 80
  cooldownHours: number;      // aynı coin+yön için bekleme süresi
  minQuoteVolume24h: number;  // minimum 24s hacim (USDT)
  minAtrPct: number;          // ölü piyasa filtresi
}

export const DEFAULT_CONFIG: SignalConfig = {
  publishThreshold: 80,
  cooldownHours: 6,
  minQuoteVolume24h: 30_000_000,
  minAtrPct: 0.3,
};
