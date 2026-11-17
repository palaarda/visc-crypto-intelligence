from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from app.core.database import get_db
from app.models.signal import Signal, SignalStatus, SignalDirection, RiskLevel
from app.schemas.signal import SignalCreate, SignalUpdate, SignalResponse, SignalFilter
from datetime import datetime
import uuid

router = APIRouter()


@router.get("/", response_model=dict)
def get_signals(
    direction: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    risk: Optional[str] = Query(None),
    symbol: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, le=100),
    db: Session = Depends(get_db),
):
    query = db.query(Signal)

    if direction:
        query = query.filter(Signal.direction == direction)
    if status:
        query = query.filter(Signal.status == status)
    if risk:
        query = query.filter(Signal.risk == risk)
    if symbol:
        query = query.filter(Signal.symbol.ilike(f"%{symbol}%"))

    total = query.count()
    signals = query.order_by(Signal.created_at.desc()).offset((page - 1) * limit).limit(limit).all()

    return {
        "data": signals,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": (total + limit - 1) // limit,
    }


@router.get("/{signal_id}")
def get_signal(signal_id: str, db: Session = Depends(get_db)):
    signal = db.query(Signal).filter(Signal.id == signal_id).first()
    if not signal:
        raise HTTPException(status_code=404, detail="Sinyal bulunamadı")
    return signal


@router.post("/", response_model=dict)
def create_signal(data: SignalCreate, db: Session = Depends(get_db)):
    signal = Signal(**data.model_dump())
    db.add(signal)
    db.commit()
    db.refresh(signal)
    return {"id": str(signal.id), "message": "Sinyal oluşturuldu"}


@router.patch("/{signal_id}")
def update_signal(signal_id: str, data: SignalUpdate, db: Session = Depends(get_db)):
    signal = db.query(Signal).filter(Signal.id == signal_id).first()
    if not signal:
        raise HTTPException(status_code=404, detail="Sinyal bulunamadı")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(signal, field, value)

    if data.status in ["CLOSED", "CANCELLED"]:
        signal.closed_at = datetime.utcnow()

    db.commit()
    return {"message": "Sinyal güncellendi"}


@router.delete("/{signal_id}")
def delete_signal(signal_id: str, db: Session = Depends(get_db)):
    signal = db.query(Signal).filter(Signal.id == signal_id).first()
    if not signal:
        raise HTTPException(status_code=404, detail="Sinyal bulunamadı")
    db.delete(signal)
    db.commit()
    return {"message": "Sinyal silindi"}
