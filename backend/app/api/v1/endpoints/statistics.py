from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.models.signal import Signal, SignalStatus

router = APIRouter()


@router.get("/dashboard")
def get_dashboard_stats(db: Session = Depends(get_db)):
    total_signals = db.query(Signal).count()
    active_signals = db.query(Signal).filter(Signal.status == SignalStatus.ACTIVE).count()
    closed_signals = db.query(Signal).filter(Signal.status == SignalStatus.CLOSED).all()

    profitable = [s for s in closed_signals if (s.pnl or 0) > 0]
    win_rate = (len(profitable) / len(closed_signals) * 100) if closed_signals else 0

    avg_pnl = (
        sum(s.pnl for s in closed_signals if s.pnl) / len(closed_signals)
        if closed_signals
        else 0
    )

    return {
        "total_signals": total_signals,
        "active_signals": active_signals,
        "closed_signals": len(closed_signals),
        "win_rate": round(win_rate, 2),
        "profitable_trades": len(profitable),
        "avg_pnl": round(avg_pnl, 2),
    }


@router.get("/performance")
def get_performance(db: Session = Depends(get_db)):
    """Monthly performance breakdown"""
    return {
        "message": "Performance data will be implemented",
        "data": [],
    }
