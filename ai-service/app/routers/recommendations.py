"""
Restock Recommendations Engine
Uses last 30-day transaction velocity to recommend restock quantities.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Optional
from pydantic import BaseModel
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

from ..database import get_db

router = APIRouter()

class RestockRequest(BaseModel):
    storeId: Optional[str] = None

@router.post("")
async def get_restock_recommendations(request: RestockRequest, db: Session = Depends(get_db)):
    """
    Analyze last 30 days of stock-out transactions.
    Recommend restock quantity = avg_daily_out * 30 - current_quantity
    """
    cutoff = datetime.utcnow() - timedelta(days=30)

    store_filter = "AND p.store_id = :store_id" if request.storeId else ""

    query = text(f"""
        SELECT
            p.id,
            p.name,
            p.sku,
            p.quantity AS current_quantity,
            p.minimum_stock,
            p.unit_price,
            s.name AS store_name,
            COALESCE(SUM(CASE WHEN st.type = 'OUT' THEN st.quantity ELSE 0 END), 0) AS total_out_30d,
            COALESCE(COUNT(CASE WHEN st.type = 'OUT' THEN 1 END), 0) AS transaction_count
        FROM products p
        LEFT JOIN stores s ON p.store_id = s.id
        LEFT JOIN stock_transactions st ON st.product_id = p.id AND st.created_at >= :cutoff
        WHERE p.deleted_at IS NULL AND p.is_active = 1
        {store_filter}
        GROUP BY p.id, p.name, p.sku, p.quantity, p.minimum_stock, p.unit_price, s.name
        ORDER BY total_out_30d DESC
    """)

    params = {"cutoff": cutoff}
    if request.storeId:
        params["store_id"] = request.storeId

    result = db.execute(query, params).fetchall()

    recommendations = []
    for row in result:
        avg_daily_out = row.total_out_30d / 30 if row.total_out_30d > 0 else 0
        recommended_restock = max(0, round(avg_daily_out * 30 - row.current_quantity))
        urgency = "critical" if row.current_quantity == 0 else \
                  "high" if row.current_quantity <= row.minimum_stock else \
                  "medium" if recommended_restock > 0 else "low"

        if recommended_restock > 0 or row.current_quantity <= row.minimum_stock:
            recommendations.append({
                "productId": row.id,
                "productName": row.name,
                "sku": row.sku,
                "storeName": row.store_name,
                "currentQuantity": row.current_quantity,
                "minimumStock": row.minimum_stock,
                "totalOut30Days": int(row.total_out_30d),
                "avgDailyOut": round(avg_daily_out, 2),
                "recommendedRestock": recommended_restock,
                "urgency": urgency,
                "insight": _build_insight(row.name, recommended_restock, avg_daily_out, row.current_quantity),
            })

    return {
        "generatedAt": datetime.utcnow().isoformat(),
        "period": "last_30_days",
        "totalRecommendations": len(recommendations),
        "recommendations": recommendations,
    }

def _build_insight(name: str, restock: int, avg_daily: float, current: int) -> str:
    if current == 0:
        return f"⚠️ {name} is OUT OF STOCK. Restock {restock} units immediately."
    if avg_daily > 0:
        days_left = round(current / avg_daily) if avg_daily > 0 else 999
        return f"📦 Based on last 30 days, restock {name} with {restock} units. ~{days_left} days of stock remaining."
    return f"📦 {name} has low stock. Consider restocking {restock} units."
