from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from uuid import UUID


class SignalCreate(BaseModel):
    coin: str
    symbol: str
    direction: str
    entry: float
    stop_loss: float
    take_profit_1: float
    take_profit_2: Optional[float] = None
    take_profit_3: Optional[float] = None
    risk: str
    confidence: int = 70
    strategy: Optional[str] = None


class SignalUpdate(BaseModel):
    status: Optional[str] = None
    pnl: Optional[float] = None


class SignalResponse(BaseModel):
    id: UUID
    coin: str
    symbol: str
    direction: str
    entry: float
    stop_loss: float
    take_profit: List[float]
    risk: str
    status: str
    pnl: Optional[float] = None
    confidence: int
    strategy: Optional[str] = None
    created_at: datetime
    closed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class SignalFilter(BaseModel):
    direction: Optional[str] = None
    status: Optional[str] = None
    risk: Optional[str] = None
    symbol: Optional[str] = None
    page: int = 1
    limit: int = 20
