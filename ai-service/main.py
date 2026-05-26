"""
GENZURA AI Service — FastAPI
Provides: restock recommendations, demand prediction, inventory insights
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn

from app.database import engine, Base
from app.routers import recommendations, predictions, insights
from app.config import settings

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print(f"🤖 GENZURA AI Service starting on port {settings.PORT}")
    yield
    # Shutdown
    print("AI Service shutting down.")

app = FastAPI(
    title="GENZURA AI Service",
    description="AI-powered inventory insights and predictions",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(recommendations.router, prefix="/recommendations", tags=["Recommendations"])
app.include_router(predictions.router, prefix="/predictions", tags=["Predictions"])
app.include_router(insights.router, prefix="/insights", tags=["Insights"])

@app.get("/health")
async def health():
    return {"status": "ok", "service": "GENZURA AI", "version": "1.0.0"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=settings.PORT, reload=True)
