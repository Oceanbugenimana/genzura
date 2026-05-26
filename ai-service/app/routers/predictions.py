"""
Demand Prediction Engine
Uses simple linear regression on historical transaction data.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel
from typing import Optional
import numpy as np
from datetime import datetime, timedelta

from ..database import get_db

router = APIRouter()

class DemandRequest(BaseModel):
    productId: str
    forecastDays: Optional[int] = 30

@router.post("/demand")
async def predict_demand(request: DemandRequest, db: Session = Depends(get_db)):
    """
    Predict demand for a product over the next N days using
    linear regression on daily transaction history.
    """
    cutoff = datetime.utcnow() - timedelta(days=90)

    # Get product info
    product = db.execute(
        text("SELECT id, name, sku, quantity, minimum_stock FROM products WHERE id = :id AND deleted_at IS NULL"),
        {"id": request.productId}
    ).fetchone()

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Get daily OUT transactions for last 90 days
    rows = db.execute(text("""
        SELECT DATE(created_at) AS day, SUM(quantity) AS daily_out
        FROM stock_transactions
        WHERE product_id = :product_id AND type = 'OUT' AND created_at >= :cutoff
        GROUP BY DATE(created_at)
        ORDER BY day ASC
    """), {"product_id": request.productId, "cutoff": cutoff}).fetchall()

    if len(rows) < 3:
        return {
            "productId": request.productId,
            "productName": product.name,
            "forecastDays": request.forecastDays,
            "predictedDemand": 0,
            "confidence": "low",
            "message": "Insufficient transaction history for prediction (need at least 3 data points).",
            "dataPoints": len(rows),
        }

    # Simple linear regression
    y = np.array([float(r.daily_out) for r in rows])
    x = np.arange(len(y))

    coeffs = np.polyfit(x, y, 1)
    slope, intercept = coeffs

    # Predict next N days
    future_x = np.arange(len(y), len(y) + request.forecastDays)
    predictions = np.polyval(coeffs, future_x)
    predicted_total = max(0, round(float(np.sum(predictions))))

    avg_daily = float(np.mean(y))
    trend = "increasing" if slope > 0.1 else "decreasing" if slope < -0.1 else "stable"
    confidence = "high" if len(rows) >= 30 else "medium" if len(rows) >= 14 else "low"

    days_of_stock = round(product.quantity / avg_daily) if avg_daily > 0 else 999

    return {
        "productId": request.productId,
        "productName": product.name,
        "sku": product.sku,
        "currentQuantity": product.quantity,
        "forecastDays": request.forecastDays,
        "predictedDemand": predicted_total,
        "avgDailyDemand": round(avg_daily, 2),
        "trend": trend,
        "confidence": confidence,
        "daysOfStockRemaining": days_of_stock,
        "dataPoints": len(rows),
        "insight": f"📈 Predicted demand for {product.name} over next {request.forecastDays} days: {predicted_total} units. Trend: {trend}.",
    }
