from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.config import settings

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="GuildOS — Multi-tenant retro-gaming SaaS backend. Cron jobs, webhooks, and cross-tenant operations.",
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "service": settings.PROJECT_NAME,
        "version": "1.0.0",
        "mode": "demo" if settings.DEMO_MODE else "production",
    }


# --- Router Registration ---
from routers import cron, webhooks

app.include_router(cron.router, prefix="/api/v1/cron", tags=["cron"])
app.include_router(webhooks.router, prefix="/api/v1/webhooks", tags=["webhooks"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
