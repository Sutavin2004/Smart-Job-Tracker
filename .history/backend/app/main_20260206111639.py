from fastapi import FastAPI
from app.core.config import settings
from app.db.database import init_db
from app.api.auth import router as auth_router
from app.api.applications import router as applications_router

def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.APP_NAME,
        debug=settings.DEBUG,
    )

    @app.on_event("startup")
    async def startup_event():
        init_db()

    app.include_router(auth_router)

    return app

app = create_app()
