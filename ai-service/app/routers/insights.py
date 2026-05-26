"""
Inventory Insights Engine
Provides holistic AI-generated insights about inventory health.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Optional
from pydantic import BaseModel
from datetime import datetime, timedelta

from ..database import get_db

router = APIRouter()

class InsightsRequest(BaseModel):
    storeId: Optional[str] = None

@router.post("")
async def get_insights(request: InsightsRequest, db: Session = Depends(get_db)):
    store_filter = "AND p.store_id = :store_id" if request.storeId else ""
    params = {}
    if request.storeId:
        params["store_id"] = request.storeId

    cutoff_30 = datetime.utcnow() - timedelta(days=30)
    cutoff_7 = datetime.utcnow() - timedelta(days=7)

    # Overall inventory health
    products = db.execute(text(f"""
        SELECT p.id, p.name, p.quantity, p.minimum_stock, p.unit_price,
               COALESCE(SUM(CASE WHEN st.type='OUT' AND st.created_at >= :cutoff_30 THEN st.quantity ELSE 0 END), 0) AS out_30d,
               COALESCE(SUM(CASE WHEN st.type='OUT' AND st.created_at >= :cutoff_7 THEN st.quantity ELSE 0 END), 0) AS out_7d
        FROM products p
        LEFT JOIN stock_transactions st ON st.product_id = p.id
        WHERE p.deleted_at IS NULL AND p.is_active = 1 {store_filter}
        GROUP BY p.id, p.name, p.quantity, p.minimum_stock, p.unit_price
    """), {**params, "cutoff_30": cutoff_30, "cutoff_7": cutoff_7}).fetchall()

    total = len(products)
    out_of_stock = [p for p in products if p.quantity == 0]
    low_stock = [p for p in products if 0 < p.quantity <= p.minimum_stock]
    dead_stock = [p for p in products if p.quantity > 0 and p.out_30d == 0]
    fast_moving = sorted(products, key=lambda p: p.out_30d, reverse=True)[:5]

    total_value = sum(p.quantity * float(p.unit_price) for p in products)
    health_score = max(0, 100 - (len(out_of_stock) * 10) - (len(low_stock) * 3) - (len(dead_stock) * 1))

    insights = []

    if out_of_stock:
        insights.append({
            "type": "critical",
            "icon": "🚨",
            "title": "Out of Stock Products",
            "message": f"{len(out_of_stock)} product(s) are completely out of stock and need immediate restocking.",
            "products": [{"id": p.id, "name": p.name} for p in out_of_stock[:5]],
        })

    if low_stock:
        insights.append({
            "type": "warning",
            "icon": "⚠️",
            "title": "Low Stock Alert",
            "message": f"{len(low_stock)} product(s) are below minimum stock levels.",
            "products": [{"id": p.id, "name": p.name, "quantity": p.quantity} for p in low_stock[:5]],
        })

    if dead_stock:
        insights.append({
            "type": "info",
            "icon": "📦",
            "title": "Dead Stock Detected",
            "message": f"{len(dead_stock)} product(s) have had no movement in the last 30 days. Consider promotions or clearance.",
            "products": [{"id": p.id, "name": p.name, "quantity": p.quantity} for p in dead_stock[:5]],
        })

    if fast_moving:
        insights.append({
            "type": "success",
            "icon": "🔥",
            "title": "Fast Moving Products",
            "message": f"Top selling products in the last 30 days.",
            "products": [{"id": p.id, "name": p.name, "sold": p.out_30d} for p in fast_moving if p.out_30d > 0],
        })

    return {
        "generatedAt": datetime.utcnow().isoformat(),
        "healthScore": min(100, health_score),
        "summary": {
            "totalProducts": total,
            "outOfStock": len(out_of_stock),
            "lowStock": len(low_stock),
            "deadStock": len(dead_stock),
            "totalInventoryValue": round(total_value, 2),
        },
        "insights": insights,
    }
