export interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "trader" | "user";
  avatar?: string;
  createdAt: string;
}

export interface Coin {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  volume24h: number;
  marketCap: number;
  dominance?: number;
  image?: string;
}

export type SignalDirection = "LONG" | "SHORT";
export type SignalStatus = "ACTIVE" | "CLOSED" | "CANCELLED" | "PENDING";
export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

export interface Signal {
  id: string;
  coin: string;
  symbol: string;
  direction: SignalDirection;
  entry: number;
  stopLoss: number;
  takeProfit: number[];
  risk: RiskLevel;
  status: SignalStatus;
  createdAt: string;
  closedAt?: string;
  pnl?: number;
  confidence: number;
  strategy: string;
}

export interface Strategy {
  id: string;
  name: string;
  description: string;
  type: string;
  isActive: boolean;
  winRate: number;
  totalSignals: number;
  icon: string;
}

export interface Statistics {
  winRate: number;
  averageRR: number;
  profitFactor: number;
  monthlyReturn: number;
  maxDrawdown: number;
  topCoin: string;
  worstCoin: string;
  totalTrades: number;
  profitableTrades: number;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "success" | "warning" | "danger" | "info";
  isRead: boolean;
  createdAt: string;
}

export interface MarketOverview {
  btcPrice: number;
  btcChange: number;
  ethPrice: number;
  ethChange: number;
  btcDominance: number;
  totalMarketCap: number;
  fearGreedIndex: number;
  fearGreedLabel: string;
}

export interface DashboardStats {
  totalSignals: number;
  todaySignals: number;
  successfulTrades: number;
  winRate: number;
  activeCoins: number;
  systemStatus: "ONLINE" | "OFFLINE" | "MAINTENANCE";
  todayPnl: number;
  weeklyPnl: number;
}

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TechnicalIndicator {
  name: string;
  value: string | number;
  signal: "BUY" | "SELL" | "NEUTRAL";
  description?: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type FilterDirection = "ALL" | "LONG" | "SHORT";
export type FilterStatus = "ALL" | "ACTIVE" | "CLOSED" | "CANCELLED";
